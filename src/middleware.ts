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

  const { data: { session } } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  // Protected routes: /app/*, /onboarding/*
  const isProtected = path.startsWith('/app') || path.startsWith('/onboarding');
  const isAuthPage = path === '/login' || path === '/signup';

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && session) {
    // Check if user has a restaurant
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_restaurant_id')
      .eq('user_id', session.user.id)
      .single();

    if (profile?.default_restaurant_id) {
      return NextResponse.redirect(new URL('/app/orders', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding/create-restaurant', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/onboarding/:path*', '/login', '/signup'],
};
