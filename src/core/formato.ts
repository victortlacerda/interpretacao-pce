/** Número em pt-BR para texto/tabela. */
export function fmt(x: number | null | undefined, d = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—';
  return x.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Número para TeX (vírgula decimal). */
export function tx(x: number | null | undefined, d = 2): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return '\\text{—}';
  if (x !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e7)) {
    const e = Math.floor(Math.log10(Math.abs(x)));
    const m = x / 10 ** e;
    return `${m.toFixed(d).replace('.', '{,}')} \\times 10^{${e}}`;
  }
  const [int, dec] = Math.abs(x).toFixed(d).split('.');
  const milhar = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');
  return `${x < 0 ? '-' : ''}${milhar}${dec ? `{,}${dec}` : ''}`;
}

/** Formato científico curto para tabelas. */
export function fmtSci(x: number | null | undefined, d = 4): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return '—';
  if (x !== 0 && (Math.abs(x) < 1e-2 || Math.abs(x) >= 1e6)) {
    const e = Math.floor(Math.log10(Math.abs(x)));
    return `${(x / 10 ** e).toFixed(3).replace('.', ',')}×10^${e}`;
  }
  return fmt(x, d);
}

export function parseNum(s: unknown): number | null {
  if (s === null || s === undefined) return null;
  if (typeof s === 'number') return Number.isFinite(s) ? s : null;
  const t = String(s).trim().replace(/\s/g, '');
  if (!t) return null;
  // aceita "1.234,56", "1234,56" e "1234.56"
  let v = t;
  if (v.includes(',') && v.includes('.')) v = v.replace(/\./g, '').replace(',', '.');
  else v = v.replace(',', '.');
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
