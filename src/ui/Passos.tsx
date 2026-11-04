import type { Passo } from '../core/types';
import { Tex } from './Tex';

export function Passos({ passos }: { passos: Passo[] }) {
  return (
    <ol className="passos-calc">
      {passos.map((p, i) => (
        <li key={i} className="passo-calc">
          <h4>{p.titulo}</h4>
          {p.texto && <p>{p.texto}</p>}
          {p.tex?.map((t, k) => <Tex key={k}>{t}</Tex>)}
          {p.tabela && (
            <div className="tabela-rolagem">
              <table className="tabela tabela--compacta">
                <thead><tr>{p.tabela.cab.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{p.tabela.linhas.map((l, j) => <tr key={j}>{l.map((c, k) => <td key={k} className="num">{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
