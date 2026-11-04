import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { lerPlanilha } from '../core/importar';
import { interpretar } from '../core/metodos';
import { PARAMETROS_PADRAO } from '../core/types';
import { escalaNormativa } from '../ui/figuras';
import { montarRelatorio } from './modelo';
import { gerarDocx } from './docx';

// PNG 1×1 azul
const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));

describe('Relatório DOCX', () => {
  it('gera documento com equações OMML', async () => {
    const buf = readFileSync('public/modelo-entrada-pce.xlsx');
    const { ensaio } = lerPlanilha(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    const interp = interpretar(ensaio, PARAMETROS_PADRAO);
    const vis = new Set(['nbr6122', 'aoki']);
    const v = escalaNormativa(ensaio, interp, vis);
    const { blocos, meta } = montarRelatorio(ensaio, interp, v, vis, {
      metodos: new Set(interp.resultados.map((r) => r.id)), empresa: 'Empresa Teste', responsavel: 'Eng. Fulano', registro: 'CREA 000000', observacoes: 'Observação de teste.',
    });
    const figs: Record<string, any> = {};
    blocos.forEach((b) => { if (b.t === 'fig') figs[b.id] = { bytes: PNG, wPx: 1000, hPx: b.fig.aspecto ? 1000 * b.fig.aspecto : 520 }; });
    const out = await gerarDocx(blocos, meta, figs);
    expect(out.length).toBeGreaterThan(10000);
    const JSZip = (await import('jszip')).default;
    const xml = await (await JSZip.loadAsync(out)).file('word/document.xml')!.async('string');
    expect(xml).not.toContain('§EQ');
    expect((xml.match(/<m:oMathPara>/g) ?? []).length).toBe(blocos.filter((b) => b.t === 'eq').reduce((n, b) => n + (b as any).tex.split('\\qquad').filter((x: string) => x.trim()).length, 0));
    if (process.env.SAIDA_DOCX) writeFileSync(process.env.SAIDA_DOCX, out);
  });
});

import { texParaMathml } from './tex';
describe('MathML pt-BR', () => {
  it('junta decimais e milhares num único número', () => {
    const m = texParaMathml('Q = 2\\,746{,}0\\ \\text{kN} \\quad 14{,}00');
    expect(m).toContain('<mn>2 746,0</mn>');
    expect(m).toContain('<mn>14,00</mn>');
  });
});
