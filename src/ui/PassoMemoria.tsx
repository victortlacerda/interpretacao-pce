import { useMemo } from 'react';
import { areaEstaca, diametroPonta, media } from '../core/curva';
import { fmt } from '../core/formato';
import type { Interpretacao } from '../core/metodos';
import type { Ensaio } from '../core/types';
import { Grafico } from './Grafico';
import { CORES, figuraAux, figuraCargaRecalque, figuraR2, figuraTempoRecalque, type Visual } from './figuras';
import { Passos } from './Passos';
import { STATUS_TXT } from './PassoInterpretar';
import { Tex } from './Tex';
import { tx } from '../core/formato';

export function PassoMemoria({ ensaio, interp, vis, visiveis }: { ensaio: Ensaio; interp: Interpretacao; vis: Visual; visiveis: Set<string> }) {
  const est = ensaio.estaca;
  const figCR = useMemo(() => (vis.escala ? figuraCargaRecalque(ensaio, interp, vis, visiveis) : null), [ensaio, interp, vis, visiveis]);
  const figTR = useMemo(() => (vis.escala ? figuraTempoRecalque(ensaio, vis) : null), [ensaio, vis]);
  const e = vis.escala;

  return (
    <section className="pilha memoria">
      <div className="barra-acoes barra-acoes--topo no-print">
        <span className="dica">Relatório DOCX/PDF formatado: próxima etapa. Por enquanto, use “Imprimir / salvar PDF”.</span>
        <button className="btn btn--leve" disabled title="Em desenvolvimento">Exportar DOCX</button>
        <button className="btn btn--primario" onClick={() => window.print()}>Imprimir / salvar PDF</button>
      </div>

      <div className="cartao">
        <h1 className="memoria__titulo">Memória de cálculo — interpretação de prova de carga estática</h1>
        <div className="grade-info">
          <div><span>Obra</span><b>{est.obra || '—'}</b></div>
          <div><span>Ensaio</span><b>{est.referencia || '—'}</b></div>
          <div><span>Estaca</span><b>{est.estaca || '—'}</b></div>
          <div><span>Tipo</span><b>{est.tipo || '—'}</b></div>
          <div><span>Diâmetro D</span><b>{fmt(est.D, 0)} mm</b></div>
          <div><span>Diâmetro da ponta</span><b>{fmt(diametroPonta(ensaio), 0)} mm</b></div>
          <div><span>Comprimento L</span><b>{fmt(est.L, 2)} m</b></div>
          <div><span>Área A</span><b>{fmt(areaEstaca(ensaio), 5)} m²</b></div>
          <div><span>Módulo E</span><b>{fmt(est.E, 1)} GPa</b></div>
          <div><span>Carga de trabalho estimada</span><b>{fmt(vis.Qt, 1)} kN{vis.QtSugerido ? ' (sugerida)' : ''}</b></div>
          <div><span>Cota de arrasamento</span><b>{est.cotaArrasamento || '—'}</b></div>
          <div><span>Cota da ponta</span><b>{est.cotaPonta || '—'}</b></div>
          <div><span>Carregamento</span><b>{est.tipoCarregamento || '—'}</b></div>
          <div><span>Data</span><b>{est.data || '—'}</b></div>
          <div><span>Horário</span><b>{est.horaInicio || '—'} – {est.horaFim || '—'}</b></div>
          <div><span>Executor</span><b>{est.executor || '—'}</b></div>
        </div>
      </div>

      <div className="cartao">
        <h2>1. Leituras e médias por estágio</h2>
        <p>Deslocamento de cada leitura = média aritmética dos relógios ativos ({ensaio.relogioAtivo.map((a, i) => (a ? `R${i + 1}` : null)).filter(Boolean).join(', ')}).</p>
        <Tex>{'\\bar r = \\frac{1}{n}\\sum_{i=1}^{n} r_i'}</Tex>
        <div className="tabela-rolagem">
          <table className="tabela tabela--compacta">
            <thead><tr><th>Estágio</th><th>Fase</th><th>Q (kN)</th><th>Início</th><th>Fim</th><th>r inicial (mm)</th><th>r final (mm)</th><th>Δr no estágio (mm)</th></tr></thead>
            <tbody>
              {ensaio.estagios.filter((s) => s.incluir).map((s) => {
                const a = media(s.rIni, ensaio.relogioAtivo), b = media(s.rFim, ensaio.relogioAtivo);
                return (
                  <tr key={s.n}><td>{s.n}</td><td>{s.fase}</td><td className="num">{fmt(s.Q, 1)}</td><td>{s.hIni}</td><td>{s.hFim}</td>
                    <td className="num">{fmt(a, 3)}</td><td className="num">{fmt(b, 3)}</td><td className="num">{a !== null && b !== null ? fmt(b - a, 3) : '—'}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {e && (
        <div className="cartao">
          <h2>2. Escala dos gráficos</h2>
          <p>
            Curvas carga × deslocamento e tempo × deslocamento com a carga e o deslocamento da leitura inicial e final de cada estágio, em escala tal que a reta que liga a
            origem ao ponto da curva correspondente à carga estimada de trabalho resulte em inclinação de 20° ± 5° com o eixo das cargas.
          </p>
          <Tex>{`r_t = r(Q_t = ${tx(vis.Qt, 1)}\\ \\text{kN}) = ${tx(vis.rt, 3)}\\ \\text{mm}`}</Tex>
          <Tex>{`s_Q = ${tx(e.sQ, 0)}\\ \\text{kN/cm} \\qquad s_r = ${tx(e.sR, 2)}\\ \\text{mm/cm}`}</Tex>
          <Tex>{`\\theta = \\arctan\\!\\left(\\frac{r_t / s_r}{Q_t / s_Q}\\right) = \\arctan\\!\\left(\\frac{${tx(vis.rt! / e.sR, 3)}\\ \\text{cm}}{${tx(vis.Qt! / e.sQ, 3)}\\ \\text{cm}}\\right) = ${tx(e.angulo, 1)}^\\circ \\quad ${e.anguloOk ? '\\in [15^\\circ;\\,25^\\circ]\\ \\checkmark' : '\\notin [15^\\circ;\\,25^\\circ]'}`}</Tex>
        </div>
      )}

      {figCR && e && <div className="cartao quebra"><Grafico {...figCR} nomeArquivo="carga-deslocamento" titulo="Figura 1 — Carga × deslocamento" /></div>}
      {figTR && <div className="cartao quebra"><Grafico {...figTR} nomeArquivo="tempo-deslocamento" titulo="Figura 2 — Tempo × deslocamento" /></div>}

      <div className="cartao">
        <h2>3. Resumo</h2>
        <table className="tabela tabela--compacta">
          <thead><tr><th>Método</th><th>Qu (kN)</th><th>r (mm)</th><th>Obtido sobre</th><th>Situação</th></tr></thead>
          <tbody>
            {interp.resultados.map((r) => (
              <tr key={r.id}><td>{r.nome}</td><td className="num forte">{fmt(r.Qu, 1)}</td><td className="num">{fmt(r.ru, 2)}</td><td>{r.fonte ?? '—'}</td><td>{STATUS_TXT[r.status]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      {interp.resultados.map((r, i) => (
        <MetodoMemoria key={r.id} n={i + 4} r={r} interp={interp} />
      ))}
    </section>
  );
}

function MetodoMemoria({ n, r, interp }: { n: number; r: Interpretacao['resultados'][number]; interp: Interpretacao }) {
  const aux = useMemo(() => (r.aux ? figuraAux(r.aux, CORES[r.id]) : null), [r]);
  const r2 = useMemo(() => (r.id === 'vdv' || r.id === 'aoki' ? figuraR2(interp, r.id, CORES[r.id]) : null), [r, interp]);
  return (
    <div className="cartao quebra">
      <div className="cartao__cab">
        <h2>{n}. {r.nome}</h2>
        <span className="dica">{r.ref}</span>
      </div>
      {r.aviso && <div className="alerta alerta--aviso">{r.aviso}</div>}
      <Passos passos={r.passos} />
      {aux && <Grafico {...aux} altura={340} nomeArquivo={`metodo-${r.id}`} titulo={r.aux!.titulo} />}
      {r2 && <Grafico {...r2} altura={260} nomeArquivo={`r2-${r.id}`} titulo="R² em função do Qu testado" />}
      <div className="resultado-final">
        Resultado: <b>{r.Qu !== null ? `Qu = ${fmt(r.Qu, 1)} kN` : STATUS_TXT[r.status]}</b>
        {r.ru !== null && r.Qu !== null && <> · r = {fmt(r.ru, 2)} mm</>}
        {r.fonte && <> · obtido sobre {r.fonte}</>}
      </div>
    </div>
  );
}
