import { useMemo, useState } from 'react';
import { interpretar } from './core/metodos';
import { PARAMETROS_PADRAO, type Ensaio, type Parametros } from './core/types';
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

  const interp = useMemo(() => (ensaio ? interpretar(ensaio, params) : null), [ensaio, params]);
  const vis = useMemo(() => (ensaio && interp ? escalaNormativa(ensaio, interp, visiveis) : null), [ensaio, interp, visiveis]);
  const visBase = useMemo(() => (ensaio && interp ? escalaNormativa(ensaio, interp, new Set()) : null), [ensaio, interp]);

  const carregar = (e: Ensaio, av: string[]) => { setEnsaio(e); setAvisos(av); setPasso(1); };

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
        {ensaio && (
          <div className="topo__ensaio">
            <span>{ensaio.estaca.obra || 'Obra sem nome'}</span>
            <span className="topo__sep">·</span>
            <span>{ensaio.estaca.referencia || 'Ensaio'}</span>
            {ensaio.estaca.estaca && <><span className="topo__sep">·</span><span>{ensaio.estaca.estaca}</span></>}
          </div>
        )}
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
        {passo === 1 && ensaio && interp && visBase && (
          <PassoConferir ensaio={ensaio} setEnsaio={setEnsaio} avisos={avisos} interp={interp} vis={visBase} onAvancar={() => setPasso(2)} />
        )}
        {passo === 2 && ensaio && interp && vis && (
          <PassoInterpretar
            ensaio={ensaio} interp={interp} vis={vis} params={params} setParams={setParams}
            visiveis={visiveis} setVisiveis={setVisiveis} onMemoria={() => setPasso(3)}
          />
        )}
        {passo === 3 && ensaio && interp && vis && <PassoMemoria ensaio={ensaio} interp={interp} vis={vis} visiveis={visiveis} />}
      </main>

      <footer className="rodape">
        Os dados são processados apenas no seu navegador. Formulações em validação — conferir com a bibliografia de referência.
      </footer>
    </div>
  );
}
