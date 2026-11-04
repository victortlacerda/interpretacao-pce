import {
  AlignmentType, BorderStyle, LineRuleType, Document, Footer, Header, HeadingLevel, ImageRun, Packer, PageNumber, Paragraph,
  ShadingType, Table, TableCell, TableRow, TabStopType, TextRun, WidthType,
} from 'docx';
import JSZip from 'jszip';
import type { Bloco, Meta } from './modelo';
import { texParaOmml } from './tex';

export interface ImagemFig {
  bytes: Uint8Array;
  wPx: number;
  hPx: number;
}

const AZUL = '0B3A66', AZUL_MEDIO = '1E6FD9', AZUL_CLARO = 'E3EEFB', BORDA = 'C4DCF8', MUDO = '6B7A8C';
const FONTE = 'Calibri';
const LARG_UTIL_CM = 17; // A4 com margens de 2 cm
const ALT_MAX_CM = 19;
const CM_TWIP = 567;
const CM_PX = 37.7953;

const tamanho = { normal: 19, pequena: 16, mini: 13 } as const; // meio-pontos

function celula(texto: string, opts: { cab?: boolean; alinhar?: 'l' | 'r' | 'c'; tam: number; largura: number; zebra?: boolean }) {
  const al = opts.alinhar === 'r' ? AlignmentType.RIGHT : opts.alinhar === 'c' ? AlignmentType.CENTER : AlignmentType.LEFT;
  return new TableCell({
    width: { size: opts.largura, type: WidthType.DXA },
    shading: opts.cab ? { type: ShadingType.CLEAR, fill: AZUL_CLARO, color: 'auto' } : opts.zebra ? { type: ShadingType.CLEAR, fill: 'F7FAFD', color: 'auto' } : undefined,
    margins: { top: 30, bottom: 30, left: 70, right: 70 },
    children: [new Paragraph({
      alignment: opts.cab ? (opts.alinhar === 'l' ? AlignmentType.LEFT : AlignmentType.CENTER) : al,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: texto, bold: opts.cab, size: opts.tam, color: opts.cab ? AZUL : undefined, font: FONTE })],
    })],
  });
}

const bordas = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDA },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDA },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDA },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDA },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BORDA },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: BORDA },
};

function tabela(cab: string[], linhas: string[][], pesos: number[], alinhar: ('l' | 'r' | 'c')[], tam: number) {
  const total = LARG_UTIL_CM * CM_TWIP;
  const soma = pesos.reduce((a, b) => a + b, 0);
  const larg = pesos.map((p) => Math.round((p / soma) * total));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: larg,
    borders: bordas,
    rows: [
      new TableRow({ tableHeader: true, children: cab.map((c, i) => celula(c, { cab: true, alinhar: alinhar[i], tam, largura: larg[i] })) }),
      ...linhas.map((l, j) => new TableRow({ cantSplit: true, children: l.map((c, i) => celula(c, { alinhar: alinhar[i], tam, largura: larg[i], zebra: j % 2 === 1 })) })),
    ],
  });
}

function kv(pares: [string, string][]) {
  const total = LARG_UTIL_CM * CM_TWIP;
  const larg = [0.27, 0.23, 0.27, 0.23].map((f) => Math.round(f * total));
  const rows: TableRow[] = [];
  for (let i = 0; i < pares.length; i += 2) {
    const par = [pares[i], pares[i + 1] ?? ['', '']];
    rows.push(new TableRow({
      cantSplit: true,
      children: par.flatMap(([k, v], j) => [
        new TableCell({
          width: { size: larg[j * 2], type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'F1F6FD', color: 'auto' },
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: k, size: 16, color: MUDO, font: FONTE })] })],
        }),
        new TableCell({
          width: { size: larg[j * 2 + 1], type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v, size: 18, bold: true, color: AZUL, font: FONTE })] })],
        }),
      ]),
    }));
  }
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: larg, borders: bordas, rows });
}

export async function gerarDocx(blocos: Bloco[], meta: Meta, figs: Record<string, ImagemFig>): Promise<Uint8Array> {
  const eqs: string[] = [];
  const filhos: (Paragraph | Table)[] = [];

  filhos.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'RELATÓRIO TÉCNICO', size: 18, bold: true, color: AZUL_MEDIO, font: FONTE, characterSpacing: 40 })] }));
  filhos.push(new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 80 }, children: [new TextRun({ text: meta.titulo, size: 36, bold: true, color: AZUL, font: FONTE })] }));
  filhos.push(new Paragraph({
    spacing: { after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL_MEDIO, space: 6 } },
    children: [new TextRun({ text: `${meta.cabecalho}${meta.cabecalho ? ' · ' : ''}emitido em ${meta.geradoEm}`, size: 20, color: MUDO, font: FONTE })],
  }));

  for (const b of blocos) {
    switch (b.t) {
      case 'h1':
        filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: b.texto })] }));
        break;
      case 'h2':
        filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun({ text: b.texto })] }));
        break;
      case 'h3':
        filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: [new TextRun({ text: b.texto })] }));
        break;
      case 'p':
        filhos.push(new Paragraph({
          spacing: { after: 100 },
          shading: b.estilo === 'aviso' ? { type: ShadingType.CLEAR, fill: 'FDF6EC', color: 'auto' } : undefined,
          children: [new TextRun({ text: b.texto, size: b.estilo === 'nota' ? 17 : 19, italics: b.estilo === 'nota', color: b.estilo === 'aviso' ? '7A4D0B' : b.estilo === 'nota' ? '4B5868' : undefined })],
        }));
        break;
      case 'eq': {
        // cada termo separado por \qquad vira uma linha (o espaçamento não é preservado por todos os editores)
        const partes = b.tex.split('\\qquad').map((x) => x.trim()).filter(Boolean);
        partes.forEach((parte, k) => {
        const i = eqs.push(parte) - 1;
        filhos.push(new Paragraph({ spacing: { before: 60, after: 100, line: 240, lineRule: LineRuleType.AUTO }, indent: { left: 360 }, children: [new TextRun({ text: `§EQ${i}§` })] }));
        void k;
        });
        break;
      }
      case 'tabela':
        filhos.push(tabela(b.cab, b.linhas, b.pesos ?? b.cab.map(() => 1), b.alinhar ?? b.cab.map(() => 'l'), tamanho[b.fonte ?? 'normal']));
        filhos.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
        break;
      case 'kv':
        filhos.push(kv(b.pares));
        filhos.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
        break;
      case 'fig': {
        const img = figs[b.id];
        if (!img) break;
        let w = LARG_UTIL_CM * (b.larguraRel ?? 1);
        let h = (w * img.hPx) / img.wPx;
        if (h > ALT_MAX_CM) { w *= ALT_MAX_CM / h; h = ALT_MAX_CM; }
        filhos.push(new Paragraph({
          alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 40 },
          children: [new ImageRun({ data: img.bytes, transformation: { width: Math.round(w * CM_PX), height: Math.round(h * CM_PX) } })],
        }));
        filhos.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: b.legenda, size: 17, italics: true, color: '4B5868' })] }));
        break;
      }
      case 'resultado':
        filhos.push(new Paragraph({
          spacing: { before: 120, after: 240 },
          shading: { type: ShadingType.CLEAR, fill: 'F1F6FD', color: 'auto' },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: AZUL_MEDIO, space: 6 } },
          children: [new TextRun({ text: b.texto, bold: true, color: AZUL, size: 20 })],
        }));
        break;
      case 'assinatura':
        filhos.push(new Paragraph({ spacing: { before: 1200, after: 0 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_______________________________________________', color: MUDO })] }));
        if (b.nome) filhos.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: b.nome, bold: true, color: AZUL })] }));
        if (b.registro) filhos.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: b.registro, color: MUDO, size: 18 })] }));
        if (b.empresa) filhos.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: b.empresa, color: MUDO, size: 18 })] }));
        break;
      case 'quebra':
        filhos.push(new Paragraph({ pageBreakBefore: true, spacing: { after: 0 }, children: [] }));
        break;
    }
  }

  const doc = new Document({
    creator: 'Interpretação PCE',
    title: meta.titulo,
    description: meta.cabecalho,
    styles: {
      default: { document: { run: { font: FONTE, size: 19, color: '1F2A37' }, paragraph: { spacing: { line: 264, lineRule: LineRuleType.AUTO } } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: AZUL, font: FONTE }, paragraph: { spacing: { before: 320, after: 120 }, keepNext: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: AZUL_MEDIO, font: FONTE }, paragraph: { spacing: { before: 280, after: 100 }, keepNext: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 19, bold: true, color: AZUL, font: FONTE }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134, header: 567, footer: 567 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: LARG_UTIL_CM * CM_TWIP }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDA, space: 4 } },
            children: [
              new TextRun({ text: meta.titulo, size: 15, color: MUDO }),
              new TextRun({ text: `\t${meta.cabecalho}`, size: 15, color: AZUL, bold: true }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: LARG_UTIL_CM * CM_TWIP }],
            children: [
              new TextRun({ text: `Gerado em ${meta.geradoEm} · Interpretação PCE`, size: 15, color: MUDO }),
              new TextRun({ children: ['\tPágina ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES], size: 15, color: MUDO }),
            ],
          })],
        }),
      },
      children: filhos,
    }],
  });

  // Substitui os marcadores pelas equações em OMML
  const b64 = await Packer.toBase64String(doc);
  const zip = await JSZip.loadAsync(b64, { base64: true });
  let xml = await zip.file('word/document.xml')!.async('string');
  xml = xml.replace(/<w:r>(?:(?!<w:r>)[\s\S])*?§EQ(\d+)§<\/w:t><\/w:r>/g, (_m, i) => {
    let omml: string;
    try { omml = texParaOmml(eqs[Number(i)]); } catch { omml = `<m:oMath><m:r><m:t>${eqs[Number(i)]}</m:t></m:r></m:oMath>`; }
    return `<m:oMathPara><m:oMathParaPr><m:jc m:val="left"/></m:oMathParaPr>${omml}</m:oMathPara>`;
  });
  if (!/xmlns:m=/.test(xml.slice(0, 3000))) xml = xml.replace('<w:document ', '<w:document xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ');
  zip.file('word/document.xml', xml);
  return zip.generateAsync({ type: 'uint8array' });
}
