import type { NextRequest } from 'next/server';
import { serverApi } from '@/lib/api-base';

// Same-origin proxy: the browser calls /api/* on the web origin and this
// forwards to the backend server-side (no CORS, runtime-configurable origin).
export const dynamic = 'force-dynamic';

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const origin = serverApi();
  let target = origin;
  try {
    const { path } = await ctx.params;
    target = `${origin}/api/${path.join('/')}${req.nextUrl.search}`;

    const headers = new Headers(req.headers);
    headers.delete('host');
    headers.delete('content-length');
    headers.delete('accept-encoding');

    const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = await req.arrayBuffer();
    }

    const res = await fetch(target, init);
    const resHeaders = new Headers(res.headers);
    resHeaders.delete('content-encoding');
    resHeaders.delete('content-length');
    resHeaders.delete('transfer-encoding');
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (e) {
    let host = origin;
    try {
      host = new URL(origin).host;
    } catch {
      /* origin not a valid URL */
    }
    return new Response(
      JSON.stringify({
        message: `Cannot reach the API at "${host}". Check the API service is running and API_ORIGIN is set on the web service.`,
        detail: (e as Error).message,
      }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
