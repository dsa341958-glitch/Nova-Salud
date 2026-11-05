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