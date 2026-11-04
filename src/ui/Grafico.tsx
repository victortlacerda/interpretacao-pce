import { useEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';

let localeRegistrado = false;
function registrarLocale() {
  if (localeRegistrado) return;
  localeRegistrado = true;
  (Plotly as any).register({
    moduleType: 'locale',
    name: 'pt-BR',
    dictionary: {
      'Download plot as a png': 'Baixar PNG',
      'Download plot': 'Baixar gráfico',
      Zoom: 'Zoom',
      Pan: 'Mover',
      'Zoom in': 'Ampliar',
      'Zoom out': 'Reduzir',
      'Reset axes': 'Restaurar escala normativa',
      Autoscale: 'Escala automática',
      'Toggle Spike Lines': 'Linhas de referência',
      'Show closest data on hover': 'Mostrar ponto mais próximo',
      'Compare data on hover': 'Comparar dados',
      'Box Select': 'Selecionar retângulo',
      'Lasso Select': 'Selecionar laço',
      'Double-click to zoom back out': 'Duplo clique para voltar',
    },
    format: { decimal: ',', thousands: '.', days: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], months: [] },
  });
}

export const MARGEM = { l: 74, r: 24, t: 28, b: 58 };

interface Props {
  data: any[];
  layout: any;
  /** razão altura/largura da área de plotagem (escala física fixa) */
  aspecto?: number;
  altura?: number;
  nomeArquivo: string;
  titulo?: string;
  legenda?: React.ReactNode;
}

export function Grafico({ data, layout, aspecto, altura = 380, nomeArquivo, titulo, legenda }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const alvo = useRef<HTMLDivElement>(null);
  const [tela, setTela] = useState(false);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    registrarLocale();
    const el = caixa.current!;
    const ro = new ResizeObserver(() => setLargura(el.clientWidth));
    ro.observe(el);
    setLargura(el.clientWidth);
    const fs = () => setTela(document.fullscreenElement === el);
    document.addEventListener('fullscreenchange', fs);
    return () => { ro.disconnect(); document.removeEventListener('fullscreenchange', fs); };
  }, []);

  const dims = () => {
    const m = layout.margin ?? MARGEM;
    const mh = m.l + m.r, mv = m.t + m.b;
    let W = Math.max(280, largura - (tela ? 32 : 0));
    if (aspecto) {
      let pw = W - mh;
      let ph = pw * aspecto;
      if (tela) {
        const H = window.innerHeight - 90;
        if (ph + mv > H) { ph = H - mv; pw = ph / aspecto; W = pw + mh; }
      }
      return { width: W, height: ph + mv };
    }
    return { width: W, height: tela ? window.innerHeight - 90 : altura };
  };

  useEffect(() => {
    if (!alvo.current || !largura) return;
    const { width, height } = dims();
    Plotly.react(
      alvo.current,
      data,
      {
        font: { family: 'Inter, system-ui, sans-serif', size: 12, color: '#1F2A37' },
        paper_bgcolor: '#FFFFFF',
        plot_bgcolor: '#FFFFFF',
        margin: MARGEM,
        hoverlabel: { bgcolor: '#0B3A66', bordercolor: '#0B3A66', font: { color: '#fff', family: 'Inter' } },
        legend: { orientation: 'h', y: -0.16, x: 0, font: { size: 11 } },
        separators: ',.',
        ...layout,
        width,
        height,
        autosize: false,
      },
      {
        locale: 'pt-BR',
        displaylogo: false,
        responsive: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
        toImageButtonOptions: { format: 'png', filename: nomeArquivo, scale: 3 },
      } as any,
    );
  }, [data, layout, largura, tela, aspecto, altura]);

  useEffect(() => () => { if (alvo.current) Plotly.purge(alvo.current); }, []);

  const png = () => {
    if (!alvo.current) return;
    Plotly.downloadImage(alvo.current, { format: 'png', filename: nomeArquivo, scale: 3, ...dims() } as any);
  };
  const alternarTela = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else caixa.current?.requestFullscreen?.();
  };

  return (
    <div className={`grafico ${tela ? 'grafico--tela' : ''}`} ref={caixa}>
      <div className="grafico__barra">
        {titulo && <h3 className="grafico__titulo">{titulo}</h3>}
        <div className="grafico__acoes">
          {legenda}
          <button className="btn btn--leve btn--peq" onClick={png} title="Baixar PNG em alta resolução">PNG</button>
          <button className="btn btn--leve btn--peq" onClick={alternarTela} title="Ampliar em tela cheia">
            {tela ? 'Sair da tela cheia' : 'Ampliar'}
          </button>
        </div>
      </div>
      <div ref={alvo} />
    </div>
  );
}
