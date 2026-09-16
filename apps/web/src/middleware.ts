import { NextResponse, type NextRequest } from 'next/server';

/**
 * Carry the requested path into server components.
 *
 * A layout is rendered without knowing which page is inside it, and the
 * announcement band has to honour "show on these pages". Copying the path onto a
 * request header keeps that decision on the server, so the band is part of the
 * first response rather than something that pops in after hydration and pushes
 * the page down.
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set('x-pathname', req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: static assets and the API proxy gain nothing from this.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
