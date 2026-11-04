import * as XLSX from 'xlsx';
import { parseNum } from './formato';
import type { Ensaio, Estaca, Estagio } from './types';

const norm = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

function hora(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') {
    const frac = v % 1;
    const min = Math.round(frac * 1440) % 1440;
    return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  }
  if (v instanceof Date) return `${String(v.getHours()).padStart(2, '0')}:${String(v.getMinutes()).padStart(2, '0')}`;
  const m = /(\d{1,2})[:h](\d{2})/.exec(String(v));
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : String(v);
}

function dataStr(v: unknown): string {
  if (typeof v === 'number' && v > 20000) {
    const d = XLSX.SSF.parse_date_code(v);
    return `${String(d.d).padStart(2, '0')}/${String(d.m).padStart(2, '0')}/${d.y}`;
  }
  if (v instanceof Date) return v.toLocaleDateString('pt-BR');
  return String(v ?? '');
}

export function estacaVazia(): Estaca {
  return {
    obra: '', referencia: '', estaca: '', tipo: '', D: 500, Dponta: null, L: 10, area: null, E: 20, Qt: null,
    cotaArrasamento: '', cotaPonta: '', tipoCarregamento: 'lento', data: '', horaInicio: '', horaFim: '', executor: '',
  };
}

const CAMPOS: [RegExp, keyof Estaca][] = [
  [/^obra/, 'obra'],
  [/^referencia/, 'referencia'],
  [/^estaca/, 'estaca'],
  [/^tipo de estaca/, 'tipo'],
  [/diametro da ponta/, 'Dponta'],
  [/^diametro/, 'D'],
  [/^comprimento/, 'L'],
  [/^area/, 'area'],
  [/cota de arrasamento|cota de execucao/, 'cotaArrasamento'],
  [/cota da ponta/, 'cotaPonta'],
  [/^modulo/, 'E'],
  [/carga de trabalho/, 'Qt'],
  [/tipo de carregamento/, 'tipoCarregamento'],
  [/^data/, 'data'],
  [/hora de inicio/, 'horaInicio'],
  [/hora de (termino|fim)/, 'horaFim'],
  [/executor|responsavel/, 'executor'],
];
const NUMERICOS: (keyof Estaca)[] = ['D', 'Dponta', 'L', 'area', 'E', 'Qt'];

export function lerPlanilha(buf: ArrayBuffer): { ensaio: Ensaio; avisos: string[] } {
  const wb = XLSX.read(buf, { type: 'array' });
  const avisos: string[] = [];
  const aba = (re: RegExp) => wb.SheetNames.find((n) => re.test(norm(n)));
  const est = estacaVazia();

  const nIdent = aba(/ident/);
  if (nIdent) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nIdent], { header: 1, raw: true });
    for (const row of rows) {
      const campo = norm(row[0]);
      const val = row[1];
      const def = CAMPOS.find(([re]) => re.test(campo));
      if (!def || val === undefined || val === null || val === '') continue;
      const k = def[1];
      if (NUMERICOS.includes(k)) (est as any)[k] = parseNum(val);
      else if (k === 'horaInicio' || k === 'horaFim') (est as any)[k] = hora(val);
      else if (k === 'data') est.data = dataStr(val);
      else (est as any)[k] = String(val);
    }
  } else avisos.push('Aba "Identificacao" não encontrada — preencha os dados da estaca manualmente.');
  if (!(est.E > 0)) est.E = 20;
  if (!(est.D > 0)) { avisos.push('Diâmetro não informado.'); est.D = 0; }
  if (!(est.L > 0)) { avisos.push('Comprimento não informado.'); est.L = 0; }

  const nEst = aba(/estag/) ?? wb.SheetNames[nIdent ? 1 : 0];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nEst], { header: 1, raw: true });
  const iCab = rows.findIndex((r) => r.some((c) => /carga/.test(norm(c))));
  if (iCab < 0) throw new Error('Não encontrei a linha de cabeçalho com a coluna "Carga" na aba de estágios.');
  const cab = rows[iCab].map(norm);
  const col = (re: RegExp) => cab.findIndex((c) => re.test(c));
  const cEst = col(/^estagio/), cFase = col(/^fase/), cQ = col(/carga/), cHi = col(/hora.*ini/), cHf = col(/hora.*fim/);
  const cHora = col(/^hora$/);
  const relIni: number[] = [], relFim: number[] = [];
  cab.forEach((c, i) => {
    const m = /^(?:r|relogio|rel\.?|defletometro)\s*(\d+)\s*(ini|fim|final|inicial)?/.exec(c);
    if (!m) return;
    const k = Number(m[1]) - 1;
    if (m[2] && m[2].startsWith('ini')) relIni[k] = i; else relFim[k] = i;
  });
  const nRel = Math.max(relIni.length, relFim.length);
  if (!nRel) throw new Error('Nenhuma coluna de relógio encontrada (ex.: "R1 ini (mm)", "R1 fim (mm)").');
  if (!relIni.length) avisos.push('Planilha sem leituras iniciais por estágio: usando a leitura final também como inicial.');

  const estagios: Estagio[] = [];
  let n = 0;
  for (const row of rows.slice(iCab + 1)) {
    const Q = parseNum(row[cQ]);
    if (Q === null) continue;
    const fim = Array.from({ length: nRel }, (_, k) => (relFim[k] !== undefined ? parseNum(row[relFim[k]]) : null));
    const ini = Array.from({ length: nRel }, (_, k) => (relIni[k] !== undefined ? parseNum(row[relIni[k]]) : fim[k]));
    if (fim.every((v) => v === null) && ini.every((v) => v === null)) continue;
    const faseTxt = cFase >= 0 ? norm(row[cFase]) : '';
    let fase: 'C' | 'D' = faseTxt.startsWith('d') ? 'D' : 'C';
    if (cFase < 0 && estagios.length && Q < estagios[estagios.length - 1].Q) fase = 'D';
    if (cFase < 0 && estagios.some((e) => e.fase === 'D')) fase = 'D';
    n++;
    estagios.push({
      n: cEst >= 0 && parseNum(row[cEst]) !== null ? parseNum(row[cEst])! : n,
      fase, Q,
      hIni: hora(cHi >= 0 ? row[cHi] : cHora >= 0 ? row[cHora] : ''),
      hFim: hora(cHf >= 0 ? row[cHf] : cHora >= 0 ? row[cHora] : ''),
      rIni: ini, rFim: fim,
      incluir: !(Q === 0 && fase === 'C'),
    });
  }
  if (!estagios.length) throw new Error('Nenhum estágio com leituras foi encontrado.');
  return { ensaio: { estaca: est, estagios, nRelogios: nRel, relogioAtivo: Array(nRel).fill(true) }, avisos };
}
