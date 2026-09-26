export interface Env {
  DB: D1Database;
}

function generateCode(length = 6): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise {
    const url = new URL(request.url);

    // 1. Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. GET / -> Serve HTML Frontend
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(getHtmlFrontend(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 3. POST /shorten -> Create short URL
    if (request.method === 'POST' && url.pathname === '/shorten') {
      try {
        const body = (await request.json()) as { url?: string };
        if (!body.url) {
          return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const code = generateCode(6);
        await env.DB.prepare('INSERT INTO urls (code, original_url, clicks) VALUES (?, ?, 0)')
          .bind(code, body.url)
          .run();

        return new Response(
          JSON.stringify({
            code,
            short_url: `\({url.origin}/\){code}`,
            original_url: body.url,
            clicks: 0,
          }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: 'Database or internal error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 4. GET /stats/:code -> Fetch link click statistics
    if (request.method === 'GET' && url.pathname.startsWith('/stats/')) {
      const code = url.pathname.split('/stats/')[1];
      const record = await env.DB.prepare('SELECT code, original_url, clicks, created_at FROM urls WHERE code = ?')
        .bind(code)
        .first();

      if (!record) {
        return new Response(JSON.stringify({ error: 'Short URL not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(record), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. GET /:code -> Increment click counter & redirect
    const code = url.pathname.slice(1);
    if (request.method === 'GET' && code) {
      const record = await env.DB.prepare('SELECT original_url FROM urls WHERE code = ?')
        .bind(code)
        .first<{ original_url: string }>();

      if (record && record.original_url) {
        // Asynchronously update click counter in D1
        await env.DB.prepare('UPDATE urls SET clicks = clicks + 1 WHERE code = ?')
          .bind(code)
          .run();

        return Response.redirect(record.original_url, 307);
      }

      return new Response('404 - Short URL not found.', { status: 404 });
    }

    return new Response('theshortenist API active.', { status: 200 });
  },
};

// Frontend Page Generator (Pico CSS styling)
function getHtmlFrontend(): string {
  return `


  
  
  theshortenist 🔗