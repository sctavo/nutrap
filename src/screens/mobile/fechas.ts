// Fechas yyyy-MM-dd. Se calculan en UTC para no depender de la zona horaria del celular.

export const DIAS_CORTOS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const sumarDias = (f: string, n: number) =>
  new Date(Date.parse(f + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);

/** 0 = lunes … 6 = domingo */
export const diaSemana = (f: string) => (new Date(f + 'T00:00:00Z').getUTCDay() + 6) % 7;

/** "jueves 19 nov" */
export const fechaLarga = (f: string) =>
  `${DIAS_LARGOS[diaSemana(f)]} ${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1]}`;

/** "HOY", "AYER" o "MAR 17" */
export function etiquetaDia(f: string, hoyStr: string): string {
  if (f === hoyStr) return 'HOY';
  if (f === sumarDias(hoyStr, -1)) return 'AYER';
  return `${DIAS_CORTOS[diaSemana(f)]} ${Number(f.slice(8))}`;
}

/** "08:30" a partir de un timestamp */
export const hora = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
