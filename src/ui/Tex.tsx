import katex from 'katex';
import { useMemo } from 'react';

export function Tex({ children, bloco = true }: { children: string; bloco?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, { displayMode: bloco, throwOnError: false, strict: false });
    } catch {
      return children;
    }
  }, [children, bloco]);
  return <span className={bloco ? 'tex tex--bloco' : 'tex'} dangerouslySetInnerHTML={{ __html: html }} />;
}
