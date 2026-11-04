import { sequenciaDegraus, rDeQ } from '../core/curva';
import { calcularEscala, redondoAcima, type Escala } from '../core/escala';
import { fmt } from '../core/formato';
import type { Interpretacao } from '../core/metodos';
import type { Ensaio, GraficoAux, Resultado } from '../core/types';

export const CORES: Record<string, string> = {
  nbr6122: '#C93B3B',
  davisson: '#D98A1E',
  terzaghi: '#7A4FC9',
  limite: '#8A6D3B',
  vdv: '#0E9F9A',
  aoki: '#1E6FD9',
  chin: '#2E8B57',
  decourt: '#B0417E',
  mazurkiewicz: '#5B6CE0',
  massad: '#3A9AD9',
  bh80: '#C25E1F',
  bh90: '#8F5A00',
  fullerhoy: '#4C7A2E',
  butlerhoy: '#6E5BA8',
  debeer: '#00788A',
};

export interface Visual {
  escala: Escala | null;
  Qt: number | null;
  QtSugerido: boolean;
  rt: number | null;
  erro?: string;
}

/** Define a escala normativa (reta origem → ponto da carga de trabalho a 20° ± 5° com o eixo das cargas). */
export function escalaNormativa(ens: Ensaio, interp: Interpretacao, visiveis: Set<string>): Visual {
  const { ctx } = interp;
  if (ctx.pts.length < 1) return { escala: null, Qt: null, QtSugerido: false, rt: null, erro: 'Sem estágios de carregamento.' };
  const QtSugerido = !(ens.estaca.Qt && ens.estaca.Qt > 0);
  const Qt = QtSugerido ? ctx.Qmax / 2 : ens.estaca.Qt!;
  const rt = rDeQ(ctx.pts, Qt);
  if (rt === null || !(rt > 0)) {
    return { escala: null, Qt, QtSugerido, rt, erro: 'A carga de trabalho estimada deve estar dentro da faixa ensaiada e corresponder a recalque > 0.' };
  }
  const seq = sequenciaDegraus(ens);
  let Qplot = ctx.Qmax, rPlot = Math.max(...seq.map((s) => s.r));
  for (const r of interp.resultados) {
    if (!visiveis.has(r.id) || r.Qu === null) continue;
    if (r.Qu <= ctx.Qmax * 2) Qplot = Math.max(Qplot, r.Qu);
    if (r.ru !== null && r.ru <= Math.max(ctx.rmax * 4, 0.12 * ctx.Dp)) rPlot = Math.max(rPlot, r.ru);
    for (const l of r.linhasR ?? []) if (l.r <= Math.max(ctx.rmax * 4, 0.12 * ctx.Dp)) rPlot = Math.max(rPlot, l.r);
  }
  const escala = calcularEscala({ Qt, rt, Qplot: Qplot * 1.06, rPlot: rPlot * 1.06 });
  return { escala, Qt, QtSugerido, rt };
}

const eixo = (titulo: string, extra: any = {}) => ({
  title: { text: titulo, font: { size: 12, color: '#0B3A66' } },
  showline: true, linecolor: '#8CB8F0', mirror: true,
  gridcolor: '#E3EEFB', zeroline: false, ticks: 'outside', tickcolor: '#8CB8F0',
  ...extra,
});

function dticks(fim: number, s: number) {
  const n = fim / s;
  return n > 20 ? s * Math.ceil(n / 20) : s;
}

export function figuraCargaRecalque(ens: Ensaio, interp: Interpretacao, vis: Visual, visiveis: Set<string>, mostrarRetaTrabalho = true) {
  const U = interp.ctx.U;
  const e = vis.escala!;
  const seq = sequenciaDegraus(ens);
  const data: any[] = [];

  // métodos
  for (const r of interp.resultados) {
    if (!visiveis.has(r.id)) continue;
    const cor = CORES[r.id] ?? '#555';
    if (r.retaR) {
      data.push({ x: [0, e.Qfim], y: [r.retaR(0), r.retaR(e.Qfim)], mode: 'lines', name: `Reta — ${r.nome}`, line: { color: cor, width: 1.5, dash: 'dash' }, hovertemplate: `${r.nome}<br>Q = %{x:.1f} ${U}<br>r = %{y:.2f} mm<extra></extra>` });
    }
    if (r.curvaQ) {
      const xs: number[] = [], ys: number[] = [];
      const N = 160;
      for (let i = 0; i <= N; i++) {
        const rr = (e.rFim * i) / N;
        const Q = r.curvaQ(rr);
        if (!Number.isFinite(Q) || Q < 0) continue;
        if (Q > e.Qfim) break;
        xs.push(Q); ys.push(rr);
      }
      data.push({ x: xs, y: ys, mode: 'lines', name: `Curva — ${r.nome}`, line: { color: cor, width: 1.8, dash: 'dot' }, hovertemplate: `${r.nome}<br>Q = %{x:.1f} ${U}<br>r = %{y:.2f} mm<extra></extra>` });
    }
    for (const l of r.linhasR ?? []) {
      data.push({ x: [0, e.Qfim], y: [l.r, l.r], mode: 'lines', name: `${l.nome} = ${fmt(l.r, 1)} mm`, line: { color: cor, width: 1, dash: 'longdash' }, hovertemplate: `${l.nome}: r = ${fmt(l.r, 2)} mm<extra></extra>` });
    }
    if (r.Qu !== null && r.Qu <= e.Qfim) {
      if (r.ru !== null && r.ru <= e.rFim) {
        data.push({ x: [r.Qu], y: [r.ru], mode: 'markers', name: `Qu ${r.nome}`, showlegend: false, marker: { symbol: 'star', size: 13, color: cor, line: { color: '#fff', width: 1 } }, hovertemplate: `<b>${r.nome}</b><br>Qu = ${fmt(r.Qu, 1)} ${U}<br>r = ${fmt(r.ru, 2)} mm<extra></extra>` });
      } else {
        data.push({ x: [r.Qu, r.Qu], y: [0, e.rFim], mode: 'lines', name: `Qu ${r.nome}`, showlegend: false, line: { color: cor, width: 1, dash: 'dot' }, hovertemplate: `<b>${r.nome}</b><br>Qu = ${fmt(r.Qu, 1)} ${U}<extra></extra>` });
      }
    }
  }

  if (mostrarRetaTrabalho && vis.Qt !== null && vis.rt !== null) {
    data.push({
      x: [0, vis.Qt], y: [0, vis.rt], mode: 'lines+markers', name: `Reta da carga de trabalho (${fmt(e.angulo, 1)}°)`,
      line: { color: '#6B7A8C', width: 1.2, dash: 'dashdot' }, marker: { size: [0, 8], color: '#6B7A8C', symbol: 'diamond' },
      hovertemplate: `Carga de trabalho estimada<br>Qt = ${fmt(vis.Qt, 1)} ${U}<br>r = ${fmt(vis.rt, 2)} mm<br>Inclinação = ${fmt(e.angulo, 1)}°<extra></extra>`,
    });
  }

  // curva medida em degraus
  const label = (s: (typeof seq)[number]) =>
    s.tipo === 'origem' ? 'Origem' : `Estágio ${s.s!.n} (${s.s!.fase === 'C' ? 'carregamento' : 'descarregamento'}) — leitura ${s.tipo === 'ini' ? 'inicial' : 'final'}`;
  data.push({
    x: seq.map((s) => s.Q), y: seq.map((s) => s.r), mode: 'lines', name: 'Curva medida', line: { color: '#0B3A66', width: 2.2 },
    hoverinfo: 'skip',
  });
  const ini = seq.filter((s) => s.tipo === 'ini'), fim = seq.filter((s) => s.tipo !== 'ini');
  data.push({ x: ini.map((s) => s.Q), y: ini.map((s) => s.r), text: ini.map(label), mode: 'markers', name: 'Leitura inicial', marker: { symbol: 'circle-open', size: 7, color: '#0B3A66', line: { width: 1.5 } }, hovertemplate: `%{text}<br>Q = %{x:.1f} ${U}<br>r = %{y:.3f} mm<extra></extra>` });
  data.push({ x: fim.map((s) => s.Q), y: fim.map((s) => s.r), text: fim.map(label), mode: 'markers', name: 'Leitura final', marker: { symbol: 'circle', size: 7, color: '#1E6FD9' }, hovertemplate: `%{text}<br>Q = %{x:.1f} ${U}<br>r = %{y:.3f} mm<extra></extra>` });

  const layout = {
    xaxis: eixo(`Carga Q (${U})`, { range: [0, e.Qfim], dtick: dticks(e.Qfim, e.sQ), side: 'top' }),
    yaxis: eixo('Deslocamento r (mm)', { range: [e.rFim, 0], dtick: dticks(e.rFim, e.sR) }),
    margin: { l: 74, r: 24, t: 58, b: 30 },
    legend: { orientation: 'h', y: -0.02, yanchor: 'top', x: 0, font: { size: 11 } },
    hovermode: 'closest',
  };
  return { data, layout, aspecto: e.alturaCm / e.larguraCm };
}

export function figuraTempoRecalque(ens: Ensaio, vis: Visual, U = 'kN') {
  const e = vis.escala!;
  const seq = sequenciaDegraus(ens).filter((s) => s.t !== null);
  if (seq.length < 2) return null;
  const tMax = Math.max(...seq.map((s) => s.t!));
  const sT = redondoAcima((tMax * 1.04) / 16);
  const largura = Math.ceil((tMax * 1.04) / sT);
  const txt = seq.map((s) => (s.s ? `Estágio ${s.s.n} — Q = ${fmt(s.Q, 1)} ${U} — leitura ${s.tipo === 'ini' ? 'inicial' : 'final'}` : 'Início'));
  const fmtT = (t: number) => `${Math.floor(t / 60)}h${String(Math.round(t % 60)).padStart(2, '0')}`;
  const data: any[] = [
    { x: seq.map((s) => s.t), y: seq.map((s) => s.r), mode: 'lines', name: 'Deslocamento', line: { color: '#0B3A66', width: 2 }, hoverinfo: 'skip' },
    {
      x: seq.filter((s) => s.tipo === 'ini').map((s) => s.t), y: seq.filter((s) => s.tipo === 'ini').map((s) => s.r),
      text: txt.filter((_, i) => seq[i].tipo === 'ini'), mode: 'markers', name: 'Leitura inicial',
      marker: { symbol: 'circle-open', size: 7, color: '#0B3A66', line: { width: 1.5 } },
      customdata: seq.filter((s) => s.tipo === 'ini').map((s) => fmtT(s.t!)),
      hovertemplate: '%{text}<br>t = %{customdata}<br>r = %{y:.3f} mm<extra></extra>',
    },
    {
      x: seq.filter((s) => s.tipo === 'fim').map((s) => s.t), y: seq.filter((s) => s.tipo === 'fim').map((s) => s.r),
      text: txt.filter((_, i) => seq[i].tipo === 'fim'), mode: 'markers', name: 'Leitura final',
      marker: { symbol: 'circle', size: 7, color: '#1E6FD9' },
      customdata: seq.filter((s) => s.tipo === 'fim').map((s) => fmtT(s.t!)),
      hovertemplate: '%{text}<br>t = %{customdata}<br>r = %{y:.3f} mm<extra></extra>',
    },
  ];
  // rótulos de carga por estágio
  const anot = seq.filter((s) => s.tipo === 'fim' && s.s).map((s) => ({
    x: s.t, y: s.r, text: `${fmt(s.Q, 0)}`, showarrow: false, yshift: 12, font: { size: 9, color: '#6B7A8C' },
  }));
  const layout = {
    xaxis: eixo('Tempo decorrido (min)', { range: [0, largura * sT], dtick: dticks(largura * sT, sT), side: 'top' }),
    yaxis: eixo('Deslocamento r (mm)', { range: [e.rFim, 0], dtick: dticks(e.rFim, e.sR) }),
    margin: { l: 74, r: 24, t: 58, b: 30 },
    legend: { orientation: 'h', y: -0.02, yanchor: 'top', x: 0, font: { size: 11 } },
    annotations: anot,
    hovermode: 'closest',
  };
  return { data, layout, aspecto: e.alturaCm / largura };
}

export function figuraAux(aux: GraficoAux, cor: string) {
  const paleta = ['#9AA8B8', cor, cor, '#6B7A8C'];
  const data = aux.series.map((s, i) => ({
    x: s.x, y: s.y, name: s.nome, mode: s.modo ?? 'markers',
    marker: { size: 8, color: s.cor ?? (i === 0 && aux.series.length > 2 ? '#9AA8B8' : paleta[i] ?? cor), symbol: i === 0 ? 'circle-open' : 'circle' },
    line: { color: s.cor ?? cor, width: 1.8, dash: s.tracejado ? 'dash' : 'solid' },
    hovertemplate: `${s.nome}<br>x = %{x:.4g}<br>y = %{y:.4g}<extra></extra>`,
  }));
  const layout = {
    xaxis: eixo(aux.xLabel, aux.logX ? { type: 'log' } : {}),
    yaxis: eixo(aux.yLabel, { ...(aux.logY ? { type: 'log' } : {}), ...(aux.yInvertido ? { autorange: 'reversed' } : {}) }),
    hovermode: 'closest',
  };
  return { data, layout };
}

export function figuraR2(interp: Interpretacao, id: 'vdv' | 'aoki', cor: string) {
  const U = interp.ctx.U;
  const v = interp.varreduras[id];
  if (!v) return null;
  return {
    data: [
      { x: v.candidatos.map((c) => c.Qu), y: v.candidatos.map((c) => c.r2), mode: 'lines', name: 'R² (Qu)', line: { color: cor, width: 2 }, hovertemplate: `Qu = %{x:.1f} ${U}<br>R² = %{y:.5f}<extra></extra>` },
      { x: [v.Qu], y: [v.aj.r2], mode: 'markers', name: 'Máximo', marker: { size: 11, color: '#C93B3B', symbol: 'star' }, hovertemplate: `Qu = %{x:.1f} ${U}<br>R² = %{y:.5f}<extra></extra>` },
    ],
    layout: { xaxis: eixo(`Qu testado (${U})`), yaxis: eixo('R²', { range: [Math.max(0, Math.min(...v.candidatos.map((c) => c.r2))), 1.0005] }) },
  };
}

export function resultadoPorId(interp: Interpretacao, id: string): Resultado | undefined {
  return interp.resultados.find((r) => r.id === id);
}
