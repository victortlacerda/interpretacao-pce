import Plotly from 'plotly.js-dist-min';
import { ajustarAspecto, layoutBase } from '../ui/Grafico';
import type { Bloco, Meta } from './modelo';

export type Formato = 'docx' | 'pdf';

const LARGURA_FIG = 900; // px (renderizado a 3×)

async function renderizarFigura(b: Extract<Bloco, { t: 'fig' }>) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:-20000px;top:0;';
  document.body.appendChild(div);
  try {
    const W = Math.round(LARGURA_FIG * (b.larguraRel ?? 1));
    const H = b.fig.aspecto ? Math.round(W * b.fig.aspecto) + 100 : Math.round(W * (b.fig.alturaRel ?? 0.55));
    const lay = layoutBase(b.fig.layout, W, H);
    lay.font = { ...lay.font, family: 'Inter, Roboto, Arial, sans-serif', size: 13 };
    lay.legend = { ...lay.legend, font: { size: 11.5 } };
    await Plotly.newPlot(div, b.fig.data, lay, { staticPlot: true });
    if (b.fig.aspecto) await ajustarAspecto(div, b.fig.aspecto);
    const fl = (div as any)._fullLayout;
    const dataUrl: string = await (Plotly as any).toImage(div, { format: 'png', width: fl.width, height: fl.height, scale: 3 });
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return { dataUrl, bytes, wPx: fl.width, hPx: fl.height };
  } finally {
    Plotly.purge(div);
    div.remove();
  }
}

let conversor: ((tex: string) => string) | null = null;
async function texParaSvg(tex: string): Promise<string> {
  if (!conversor) {
    const [{ mathjax }, { TeX }, { SVG }, { liteAdaptor }, { RegisterHTMLHandler }, { AllPackages }] = await Promise.all([
      import('mathjax-full/js/mathjax.js'),
      import('mathjax-full/js/input/tex.js'),
      import('mathjax-full/js/output/svg.js'),
      import('mathjax-full/js/adaptors/liteAdaptor.js'),
      import('mathjax-full/js/handlers/html.js'),
      import('mathjax-full/js/input/tex/AllPackages.js'),
    ]);
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const doc = mathjax.document('', { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: 'none' }) });
    conversor = (t) => adaptor.innerHTML(doc.convert(t, { display: true }) as any);
  }
  return conversor(tex);
}

const PT_POR_EM = 10.2;
const ESCALA = 4; // resolução da imagem

async function equacaoPng(tex: string) {
  const svg0 = await texParaSvg(tex);
  const vb = /viewBox="([-\d.\s]+)"/.exec(svg0)?.[1].split(/\s+/).map(Number) ?? [0, 0, 1000, 1000];
  const wEm = vb[2] / 1000, hEm = vb[3] / 1000;
  const wPx = Math.ceil(wEm * 16 * ESCALA), hPx = Math.ceil(hEm * 16 * ESCALA);
  const svg = svg0
    .replace(/currentColor/g, '#1F2A37')
    .replace(/ width="[^"]*"/, ` width="${wPx}"`)
    .replace(/ height="[^"]*"/, ` height="${hPx}"`)
    .replace(/ style="[^"]*"/, '');
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    await new Promise<void>((ok, erro) => { img.onload = () => ok(); img.onerror = () => erro(new Error('Falha ao renderizar equação')); img.src = url; });
    const cv = document.createElement('canvas');
    cv.width = wPx; cv.height = hPx;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, wPx, hPx);
    ctx.drawImage(img, 0, 0, wPx, hPx);
    return { dataUrl: cv.toDataURL('image/png'), wPt: wEm * PT_POR_EM, hPt: hEm * PT_POR_EM };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function exportarRelatorio(formato: Formato, blocos: Bloco[], meta: Meta, progresso?: (txt: string) => void) {
  const figs: Record<string, Awaited<ReturnType<typeof renderizarFigura>>> = {};
  const lista = blocos.filter((b): b is Extract<Bloco, { t: 'fig' }> => b.t === 'fig');
  for (let i = 0; i < lista.length; i++) {
    progresso?.(`Gerando gráficos (${i + 1}/${lista.length})…`);
    figs[lista[i].id] = await renderizarFigura(lista[i]);
  }
  if (formato === 'docx') {
    progresso?.('Montando documento Word…');
    const { gerarDocx } = await import('./docx');
    const bytes = await gerarDocx(blocos, meta, figs);
    baixar(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), `${meta.nomeArquivo}.docx`);
  } else {
    const texs = blocos.filter((b): b is Extract<Bloco, { t: 'eq' }> => b.t === 'eq').map((b) => b.tex);
    const eqs = [];
    for (let i = 0; i < texs.length; i++) {
      if (i % 10 === 0) progresso?.(`Formatando equações (${i + 1}/${texs.length})…`);
      eqs.push(await equacaoPng(texs[i]));
    }
    progresso?.('Montando PDF…');
    const { gerarPdf } = await import('./pdf');
    baixar(await gerarPdf(blocos, meta, figs, eqs), `${meta.nomeArquivo}.pdf`);
  }
}
