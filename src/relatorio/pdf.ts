import type { Bloco, Meta } from './modelo';

export interface ImagemPdf {
  dataUrl: string;
  wPx: number;
  hPx: number;
}
export interface EquacaoPdf {
  dataUrl: string;
  wPt: number;
  hPt: number;
}

const AZUL = '#0B3A66', AZUL_MEDIO = '#1E6FD9', AZUL_CLARO = '#E3EEFB', BORDA = '#C4DCF8', MUDO = '#6B7A8C', TEXTO = '#1F2A37';
const MARGEM = 57; // 2 cm
const LARG_UTIL = 595.28 - 2 * MARGEM;
const ALT_MAX = 545;
const tamanho = { normal: 9, pequena: 8, mini: 6.6 } as const;

export function definicaoPdf(blocos: Bloco[], meta: Meta, figs: Record<string, ImagemPdf>, eqs: EquacaoPdf[]): any {
  const content: any[] = [
    { text: 'RELATÓRIO TÉCNICO', fontSize: 8.5, bold: true, color: AZUL_MEDIO, characterSpacing: 1.5, margin: [0, 0, 0, 3] },
    { text: meta.titulo, fontSize: 18, bold: true, color: AZUL, margin: [0, 0, 0, 3] },
    { text: `${meta.cabecalho}${meta.cabecalho ? ' · ' : ''}emitido em ${meta.geradoEm}`, fontSize: 9.5, color: MUDO },
    { canvas: [{ type: 'line', x1: 0, y1: 6, x2: LARG_UTIL, y2: 6, lineWidth: 1.4, lineColor: AZUL_MEDIO }], margin: [0, 0, 0, 10] },
  ];
  let ie = 0;
  for (const b of blocos) {
    switch (b.t) {
      case 'h1': content.push({ text: b.texto, style: 'h1', headlineLevel: 1 }); break;
      case 'h2': content.push({ text: b.texto, style: 'h2', headlineLevel: 2 }); break;
      case 'h3': content.push({ text: b.texto, style: 'h3', headlineLevel: 3 }); break;
      case 'p':
        if (b.estilo === 'aviso') {
          content.push({ table: { widths: ['*'], body: [[{ text: b.texto, color: '#7A4D0B', fontSize: 8.8 }]] }, layout: caixa('#FDF6EC', '#F2D9B0'), margin: [0, 2, 0, 6] });
        } else {
          content.push({ text: b.texto, fontSize: b.estilo === 'nota' ? 8 : 9.2, italics: b.estilo === 'nota', color: b.estilo === 'nota' ? '#4B5868' : TEXTO, margin: [0, 0, 0, 5] });
        }
        break;
      case 'eq': {
        const e = eqs[ie++];
        if (!e) break;
        const esc = Math.min(1, (LARG_UTIL - 18) / e.wPt);
        content.push({ image: e.dataUrl, width: e.wPt * esc, height: e.hPt * esc, margin: [18, 3, 0, 5] });
        break;
      }
      case 'tabela': {
        const pesos = b.pesos ?? b.cab.map(() => 1);
        const soma = pesos.reduce((a, x) => a + x, 0);
        const widths = pesos.map((p) => ((p / soma) * (LARG_UTIL - b.cab.length * 8.5 - 1)));
        const al = (i: number) => ({ l: 'left', r: 'right', c: 'center' } as const)[b.alinhar?.[i] ?? 'l'];
        const fs = tamanho[b.fonte ?? 'normal'];
        content.push({
          table: {
            headerRows: 1,
            dontBreakRows: true,
            widths,
            body: [
              b.cab.map((c, i) => ({ text: c, bold: true, color: AZUL, fontSize: fs, alignment: b.alinhar?.[i] === 'l' ? 'left' : 'center', fillColor: AZUL_CLARO })),
              ...b.linhas.map((l, j) => l.map((c, i) => ({ text: c, fontSize: fs, alignment: al(i), fillColor: j % 2 ? '#F7FAFD' : null }))),
            ],
          },
          layout: grade(),
          margin: [0, 2, 0, 8],
        });
        break;
      }
      case 'kv': {
        const body: any[] = [];
        for (let i = 0; i < b.pares.length; i += 2) {
          const par = [b.pares[i], b.pares[i + 1] ?? ['', '']];
          body.push(par.flatMap(([k, v]) => [
            { text: k, fontSize: 7.8, color: MUDO, fillColor: '#F1F6FD' },
            { text: v, fontSize: 8.8, bold: true, color: AZUL },
          ]));
        }
        content.push({ table: { widths: ['27%', '23%', '27%', '23%'], dontBreakRows: true, body }, layout: grade(), margin: [0, 2, 0, 8] });
        break;
      }
      case 'fig': {
        const img = figs[b.id];
        if (!img) break;
        let w = LARG_UTIL * (b.larguraRel ?? 1);
        let h = (w * img.hPx) / img.wPx;
        if (h > ALT_MAX) { w *= ALT_MAX / h; h = ALT_MAX; }
        content.push({
          stack: [
            { image: img.dataUrl, width: w, height: h, alignment: 'center' },
            { text: b.legenda, fontSize: 8, italics: true, color: '#4B5868', alignment: 'center', margin: [0, 4, 0, 0] },
          ],
          unbreakable: true,
          margin: [0, 6, 0, 10],
        });
        break;
      }
      case 'resultado':
        content.push({ table: { widths: ['*'], body: [[{ text: b.texto, bold: true, color: AZUL, fontSize: 9.5 }]] }, layout: caixaResultado(), margin: [0, 4, 0, 12] });
        break;
      case 'assinatura':
        content.push({
          unbreakable: true,
          margin: [0, 50, 0, 0],
          stack: [
            { canvas: [{ type: 'line', x1: LARG_UTIL / 2 - 120, y1: 0, x2: LARG_UTIL / 2 + 120, y2: 0, lineWidth: 0.6, lineColor: MUDO }] },
            ...(b.nome ? [{ text: b.nome, bold: true, color: AZUL, alignment: 'center', margin: [0, 4, 0, 0] }] : []),
            ...(b.registro ? [{ text: b.registro, color: MUDO, fontSize: 8.5, alignment: 'center' }] : []),
            ...(b.empresa ? [{ text: b.empresa, color: MUDO, fontSize: 8.5, alignment: 'center' }] : []),
          ],
        });
        break;
      case 'quebra':
        content.push({ text: '', pageBreak: 'after' });
        break;
    }
  }

  return {
    pageSize: 'A4',
    pageMargins: [MARGEM, 62, MARGEM, 50],
    info: { title: meta.titulo, subject: meta.cabecalho, creator: 'Interpretação PCE' },
    defaultStyle: { font: 'Roboto', fontSize: 9.2, color: TEXTO, lineHeight: 1.18 },
    styles: {
      h1: { fontSize: 13, bold: true, color: AZUL, margin: [0, 12, 0, 6] },
      h2: { fontSize: 11.2, bold: true, color: AZUL_MEDIO, margin: [0, 12, 0, 4] },
      h3: { fontSize: 9.2, bold: true, color: AZUL, margin: [0, 6, 0, 3] },
    },
    header: () => ({
      margin: [MARGEM, 26, MARGEM, 0],
      stack: [
        { columns: [{ text: meta.titulo, fontSize: 7.5, color: MUDO }, { text: meta.cabecalho, fontSize: 7.5, color: AZUL, bold: true, alignment: 'right' }] },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: LARG_UTIL, y2: 4, lineWidth: 0.5, lineColor: BORDA }] },
      ],
    }),
    footer: (pag: number, total: number) => ({
      margin: [MARGEM, 16, MARGEM, 0],
      columns: [
        { text: `Gerado em ${meta.geradoEm} · Interpretação PCE`, fontSize: 7.5, color: MUDO },
        { text: `Página ${pag} de ${total}`, fontSize: 7.5, color: MUDO, alignment: 'right' },
      ],
    }),
    // evita título órfão no fim da página
    pageBreakBefore: (node: any, seguintes: any[]) => !!node.headlineLevel && seguintes.length === 0,
    content,
  };
}

function grade() {
  return {
    hLineWidth: () => 0.5, vLineWidth: () => 0.5,
    hLineColor: () => BORDA, vLineColor: () => BORDA,
    paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 2.2, paddingBottom: () => 2.2,
  };
}
function caixa(fundo: string, borda: string) {
  return {
    hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => borda, vLineColor: () => borda,
    fillColor: () => fundo, paddingLeft: () => 7, paddingRight: () => 7, paddingTop: () => 4, paddingBottom: () => 4,
  };
}
function caixaResultado() {
  return {
    hLineWidth: () => 0, vLineWidth: (i: number) => (i === 0 ? 2.5 : 0), vLineColor: () => AZUL_MEDIO,
    fillColor: () => '#F1F6FD', paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 5, paddingBottom: () => 5,
  };
}

export async function gerarPdf(blocos: Bloco[], meta: Meta, figs: Record<string, ImagemPdf>, eqs: EquacaoPdf[]): Promise<Blob> {
  const pdfMake: any = (await import('pdfmake/build/pdfmake')).default ?? (await import('pdfmake/build/pdfmake'));
  if (!pdfMake.vfs || !pdfMake.vfs['Roboto-Regular.ttf']) {
    // vfs_fonts.js atribui a "this.pdfMake" (incompatível com ESM): lê o objeto como JSON
    const src: string = (await import('pdfmake/build/vfs_fonts.js?raw')).default;
    pdfMake.vfs = JSON.parse(src.slice(src.indexOf('{', src.indexOf('.vfs')), src.lastIndexOf('}') + 1));
  }
  const def = definicaoPdf(blocos, meta, figs, eqs);
  return new Promise((ok) => pdfMake.createPdf(def).getBlob((b: Blob) => ok(b)));
}
