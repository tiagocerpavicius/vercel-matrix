export const config = { runtime: 'edge' };

const TOKEN_URL = 'https://productores.invertironline.com/token';

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

export default async function handler(req) {
  try {
    const token = await getToken();
    const h = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
    const BASE = 'https://productores.invertironline.com';
    const ID = '670811';

    const URLS = [
      `${BASE}/api/v1/Clientes/${ID}`,
      `${BASE}/api/v1/Clientes/${ID}/portafolio`,
      `${BASE}/api/v1/Clientes/${ID}/cotizaciones`,
      `${BASE}/api/v1/Clientes/${ID}/cotizaciones?mercado=BCBA`,
      `${BASE}/api/v1/Clientes/portafolio/${ID}/Argentina`,
      `${BASE}/api/v1/Cotizaciones/BCBA`,
      `${BASE}/api/v1/Cotizaciones?mercado=BCBA&tipo=ACCIONES`,
      `${BASE}/api/v1/Mercado/BCBA`,
      `${BASE}/api/v1/Mercado/cotizaciones?tipo=ACCIONES`,
      `${BASE}/api/v1/Instrumentos?mercado=BCBA&tipo=ACCIONES`,
      `${BASE}/api/v1/Panel?mercado=BCBA&tipo=ACCIONES`,
      `${BASE}/api/v1/Titulos/cotizacion?mercado=BCBA&simbolo=GGAL`,
    ];

    const resultados = await Promise.all(URLS.map(async url => {
      try {
        const res = await fetch(url, { headers: h });
        const text = await res.text();
        return {
          url: url.replace(BASE, ''),
          status: res.status,
          preview: text.slice(0, 300),
        };
      } catch (e) {
        return { url: url.replace(BASE, ''), status: 'ERR', preview: e.message };
      }
    }));

    return new Response(JSON.stringify({ ok: true, resultados }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
