import { useMemo, useState } from 'react';
import { fmt } from '../core/formato';
import type { Interpretacao } from '../core/metodos';
import type { Ensaio, Parametros, Resultado } from '../core/types';
import { Campo, NumInput } from './Campos';
import { Grafico } from './Grafico';
import { CORES, figuraAux, figuraCargaRecalque, figuraR2, type Visual } from './figuras';
import { SeloAngulo } from './SeloAngulo';
import { Passos } from './Passos';

interface Props {
  ensaio: Ensaio;
  interp: Interpretacao;
  vis: Visual;
  params: Parametros;
  setParams: (p: Parametros) => void;
  visiveis: Set<string>;
  setVisiveis: (s: Set<string>) => void;
  onMemoria: () => void;
}

export const STATUS_TXT: Record<Resultado['status'], string> = { ok: 'ok', 'nao-atingido': 'não atingido', invalido: 'não aplicável' };

export function PassoInterpretar({ ensaio, interp, vis, params, setParams, visiveis, setVisiveis, onMemoria }: Props) {
  const U = interp.ctx.U;
  const [sel, setSel] = useState('aoki');
  const [mostrarParams, setMostrarParams] = useState(false);
  const fig = useMemo(() => (vis.escala ? figuraCargaRecalque(ensaio, interp, vis, visiveis) : null), [ensaio, interp, vis, visiveis]);
  const res = interp.resultados.find((r) => r.id === sel) ?? interp.resultados[0];
  const figAux = useMemo(() => (res?.aux ? figuraAux(res.aux, CORES[res.id]) : null), [res]);
  const figR2 = useMemo(() => (res && (res.id === 'vdv' || res.id === 'aoki') ? figuraR2(interp, res.id, CORES[res.id]) : null), [res, interp]);

  const alternar = (id: string) => {
    const s = new Set(visiveis);
    s.has(id) ? s.delete(id) : s.add(id);
    setVisiveis(s);
  };
  const P = (k: keyof Parametros) => (v: number | null) => setParams({ ...params, [k]: v });

  const grupos: [string, Resultado['categoria']][] = [['Critérios de ruptura convencional', 'convencional'], ['Métodos de extrapolação', 'extrapolacao']];
  const validos = interp.resultados.filter((r) => r.Qu !== null && r.status === 'ok');
  const qs = validos.map((r) => r.Qu!);
  const mediaQu = qs.length ? qs.reduce((a, b) => a + b, 0) / qs.length : null;

  return (
    <section className="pilha">
      {vis.erro && <div className="alerta alerta--erro">{vis.erro}</div>}
      <div className="interpretar">
        <div className="cartao interpretar__grafico">
          {fig && vis.escala && (
            <Grafico {...fig} nomeArquivo="carga-deslocamento-interpretacao" titulo="Carga × deslocamento" legenda={<SeloAngulo e={vis.escala} U={U} />} />
          )}
          {vis.escala && (
            <p className="nota">
              Escala: {fmt(vis.escala.sQ, 0)} {U}/cm × {fmt(vis.escala.sR, 2)} mm/cm. Reta origem → carga de trabalho estimada
              ({fmt(vis.Qt, 0)} {U}{vis.QtSugerido ? ', sugerida = Qmáx/2' : ''}) com {fmt(vis.escala.angulo, 1)}° em relação ao eixo das cargas.
            </p>
          )}
        </div>

        <aside className="cartao metodos">
          {grupos.map(([titulo, cat]) => (
            <div key={cat} className="metodos__grupo">
              <h3>{titulo}</h3>
              {interp.resultados.filter((r) => r.categoria === cat).map((r) => (
                <div key={r.id} className={`metodo ${sel === r.id ? 'metodo--sel' : ''}`} onClick={() => setSel(r.id)}>
                  <input type="checkbox" checked={visiveis.has(r.id)} onClick={(e) => e.stopPropagation()} onChange={() => alternar(r.id)} title="Mostrar no gráfico" />
                  <span className="metodo__cor" style={{ background: CORES[r.id] }} />
                  <span className="metodo__nome">{r.nome}</span>
                  <span className={`metodo__valor ${r.status !== 'ok' ? 'txt-mudo' : ''}`}>
                    {r.Qu !== null ? `${fmt(r.Qu, 0)} ${U}` : STATUS_TXT[r.status]}
                  </span>
                </div>
              ))}
            </div>
          ))}
          <button className="btn btn--leve btn--bloco" onClick={() => setMostrarParams(!mostrarParams)}>
            {mostrarParams ? 'Ocultar parâmetros' : 'Parâmetros dos métodos'}
          </button>
          {mostrarParams && (
            <div className="params">
              <Campo rotulo="Curva extrapolada de referência" dica="Usada quando um critério não é atingido na curva medida.">
                <select className="input" value={params.extrapBase} onChange={(e) => setParams({ ...params, extrapBase: e.target.value as any })}>
                  <option value="aoki">Van der Veen–Aoki</option>
                  <option value="vdv">Van der Veen</option>
                </select>
              </Campo>
              <Campo rotulo="Davisson — parcela fixa" unidade="mm"><NumInput valor={params.davissonOffset} casas={1} onChange={(v) => P('davissonOffset')(v ?? 3.8)} /></Campo>
              <Campo rotulo="Recalque-limite" unidade="mm"><NumInput valor={params.recalqueLimite} casas={1} onChange={(v) => P('recalqueLimite')(v ?? 25)} /></Campo>
              <Campo rotulo="Inclinação Fuller/Butler-Hoy" unidade="mm/kN"><NumInput valor={params.hoySlope} casas={3} onChange={(v) => P('hoySlope')(v ?? 0.143)} /></Campo>
              <Campo rotulo="Butler-Hoy — estágios iniciais"><NumInput valor={params.nInicialButler} casas={0} onChange={(v) => P('nInicialButler')(v ?? 3)} /></Campo>
              <p className="dica">Últimos N estágios usados no ajuste (vazio = padrão):</p>
              <Campo rotulo="Chin-Kondner"><NumInput valor={params.nChin} casas={0} placeholder="metade" onChange={P('nChin')} /></Campo>
              <Campo rotulo="Décourt"><NumInput valor={params.nDecourt} casas={0} placeholder="metade" onChange={P('nDecourt')} /></Campo>
              <Campo rotulo="Brinch-Hansen 80 %"><NumInput valor={params.nBH80} casas={0} placeholder="todos" onChange={P('nBH80')} /></Campo>
              <Campo rotulo="Mazurkiewicz (pares)"><NumInput valor={params.nMaz} casas={0} placeholder="todos" onChange={P('nMaz')} /></Campo>
              <Campo rotulo="Massad (pares)"><NumInput valor={params.nMassad} casas={0} placeholder="todos" onChange={P('nMassad')} /></Campo>
            </div>
          )}
        </aside>
      </div>

      <div className="cartao">
        <div className="cartao__cab">
          <h2>Resumo dos resultados</h2>
          <button className="btn btn--primario" onClick={onMemoria}>Memória de cálculo completa →</button>
        </div>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Método</th><th>Tipo</th><th>Qu ({U})</th><th>r (mm)</th><th>Obtido sobre</th><th>R²</th><th>Qmáx/Qu</th><th>Situação</th></tr>
            </thead>
            <tbody>
              {interp.resultados.map((r) => (
                <tr key={r.id} onClick={() => setSel(r.id)} className={`clicavel ${sel === r.id ? 'linha--sel' : ''}`}>
                  <td><span className="metodo__cor" style={{ background: CORES[r.id] }} /> {r.nome}</td>
                  <td>{r.categoria === 'convencional' ? 'Convencional' : 'Extrapolação'}</td>
                  <td className="num forte">{fmt(r.Qu, 1)}</td>
                  <td className="num">{fmt(r.ru, 2)}</td>
                  <td>{r.fonte ?? '—'}</td>
                  <td className="num">{r.R2 !== undefined ? fmt(r.R2, 4) : '—'}</td>
                  <td className="num">{r.Qu ? fmt(interp.ctx.Qmax / r.Qu, 2) : '—'}</td>
                  <td><span className={`etiqueta etiqueta--${r.status}`}>{STATUS_TXT[r.status]}</span>{r.aviso && <span className="aviso-icone" title={r.aviso}> ⓘ</span>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Carga máxima do ensaio</td><td className="num forte">{fmt(interp.ctx.Qmax, 1)}</td><td className="num">{fmt(interp.ctx.rmax, 2)}</td>
                <td colSpan={4} className="txt-mudo">Média dos métodos válidos: {fmt(mediaQu, 1)} {U} ({qs.length} métodos)</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {res && (
        <div className="cartao">
          <div className="cartao__cab">
            <h2><span className="metodo__cor" style={{ background: CORES[res.id] }} /> {res.nome}</h2>
            <span className="dica">{res.ref}</span>
          </div>
          {res.aviso && <div className="alerta alerta--aviso">{res.aviso}</div>}
          <div className={figAux || figR2 ? 'duas-colunas' : ''}>
            <div className="memoria-compacta"><Passos passos={res.passos} /></div>
            <div className="pilha">
              {figAux && <Grafico {...figAux} altura={340} nomeArquivo={`metodo-${res.id}`} titulo={res.aux!.titulo} />}
              {figR2 && <Grafico {...figR2} altura={280} nomeArquivo={`r2-${res.id}`} titulo="R² em função do Qu testado" />}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
