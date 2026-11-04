import type { Ensaio, Estagio, NomeUnidade, Ponto } from './types';

/** Fator multiplicativo para converter forças de `de` para `para`. */
export function fatorConversao(de: NomeUnidade, para: NomeUnidade, fatorTf: number): number {
  if (de === para) return 1;
  return de === 'tf' ? fatorTf : 1 / fatorTf;
}

/** Cópia do ensaio com as forças convertidas da unidade de origem para `para`. */
export function ensaioNaUnidade(ens: Ensaio, para: NomeUnidade, fatorTf: number): Ensaio {
  const k = fatorConversao(ens.unidadeOrigem, para, fatorTf);
  if (k === 1) return ens;
  return {
    ...ens,
    unidadeOrigem: para,
    estaca: { ...ens.estaca, Qt: ens.estaca.Qt === null ? null : ens.estaca.Qt * k },
    estagios: ens.estagios.map((s) => ({ ...s, Q: s.Q * k })),
  };
}

export function media(vals: (number | null)[], ativos: boolean[]): number | null {
  let s = 0, k = 0;
  vals.forEach((v, i) => {
    if (ativos[i] !== false && v !== null && v !== undefined && Number.isFinite(v)) { s += v; k++; }
  });
  return k ? s / k : null;
}

/** Desvio máximo relativo de um relógio em relação à média (fração). */
export function dispersao(vals: (number | null)[], ativos: boolean[]): number | null {
  const m = media(vals, ativos);
  if (m === null || Math.abs(m) < 0.5) return null;
  let d = 0;
  vals.forEach((v, i) => {
    if (ativos[i] !== false && v !== null && Number.isFinite(v)) d = Math.max(d, Math.abs(v - m) / Math.abs(m));
  });
  return d;
}

export function areaEstaca(ens: Ensaio): number {
  const e = ens.estaca;
  return e.area && e.area > 0 ? e.area : (Math.PI * (e.D / 1000) ** 2) / 4;
}

export function diametroPonta(ens: Ensaio): number {
  return ens.estaca.Dponta && ens.estaca.Dponta > 0 ? ens.estaca.Dponta : ens.estaca.D;
}

export function horaParaMin(h: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec((h || '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Pontos de carregamento (leitura final de cada estágio), em ordem, sem a origem. */
export function pontosCarregamento(ens: Ensaio): Ponto[] {
  const pts: Ponto[] = [];
  for (const s of ens.estagios) {
    if (s.fase !== 'C' || !s.incluir || !(s.Q > 0)) continue;
    const r = media(s.rFim, ens.relogioAtivo);
    if (r === null) continue;
    pts.push({ Q: s.Q, r, n: s.n });
  }
  return pts;
}

/** Sequência de pontos (inicial e final de cada estágio) para o gráfico em "degraus". */
export function sequenciaDegraus(ens: Ensaio) {
  const seq: { Q: number; r: number; t: number | null; tipo: 'ini' | 'fim' | 'origem'; s: Estagio | null }[] = [
    { Q: 0, r: 0, t: null, tipo: 'origem', s: null },
  ];
  let base: number | null = null;
  let ultimo = -Infinity;
  const tempo = (h: string) => {
    let m = horaParaMin(h);
    if (m === null) return null;
    if (base === null) base = m;
    let t: number = m - base;
    while (t < ultimo - 1e-9) t += 1440; // virada de dia
    ultimo = t;
    return t;
  };
  for (const s of ens.estagios) {
    if (!s.incluir) continue;
    const ri = media(s.rIni, ens.relogioAtivo);
    const rf = media(s.rFim, ens.relogioAtivo);
    const ti = tempo(s.hIni);
    const tf = tempo(s.hFim);
    if (ri !== null) seq.push({ Q: s.Q, r: ri, t: ti, tipo: 'ini', s });
    if (rf !== null) seq.push({ Q: s.Q, r: rf, t: tf, tipo: 'fim', s });
  }
  if (seq.length > 1 && seq[1].t !== null) seq[0].t = seq[1].t;
  return seq;
}

const comOrigem = (pts: Ponto[]): Ponto[] => [{ Q: 0, r: 0 }, ...pts];

/** Recalque na curva medida para a carga Q (interpolação linear). */
export function rDeQ(pts: Ponto[], Q: number): number | null {
  const p = comOrigem(pts);
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1];
    if (Q >= a.Q && Q <= b.Q && b.Q > a.Q) return a.r + ((Q - a.Q) / (b.Q - a.Q)) * (b.r - a.r);
  }
  return null;
}

/** Carga na curva medida para o recalque r (primeiro cruzamento). */
export function QdeR(pts: Ponto[], r: number): number | null {
  const p = comOrigem(pts);
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i], b = p[i + 1];
    if (r >= a.r && r <= b.r && b.r > a.r) return a.Q + ((r - a.r) / (b.r - a.r)) * (b.Q - a.Q);
  }
  return null;
}

/** Interseção da curva medida com a reta r = c + m·Q (curva começa abaixo da reta). */
export function intersecaoMedida(pts: Ponto[], c: number, m: number): Ponto | null {
  const p = comOrigem(pts);
  for (let i = 0; i < p.length - 1; i++) {
    const fa = p[i].r - (c + m * p[i].Q);
    const fb = p[i + 1].r - (c + m * p[i + 1].Q);
    if (fa < 0 && fb >= 0) {
      const t = fa / (fa - fb);
      const Q = p[i].Q + t * (p[i + 1].Q - p[i].Q);
      return { Q, r: c + m * Q };
    }
  }
  return null;
}

/** Bisseção genérica: f(lo) < 0 < f(hi). */
export function bissecao(f: (x: number) => number, lo: number, hi: number, it = 200): number | null {
  let flo = f(lo), fhi = f(hi);
  if (!(flo < 0 && fhi > 0)) return null;
  for (let k = 0; k < it; k++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (fm < 0) { lo = mid; flo = fm; } else { hi = mid; fhi = fm; }
    if (hi - lo < 1e-9 * Math.max(1, hi)) break;
  }
  return (lo + hi) / 2;
}
