/**
 * Conteúdo do relatório, independente do formato de saída (DOCX ou PDF).
 */
import { areaEstaca, diametroPonta, media } from '../core/curva';
import { fmt, tx } from '../core/formato';
import type { Interpretacao } from '../core/metodos';
import type { Ensaio, Passo, Resultado } from '../core/types';
import { CORES, figuraAux, figuraCargaRecalque, figuraR2, figuraTempoRecalque, type Visual } from '../ui/figuras';

export interface Figura {
  data: any[];
  layout: any;
  /** razão altura/largura da área de plotagem (escala normativa); ausente = altura fixa */
  aspecto?: number;
  alturaRel?: number; // altura/largura total para gráficos sem escala fixa
}

export type Bloco =
  | { t: 'h1' | 'h2' | 'h3'; texto: string }
  | { t: 'p'; texto: string; estilo?: 'nota' | 'aviso' | 'destaque' }
  | { t: 'eq'; tex: string }
  | { t: 'tabela'; cab: string[]; linhas: string[][]; pesos?: number[]; alinhar?: ('l' | 'r' | 'c')[]; fonte?: 'normal' | 'pequena' | 'mini' }
  | { t: 'kv'; pares: [string, string][] }
  | { t: 'fig'; id: string; fig: Figura; legenda: string; larguraRel?: number }
  | { t: 'resultado'; texto: string }
  | { t: 'assinatura'; nome: string; registro: string; empresa: string }
  | { t: 'quebra' };

export interface OpcoesRelatorio {
  metodos: Set<string>;
  empresa: string;
  responsavel: string;
  registro: string;
  observacoes: string;
}

export interface Meta {
  titulo: string;
  cabecalho: string;
  geradoEm: string;
  nomeArquivo: string;
}

export const REFERENCIAS: Record<string, string> = {
  nbr6122: 'ABNT – Associação Brasileira de Normas Técnicas. NBR 6122: Projeto e execução de fundações. Rio de Janeiro, 2019.',
  nbr16903: 'ABNT – Associação Brasileira de Normas Técnicas. NBR 16903: Solo – Prova de carga estática em fundação profunda. Rio de Janeiro, 2020.',
  davisson: 'DAVISSON, M. T. High capacity piles. In: Proceedings, Soil Mechanics Lecture Series on Innovations in Foundation Construction. ASCE, Illinois Section, Chicago, 1972.',
  terzaghi: 'TERZAGHI, K. Discussion on the progress report of the committee on the bearing value of pile foundations. Proceedings ASCE, v. 68, 1942.',
  vdv: 'VAN DER VEEN, C. The bearing capacity of a pile. In: 3rd International Conference on Soil Mechanics and Foundation Engineering, Zurich, v. 2, 1953.',
  aoki: 'AOKI, N. Considerações sobre a capacidade de carga de estacas isoladas. Curso de extensão universitária em Engenharia de Fundações. Universidade Gama Filho, Rio de Janeiro, 1976.',
  chin: 'CHIN, F. K. Estimation of the ultimate load of piles not carried to failure. In: 2nd Southeast Asian Conference on Soil Engineering, Singapore, 1970. / KONDNER, R. L. Hyperbolic stress-strain response: cohesive soils. Journal of the Soil Mechanics and Foundations Division, ASCE, v. 89, 1963.',
  decourt: 'DÉCOURT, L. Behavior of foundations under working load conditions. In: XI Pan-American Conference on Soil Mechanics and Geotechnical Engineering, Foz do Iguaçu, 1999.',
  mazurkiewicz: 'MAZURKIEWICZ, B. K. Test loading of piles according to Polish regulations. Royal Swedish Academy of Engineering Sciences (IVA), Commission on Pile Research, Report n. 35, Stockholm, 1972.',
  massad: 'MASSAD, F. Notes on the interpretation of failure load from routine pile load tests. Solos e Rochas, v. 9, n. 1, 1986.',
  bh80: 'BRINCH HANSEN, J. Discussion on hyperbolic stress-strain response: cohesive soils. Journal of the Soil Mechanics and Foundations Division, ASCE, v. 89, 1963.',
  fullerhoy: 'FULLER, F. M.; HOY, H. E. Pile load tests including quick-load test method, conventional methods and interpretations. Highway Research Record, n. 333, 1970.',
  butlerhoy: 'BUTLER, H. D.; HOY, H. E. Users manual for the Texas quick-load method for foundation load testing. FHWA, Washington, 1977.',
  debeer: 'DE BEER, E. E. Proefondervindelijke bijdrage tot de studie van het grensdraagvermogen van zand onder funderingen op staal. Tijdschrift der Openbaar Verbruik, 1967.',
};
const REF_DE: Record<string, string[]> = {
  nbr6122: ['nbr6122'], davisson: ['davisson'], terzaghi: ['terzaghi'], limite: [], vdv: ['vdv'], aoki: ['vdv', 'aoki'],
  chin: ['chin'], decourt: ['decourt'], mazurkiewicz: ['mazurkiewicz'], massad: ['massad'], bh80: ['bh80'], bh90: ['bh80'],
  fullerhoy: ['fullerhoy'], butlerhoy: ['butlerhoy'], debeer: ['debeer'],
};

const STATUS: Record<Resultado['status'], string> = { ok: 'ok', 'nao-atingido': 'não atingido', invalido: 'não aplicável' };

const limparNome = (s: string) => s.replace(/[^\w\-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

export function montarRelatorio(ens: Ensaio, interp: Interpretacao, vis: Visual, visiveis: Set<string>, op: OpcoesRelatorio): { blocos: Bloco[]; meta: Meta } {
  const U = interp.ctx.U;
  const est = ens.estaca;
  const B: Bloco[] = [];
  const hoje = new Date().toLocaleDateString('pt-BR');
  const res = interp.resultados.filter((r) => op.metodos.has(r.id));

  // ---- Identificação
  B.push({ t: 'h1', texto: '1. Identificação do ensaio e da estaca' });
  B.push({
    t: 'kv',
    pares: [
      ['Obra', est.obra || '—'], ['Referência do ensaio', est.referencia || '—'],
      ['Estaca', est.estaca || '—'], ['Tipo de estaca', est.tipo || '—'],
      ['Diâmetro D', `${fmt(est.D, 0)} mm`], ['Diâmetro da ponta', `${fmt(diametroPonta(ens), 0)} mm`],
      ['Comprimento L', `${fmt(est.L, 2)} m`], ['Área A', `${fmt(areaEstaca(ens), 5)} m²`],
      ['Módulo de elasticidade E', `${fmt(est.E, 1)} GPa`], ['Carga de trabalho estimada', `${fmt(vis.Qt, 1)} ${U}${vis.QtSugerido ? ' (sugerida: Qmáx/2)' : ''}`],
      ['Cota de arrasamento / execução', est.cotaArrasamento ? `${est.cotaArrasamento} m` : '—'], ['Cota da ponta', est.cotaPonta ? `${est.cotaPonta} m` : '—'],
      ['Tipo de carregamento', est.tipoCarregamento || '—'], ['Data do ensaio', est.data || '—'],
      ['Início / término', `${est.horaInicio || '—'} / ${est.horaFim || '—'}`], ['Executor', est.executor || '—'],
    ],
  });

  // ---- Resumo
  const descarga = ens.estagios.filter((s) => s.incluir && s.fase === 'D');
  const ultimo = descarga.length ? descarga[descarga.length - 1] : null;
  const rResid = ultimo && ultimo.Q === 0 ? media(ultimo.rFim, ens.relogioAtivo) : null;
  B.push({ t: 'h1', texto: '2. Resumo dos resultados' });
  B.push({
    t: 'kv',
    pares: [
      ['Carga máxima aplicada', `${fmt(interp.ctx.Qmax, 1)} ${U}`], ['Deslocamento sob a carga máxima', `${fmt(interp.ctx.rmax, 2)} mm`],
      ['Deslocamento residual após descarregamento', rResid !== null ? `${fmt(rResid, 2)} mm` : '—'],
      ['Deslocamento recuperado', rResid !== null ? `${fmt(interp.ctx.rmax - rResid, 2)} mm` : '—'],
    ],
  });
  B.push({
    t: 'tabela',
    cab: ['Método / critério', 'Tipo', `Qu (${U})`, 'r (mm)', 'Obtido sobre', 'R²', 'Qmáx/Qu', 'Situação'],
    pesos: [3.2, 1.6, 1.1, 0.9, 1.7, 0.9, 1, 1.3],
    alinhar: ['l', 'l', 'r', 'r', 'l', 'r', 'r', 'l'],
    fonte: 'pequena',
    linhas: res.map((r) => [
      r.nome, r.categoria === 'convencional' ? 'Convencional' : 'Extrapolação', fmt(r.Qu, 1), fmt(r.ru, 2), r.fonte ?? '—',
      r.R2 !== undefined ? fmt(r.R2, 4) : '—', r.Qu ? fmt(interp.ctx.Qmax / r.Qu, 2) : '—', STATUS[r.status],
    ]),
  });
  const extrap = res.filter((r) => r.fonte === 'curva extrapolada').map((r) => r.nome);
  if (extrap.length) {
    B.push({ t: 'p', estilo: 'nota', texto: `Resultados obtidos sobre a curva extrapolada (${interp.base?.nome ?? '—'}), pois o critério não é atingido na curva medida: ${extrap.join('; ')}.` });
  }

  // ---- Leituras
  B.push({ t: 'h1', texto: '3. Leituras e deslocamentos médios por estágio' });
  const ativos = ens.relogioAtivo.map((a, i) => (a ? `R${i + 1}` : null)).filter(Boolean).join(', ');
  B.push({ t: 'p', texto: `Deslocamento de cada leitura igual à média aritmética dos relógios ativos (${ativos}). Leituras em mm; cargas em ${U}.` });
  B.push({ t: 'eq', tex: '\\bar r = \\frac{r_1 + r_2 + \\cdots + r_n}{n}' });
  const n = ens.nRelogios;
  const rels = Array.from({ length: n }, (_, k) => k);
  B.push({
    t: 'tabela',
    cab: ['Est.', 'Fase', `Q (${U})`, 'Início', 'Fim', ...rels.map((k) => `R${k + 1} ini`), ...rels.map((k) => `R${k + 1} fim`), 'Média ini', 'Média fim'],
    pesos: [0.6, 0.6, 1, 0.9, 0.9, ...rels.map(() => 0.9), ...rels.map(() => 0.9), 1.1, 1.1],
    alinhar: ['c', 'c', 'r', 'c', 'c', ...rels.map(() => 'r' as const), ...rels.map(() => 'r' as const), 'r', 'r'],
    fonte: 'mini',
    linhas: ens.estagios.filter((s) => s.incluir).map((s) => [
      String(s.n), s.fase, fmt(s.Q, 1), s.hIni, s.hFim,
      ...rels.map((k) => fmt(s.rIni[k], 2)), ...rels.map((k) => fmt(s.rFim[k], 2)),
      fmt(media(s.rIni, ens.relogioAtivo), 3), fmt(media(s.rFim, ens.relogioAtivo), 3),
    ]),
  });

  // ---- Gráficos
  B.push({ t: 'quebra' });
  B.push({ t: 'h1', texto: '4. Curvas carga × deslocamento e tempo × deslocamento' });
  const e = vis.escala;
  if (e) {
    B.push({
      t: 'p',
      texto: 'As curvas apresentam a carga e o deslocamento da leitura inicial e final de cada estágio, em escala tal que a reta que liga a origem ao ponto da curva correspondente à carga estimada de trabalho resulte em inclinação de 20° ± 5° com o eixo das cargas.',
    });
    B.push({ t: 'eq', tex: `r_t = r(Q_t = ${tx(vis.Qt, 1)}\\ \\text{${U}}) = ${tx(vis.rt, 3)}\\ \\text{mm} \\qquad s_Q = ${tx(e.sQ, 0)}\\ \\text{${U}/cm} \\qquad s_r = ${tx(e.sR, 2)}\\ \\text{mm/cm}` });
    B.push({ t: 'eq', tex: `\\theta = \\arctan\\!\\left(\\frac{r_t / s_r}{Q_t / s_Q}\\right) = \\arctan\\!\\left(\\frac{${tx(vis.rt! / e.sR, 3)}}{${tx(vis.Qt! / e.sQ, 3)}}\\right) = ${tx(e.angulo, 1)}^\\circ ${e.anguloOk ? '\\in [15^\\circ;\\,25^\\circ]' : '\\notin [15^\\circ;\\,25^\\circ]'}` });
    const nomes = interp.resultados.filter((r) => visiveis.has(r.id)).map((r) => r.nome);
    B.push({ t: 'fig', id: 'carga-deslocamento', fig: figuraCargaRecalque(ens, interp, vis, visiveis), legenda: `Figura 1 – Curva carga × deslocamento${nomes.length ? `, com ${nomes.join(', ')}` : ''}.` });
    const ft = figuraTempoRecalque(ens, vis, U);
    if (ft) B.push({ t: 'fig', id: 'tempo-deslocamento', fig: ft, legenda: 'Figura 2 – Curva tempo × deslocamento (leituras inicial e final de cada estágio; rótulos = carga do estágio).' });
  }

  // ---- Memória de cálculo
  B.push({ t: 'quebra' });
  B.push({ t: 'h1', texto: '5. Memória de cálculo' });
  B.push({ t: 'p', texto: `Pontos de carregamento utilizados: leitura final (estabilizada) de cada estágio de carregamento incluído (${interp.ctx.pts.length} estágios). Cargas em ${U}, deslocamentos em mm.` });
  let nf = 3;
  res.forEach((r, i) => {
    B.push({ t: 'h2', texto: `5.${i + 1} ${r.nome}` });
    if (r.aviso) B.push({ t: 'p', estilo: 'aviso', texto: r.aviso });
    pushPassos(B, r.passos);
    if (r.aux) {
      B.push({ t: 'fig', id: `metodo-${r.id}`, fig: { ...figuraAux(r.aux, CORES[r.id]), alturaRel: 0.52 }, legenda: `Figura ${nf++} – ${r.aux.titulo}.`, larguraRel: 0.8 });
    }
    if (r.id === 'vdv' || r.id === 'aoki') {
      const f = figuraR2(interp, r.id, CORES[r.id]);
      if (f) B.push({ t: 'fig', id: `r2-${r.id}`, fig: { ...f, alturaRel: 0.42 }, legenda: `Figura ${nf++} – R² em função do Qu testado (${r.nome}).`, larguraRel: 0.8 });
    }
    B.push({
      t: 'resultado',
      texto: r.Qu !== null
        ? `Resultado: Qu = ${fmt(r.Qu, 1)} ${U}${r.ru !== null ? ` · r = ${fmt(r.ru, 2)} mm` : ''}${r.fonte ? ` · obtido sobre ${r.fonte}` : ''}`
        : `Resultado: ${STATUS[r.status]}`,
    });
  });

  // ---- Parâmetros e observações
  B.push({ t: 'h1', texto: '6. Parâmetros adotados' });
  const p = interp.ctx.p;
  B.push({
    t: 'kv',
    pares: [
      ['Curva extrapolada de referência', p.extrapBase === 'aoki' ? 'Van der Veen modificado (Aoki)' : 'Van der Veen'],
      ['Escolha de Qu (Van der Veen / Aoki)', 'maior R²'],
      ['Davisson – parcela fixa', `${fmt(p.davissonOffset, 1)} mm`], ['Recalque-limite', `${fmt(p.recalqueLimite, 1)} mm`],
      ['Inclinação Fuller-Hoy / Butler-Hoy', `${fmt(p.hoySlope, 3)} mm/kN`], ['Unidade de força', U === 'tf' ? `tf (1 tf = ${fmt(interp.ctx.f, 5)} kN)` : 'kN'],
    ],
  });
  if (op.observacoes.trim()) {
    B.push({ t: 'h1', texto: '7. Observações' });
    op.observacoes.split(/\n+/).filter((l) => l.trim()).forEach((l) => B.push({ t: 'p', texto: l.trim() }));
  }

  // ---- Referências
  B.push({ t: 'h1', texto: `${op.observacoes.trim() ? 8 : 7}. Referências` });
  const refs = new Set<string>(['nbr6122', 'nbr16903']);
  res.forEach((r) => (REF_DE[r.id] ?? []).forEach((k) => refs.add(k)));
  [...refs].map((k) => REFERENCIAS[k]).filter(Boolean).sort().forEach((t) => B.push({ t: 'p', estilo: 'nota', texto: t }));

  if (op.responsavel.trim() || op.empresa.trim()) {
    B.push({ t: 'assinatura', nome: op.responsavel.trim(), registro: op.registro.trim(), empresa: op.empresa.trim() });
  }

  const ref = [est.referencia, est.estaca].filter(Boolean).join('_') || 'ensaio';
  return {
    blocos: B,
    meta: {
      titulo: 'Interpretação de prova de carga estática',
      cabecalho: [est.obra, est.referencia, est.estaca].filter(Boolean).join(' · '),
      geradoEm: hoje,
      nomeArquivo: `Relatorio_PCE_${limparNome(ref)}`,
    },
  };
}

function pushPassos(B: Bloco[], passos: Passo[]) {
  passos.forEach((p, i) => {
    B.push({ t: 'h3', texto: `${i + 1}) ${p.titulo}` });
    if (p.texto) B.push({ t: 'p', texto: p.texto });
    p.tex?.forEach((tex) => B.push({ t: 'eq', tex }));
    if (p.tabela) {
      const nc = p.tabela.cab.length;
      const alinhar: ('l' | 'r' | 'c')[] = Array(nc).fill('r');
      alinhar[0] = /grandeza/i.test(p.tabela.cab[0]) ? 'l' : 'c';
      B.push({ t: 'tabela', cab: p.tabela.cab, linhas: p.tabela.linhas, alinhar, fonte: 'pequena', pesos: Array(nc).fill(1) });
    }
  });
}
