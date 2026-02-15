import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh the session — this is the main purpose of the middleware.
  // Using getUser() instead of getSession() as recommended by Supabase.
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtected = path.startsWith('/app') || path.startsWith('/onboarding');
  const isAuthPage = path === '/login' || path === '/signup';

  // Not logged in → block protected routes
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in → skip auth pages (no DB queries here, keep middleware fast)
  if (isAuthPage && user) {
    const dashboardUrl = new URL('/app/orders', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/onboarding/:path*', '/login', '/signup'],
};
