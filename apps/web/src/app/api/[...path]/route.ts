import type { NextRequest } from 'next/server';
import { serverApi } from '@/lib/api-base';

// Same-origin proxy: the browser calls /api/* on the web origin and this
// forwards to the backend server-side (no CORS, runtime-configurable origin).
export const dynamic = 'force-dynamic';

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const target = `${serverApi()}/api/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('accept-encoding');

  const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch {
    return new Response(
      JSON.stringify({ message: 'The API service is unreachable.' }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    );
  }

  const resHeaders = new Headers(res.headers);
  resHeaders.delete('content-encoding');
  resHeaders.delete('content-length');
  resHeaders.delete('transfer-encoding');
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  });
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
