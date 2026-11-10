export const soles = (n) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(n) || 0);

export const duracion = (seg) => {
  const s = Math.round(Number(seg) || 0);
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m ? `${m} min ${s % 60} s` : `${s} s`;
};

export const diaCorto = (iso) => {
  const [, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}`;
};

// "2026-11-10 14:35:20" -> "10/11/2026 14:35"
export const fechaHora = (s) => {
  const [f, h] = String(s).split(' ');
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}${h ? ` ${h.slice(0, 5)}` : ''}`;
};