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
      `${BASE}/api/v1/Titulos/BCBA/GGAL/cotizacion`,
      `${BASE}/api/v1/Titulos/BCBA/GD41/cotizacion`,
      `${BASE}/api/v1/Titulos/BCBA/YPFD/cotizacion`,
      `${BASE}/api/v1/Clientes/cotizaciones?mercado=BCBA&simbolos=GGAL,YPFD,GD41`,
      `${BASE}/api/v1/Clientes/cotizaciones?mercado=BCBA&tickers=GGAL,YPFD,GD41`,
      `${BASE}/api/v1/mercado/BCBA/panel?tipo=ACCIONES`,
      `${BASE}/api/v1/Titulos/cotizaciones?mercado=BCBA&tipo=ACCIONES`,
      `${BASE}/api/v1/Titulos/panel?mercado=BCBA`,
      `${BASE}/api/v2/Titulos/BCBA/GGAL/cotizacion`,
      `${BASE}/api/v1/Clientes/portafolio/670811/Argentina`,
    ];

    const resultados = await Promise.all(URLS.map(async url => {
      try {
        const res = await fetch(url, { headers: h });
        const text = await res.text();
        return { url: url.replace(BASE,''), status: res.status, preview: text.slice(0, 200) };
      } catch (e) {
        return { url: url.replace(BASE,''), status: 'ERR', preview: e.message };
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
