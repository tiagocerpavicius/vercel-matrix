export const config = { runtime: 'edge' };

const TOKEN_URL = 'https://productores.invertironline.com/token';
const API_BASE  = 'https://productores.invertironline.com/api/v1';

const PANELES = [
  { tipo: 'acciones',               label: 'ACCIONES'    },
  { tipo: 'bonos',                  label: 'BONOS'       },
  { tipo: 'cedears',                label: 'CEDEARS'     },
  { tipo: 'obligaciones_negociables', label: 'ONs'       },
  { tipo: 'cauciones',              label: 'CAUCIONES'   },
];

async function getToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Accept': 'application/json, text/plain, */*',
      'Origin': 'https://afi.invertironline.com',
      'Referer': 'https://afi.invertironline.com/',
    },
    body: `username=${encodeURIComponent(process.env.IOL_USERNAME)}&password=${encodeURIComponent(process.env.IOL_PASSWORD)}&grant_type=password`,
  });
  const d = await res.json();
  return d.access_token;
}

async function fetchPanel(token, tipo, label) {
  const urls = [
    `${API_BASE}/mercado/BCBA/cotizaciones?tipo=${tipo}&paginado=false`,
    `${API_BASE}/Titulos/cotizaciones?mercado=BCBA&tipo=${tipo}`,
    `https://api.invertironline.com/api/v2/mercado/BCBA/cotizaciones?tipo=${tipo.toUpperCase()}&panel=general&paginado=false`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || text.trim().startsWith('<')) continue;
      const d = JSON.parse(text);
      const items = d.titulos || d.items || d.data || (Array.isArray(d) ? d : null);
      if (!items || items.length === 0) continue;
      return items.map(t => ({
        ticker:    t.simbolo     || t.ticker  || '',
        desc:      t.descripcion || t.nombre  || '',
        precio:    t.ultimoPrecio ?? t.precio ?? null,
        variacion: t.variacionDiaria ?? t.variacion ?? 0,
        volumen:   t.volumenNominal  ?? t.volumen   ?? 0,
        tipo:      label,
        url,
      }));
    } catch { continue; }
  }
  return [{ ticker: `SIN_DATOS_${label}`, desc: 'Endpoint no encontrado', precio: null, variacion: 0, volumen: 0, tipo: label }];
}

export default async function handler(req) {
  try {
    const token = await getToken();

    const resultados = await Promise.all(
      PANELES.map(({ tipo, label }) => fetchPanel(token, tipo, label))
    );

    const data = resultados.flat();

    return new Response(JSON.stringify({ ok: true, total: data.length, data }), {
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
