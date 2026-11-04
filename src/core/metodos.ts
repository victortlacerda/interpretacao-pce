import { ajusteLinear, ajusteOrigem, type Ajuste } from './regressao';
import { QdeR, rDeQ, intersecaoMedida, bissecao, areaEstaca, diametroPonta, pontosCarregamento } from './curva';
import { fmt, fmtSci, tx } from './formato';
import type { Ensaio, Parametros, Ponto, Resultado, Passo, Tabela } from './types';

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

export interface Contexto {
  pts: Ponto[];
  Qmax: number;
  rmax: number;
  D: number; // mm
  Dp: number; // mm
  L: number; // m
  A: number; // m²
  E: number; // GPa
  p: Parametros;
}

export interface Exponencial {
  Qu: number;
  alfa: number;
  beta: number;
  nome: string;
}

export const rExp = (e: Exponencial, Q: number) => (-Math.log(1 - Q / e.Qu) - e.beta) / e.alfa;
export const QExp = (e: Exponencial, r: number) => e.Qu * (1 - Math.exp(-(e.alfa * r + e.beta)));

export function criarContexto(ens: Ensaio, p: Parametros): Contexto {
  const pts = pontosCarregamento(ens);
  return {
    pts,
    Qmax: Math.max(0, ...pts.map((x) => x.Q)),
    rmax: Math.max(0, ...pts.map((x) => x.r)),
    D: ens.estaca.D,
    Dp: diametroPonta(ens),
    L: ens.estaca.L,
    A: areaEstaca(ens),
    E: ens.estaca.E,
    p,
  };
}

const ultimos = <T,>(arr: T[], n: number | null, padrao: number) => {
  const k = Math.min(arr.length, Math.max(2, n ?? padrao));
  return arr.slice(arr.length - k);
};

const tabelaPontos = (pts: Ponto[], extra?: { cab: string; f: (p: Ponto) => string }[]): Tabela => ({
  cab: ['Estágio', 'Q (kN)', 'r (mm)', ...(extra ?? []).map((e) => e.cab)],
  linhas: pts.map((p) => [String(p.n ?? '—'), fmt(p.Q, 1), fmt(p.r, 3), ...(extra ?? []).map((e) => e.f(p))]),
});

const passoRegressao = (aj: Ajuste, yNome: string, xNome: string, aNome = 'a', bNome = 'b'): Passo => ({
  titulo: 'Regressão linear (mínimos quadrados)',
  tex: [
    `${yNome} = ${aNome} + ${bNome}\\,${xNome}`,
    `${aNome} = ${tx(aj.a, 6)} \\qquad ${bNome} = ${tx(aj.b, 6)} \\qquad R^2 = ${tx(aj.r2, 5)} \\qquad n = ${aj.n}`,
  ],
});

function primeiraRaiz(f: (x: number) => number, lo: number, hi: number, N = 4000): number | null {
  let xa = lo, fa = f(lo);
  for (let i = 1; i <= N; i++) {
    const xb = lo + ((hi - lo) * i) / N;
    const fb = f(xb);
    if (Number.isFinite(fa) && Number.isFinite(fb) && fa < 0 && fb >= 0) return bissecao(f, xa, xb);
    xa = xb; fa = fb;
  }
  return null;
}

const vazio = (id: string, nome: string, ref: string, categoria: Resultado['categoria'], motivo: string): Resultado => ({
  id, nome, ref, categoria, Qu: null, ru: null, status: 'invalido', aviso: motivo, passos: [{ titulo: 'Não aplicável', texto: motivo }],
});

// ---------------------------------------------------------------------------
// Van der Veen (1953) e Van der Veen modificado por Aoki (1976)
// ---------------------------------------------------------------------------

interface Varredura {
  Qu: number;
  aj: Ajuste;
  candidatos: { Qu: number; r2: number }[];
  noLimite: boolean;
}

export function varreduraVdV(pts: Ponto[], intercepto: boolean): Varredura | null {
  if (pts.length < 3) return null;
  const Qmax = Math.max(...pts.map((p) => p.Q));
  const x = pts.map((p) => p.r);
  const fit = (Qu: number) => {
    const y = pts.map((p) => -Math.log(1 - p.Q / Qu));
    return intercepto ? ajusteLinear(x, y) : ajusteOrigem(x, y);
  };
  const N = 800, FATOR = 5;
  const cands: { Qu: number; r2: number }[] = [];
  for (let i = 1; i <= N; i++) {
    const Qu = Qmax * (1 + (FATOR - 1) * (i / N) ** 2);
    cands.push({ Qu, r2: fit(Qu).r2 });
  }
  let ib = 0;
  cands.forEach((c, i) => { if (c.r2 > cands[ib].r2) ib = i; });
  // refinamento por seção áurea
  let lo = ib > 0 ? cands[ib - 1].Qu : Qmax * (1 + 1e-7);
  let hi = ib < N - 1 ? cands[ib + 1].Qu : cands[ib].Qu;
  const g = (Math.sqrt(5) - 1) / 2;
  let c1 = hi - g * (hi - lo), c2 = lo + g * (hi - lo);
  let f1 = fit(c1).r2, f2 = fit(c2).r2;
  for (let k = 0; k < 100; k++) {
    if (f1 > f2) { hi = c2; c2 = c1; f2 = f1; c1 = hi - g * (hi - lo); f1 = fit(c1).r2; }
    else { lo = c1; c1 = c2; f1 = f2; c2 = lo + g * (hi - lo); f2 = fit(c2).r2; }
  }
  const Qu = (lo + hi) / 2;
  return { Qu, aj: fit(Qu), candidatos: cands, noLimite: ib >= N - 2 };
}

function metodoVdV(ctx: Contexto, intercepto: boolean): { res: Resultado; exp: Exponencial | null } {
  const id = intercepto ? 'aoki' : 'vdv';
  const nome = intercepto ? 'Van der Veen modificado (Aoki, 1976)' : 'Van der Veen (1953)';
  const ref = intercepto ? 'Aoki (1976)' : 'Van der Veen (1953)';
  const v = varreduraVdV(ctx.pts, intercepto);
  if (!v) return { res: vazio(id, nome, ref, 'extrapolacao', 'São necessários ao menos 3 estágios de carregamento.'), exp: null };
  const { Qu, aj } = v;
  const alfa = aj.b, beta = intercepto ? aj.a : 0;
  const exp: Exponencial = { Qu, alfa, beta, nome };
  const passos: Passo[] = [
    {
      titulo: 'Equação do método',
      tex: intercepto
        ? ['Q = Q_u\\left(1 - e^{-(\\alpha\\, r + \\beta)}\\right)', '-\\ln\\!\\left(1 - \\dfrac{Q}{Q_u}\\right) = \\alpha\\, r + \\beta']
        : ['Q = Q_u\\left(1 - e^{-\\alpha\\, r}\\right)', '-\\ln\\!\\left(1 - \\dfrac{Q}{Q_u}\\right) = \\alpha\\, r'],
      texto: intercepto
        ? 'Aoki (1976) introduz o intercepto β, de modo que a reta não precise passar pela origem.'
        : 'A reta linearizada passa pela origem (regressão sem intercepto).',
    },
    {
      titulo: 'Critério de escolha de Qu',
      texto: `Foram testados ${v.candidatos.length} valores de Qu entre Qmáx = ${fmt(ctx.Qmax, 1)} kN e ${fmt(ctx.Qmax * 5, 0)} kN, com refinamento por seção áurea. Adota-se o Qu que fornece o maior coeficiente de determinação R² da reta.`,
      tabela: {
        cab: ['Qu (kN)', 'R²'],
        linhas: amostraCandidatos(v, ctx.Qmax).map((c) => [fmt(c.Qu, 1), fmt(c.r2, 5)]),
      },
    },
    {
      titulo: `Linearização para Qu = ${fmt(Qu, 1)} kN`,
      tabela: tabelaPontos(ctx.pts, [
        { cab: 'Q/Qu', f: (p) => fmt(p.Q / Qu, 4) },
        { cab: '−ln(1 − Q/Qu)', f: (p) => fmt(-Math.log(1 - p.Q / Qu), 4) },
      ]),
    },
    {
      titulo: 'Regressão linear',
      tex: [
        intercepto ? `\\alpha = ${tx(alfa, 5)}\\ \\text{mm}^{-1} \\qquad \\beta = ${tx(beta, 5)}` : `\\alpha = ${tx(alfa, 5)}\\ \\text{mm}^{-1}`,
        `R^2 = ${tx(aj.r2, 5)}`,
      ],
    },
    {
      titulo: 'Resultado',
      tex: [
        intercepto
          ? `Q = ${tx(Qu, 1)}\\left(1 - e^{-(${tx(alfa, 5)}\\, r ${beta >= 0 ? '+' : '-'} ${tx(Math.abs(beta), 5)})}\\right)`
          : `Q = ${tx(Qu, 1)}\\left(1 - e^{-${tx(alfa, 5)}\\, r}\\right)`,
        `Q_u = ${tx(Qu, 1)}\\ \\text{kN} \\qquad \\dfrac{Q_{máx}}{Q_u} = ${tx(ctx.Qmax / Qu, 3)}`,
      ],
    },
  ];
  const aviso = v.noLimite
    ? 'O R² não apresentou máximo no intervalo pesquisado: a curva não caracteriza ruptura e a extrapolação não é confiável.'
    : undefined;
  const xs = ctx.pts.map((p) => p.r);
  const rLin = [0, ctx.rmax * 1.05];
  return {
    exp,
    res: {
      id, nome, ref, categoria: 'extrapolacao', Qu, ru: null, fonte: 'ajuste', status: v.noLimite ? 'invalido' : 'ok', aviso, R2: aj.r2, passos,
      curvaQ: (r) => QExp(exp, r),
      aux: {
        titulo: 'Linearização −ln(1 − Q/Qu) × r', xLabel: 'Recalque r (mm)', yLabel: '−ln(1 − Q/Qu)',
        series: [
          { nome: 'Estágios', x: xs, y: ctx.pts.map((p) => -Math.log(1 - p.Q / Qu)), modo: 'markers' },
          { nome: 'Reta ajustada', x: rLin, y: rLin.map((r) => alfa * r + beta), modo: 'lines', tracejado: true },
        ],
      },
    },
  };
}

function amostraCandidatos(v: Varredura, Qmax: number) {
  const fatores = [0.9, 0.95, 0.98, 0.99, 1, 1.01, 1.02, 1.05, 1.1, 1.25];
  const pts = fatores.map((f) => v.Qu * f).filter((q) => q > Qmax * 1.0001);
  const out = pts.map((Qu) => {
    // interpola R² na lista de candidatos (ou exato no ótimo)
    if (Math.abs(Qu - v.Qu) < 1e-9) return { Qu, r2: v.aj.r2 };
    let best = v.candidatos[0];
    for (const c of v.candidatos) if (Math.abs(c.Qu - Qu) < Math.abs(best.Qu - Qu)) best = c;
    return best;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Critérios de ruptura convencional por reta (NBR 6122, Davisson)
// ---------------------------------------------------------------------------

function retaRuptura(
  ctx: Contexto, base: Exponencial | null, id: string, nome: string, ref: string,
  c: number, eqTex: string, cTex: string,
): Resultado {
  const m = ctx.L / (ctx.A * ctx.E * 1000); // mm/kN
  const dados: Passo = {
    titulo: 'Dados da estaca',
    tabela: {
      cab: ['Grandeza', 'Valor'],
      linhas: [
        ['Comprimento L', `${fmt(ctx.L, 2)} m`],
        ['Diâmetro D', `${fmt(ctx.D, 0)} mm`],
        ['Área A', `${fmt(ctx.A, 5)} m²`],
        ['Módulo E', `${fmt(ctx.E, 1)} GPa`],
      ],
    },
  };
  const passos: Passo[] = [
    dados,
    { titulo: 'Equação da reta de ruptura', tex: [eqTex] },
    {
      titulo: 'Substituição',
      tex: [
        `\\frac{L}{A\\,E} = \\frac{${tx(ctx.L, 2)}\\ \\text{m}}{${tx(ctx.A, 5)}\\ \\text{m}^2 \\times ${tx(ctx.E, 1)}\\times10^{6}\\ \\text{kN/m}^2} = ${tx(m, 6)}\\ \\text{mm/kN}`,
        `${cTex} = ${tx(c, 3)}\\ \\text{mm}`,
        `r = ${tx(c, 3)} + ${tx(m, 6)}\\,Q \\quad (\\text{mm; } Q \\text{ em kN})`,
      ],
    },
  ];
  const retaR = (Q: number) => c + m * Q;
  const pm = intersecaoMedida(ctx.pts, c, m);
  if (pm) {
    passos.push({
      titulo: 'Interseção com a curva medida',
      texto: 'A reta intercepta a curva carga × recalque medida.',
      tex: [`Q_u = ${tx(pm.Q, 1)}\\ \\text{kN} \\qquad r_u = ${tx(pm.r, 2)}\\ \\text{mm}`],
    });
    return { id, nome, ref, categoria: 'convencional', Qu: pm.Q, ru: pm.r, fonte: 'curva medida', status: 'ok', passos, retaR };
  }
  if (!base) {
    passos.push({ titulo: 'Resultado', texto: 'A reta não intercepta a curva medida e não há curva extrapolada disponível.' });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru: null, status: 'nao-atingido', passos, retaR };
  }
  const Q = primeiraRaiz((q) => rExp(base, q) - retaR(q), 1e-9 * base.Qu, base.Qu * (1 - 1e-12));
  passos.push({
    titulo: `Interseção com a curva extrapolada (${base.nome})`,
    texto: `A reta não intercepta a curva medida (ensaio até ${fmt(ctx.Qmax, 1)} kN). A interseção é obtida com a curva extrapolada por ${base.nome}, resolvendo numericamente:`,
    tex: [
      `\\frac{-\\ln(1 - Q/${tx(base.Qu, 1)}) - (${tx(base.beta, 5)})}{${tx(base.alfa, 5)}} = ${tx(c, 3)} + ${tx(m, 6)}\\,Q`,
      Q ? `Q_u = ${tx(Q, 1)}\\ \\text{kN} \\qquad r_u = ${tx(retaR(Q), 2)}\\ \\text{mm}` : '\\text{sem solução}',
    ],
  });
  return {
    id, nome, ref, categoria: 'convencional', Qu: Q, ru: Q ? retaR(Q) : null, fonte: 'curva extrapolada', status: Q ? 'ok' : 'nao-atingido',
    aviso: 'Resultado obtido sobre a curva extrapolada.', passos, retaR,
  };
}

// ---------------------------------------------------------------------------
// Critérios de recalque fixo (Terzaghi 10% D, recalque-limite)
// ---------------------------------------------------------------------------

function recalqueFixo(
  ctx: Contexto, base: Exponencial | null, id: string, nome: string, ref: string, ru: number, passosIni: Passo[],
  linhas: { r: number; nome: string }[],
): Resultado {
  const passos = [...passosIni];
  const Qm = QdeR(ctx.pts, ru);
  if (Qm !== null) {
    passos.push({ titulo: 'Carga correspondente (curva medida)', texto: 'Interpolação linear entre os estágios que contêm o recalque de ruptura.', tex: [`Q_u = Q(r = ${tx(ru, 2)}\\ \\text{mm}) = ${tx(Qm, 1)}\\ \\text{kN}`] });
    return { id, nome, ref, categoria: 'convencional', Qu: Qm, ru, fonte: 'curva medida', status: 'ok', passos, linhasR: linhas };
  }
  if (!base) {
    passos.push({ titulo: 'Resultado', texto: `O recalque máximo do ensaio (${fmt(ctx.rmax, 2)} mm) não atinge ${fmt(ru, 2)} mm.` });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru, status: 'nao-atingido', passos, linhasR: linhas };
  }
  const Q = QExp(base, ru);
  passos.push({
    titulo: `Carga correspondente (curva extrapolada — ${base.nome})`,
    texto: `O recalque máximo medido (${fmt(ctx.rmax, 2)} mm) é inferior a ${fmt(ru, 2)} mm; usa-se a curva extrapolada.`,
    tex: [`Q_u = ${tx(base.Qu, 1)}\\left(1 - e^{-(${tx(base.alfa, 5)}\\times ${tx(ru, 2)} ${base.beta >= 0 ? '+' : '-'} ${tx(Math.abs(base.beta), 5)})}\\right) = ${tx(Q, 1)}\\ \\text{kN}`],
  });
  return {
    id, nome, ref, categoria: 'convencional', Qu: Q, ru, fonte: 'curva extrapolada', status: 'ok',
    aviso: 'Resultado obtido sobre a curva extrapolada.', passos, linhasR: linhas,
  };
}

// ---------------------------------------------------------------------------
// Chin-Kondner
// ---------------------------------------------------------------------------

function metodoChin(ctx: Contexto): Resultado {
  const id = 'chin', nome = 'Chin-Kondner (1970/1971)', ref = 'Chin (1970, 1971); Kondner (1963)';
  if (ctx.pts.length < 3) return vazio(id, nome, ref, 'extrapolacao', 'São necessários ao menos 3 estágios.');
  const usados = ultimos(ctx.pts, ctx.p.nChin, Math.max(3, Math.ceil(ctx.pts.length / 2)));
  const aj = ajusteLinear(usados.map((p) => p.r), usados.map((p) => p.r / p.Q));
  const C1 = aj.b, C2 = aj.a;
  const passos: Passo[] = [
    { titulo: 'Equação do método', tex: ['\\frac{r}{Q} = C_1\\, r + C_2', 'Q_u = \\frac{1}{C_1}'], texto: 'Curva carga × recalque hiperbólica; Qu é a assíntota (r → ∞).' },
    {
      titulo: `Pontos usados no ajuste (${usados.length} últimos estágios)`,
      tabela: tabelaPontos(usados, [{ cab: 'r/Q (mm/kN)', f: (p) => fmtSci(p.r / p.Q, 6) }]),
    },
    passoRegressao(aj, '\\frac{r}{Q}', 'r', 'C_2', 'C_1'),
  ];
  if (!(C1 > 0)) {
    passos.push({ titulo: 'Resultado', texto: 'C1 ≤ 0: a hipérbole não converge para uma carga-limite com estes pontos.' });
    return { id, nome, ref, categoria: 'extrapolacao', Qu: null, ru: null, status: 'invalido', aviso: 'C1 ≤ 0', passos, R2: aj.r2 };
  }
  const Qu = 1 / C1;
  passos.push({ titulo: 'Resultado', tex: [`Q_u = \\frac{1}{${tx(C1, 6)}} = ${tx(Qu, 1)}\\ \\text{kN}`, `\\dfrac{Q_{máx}}{Q_u} = ${tx(ctx.Qmax / Qu, 3)}`] });
  const rs = ctx.pts.map((p) => p.r);
  const rl = [0, ctx.rmax * 1.05];
  return {
    id, nome, ref, categoria: 'extrapolacao', Qu, ru: null, fonte: 'ajuste', status: 'ok', R2: aj.r2, passos,
    curvaQ: (r) => r / (C1 * r + C2),
    aux: {
      titulo: 'Chin-Kondner: r/Q × r', xLabel: 'Recalque r (mm)', yLabel: 'r/Q (mm/kN)',
      series: [
        { nome: 'Estágios', x: rs, y: ctx.pts.map((p) => p.r / p.Q), modo: 'markers' },
        { nome: 'Usados no ajuste', x: usados.map((p) => p.r), y: usados.map((p) => p.r / p.Q), modo: 'markers' },
        { nome: 'Reta ajustada', x: rl, y: rl.map((r) => C1 * r + C2), modo: 'lines', tracejado: true },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Décourt — rigidez (1999)
// ---------------------------------------------------------------------------

function metodoDecourt(ctx: Contexto): Resultado {
  const id = 'decourt', nome = 'Décourt — rigidez (1999)', ref = 'Décourt (1996, 1999, 2008)';
  const pts = ctx.pts.filter((p) => p.r > 0);
  if (pts.length < 3) return vazio(id, nome, ref, 'extrapolacao', 'São necessários ao menos 3 estágios com recalque > 0.');
  const usados = ultimos(pts, ctx.p.nDecourt, Math.max(3, Math.ceil(pts.length / 2)));
  const aj = ajusteLinear(usados.map((p) => p.Q), usados.map((p) => p.Q / p.r));
  const a = aj.a, b = aj.b;
  const passos: Passo[] = [
    { titulo: 'Equação do método', tex: ['K = \\frac{Q}{r}', 'K = a + b\\,Q', 'Q_u = -\\frac{a}{b} \\quad (K = 0)'], texto: 'Rigidez K de cada estágio em função da carga; a ruptura física corresponde à rigidez nula.' },
    { titulo: `Pontos usados no ajuste (${usados.length} últimos estágios)`, tabela: tabelaPontos(usados, [{ cab: 'K = Q/r (kN/mm)', f: (p) => fmt(p.Q / p.r, 2) }]) },
    passoRegressao(aj, 'K', 'Q'),
  ];
  if (!(b < 0)) {
    passos.push({ titulo: 'Resultado', texto: 'b ≥ 0: a rigidez não decresce com a carga nos pontos selecionados; não há interseção com K = 0.' });
    return { id, nome, ref, categoria: 'extrapolacao', Qu: null, ru: null, status: 'invalido', aviso: 'Rigidez não decrescente', passos, R2: aj.r2 };
  }
  const Qu = -a / b;
  passos.push({ titulo: 'Resultado', tex: [`Q_u = -\\frac{${tx(a, 4)}}{${tx(b, 6)}} = ${tx(Qu, 1)}\\ \\text{kN}`, `\\dfrac{Q_{máx}}{Q_u} = ${tx(ctx.Qmax / Qu, 3)}`] });
  return {
    id, nome, ref, categoria: 'extrapolacao', Qu, ru: null, fonte: 'ajuste', status: 'ok', R2: aj.r2, passos,
    curvaQ: (r) => (a * r) / (1 - b * r),
    aux: {
      titulo: 'Décourt: rigidez K × carga Q', xLabel: 'Carga Q (kN)', yLabel: 'Rigidez K = Q/r (kN/mm)',
      series: [
        { nome: 'Estágios', x: pts.map((p) => p.Q), y: pts.map((p) => p.Q / p.r), modo: 'markers' },
        { nome: 'Usados no ajuste', x: usados.map((p) => p.Q), y: usados.map((p) => p.Q / p.r), modo: 'markers' },
        { nome: 'Reta ajustada', x: [usados[0].Q, Qu], y: [a + b * usados[0].Q, 0], modo: 'lines', tracejado: true },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Mazurkiewicz (1972) e Massad (1986)
// ---------------------------------------------------------------------------

function recalquesIguais(ctx: Contexto) {
  const n = ctx.pts.length;
  const dr = ctx.rmax / n;
  const serie: { i: number; r: number; Q: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const r = i * dr;
    const Q = QdeR(ctx.pts, Math.min(r, ctx.rmax));
    if (Q !== null) serie.push({ i, r, Q });
  }
  return { dr, serie };
}

function metodoMazurkiewicz(ctx: Contexto): Resultado {
  const id = 'mazurkiewicz', nome = 'Mazurkiewicz (1972)', ref = 'Mazurkiewicz (1972), IVA, Estocolmo';
  if (ctx.pts.length < 4) return vazio(id, nome, ref, 'extrapolacao', 'São necessários ao menos 4 estágios.');
  const { dr, serie } = recalquesIguais(ctx);
  const pares = serie.slice(1).map((s, k) => ({ Qk: serie[k].Q, Qk1: s.Q, dQ: s.Q - serie[k].Q }));
  const usados = ultimos(pares, ctx.p.nMaz, pares.length);
  const aj = ajusteLinear(usados.map((p) => p.Qk1), usados.map((p) => p.dQ));
  const passos: Passo[] = [
    {
      titulo: 'Procedimento',
      texto: 'Escolhem-se recalques igualmente espaçados e leem-se as cargas correspondentes na curva. De cada carga Q(k) no eixo traça-se uma reta a 45° até a vertical de Q(k+1); os pontos obtidos, de coordenadas (Q(k+1), ΔQ), alinham-se numa reta cuja interseção com o eixo das cargas (ΔQ = 0) fornece Qu.',
      tex: [`\\Delta r = \\frac{r_{máx}}{n} = \\frac{${tx(ctx.rmax, 3)}}{${serie.length}} = ${tx(dr, 4)}\\ \\text{mm}`, '\\Delta Q_k = Q_{k+1} - Q_k = a + b\\,Q_{k+1}', 'Q_u = -\\frac{a}{b}'],
    },
    { titulo: 'Cargas para recalques igualmente espaçados', tabela: { cab: ['k', 'r (mm)', 'Q (kN)'], linhas: serie.map((s) => [String(s.i), fmt(s.r, 3), fmt(s.Q, 1)]) } },
    { titulo: `Pares usados no ajuste (${usados.length})`, tabela: { cab: ['Q(k) (kN)', 'Q(k+1) (kN)', 'ΔQ (kN)'], linhas: usados.map((p) => [fmt(p.Qk, 1), fmt(p.Qk1, 1), fmt(p.dQ, 1)]) } },
    passoRegressao(aj, '\\Delta Q', 'Q_{k+1}'),
  ];
  if (!(aj.b < 0)) {
    passos.push({ titulo: 'Resultado', texto: 'b ≥ 0: os incrementos de carga não decrescem; não há interseção com o eixo das cargas.' });
    return { id, nome, ref, categoria: 'extrapolacao', Qu: null, ru: null, status: 'invalido', aviso: 'Incrementos não decrescentes', passos, R2: aj.r2 };
  }
  const Qu = -aj.a / aj.b;
  passos.push({ titulo: 'Resultado', tex: [`Q_u = -\\frac{${tx(aj.a, 3)}}{${tx(aj.b, 5)}} = ${tx(Qu, 1)}\\ \\text{kN}`] });
  return {
    id, nome, ref, categoria: 'extrapolacao', Qu, ru: null, fonte: 'ajuste', status: 'ok', R2: aj.r2, passos,
    aux: {
      titulo: 'Mazurkiewicz: ΔQ × Q(k+1)', xLabel: 'Q(k+1) (kN)', yLabel: 'ΔQ = Q(k+1) − Q(k) (kN)',
      series: [
        { nome: 'Pares', x: pares.map((p) => p.Qk1), y: pares.map((p) => p.dQ), modo: 'markers' },
        { nome: 'Reta ajustada', x: [usados[0].Qk1, Qu], y: [aj.a + aj.b * usados[0].Qk1, 0], modo: 'lines', tracejado: true },
      ],
    },
  };
}

function metodoMassad(ctx: Contexto): Resultado {
  const id = 'massad', nome = 'Massad (1986)', ref = 'Massad (1986)';
  if (ctx.pts.length < 4) return vazio(id, nome, ref, 'extrapolacao', 'São necessários ao menos 4 estágios.');
  const { dr, serie } = recalquesIguais(ctx);
  const pares = serie.slice(1).map((s, k) => ({ Qk: serie[k].Q, Qk1: s.Q }));
  const usados = ultimos(pares, ctx.p.nMassad, pares.length);
  const aj = ajusteLinear(usados.map((p) => p.Qk), usados.map((p) => p.Qk1));
  const passos: Passo[] = [
    {
      titulo: 'Equação do método',
      texto: 'Formalização algébrica do procedimento de Mazurkiewicz, com recalques igualmente espaçados; equivalente ao método de Van der Veen.',
      tex: [`\\Delta r = ${tx(dr, 4)}\\ \\text{mm}`, 'Q_{k+1} = a + b\\,Q_k', 'Q_u = \\frac{a}{1 - b} \\quad (\\text{interseção com } Q_{k+1} = Q_k)'],
    },
    { titulo: `Pares usados (${usados.length})`, tabela: { cab: ['Q(k) (kN)', 'Q(k+1) (kN)'], linhas: usados.map((p) => [fmt(p.Qk, 1), fmt(p.Qk1, 1)]) } },
    passoRegressao(aj, 'Q_{k+1}', 'Q_k'),
  ];
  if (!(aj.b < 1 && aj.b > 0)) {
    passos.push({ titulo: 'Resultado', texto: 'b fora do intervalo (0, 1): a reta não intercepta a bissetriz no primeiro quadrante.' });
    return { id, nome, ref, categoria: 'extrapolacao', Qu: null, ru: null, status: 'invalido', aviso: 'b fora de (0,1)', passos, R2: aj.r2 };
  }
  const Qu = aj.a / (1 - aj.b);
  passos.push({ titulo: 'Resultado', tex: [`Q_u = \\frac{${tx(aj.a, 3)}}{1 - ${tx(aj.b, 5)}} = ${tx(Qu, 1)}\\ \\text{kN}`] });
  return {
    id, nome, ref, categoria: 'extrapolacao', Qu, ru: null, fonte: 'ajuste', status: 'ok', R2: aj.r2, passos,
    aux: {
      titulo: 'Massad: Q(k+1) × Q(k)', xLabel: 'Q(k) (kN)', yLabel: 'Q(k+1) (kN)',
      series: [
        { nome: 'Pares', x: pares.map((p) => p.Qk), y: pares.map((p) => p.Qk1), modo: 'markers' },
        { nome: 'Reta ajustada', x: [0, Qu], y: [aj.a, Qu], modo: 'lines', tracejado: true },
        { nome: 'Bissetriz 45°', x: [0, Qu * 1.05], y: [0, Qu * 1.05], modo: 'lines', tracejado: true, cor: '#9AA8B8' },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Brinch-Hansen 80 % e 90 %
// ---------------------------------------------------------------------------

function metodoBH80(ctx: Contexto): Resultado {
  const id = 'bh80', nome = 'Brinch-Hansen 80 % (1963)', ref = 'Brinch Hansen (1963)';
  const pts = ctx.pts.filter((p) => p.r > 0);
  if (pts.length < 3) return vazio(id, nome, ref, 'extrapolacao', 'São necessários ao menos 3 estágios com recalque > 0.');
  const usados = ultimos(pts, ctx.p.nBH80, pts.length);
  const aj = ajusteLinear(usados.map((p) => p.r), usados.map((p) => Math.sqrt(p.r) / p.Q));
  const C1 = aj.b, C2 = aj.a;
  const passos: Passo[] = [
    {
      titulo: 'Equação do método',
      texto: 'Qu é a carga cujo recalque é quatro vezes o recalque sob 0,8·Qu.',
      tex: ['\\frac{\\sqrt{r}}{Q} = C_1\\, r + C_2', 'Q_u = \\frac{1}{2\\sqrt{C_1\\,C_2}} \\qquad r_u = \\frac{C_2}{C_1}'],
    },
    { titulo: `Pontos usados (${usados.length})`, tabela: tabelaPontos(usados, [{ cab: '√r/Q', f: (p) => fmtSci(Math.sqrt(p.r) / p.Q, 6) }]) },
    passoRegressao(aj, '\\frac{\\sqrt{r}}{Q}', 'r', 'C_2', 'C_1'),
  ];
  if (!(C1 > 0 && C2 > 0)) {
    passos.push({ titulo: 'Resultado', texto: 'C1 e C2 devem ser positivos; o critério não se aplica a estes pontos.' });
    return { id, nome, ref, categoria: 'extrapolacao', Qu: null, ru: null, status: 'invalido', aviso: 'C1 ou C2 ≤ 0', passos, R2: aj.r2 };
  }
  const Qu = 1 / (2 * Math.sqrt(C1 * C2));
  const ru = C2 / C1;
  passos.push({
    titulo: 'Resultado',
    tex: [
      `Q_u = \\frac{1}{2\\sqrt{${tx(C1, 6)} \\times ${tx(C2, 6)}}} = ${tx(Qu, 1)}\\ \\text{kN}`,
      `r_u = \\frac{${tx(C2, 6)}}{${tx(C1, 6)}} = ${tx(ru, 2)}\\ \\text{mm}`,
      `\\text{Verificação: } Q(r_u/4) = ${tx(Math.sqrt(ru / 4) / (C1 * ru / 4 + C2), 1)}\\ \\text{kN} = 0{,}8\\,Q_u`,
    ],
  });
  const rl = [0, Math.max(ctx.rmax, ru) * 1.05];
  return {
    id, nome, ref, categoria: 'extrapolacao', Qu, ru, fonte: 'ajuste', status: 'ok', R2: aj.r2, passos,
    curvaQ: (r) => Math.sqrt(Math.max(r, 0)) / (C1 * r + C2),
    aux: {
      titulo: 'Brinch-Hansen 80 %: √r/Q × r', xLabel: 'Recalque r (mm)', yLabel: '√r / Q',
      series: [
        { nome: 'Estágios', x: pts.map((p) => p.r), y: pts.map((p) => Math.sqrt(p.r) / p.Q), modo: 'markers' },
        { nome: 'Reta ajustada', x: rl, y: rl.map((r) => C1 * r + C2), modo: 'lines', tracejado: true },
      ],
    },
  };
}

function metodoBH90(ctx: Contexto, base: Exponencial | null): Resultado {
  const id = 'bh90', nome = 'Brinch-Hansen 90 % (1963)', ref = 'Brinch Hansen (1963)';
  if (ctx.pts.length < 2) return vazio(id, nome, ref, 'convencional', 'Pontos insuficientes.');
  const passos: Passo[] = [
    { titulo: 'Critério', texto: 'Qu é a carga cujo recalque é o dobro do recalque sob 0,9·Qu.', tex: ['r(Q_u) = 2\\, r(0{,}9\\,Q_u)'] },
  ];
  const f = (Q: number) => { const a = rDeQ(ctx.pts, Q), b = rDeQ(ctx.pts, 0.9 * Q); return a === null || b === null ? NaN : a - 2 * b; };
  const Qm = primeiraRaiz(f, ctx.Qmax * 0.05, ctx.Qmax);
  if (Qm !== null) {
    const r = rDeQ(ctx.pts, Qm)!;
    passos.push({ titulo: 'Solução na curva medida', tex: [`Q_u = ${tx(Qm, 1)}\\ \\text{kN} \\qquad r(Q_u) = ${tx(r, 2)}\\ \\text{mm} \\qquad r(0{,}9Q_u) = ${tx(rDeQ(ctx.pts, 0.9 * Qm), 2)}\\ \\text{mm}`] });
    return { id, nome, ref, categoria: 'convencional', Qu: Qm, ru: r, fonte: 'curva medida', status: 'ok', passos };
  }
  if (!base) {
    passos.push({ titulo: 'Resultado', texto: 'O critério não é atingido na curva medida.' });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru: null, status: 'nao-atingido', passos };
  }
  const g = (Q: number) => rExp(base, Q) - 2 * rExp(base, 0.9 * Q);
  const Q = primeiraRaiz(g, ctx.Qmax, base.Qu * (1 - 1e-12));
  if (Q === null) {
    passos.push({ titulo: 'Resultado', texto: 'O critério não é atingido na curva medida nem na extrapolada.' });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru: null, status: 'nao-atingido', passos };
  }
  passos.push({
    titulo: `Solução na curva extrapolada (${base.nome})`,
    tex: [`Q_u = ${tx(Q, 1)}\\ \\text{kN} \\qquad r(Q_u) = ${tx(rExp(base, Q), 2)}\\ \\text{mm} \\qquad r(0{,}9Q_u) = ${tx(rExp(base, 0.9 * Q), 2)}\\ \\text{mm}`],
  });
  return { id, nome, ref, categoria: 'convencional', Qu: Q, ru: rExp(base, Q), fonte: 'curva extrapolada', status: 'ok', aviso: 'Resultado obtido sobre a curva extrapolada.', passos };
}

// ---------------------------------------------------------------------------
// Fuller & Hoy (1970) e Butler & Hoy (1977)
// ---------------------------------------------------------------------------

function pontoTangente(ctx: Contexto, base: Exponencial | null, S: number): { Q: number; r: number; fonte: Resultado['fonte'] } | null {
  const p = [{ Q: 0, r: 0 }, ...ctx.pts];
  const seg = p.slice(1).map((b, i) => ({ s: (b.r - p[i].r) / (b.Q - p[i].Q), Qm: (b.Q + p[i].Q) / 2 })).filter((x) => Number.isFinite(x.s));
  for (let i = 0; i < seg.length; i++) {
    if (seg[i].s >= S) {
      let Q: number;
      if (i === 0) Q = seg[0].Qm;
      else Q = seg[i - 1].Qm + ((S - seg[i - 1].s) / (seg[i].s - seg[i - 1].s)) * (seg[i].Qm - seg[i - 1].Qm);
      return { Q, r: rDeQ(ctx.pts, Q)!, fonte: 'curva medida' };
    }
  }
  if (!base) return null;
  const Q = base.Qu - 1 / (base.alfa * S);
  if (!(Q > 0)) return null;
  return { Q, r: rExp(base, Q), fonte: 'curva extrapolada' };
}

function metodoFullerHoy(ctx: Contexto, base: Exponencial | null): Resultado {
  const id = 'fullerhoy', nome = 'Fuller & Hoy (1970)', ref = 'Fuller & Hoy (1970)';
  const S = ctx.p.hoySlope;
  const passos: Passo[] = [
    { titulo: 'Critério', texto: 'Qu é a carga em que a tangente à curva carga × recalque atinge a inclinação de 0,05 in/ton.', tex: [`\\frac{dr}{dQ} = ${tx(S, 3)}\\ \\text{mm/kN}`] },
  ];
  const t = pontoTangente(ctx, base, S);
  if (!t) {
    passos.push({ titulo: 'Resultado', texto: 'A inclinação não é atingida.' });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru: null, status: 'nao-atingido', passos };
  }
  passos.push({
    titulo: t.fonte === 'curva medida' ? 'Ponto de tangência (curva medida)' : `Ponto de tangência (curva extrapolada — ${base!.nome})`,
    texto: t.fonte === 'curva medida' ? 'Inclinações dos trechos entre estágios interpoladas linearmente em função da carga média do trecho.' : 'Na curva exponencial, dr/dQ = 1/[α(Qu − Q)].',
    tex: t.fonte === 'curva medida' ? [`Q_u = ${tx(t.Q, 1)}\\ \\text{kN} \\qquad r = ${tx(t.r, 2)}\\ \\text{mm}`] : [`Q = Q_u - \\frac{1}{\\alpha S} = ${tx(base!.Qu, 1)} - \\frac{1}{${tx(base!.alfa, 5)}\\times${tx(S, 3)}} = ${tx(t.Q, 1)}\\ \\text{kN}`],
  });
  return { id, nome, ref, categoria: 'convencional', Qu: t.Q, ru: t.r, fonte: t.fonte, status: 'ok', aviso: t.fonte === 'curva extrapolada' ? 'Resultado obtido sobre a curva extrapolada.' : undefined, passos };
}

function metodoButlerHoy(ctx: Contexto, base: Exponencial | null): Resultado {
  const id = 'butlerhoy', nome = 'Butler & Hoy (1977)', ref = 'Butler & Hoy (1977)';
  const S = ctx.p.hoySlope;
  const ini = ctx.pts.slice(0, Math.max(1, ctx.p.nInicialButler));
  if (ini.length < 1) return vazio(id, nome, ref, 'convencional', 'Pontos insuficientes.');
  const k = ajusteOrigem(ini.map((p) => p.Q), ini.map((p) => p.r)).b;
  const passos: Passo[] = [
    { titulo: 'Critério', texto: 'Qu é a interseção da tangente ao trecho inicial com a tangente à curva de inclinação 0,05 in/ton (1 in / 20 ton).', tex: ['r = k\\,Q \\quad (\\text{tangente inicial})', `r = r^* + S\\,(Q - Q^*) \\quad S = ${tx(S, 3)}\\ \\text{mm/kN}`, 'Q_u = \\frac{r^* - S\\,Q^*}{k - S}'] },
    { titulo: `Tangente inicial (${ini.length} primeiros estágios, pela origem)`, tex: [`k = ${tx(k, 6)}\\ \\text{mm/kN}`] },
  ];
  const t = pontoTangente(ctx, base, S);
  if (!t || !(k < S)) {
    passos.push({ titulo: 'Resultado', texto: 'Não foi possível determinar o ponto de tangência.' });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru: null, status: 'nao-atingido', passos };
  }
  const Qu = (t.r - S * t.Q) / (k - S);
  passos.push({
    titulo: `Ponto de tangência (${t.fonte})`,
    tex: [`Q^* = ${tx(t.Q, 1)}\\ \\text{kN} \\qquad r^* = ${tx(t.r, 2)}\\ \\text{mm}`, `Q_u = \\frac{${tx(t.r, 2)} - ${tx(S, 3)}\\times${tx(t.Q, 1)}}{${tx(k, 6)} - ${tx(S, 3)}} = ${tx(Qu, 1)}\\ \\text{kN}`],
  });
  return { id, nome, ref, categoria: 'convencional', Qu, ru: k * Qu, fonte: t.fonte, status: 'ok', aviso: t.fonte === 'curva extrapolada' ? 'Tangência obtida sobre a curva extrapolada.' : undefined, passos };
}

// ---------------------------------------------------------------------------
// De Beer (1967)
// ---------------------------------------------------------------------------

function metodoDeBeer(ctx: Contexto): Resultado {
  const id = 'debeer', nome = 'De Beer (1967)', ref = 'De Beer (1967)';
  const pts = ctx.pts.filter((p) => p.r > 0 && p.Q > 0);
  const m = Math.max(2, ctx.p.nDeBeerMin);
  if (pts.length < 2 * m) return vazio(id, nome, ref, 'convencional', `São necessários ao menos ${2 * m} estágios com recalque > 0.`);
  const X = pts.map((p) => Math.log10(p.Q)), Y = pts.map((p) => Math.log10(p.r));
  let best: { k: number; a1: Ajuste; a2: Ajuste; sse: number } | null = null;
  for (let k = m; k <= pts.length - m; k++) {
    const a1 = ajusteLinear(X.slice(0, k), Y.slice(0, k));
    const a2 = ajusteLinear(X.slice(k), Y.slice(k));
    let sse = 0;
    X.forEach((x, i) => { const aj = i < k ? a1 : a2; sse += (Y[i] - (aj.a + aj.b * x)) ** 2; });
    if (!best || sse < best.sse) best = { k, a1, a2, sse };
  }
  const { k, a1, a2 } = best!;
  const passos: Passo[] = [
    { titulo: 'Procedimento', texto: 'Curva carga × recalque em escala log-log; ajustam-se duas retas (antes e depois da quebra) e a carga de ruptura é a interseção. A divisão entre os trechos é a de menor soma de resíduos quadráticos.', tex: ['\\log r = a_1 + b_1 \\log Q \\quad (\\text{trecho 1})', '\\log r = a_2 + b_2 \\log Q \\quad (\\text{trecho 2})', '\\log Q_u = \\frac{a_2 - a_1}{b_1 - b_2}'] },
    { titulo: 'Pontos em escala logarítmica', tabela: { cab: ['Estágio', 'log Q', 'log r', 'Trecho'], linhas: pts.map((p, i) => [String(p.n ?? '—'), fmt(X[i], 4), fmt(Y[i], 4), i < k ? '1' : '2']) } },
    { titulo: 'Ajustes', tex: [`a_1 = ${tx(a1.a, 4)}\\quad b_1 = ${tx(a1.b, 4)}\\quad R^2 = ${tx(a1.r2, 4)}`, `a_2 = ${tx(a2.a, 4)}\\quad b_2 = ${tx(a2.b, 4)}\\quad R^2 = ${tx(a2.r2, 4)}`] },
  ];
  if (!(a2.b > a1.b)) {
    passos.push({ titulo: 'Resultado', texto: 'O segundo trecho não é mais inclinado que o primeiro: não há quebra característica.' });
    return { id, nome, ref, categoria: 'convencional', Qu: null, ru: null, status: 'nao-atingido', passos };
  }
  const lx = (a2.a - a1.a) / (a1.b - a2.b);
  const Qu = 10 ** lx, ru = 10 ** (a1.a + a1.b * lx);
  passos.push({ titulo: 'Resultado', tex: [`\\log Q_u = \\frac{${tx(a2.a, 4)} - (${tx(a1.a, 4)})}{${tx(a1.b, 4)} - ${tx(a2.b, 4)}} = ${tx(lx, 4)}`, `Q_u = ${tx(Qu, 1)}\\ \\text{kN} \\qquad r_u = ${tx(ru, 2)}\\ \\text{mm}`] });
  const ext = (aj: Ajuste, x0: number, x1: number) => ({ x: [10 ** x0, 10 ** x1], y: [10 ** (aj.a + aj.b * x0), 10 ** (aj.a + aj.b * x1)] });
  const l1 = ext(a1, X[0], Math.max(lx, X[k - 1])), l2 = ext(a2, Math.min(lx, X[k]), X[X.length - 1]);
  return {
    id, nome, ref, categoria: 'convencional', Qu, ru, fonte: 'curva medida', status: 'ok', passos,
    aux: {
      titulo: 'De Beer: log r × log Q', xLabel: 'Carga Q (kN)', yLabel: 'Recalque r (mm)', logX: true, logY: true,
      series: [
        { nome: 'Estágios', x: pts.map((p) => p.Q), y: pts.map((p) => p.r), modo: 'markers' },
        { nome: 'Trecho 1', ...l1, modo: 'lines', tracejado: true },
        { nome: 'Trecho 2', ...l2, modo: 'lines', tracejado: true },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Execução de todos os métodos
// ---------------------------------------------------------------------------

export interface Interpretacao {
  ctx: Contexto;
  base: Exponencial | null;
  resultados: Resultado[];
  varreduras: { vdv: Varredura | null; aoki: Varredura | null };
}

export function interpretar(ens: Ensaio, p: Parametros): Interpretacao {
  const ctx = criarContexto(ens, p);
  const vdv = metodoVdV(ctx, false);
  const aoki = metodoVdV(ctx, true);
  const base = p.extrapBase === 'aoki' ? aoki.exp : vdv.exp;
  const baseOk = base;

  const nbr = retaRuptura(ctx, baseOk, 'nbr6122', 'Ruptura convencional — NBR 6122', 'ABNT NBR 6122:2019', ctx.D / 30,
    '\\Delta r = \\frac{P\\,L}{A\\,E} + \\frac{D}{30}', `\\frac{D}{30} = \\frac{${tx(ctx.D, 0)}}{30}`);
  const dav = retaRuptura(ctx, baseOk, 'davisson', 'Davisson (1972)', 'Davisson (1972)', p.davissonOffset + ctx.D / 120,
    `\\Delta r = \\frac{P\\,L}{A\\,E} + ${tx(p.davissonOffset, 1)}\\ \\text{mm} + \\frac{D}{120}`,
    `${tx(p.davissonOffset, 1)} + \\frac{${tx(ctx.D, 0)}}{120}`);

  const ruT = 0.1 * ctx.Dp;
  const terz = recalqueFixo(ctx, baseOk, 'terzaghi', 'Terzaghi (1942) — 10 % D', 'Terzaghi (1942)', ruT, [
    {
      titulo: 'Critério',
      texto: 'Critério de ruptura convencional que define, arbitrariamente, a carga de ruptura como a correspondente a um recalque igual a 10 % do diâmetro da ponta da estaca.',
      tex: [`r_u = 0{,}10\\,D_{ponta} = 0{,}10 \\times ${tx(ctx.Dp, 0)} = ${tx(ruT, 1)}\\ \\text{mm}`],
    },
    {
      titulo: 'Ressalva de experiência prática',
      texto: `Recalque de ruptura convencional ≈ 10 % D (${fmt(ruT, 1)} mm); recalque necessário para mobilizar o atrito lateral ≈ 2 % D (${fmt(0.02 * ctx.Dp, 1)} mm).`,
    },
  ], [{ r: ruT, nome: '10 % D' }, { r: 0.02 * ctx.Dp, nome: '2 % D (atrito)' }]);

  const lim = recalqueFixo(ctx, baseOk, 'limite', `Recalque-limite (${fmt(p.recalqueLimite, 1)} mm)`, 'Definido pelo usuário', p.recalqueLimite, [
    { titulo: 'Critério', texto: 'Carga correspondente a um recalque-limite definido pelo usuário.', tex: [`r_{lim} = ${tx(p.recalqueLimite, 1)}\\ \\text{mm}`] },
  ], [{ r: p.recalqueLimite, nome: `r lim` }]);

  const resultados = [
    nbr, dav, terz, lim,
    vdv.res, aoki.res,
    metodoChin(ctx), metodoDecourt(ctx), metodoMazurkiewicz(ctx), metodoMassad(ctx),
    metodoBH80(ctx), metodoBH90(ctx, baseOk), metodoFullerHoy(ctx, baseOk), metodoButlerHoy(ctx, baseOk), metodoDeBeer(ctx),
  ];
  return {
    ctx, base: baseOk, resultados,
    varreduras: { vdv: varreduraVdV(ctx.pts, false), aoki: varreduraVdV(ctx.pts, true) },
  };
}
