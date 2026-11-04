import { useMemo } from 'react';
import { areaEstaca, dispersao, media } from '../core/curva';
import { fmt } from '../core/formato';
import type { Interpretacao } from '../core/metodos';
import type { Ensaio, Estaca, Estagio } from '../core/types';
import { Campo, NumInput } from './Campos';
import { Grafico } from './Grafico';
import { figuraCargaRecalque, figuraTempoRecalque, type Visual } from './figuras';
import { SeloAngulo } from './SeloAngulo';

const LIMITE_DISPERSAO = 0.15;

interface Props {
  ensaio: Ensaio;
  setEnsaio: (e: Ensaio) => void;
  avisos: string[];
  interp: Interpretacao;
  vis: Visual;
  onAvancar: () => void;
}

export function PassoConferir({ ensaio, setEnsaio, avisos, interp, vis, onAvancar }: Props) {
  const est = ensaio.estaca;
  const setEst = (p: Partial<Estaca>) => setEnsaio({ ...ensaio, estaca: { ...est, ...p } });
  const setEstagio = (i: number, p: Partial<Estagio>) =>
    setEnsaio({ ...ensaio, estagios: ensaio.estagios.map((s, k) => (k === i ? { ...s, ...p } : s)) });
  const setLeitura = (i: number, campo: 'rIni' | 'rFim', k: number, v: number | null) => {
    const s = ensaio.estagios[i];
    const arr = [...s[campo]]; arr[k] = v;
    setEstagio(i, { [campo]: arr } as any);
  };
  const rels = Array.from({ length: ensaio.nRelogios }, (_, k) => k);
  const A = areaEstaca(ensaio);

  const figCR = useMemo(() => (vis.escala ? figuraCargaRecalque(ensaio, interp, vis, new Set()) : null), [ensaio, interp, vis]);
  const figTR = useMemo(() => (vis.escala ? figuraTempoRecalque(ensaio, vis) : null), [ensaio, vis]);

  const nAlertas = ensaio.estagios.filter((s) => (dispersao(s.rFim, ensaio.relogioAtivo) ?? 0) > LIMITE_DISPERSAO).length;

  return (
    <section className="pilha">
      {avisos.length > 0 && (
        <div className="alerta alerta--aviso">
          {avisos.map((a) => <div key={a}>{a}</div>)}
        </div>
      )}

      <div className="cartao">
        <div className="cartao__cab">
          <h2>Dados do ensaio e da estaca</h2>
          <span className="dica">Todos os campos são editáveis. Números aceitam vírgula decimal.</span>
        </div>
        <div className="grade-campos">
          <Campo rotulo="Obra"><input className="input" value={est.obra} onChange={(e) => setEst({ obra: e.target.value })} /></Campo>
          <Campo rotulo="Referência do ensaio"><input className="input" value={est.referencia} onChange={(e) => setEst({ referencia: e.target.value })} /></Campo>
          <Campo rotulo="Estaca"><input className="input" value={est.estaca} onChange={(e) => setEst({ estaca: e.target.value })} /></Campo>
          <Campo rotulo="Tipo de estaca"><input className="input" value={est.tipo} onChange={(e) => setEst({ tipo: e.target.value })} /></Campo>
          <Campo rotulo="Diâmetro D" unidade="mm"><NumInput valor={est.D} casas={0} onChange={(v) => setEst({ D: v ?? 0 })} /></Campo>
          <Campo rotulo="Diâmetro da ponta" unidade="mm" dica="Usado no critério de Terzaghi (10 % D). Vazio = D.">
            <NumInput valor={est.Dponta} casas={0} placeholder={fmt(est.D, 0)} onChange={(v) => setEst({ Dponta: v })} />
          </Campo>
          <Campo rotulo="Comprimento L" unidade="m"><NumInput valor={est.L} onChange={(v) => setEst({ L: v ?? 0 })} /></Campo>
          <Campo rotulo="Área A" unidade="m²" dica="Vazio = πD²/4">
            <NumInput valor={est.area} casas={5} placeholder={fmt(A, 5)} onChange={(v) => setEst({ area: v })} />
          </Campo>
          <Campo rotulo="Módulo E" unidade="GPa"><NumInput valor={est.E} casas={1} onChange={(v) => setEst({ E: v ?? 20 })} /></Campo>
          <Campo rotulo="Carga de trabalho estimada" unidade="kN" dica="Define a escala do gráfico (reta a 20° ± 5° com o eixo das cargas).">
            <NumInput valor={est.Qt} casas={1} placeholder={vis.Qt ? `sugerido ${fmt(vis.Qt, 0)}` : ''} onChange={(v) => setEst({ Qt: v })} />
          </Campo>
          <Campo rotulo="Cota de arrasamento / execução" unidade="m"><input className="input" value={est.cotaArrasamento} onChange={(e) => setEst({ cotaArrasamento: e.target.value })} /></Campo>
          <Campo rotulo="Cota da ponta" unidade="m"><input className="input" value={est.cotaPonta} onChange={(e) => setEst({ cotaPonta: e.target.value })} /></Campo>
          <Campo rotulo="Tipo de carregamento"><input className="input" value={est.tipoCarregamento} onChange={(e) => setEst({ tipoCarregamento: e.target.value })} /></Campo>
          <Campo rotulo="Data"><input className="input" value={est.data} onChange={(e) => setEst({ data: e.target.value })} /></Campo>
          <Campo rotulo="Início / término"><span className="duplo">
            <input className="input" value={est.horaInicio} onChange={(e) => setEst({ horaInicio: e.target.value })} />
            <input className="input" value={est.horaFim} onChange={(e) => setEst({ horaFim: e.target.value })} />
          </span></Campo>
          <Campo rotulo="Executor / responsável"><input className="input" value={est.executor} onChange={(e) => setEst({ executor: e.target.value })} /></Campo>
        </div>
        {vis.QtSugerido && vis.Qt !== null && (
          <div className="alerta alerta--info">
            Carga de trabalho estimada não informada: usando o valor sugerido <b>{fmt(vis.Qt, 1)} kN</b> (Qmáx / 2) para definir a escala. Informe o valor do projeto, se disponível.
          </div>
        )}
      </div>

      <div className="cartao">
        <div className="cartao__cab">
          <h2>Estágios e leituras</h2>
          <div className="relogios">
            <span className="dica">Relógios usados na média:</span>
            {rels.map((k) => (
              <label key={k} className="chip-check">
                <input
                  type="checkbox" checked={ensaio.relogioAtivo[k] !== false}
                  onChange={(e) => setEnsaio({ ...ensaio, relogioAtivo: ensaio.relogioAtivo.map((v, j) => (j === k ? e.target.checked : v)) })}
                />
                R{k + 1}
              </label>
            ))}
          </div>
        </div>
        {nAlertas > 0 && (
          <div className="alerta alerta--aviso">
            {nAlertas} estágio(s) com dispersão entre relógios acima de {fmt(LIMITE_DISPERSAO * 100, 0)} % da média — verifique rotação do bloco ou relógio defeituoso.
          </div>
        )}
        <div className="tabela-rolagem">
          <table className="tabela tabela--editavel">
            <thead>
              <tr>
                <th rowSpan={2}>Usar</th><th rowSpan={2}>Estágio</th><th rowSpan={2}>Fase</th><th rowSpan={2}>Carga (kN)</th>
                <th rowSpan={2}>Hora início</th><th rowSpan={2}>Hora fim</th>
                <th colSpan={ensaio.nRelogios} className="grupo">Leitura inicial (mm)</th>
                <th colSpan={ensaio.nRelogios} className="grupo">Leitura final (mm)</th>
                <th colSpan={2} className="grupo grupo--media">Média (mm)</th>
                <th rowSpan={2}>Disp.</th>
              </tr>
              <tr>
                {rels.map((k) => <th key={`i${k}`}>R{k + 1}</th>)}
                {rels.map((k) => <th key={`f${k}`}>R{k + 1}</th>)}
                <th>inicial</th><th>final</th>
              </tr>
            </thead>
            <tbody>
              {ensaio.estagios.map((s, i) => {
                const mi = media(s.rIni, ensaio.relogioAtivo), mf = media(s.rFim, ensaio.relogioAtivo);
                const d = dispersao(s.rFim, ensaio.relogioAtivo);
                return (
                  <tr key={i} className={`${!s.incluir ? 'linha--off' : ''} ${s.fase === 'D' ? 'linha--desc' : ''}`}>
                    <td><input type="checkbox" checked={s.incluir} onChange={(e) => setEstagio(i, { incluir: e.target.checked })} /></td>
                    <td>{s.n}</td>
                    <td>
                      <select className="input input--sel" value={s.fase} onChange={(e) => setEstagio(i, { fase: e.target.value as 'C' | 'D' })}>
                        <option value="C">C</option><option value="D">D</option>
                      </select>
                    </td>
                    <td><NumInput valor={s.Q} casas={1} largura={78} onChange={(v) => setEstagio(i, { Q: v ?? 0 })} /></td>
                    <td><input className="input input--hora" value={s.hIni} onChange={(e) => setEstagio(i, { hIni: e.target.value })} /></td>
                    <td><input className="input input--hora" value={s.hFim} onChange={(e) => setEstagio(i, { hFim: e.target.value })} /></td>
                    {rels.map((k) => (
                      <td key={`i${k}`} className={ensaio.relogioAtivo[k] === false ? 'cel--off' : ''}>
                        <NumInput valor={s.rIni[k]} casas={2} largura={62} onChange={(v) => setLeitura(i, 'rIni', k, v)} />
                      </td>
                    ))}
                    {rels.map((k) => (
                      <td key={`f${k}`} className={ensaio.relogioAtivo[k] === false ? 'cel--off' : ''}>
                        <NumInput valor={s.rFim[k]} casas={2} largura={62} onChange={(v) => setLeitura(i, 'rFim', k, v)} />
                      </td>
                    ))}
                    <td className="num forte">{fmt(mi, 3)}</td>
                    <td className="num forte">{fmt(mf, 3)}</td>
                    <td className={`num ${(d ?? 0) > LIMITE_DISPERSAO ? 'txt-aviso' : 'txt-mudo'}`}>{d === null ? '—' : `${fmt(d * 100, 0)} %`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {vis.erro && <div className="alerta alerta--erro">{vis.erro}</div>}
      {figCR && vis.escala && (
        <div className="duas-colunas">
          <div className="cartao">
            <Grafico {...figCR} nomeArquivo="carga-deslocamento" titulo="Carga × deslocamento" legenda={<SeloAngulo e={vis.escala} />} />
          </div>
          {figTR && (
            <div className="cartao">
              <Grafico {...figTR} nomeArquivo="tempo-deslocamento" titulo="Tempo × deslocamento" />
            </div>
          )}
        </div>
      )}

      <div className="barra-acoes">
        <button className="btn btn--primario" onClick={onAvancar}>Interpretar →</button>
      </div>
    </section>
  );
}
