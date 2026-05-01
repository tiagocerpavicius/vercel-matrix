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

    const URLS = [
      // Ver error completo del 400
      `${BASE}/api/v1/Clientes/cotizaciones`,
      `${BASE}/api/v1/Clientes/cotizaciones?idCliente=670811`,
      `${BASE}/api/v1/Clientes/670811/cotizaciones`,
      `${BASE}/api/v1/Clientes/670811/cotizaciones?mercado=BCBA`,
      // Descubrir rutas disponibles
      `${BASE}/swagger/v1/swagger.json`,
      `${BASE}/api/v1/swagger.json`,
      `${BASE}/api/v1`,
      `${BASE}/api/v1/Titulos`,
      `${BASE}/api/v1/Titulos/BCBA`,
      `${BASE}/api/v1/Titulos/GGAL`,
    ];

    const resultados = await Promise.all(URLS.map(async url => {
      try {
        const res = await fetch(url, { headers: h });
        const text = await res.text();
        return {
          url: url.replace(BASE, ''),
          status: res.status,
          // Mostrar respuesta completa para los 400
          preview: text.slice(0, 500),
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
