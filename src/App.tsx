import { useEffect, useMemo, useState } from 'react';
import { interpretar } from './core/metodos';
import { FATOR_TF_PADRAO, PARAMETROS_PADRAO, type Ensaio, type NomeUnidade, type Parametros, type Unidade } from './core/types';
import { ensaioNaUnidade } from './core/curva';
import { fmt } from './core/formato';
import { escalaNormativa } from './ui/figuras';
import { PassoImportar } from './ui/PassoImportar';
import { PassoConferir } from './ui/PassoConferir';
import { PassoInterpretar } from './ui/PassoInterpretar';
import { PassoMemoria } from './ui/PassoMemoria';

const PASSOS = ['Importar', 'Conferir dados', 'Interpretar', 'Memória de cálculo'];
export const VISIVEIS_PADRAO = ['nbr6122', 'aoki', 'davisson', 'terzaghi'];

export default function App() {
  const [ensaio, setEnsaio] = useState<Ensaio | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [passo, setPasso] = useState(0);
  const [params, setParams] = useState<Parametros>(PARAMETROS_PADRAO);
  const [visiveis, setVisiveis] = useState<Set<string>>(new Set(VISIVEIS_PADRAO));
  const [unidade, setUnidade] = useState<NomeUnidade>('kN');
  const [fatorTf, setFatorTf] = useState(FATOR_TF_PADRAO);

  const u: Unidade = useMemo(() => ({ nome: unidade, fator: unidade === 'tf' ? fatorTf : 1 }), [unidade, fatorTf]);
  /** ensaio com as cargas na unidade de exibição */
  const ensU = useMemo(() => (ensaio ? ensaioNaUnidade(ensaio, unidade, fatorTf) : null), [ensaio, unidade, fatorTf]);
  /** edição feita na unidade de exibição → volta para a unidade de origem */
  const setEnsU = (e: Ensaio) => setEnsaio(ensaioNaUnidade(e, ensaio!.unidadeOrigem, fatorTf));

  const interp = useMemo(() => (ensU ? interpretar(ensU, params, u) : null), [ensU, params, u]);
  const vis = useMemo(() => (ensU && interp ? escalaNormativa(ensU, interp, visiveis) : null), [ensU, interp, visiveis]);
  const visBase = useMemo(() => (ensU && interp ? escalaNormativa(ensU, interp, new Set()) : null), [ensU, interp]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [passo]);

  const carregar = (e: Ensaio, av: string[]) => { setEnsaio(e); setUnidade(e.unidadeOrigem); setAvisos(av); setPasso(1); };

  return (
    <div className="app">
      <header className="topo">
        <div className="topo__marca">
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden>
            <rect width="32" height="32" rx="8" fill="#1E6FD9" />
            <path d="M7 8 Q16 9 25 25" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
          <div>
            <div className="topo__nome">Interpretação PCE</div>
            <div className="topo__sub">Prova de carga estática em estacas</div>
          </div>
        </div>
        <div className="topo__dir">
        <div className="unidade" title="Unidade de força usada em tabelas, gráficos e memória de cálculo">
          <span className="unidade__rot">Unidade</span>
          <span className="segmentado">
            {(['kN', 'tf'] as const).map((x) => (
              <button key={x} type="button" className={unidade === x ? 'ativo' : ''} onClick={() => setUnidade(x)}>{x}</button>
            ))}
          </span>
          <select className="input input--sel" value={fatorTf} onChange={(e) => setFatorTf(Number(e.target.value))} title="Fator de conversão">
            <option value={FATOR_TF_PADRAO}>1 tf = {fmt(FATOR_TF_PADRAO, 5)} kN</option>
            <option value={10}>1 tf = 10 kN (aprox.)</option>
          </select>
        </div>
        {ensaio && (
          <div className="topo__ensaio">
            <span>{ensaio.estaca.obra || 'Obra sem nome'}</span>
            <span className="topo__sep">·</span>
            <span>{ensaio.estaca.referencia || 'Ensaio'}</span>
            {ensaio.estaca.estaca && <><span className="topo__sep">·</span><span>{ensaio.estaca.estaca}</span></>}
          </div>
        )}
        </div>
      </header>

      <nav className="passos" aria-label="Etapas">
        {PASSOS.map((p, i) => (
          <button
            key={p}
            className={`passos__item ${i === passo ? 'ativo' : ''} ${i < passo ? 'feito' : ''}`}
            disabled={i > 0 && !ensaio}
            onClick={() => setPasso(i)}
          >
            <span className="passos__num">{i + 1}</span>
            <span className="passos__rot">{p}</span>
          </button>
        ))}
      </nav>

      <main className="conteudo">
        {passo === 0 && <PassoImportar onCarregar={carregar} />}
        {passo === 1 && ensaio && ensU && interp && visBase && (
          <PassoConferir ensaio={ensU} setEnsaio={setEnsU}
            unidadeOrigem={ensaio.unidadeOrigem} setUnidadeOrigem={(x) => setEnsaio({ ...ensaio, unidadeOrigem: x })} avisos={avisos} interp={interp} vis={visBase} onAvancar={() => setPasso(2)} />
        )}
        {passo === 2 && ensU && interp && vis && (
          <PassoInterpretar
            ensaio={ensU} interp={interp} vis={vis} params={params} setParams={setParams}
            visiveis={visiveis} setVisiveis={setVisiveis} onMemoria={() => setPasso(3)}
          />
        )}
        {passo === 3 && ensU && interp && vis && <PassoMemoria ensaio={ensU} interp={interp} vis={vis} visiveis={visiveis} />}
      </main>

      <footer className="rodape">
        Os dados são processados apenas no seu navegador. Formulações em validação — conferir com a bibliografia de referência.
      </footer>
    </div>
  );
}
