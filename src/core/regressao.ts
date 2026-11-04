export interface Ajuste {
  a: number; // intercepto
  b: number; // inclinação
  r2: number;
  n: number;
}

/** Regressão linear por mínimos quadrados: y = a + b·x */
export function ajusteLinear(x: number[], y: number[]): Ajuste {
  const n = x.length;
  if (n < 2) return { a: NaN, b: NaN, r2: NaN, n };
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy;
  }
  const b = sxy / sxx;
  const a = my - b * mx;
  let ssr = 0;
  for (let i = 0; i < n; i++) { const e = y[i] - (a + b * x[i]); ssr += e * e; }
  const r2 = syy === 0 ? 1 : 1 - ssr / syy;
  return { a, b, r2, n };
}

/** Regressão pela origem: y = b·x. R² calculado em relação à média de y. */
export function ajusteOrigem(x: number[], y: number[]): Ajuste {
  const n = x.length;
  let sxx = 0, sxy = 0, sy = 0;
  for (let i = 0; i < n; i++) { sxx += x[i] * x[i]; sxy += x[i] * y[i]; sy += y[i]; }
  const b = sxy / sxx;
  const my = sy / n;
  let ssr = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const e = y[i] - b * x[i]; ssr += e * e;
    syy += (y[i] - my) ** 2;
  }
  const r2 = syy === 0 ? 1 : 1 - ssr / syy;
  return { a: 0, b, r2, n };
}
