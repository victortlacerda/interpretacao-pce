/**
 * Escala do gráfico carga × deslocamento (NBR 16903:2020 — apresentação dos resultados):
 * a reta que liga a origem ao ponto da curva correspondente à carga estimada de trabalho
 * deve resultar em inclinação de 20° ± 5° com o eixo das cargas.
 *
 * Eixo das cargas horizontal, deslocamentos para baixo. Escalas em unidades por "cm" de papel.
 */

export interface Escala {
  sQ: number; // kN/cm
  sR: number; // mm/cm
  larguraCm: number;
  alturaCm: number;
  angulo: number; // graus
  anguloOk: boolean;
  Qt: number;
  rt: number;
  Qfim: number; // limite do eixo de cargas
  rFim: number; // limite do eixo de deslocamentos
}

const MANTISSAS_Q = [1, 2, 2.5, 5];
const MANTISSAS_R = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8];

/** Menor valor "redondo" ≥ x. */
export function redondoAcima(x: number, mant = MANTISSAS_Q): number {
  if (!(x > 0)) return 1;
  const e = Math.floor(Math.log10(x));
  for (const k of [e, e + 1]) for (const m of mant) { const v = m * 10 ** k; if (v >= x * (1 - 1e-12)) return v; }
  return 10 ** (e + 1);
}

function candidatosRedondos(x: number): number[] {
  const e = Math.floor(Math.log10(x));
  const out: number[] = [];
  for (const k of [e - 1, e, e + 1]) for (const m of MANTISSAS_R) out.push(m * 10 ** k);
  return out;
}

export const anguloGraus = (Qt: number, rt: number, sQ: number, sR: number) =>
  (Math.atan((rt / sR) / (Qt / sQ)) * 180) / Math.PI;

export function calcularEscala(opts: {
  Qt: number; rt: number; Qplot: number; rPlot: number; larguraCm?: number; alvo?: number;
}): Escala {
  const { Qt, rt, Qplot, rPlot } = opts;
  const largura = opts.larguraCm ?? 16;
  const alvo = opts.alvo ?? 20;
  const sQ = redondoAcima(Qplot / largura);
  const ideal = (rt * sQ) / (Qt * Math.tan((alvo * Math.PI) / 180));
  let sR = ideal;
  let melhor = Infinity;
  for (const c of candidatosRedondos(ideal)) {
    const a = anguloGraus(Qt, rt, sQ, c);
    if (a >= 15 && a <= 25 && Math.abs(a - alvo) < melhor) { melhor = Math.abs(a - alvo); sR = c; }
  }
  const larguraCm = Math.max(1, Math.ceil(Qplot / sQ - 1e-9));
  const alturaCm = Math.max(1, Math.ceil(rPlot / sR - 1e-9));
  const angulo = anguloGraus(Qt, rt, sQ, sR);
  return {
    sQ, sR, larguraCm, alturaCm, angulo, anguloOk: angulo >= 15 - 1e-9 && angulo <= 25 + 1e-9,
    Qt, rt, Qfim: larguraCm * sQ, rFim: alturaCm * sR,
  };
}
