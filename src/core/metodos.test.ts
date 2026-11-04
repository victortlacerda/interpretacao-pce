import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { interpretar, varreduraVdV } from './metodos';
import { calcularEscala, anguloGraus } from './escala';
import { lerPlanilha } from './importar';
import { FATOR_TF_PADRAO, PARAMETROS_PADRAO, type Ensaio, type Ponto } from './types';
import { ensaioNaUnidade } from './curva';
import * as XLSX from 'xlsx';

function ensaioDe(pts: Ponto[], extra: Partial<Ensaio['estaca']> = {}): Ensaio {
  return {
    unidadeOrigem: 'kN',
    estaca: {
      obra: 't', referencia: 't', estaca: 't', tipo: 't', D: 500, Dponta: null, L: 14, area: null, E: 20, Qt: 1000,
      cotaArrasamento: '', cotaPonta: '', tipoCarregamento: 'lento', data: '', horaInicio: '', horaFim: '', executor: '', ...extra,
    },
    estagios: pts.map((p, i) => ({ n: i + 1, fase: 'C', Q: p.Q, hIni: '', hFim: '', rIni: [p.r], rFim: [p.r], incluir: true })),
    nRelogios: 1,
    relogioAtivo: [true],
  };
}

const get = (ens: Ensaio, id: string) => interpretar(ens, PARAMETROS_PADRAO).resultados.find((r) => r.id === id)!;

describe('Van der Veen / Aoki', () => {
  it('recupera Qu de uma curva exponencial com intercepto', () => {
    const Qu = 2600, a = 0.11, b = 0.05;
    const pts = [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000].map((Q) => ({ Q, r: (-Math.log(1 - Q / Qu) - b) / a }));
    const v = varreduraVdV(pts, true)!;
    expect(v.Qu).toBeCloseTo(Qu, -1);
    expect(v.aj.b).toBeCloseTo(a, 3);
    expect(v.aj.a).toBeCloseTo(b, 3);
  });
  it('recupera Qu pela origem', () => {
    const Qu = 3000, a = 0.08;
    const pts = [300, 600, 900, 1200, 1500, 1800, 2100].map((Q) => ({ Q, r: -Math.log(1 - Q / Qu) / a }));
    expect(varreduraVdV(pts, false)!.Qu).toBeCloseTo(Qu, -1);
  });
});

describe('Hiperbólicos', () => {
  it('Chin recupera 1/C1', () => {
    const C1 = 1 / 2500, C2 = 0.002;
    const pts = [1, 2, 4, 6, 9, 12, 16, 20].map((r) => ({ Q: r / (C1 * r + C2), r }));
    const res = get(ensaioDe(pts), 'chin');
    expect(res.Qu!).toBeCloseTo(2500, 3);
  });
  it('Décourt recupera -a/b', () => {
    const a = 600, b = -0.25; // K = a + bQ -> Qu = 2400
    const pts = [200, 500, 800, 1100, 1400, 1700, 2000].map((Q) => ({ Q, r: Q / (a + b * Q) }));
    expect(get(ensaioDe(pts), 'decourt').Qu!).toBeCloseTo(2400, 3);
  });
  it('Brinch-Hansen 80 % recupera Qu teórico', () => {
    const C1 = 0.0001, C2 = 0.0016; // Qu = 1/(2*sqrt(C1C2)) = 1250
    const pts = [0.5, 1, 2, 4, 6, 9, 12].map((r) => ({ Q: Math.sqrt(r) / (C1 * r + C2), r }));
    expect(get(ensaioDe(pts), 'bh80').Qu!).toBeCloseTo(1250, 3);
  });
});

describe('Mazurkiewicz / Massad', () => {
  it('recuperam Qu de curva exponencial pela origem (equivalência com Van der Veen)', () => {
    const Qu = 2000, a = 0.15;
    const rs = Array.from({ length: 12 }, (_, i) => (i + 1) * 1.5);
    const pts = rs.map((r) => ({ Q: Qu * (1 - Math.exp(-a * r)), r }));
    expect(get(ensaioDe(pts), 'massad').Qu!).toBeCloseTo(Qu, -1);
    expect(get(ensaioDe(pts), 'mazurkiewicz').Qu!).toBeCloseTo(Qu, -1);
  });
});

describe('Critérios convencionais', () => {
  const Qu = 2600, a = 0.11, b = 0.02;
  const pts = [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000].map((Q) => ({ Q, r: Math.max(0, (-Math.log(1 - Q / Qu) - b) / a) }));
  it('NBR 6122 cai sobre a reta PL/AE + D/30', () => {
    const ens = ensaioDe(pts);
    const r = get(ens, 'nbr6122');
    const A = Math.PI * 0.25 ** 2;
    expect(r.Qu).not.toBeNull();
    expect(r.ru!).toBeCloseTo((r.Qu! * 14) / (A * 20e3) + 500 / 30, 6);
  });
  it('Terzaghi usa 10 % do diâmetro da ponta', () => {
    const r = get(ensaioDe(pts, { Dponta: 600 }), 'terzaghi');
    expect(r.ru).toBeCloseTo(60, 9);
    expect(r.linhasR?.map((l) => l.r)).toEqual([60, 12]);
  });
});

describe('Escala 20°', () => {
  it('ângulo dentro de 15–25° e próximo de 20°', () => {
    for (const [Qt, rt, Q, r] of [[1000, 4, 2600, 25], [500, 1.2, 1300, 9], [3000, 12, 7000, 60], [800, 0.6, 1600, 3]]) {
      const e = calcularEscala({ Qt, rt, Qplot: Q, rPlot: r });
      expect(e.anguloOk).toBe(true);
      expect(Math.abs(e.angulo - 20)).toBeLessThan(5);
      expect(anguloGraus(Qt, rt, e.sQ, e.sR)).toBeCloseTo(e.angulo, 9);
    }
  });
});

describe('Importação da planilha-modelo', () => {
  it('lê identificação e estágios com leituras inicial e final', () => {
    const buf = readFileSync('public/modelo-entrada-pce.xlsx');
    const { ensaio } = lerPlanilha(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    expect(ensaio.estaca.D).toBe(500);
    expect(ensaio.estaca.E).toBe(20);
    expect(ensaio.estaca.Qt).toBe(1000);
    expect(ensaio.nRelogios).toBe(4);
    expect(ensaio.estagios.filter((e) => e.fase === 'C').length).toBe(10);
    expect(ensaio.estagios.filter((e) => e.fase === 'D').length).toBe(4);
    expect(ensaio.estagios[0].rIni[0]).not.toBeNull();
    const res = interpretar(ensaio, PARAMETROS_PADRAO);
    const aoki = res.resultados.find((r) => r.id === 'aoki')!;
    expect(aoki.Qu! / 2600).toBeGreaterThan(0.85);
    expect(aoki.Qu! / 2600).toBeLessThan(1.15);
  });
});

describe('Unidades kN ↔ tf', () => {
  const Qu = 2600, a = 0.11, b = 0.02;
  const pts = [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000].map((Q) => ({ Q, r: Math.max(0, (-Math.log(1 - Q / Qu) - b) / a) }));
  for (const f of [FATOR_TF_PADRAO, 10]) {
    it(`todos os métodos dão o mesmo resultado físico em tf (1 tf = ${f} kN)`, () => {
      const ens = ensaioDe(pts);
      const rk = interpretar(ens, PARAMETROS_PADRAO).resultados;
      const rt = interpretar(ensaioNaUnidade(ens, 'tf', f), PARAMETROS_PADRAO, { nome: 'tf', fator: f }).resultados;
      rk.forEach((r, i) => {
        if (r.Qu === null) { expect(rt[i].Qu).toBeNull(); return; }
        expect(rt[i].Qu! * f).toBeCloseTo(r.Qu, 1);
        if (r.ru !== null) expect(rt[i].ru!).toBeCloseTo(r.ru, 3);
      });
    });
  }
  it('conversão de ida e volta preserva os valores', () => {
    const ens = ensaioDe(pts);
    const volta = ensaioNaUnidade(ensaioNaUnidade(ens, 'tf', FATOR_TF_PADRAO), 'kN', FATOR_TF_PADRAO);
    volta.estagios.forEach((s, i) => expect(s.Q).toBeCloseTo(ens.estagios[i].Q, 9));
    expect(volta.unidadeOrigem).toBe('kN');
  });
  it('importa planilha com cargas em tf pelo cabeçalho', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Campo', 'Valor', 'Unidade'], ['Diâmetro D', 400, 'mm'], ['Comprimento L', 12, 'm'], ['Carga de trabalho estimada (Qt)', 1000, 'kN']]), 'Identificacao');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Estágio', 'Fase', 'Carga (tf)', 'R1 fim (mm)'], [1, 'C', 20, 0.5], [2, 'C', 40, 1.2]]), 'Estagios');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const { ensaio } = lerPlanilha(buf);
    expect(ensaio.unidadeOrigem).toBe('tf');
    expect(ensaio.estagios[1].Q).toBe(40);
    expect(ensaio.estaca.Qt!).toBeCloseTo(1000 / FATOR_TF_PADRAO, 6);
  });
});
