import katex from 'katex';
import { mml2omml } from 'mathml2omml';

/** TeX → MathML (via KaTeX), sem a anotação TeX. */
export function texParaMathml(tex: string): string {
  let m = katex.renderToString(tex, { output: 'mathml', throwOnError: false, strict: 'ignore', displayMode: true });
  m = m.replace(/^[\s\S]*?(<math)/, '$1').replace(/<\/math>[\s\S]*$/, '</math>');
  m = m.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '').replace(/<\/?semantics>/g, '');
  m = m.replace(/<mo>[\u2061\u2062\u2063]<\/mo>/g, '').replace(/[\u2061\u2062\u2063]/g, '');
  // números em pt-BR: junta "14" "," "00" e separadores de milhar em um único <mn>
  let ant = '';
  while (ant !== m) {
    ant = m;
    m = m
      .replace(/<mn>([\d\u202F,]+)<\/mn><mo separator="true"[^>]*>,<\/mo><mn>(\d+)<\/mn>/g, '<mn>$1,$2</mn>')
      .replace(/<mn>([\d\u202F,]+)<\/mn><mtext>[\u2009\u202F ]<\/mtext><mn>([\d,]+)<\/mn>/g, '<mn>$1\u202F$2</mn>')
      .replace(/<mn>([\d\u202F,]+)<\/mn><mspace[^>]*\/><mn>([\d,]+)<\/mn>/g, '<mn>$1\u202F$2</mn>');
  }
  return m;
}

/** TeX → OMML (equação nativa do Word). */
export function texParaOmml(tex: string): string {
  // espaços explícitos (o OMML descarta <mspace>)
  const t = tex.replace(/\\qquad/g, '\\text{\u2003\u2003}').replace(/\\quad/g, '\\text{\u2003}');
  return mml2omml(texParaMathml(t));
}
