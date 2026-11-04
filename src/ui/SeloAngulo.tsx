import type { Escala } from '../core/escala';
import { fmt } from '../core/formato';

export function SeloAngulo({ e }: { e: Escala }) {
  return (
    <span
      className={`selo ${e.anguloOk ? 'selo--ok' : 'selo--alerta'}`}
      title={`Escalas: ${fmt(e.sQ, 0)} kN/cm × ${fmt(e.sR, 2)} mm/cm. Reta origem → carga de trabalho (${fmt(e.Qt, 0)} kN; ${fmt(e.rt, 2)} mm).`}
    >
      {fmt(e.angulo, 1)}° {e.anguloOk ? '✓ 20° ± 5°' : 'fora de 20° ± 5°'}
    </span>
  );
}
