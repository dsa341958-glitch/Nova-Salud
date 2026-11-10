import { useEffect, useState } from 'react';

// Espera a que el usuario deje de escribir antes de consultar la API
export default function useDebounce(valor, ms = 250) {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return v;
}