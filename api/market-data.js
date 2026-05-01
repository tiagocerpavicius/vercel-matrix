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

    const URLS_A_PROBAR = [
      'https://api.invertironline.com/api/v2/mercado/BCBA/cotizaciones?tipo=ACCIONES&panel=lideres&paginado=false',
      'https://api.invertironline.com/api/v2/mercado/BCBA/cotizaciones?tipo=CEDEARS&panel=general&paginado=false',
      'https://api.invertironline.com/api/v2/mercado/BCBA/cotizaciones?tipo=BONOS_NACIONALES_EN_DOLARES&panel=general&paginado=false',
      'https://productores.invertironline.com/api/v1/mercado/BCBA/cotizaciones?tipo=ACCIONES&paginado=false',
      'https://productores.invertironline.com/api/v2/mercado/BCBA/cotizaciones?tipo=ACCIONES&paginado=false',
      'https://productores.invertironline.com/api/v1/Titulos/panel?mercado=BCBA&tipo=ACCIONES',
      'https://productores.invertironline.com/api/v1/Clientes/cotizaciones?mercado=BCBA',
    ];

    const resultados = await Promise.all(URLS_A_PROBAR.map(async url => {
      try {
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        const text = await res.text();
        return {
          url,
          status: res.status,
          preview: text.slice(0, 120),
        };
      } catch (e) {
        return { url, status: 'ERROR', preview: e.message };
      }
    }));

    return new Response(JSON.stringify({ token_ok: true, resultados }, null, 2), {
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
