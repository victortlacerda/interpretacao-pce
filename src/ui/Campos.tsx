import { useEffect, useState } from 'react';
import { fmt, parseNum } from '../core/formato';

export function NumInput({
  valor, onChange, casas = 2, placeholder, className, vazioPermitido = true, largura,
}: {
  valor: number | null; onChange: (v: number | null) => void; casas?: number; placeholder?: string;
  className?: string; vazioPermitido?: boolean; largura?: number;
}) {
  const formatar = (v: number | null) => (v === null || v === undefined || !Number.isFinite(v) ? '' : fmt(v, casas).replace(/\./g, ''));
  const [txt, setTxt] = useState(formatar(valor));
  const [foco, setFoco] = useState(false);
  useEffect(() => { if (!foco) setTxt(formatar(valor)); }, [valor, foco]);
  const confirmar = () => {
    const v = parseNum(txt);
    if (v === null && !vazioPermitido) { setTxt(formatar(valor)); return; }
    if (v !== valor) onChange(v);
  };
  return (
    <input
      className={`input input--num ${className ?? ''}`}
      style={largura ? { width: largura } : undefined}
      inputMode="decimal"
      value={txt}
      placeholder={placeholder}
      onFocus={() => setFoco(true)}
      onBlur={() => { setFoco(false); confirmar(); }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      onChange={(e) => setTxt(e.target.value)}
    />
  );
}

export function Campo({ rotulo, unidade, children, dica }: { rotulo: string; unidade?: string; children: React.ReactNode; dica?: string }) {
  return (
    <label className="campo" title={dica}>
      <span className="campo__rotulo">{rotulo}</span>
      <span className="campo__corpo">
        {children}
        {unidade && <span className="campo__unid">{unidade}</span>}
      </span>
    </label>
  );
}
