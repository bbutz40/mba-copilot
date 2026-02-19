export { auth as proxy } from '@/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/* (all API routes - Next.js and Python)
     * - /backend/* (Python backend routes)
     * - _next/static, _next/image, favicon.ico (Next.js internals)
     */
    '/((?!api|backend|_next/static|_next/image|favicon.ico).*)',
  ],
};
