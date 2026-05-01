export const config = { runtime: 'edge' };

const IOL_TOKEN_URL = 'https://productores.invertironline.com/token';

export default async function handler(req) {
  try {
    const body = `username=${encodeURIComponent(process.env.IOL_USERNAME)}&password=${encodeURIComponent(process.env.IOL_PASSWORD)}&grant_type=password`;

    const res = await fetch(IOL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://afi.invertironline.com',
        'Referer': 'https://afi.invertironline.com/',
      },
      body,
    });

    const text = await res.text();

    return new Response(JSON.stringify({
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: text.slice(0, 500),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
