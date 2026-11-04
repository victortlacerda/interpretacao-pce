export type Fase = 'C' | 'D';

export interface Estagio {
  n: number;
  fase: Fase;
  Q: number; // kN
  hIni: string; // hh:mm
  hFim: string;
  rIni: (number | null)[]; // mm, por relógio
  rFim: (number | null)[];
  incluir: boolean;
}

export interface Estaca {
  obra: string;
  referencia: string;
  estaca: string;
  tipo: string;
  D: number; // mm
  Dponta: number | null; // mm
  L: number; // m
  area: number | null; // m² (null = calcula πD²/4)
  E: number; // GPa
  Qt: number | null; // kN — carga de trabalho estimada
  cotaArrasamento: string;
  cotaPonta: string;
  tipoCarregamento: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  executor: string;
}

export interface Ensaio {
  estaca: Estaca;
  estagios: Estagio[];
  nRelogios: number;
  relogioAtivo: boolean[];
}

export interface Ponto {
  Q: number;
  r: number;
  n?: number;
}

export interface Tabela {
  cab: string[];
  linhas: string[][];
}

export interface Passo {
  titulo: string;
  texto?: string;
  tex?: string[];
  tabela?: Tabela;
}

export interface SerieAux {
  nome: string;
  x: number[];
  y: number[];
  modo?: 'markers' | 'lines' | 'lines+markers';
  tracejado?: boolean;
  cor?: string;
}

export interface GraficoAux {
  titulo: string;
  xLabel: string;
  yLabel: string;
  series: SerieAux[];
  yInvertido?: boolean;
  logX?: boolean;
  logY?: boolean;
}

export type Status = 'ok' | 'nao-atingido' | 'invalido';

export interface Resultado {
  id: string;
  nome: string;
  ref: string;
  categoria: 'convencional' | 'extrapolacao';
  Qu: number | null;
  ru: number | null;
  fonte?: 'curva medida' | 'curva extrapolada' | 'ajuste';
  status: Status;
  aviso?: string;
  R2?: number;
  passos: Passo[];
  /** curva Q(r) para sobrepor ao gráfico principal */
  curvaQ?: (r: number) => number;
  /** reta r(Q) para sobrepor (critérios de ruptura convencional) */
  retaR?: (Q: number) => number;
  /** linhas horizontais de recalque (critérios de recalque fixo) */
  linhasR?: { r: number; nome: string }[];
  aux?: GraficoAux;
}

export interface Parametros {
  extrapBase: 'aoki' | 'vdv';
  davissonOffset: number; // mm
  recalqueLimite: number; // mm
  nChin: number | null;
  nDecourt: number | null;
  nMaz: number | null;
  nMassad: number | null;
  nBH80: number | null;
  nDeBeerMin: number;
  hoySlope: number; // mm/kN
  nInicialButler: number;
}

export const PARAMETROS_PADRAO: Parametros = {
  extrapBase: 'aoki',
  davissonOffset: 3.8,
  recalqueLimite: 25,
  nChin: null,
  nDecourt: null,
  nMaz: null,
  nMassad: null,
  nBH80: null,
  nDeBeerMin: 2,
  hoySlope: 0.143,
  nInicialButler: 3,
};
