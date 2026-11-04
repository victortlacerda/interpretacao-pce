import { useRef, useState } from 'react';
import { lerPlanilha } from '../core/importar';
import type { Ensaio } from '../core/types';

const MODELO = `${import.meta.env.BASE_URL}modelo-entrada-pce.xlsx`;

export function PassoImportar({ onCarregar }: { onCarregar: (e: Ensaio, avisos: string[]) => void }) {
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const processar = async (buf: ArrayBuffer) => {
    try {
      setErro(null);
      const { ensaio, avisos } = lerPlanilha(buf);
      onCarregar(ensaio, avisos);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível ler a planilha.');
    } finally { setCarregando(false); }
  };
  const arquivo = async (f: File | undefined) => {
    if (!f) return;
    setCarregando(true);
    processar(await f.arrayBuffer());
  };
  const exemplo = async () => {
    setCarregando(true);
    const r = await fetch(MODELO);
    processar(await r.arrayBuffer());
  };

  return (
    <section className="importar">
      <div className="importar__intro">
        <h1>Interprete uma prova de carga estática</h1>
        <p>
          Importe a planilha do ensaio com os dados da estaca e as leituras dos relógios de cada estágio.
          O app calcula a curva carga × deslocamento, plota os gráficos na escala da norma e determina a carga de ruptura por
          15 critérios e métodos de extrapolação, com memória de cálculo completa.
        </p>
      </div>

      <div
        className={`soltar ${arrastando ? 'soltar--ativo' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastando(false); arquivo(e.dataTransfer.files[0]); }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#1E6FD9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M12 18v-6" /><path d="m9 15 3-3 3 3" />
        </svg>
        <strong>{carregando ? 'Lendo planilha…' : 'Arraste a planilha aqui ou clique para escolher'}</strong>
        <span>Formatos .xlsx, .xls ou .csv</span>
        <input ref={input} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => arquivo(e.target.files?.[0])} />
      </div>

      {erro && <div className="alerta alerta--erro">{erro}</div>}

      <div className="importar__acoes">
        <button className="btn btn--primario" onClick={exemplo}>Abrir ensaio de exemplo</button>
        <a className="btn btn--leve" href={MODELO} download>Baixar planilha-modelo</a>
      </div>

      <div className="cartoes3">
        <div className="cartao cartao--info">
          <h3>1 · Identificação</h3>
          <p>Obra, referência, tipo de estaca, diâmetro, comprimento, cotas, módulo E (padrão 20 GPa), carga de trabalho estimada, horários.</p>
        </div>
        <div className="cartao cartao--info">
          <h3>2 · Estágios</h3>
          <p>Carga de cada estágio, fase (C/D), horários e leituras <b>inicial</b> e <b>final</b> de cada relógio. A média é calculada automaticamente.</p>
        </div>
        <div className="cartao cartao--info">
          <h3>3 · Resultados</h3>
          <p>Gráficos interativos em escala normativa (20° ± 5°), tabela comparativa dos métodos e memória de cálculo passo a passo.</p>
        </div>
      </div>
    </section>
  );
}
