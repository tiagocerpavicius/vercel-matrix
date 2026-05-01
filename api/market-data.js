export const config = { runtime: 'edge' };

const IOL_TOKEN_URL = 'https://productores.invertironline.com/token';
const IOL_API_URL   = 'https://api.invertironline.com/api/v2';

const TIPOS = [
  { tipo: 'ACCIONES',                      panel: 'lideres'  },
  { tipo: 'BONOS_NACIONALES_EN_DOLARES',   panel: 'general'  },
  { tipo: 'CEDEARS',                       panel: 'general'  },
  { tipo: 'OBLIGACIONES_NEGOCIABLES',      panel: 'general'  },
  { tipo: 'CAUCIONES',                     panel: 'general'  },
];

async function getToken() {
  const res = await fetch(IOL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(process.env.IOL_USERNAME)}&password=${encodeURIComponent(process.env.IOL_PASSWORD)}&grant_type=password`,
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const d = await res.json();
  return d.access_token;
}

async function fetchTipo(token, tipo, panel) {
  const url = `${IOL_API_URL}/mercado/BCBA/cotizaciones?tipo=${tipo}&panel=${panel}&paginado=false`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const d = await res.json();
  return (d.titulos || d.items || d || []).map(t => ({
    ticker:   t.simbolo     || t.ticker || '',
    desc:     t.descripcion || t.nombre || '',
    precio:   t.ultimoPrecio ?? t.precio ?? null,
    variacion: t.variacionDiaria ?? t.variacion ?? 0,
    volumen:  t.volumenNominal ?? t.volumen ?? 0,
    tipo,
  }));
}

export default async function handler(req) {
  try {
    const token = await getToken();

    const resultados = await Promise.all(
      TIPOS.map(({ tipo, panel }) => fetchTipo(token, tipo, panel))
    );

    const data = resultados.flat();

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
