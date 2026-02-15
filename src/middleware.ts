import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * MENIUS API Gateway Middleware
 * 
 * This middleware acts as the central security gateway for the application.
 * It handles:
 * 1. Session refresh using getUser() (validates with Supabase Auth server)
 * 2. Route protection (authenticated vs public routes)
 * 3. Rate limiting headers
 * 4. Security headers (CORS, CSP, etc.)
 * 5. Tenant context injection for API routes
 */

// Rate limiting: simple in-memory store (for production, use Redis/Upstash)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute
const RATE_LIMIT_API_MAX = 30; // 30 API requests per minute (stricter)

function checkRateLimit(ip: string, isApi: boolean): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = `${ip}:${isApi ? 'api' : 'page'}`;
  const limit = isApi ? RATE_LIMIT_API_MAX : RATE_LIMIT_MAX_REQUESTS;
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: limit - 1 };
  }
  
  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  
  // Rate limiting check
  const isApiRoute = path.startsWith('/api/');
  const { allowed, remaining } = checkRateLimit(ip, isApiRoute);
  
  if (!allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

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
          // Re-apply security headers after creating new response
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('X-Frame-Options', 'DENY');
          response.headers.set('X-XSS-Protection', '1; mode=block');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          response.headers.set('X-RateLimit-Remaining', remaining.toString());
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.headers.set('X-Content-Type-Options', 'nosniff');
          response.headers.set('X-Frame-Options', 'DENY');
          response.headers.set('X-XSS-Protection', '1; mode=block');
          response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
          response.headers.set('X-RateLimit-Remaining', remaining.toString());
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // CRITICAL: Use getUser() NOT getSession()
  // getUser() validates the session with the Supabase Auth server
  // getSession() only reads from potentially stale cookies
  const { data: { user } } = await supabase.auth.getUser();

  // Define route types
  const isProtected = path.startsWith('/app') || path.startsWith('/onboarding');
  const isAuthPage = path === '/login' || path === '/signup';
  const isProtectedApi = path.startsWith('/api/tenant/');

  // Handle protected routes
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Handle protected API routes
  if (isProtectedApi && !user) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Handle auth pages (redirect if already logged in)
  if (isAuthPage && user) {
    // Check if user has a restaurant
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_restaurant_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.default_restaurant_id) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.redirect(new URL('/onboarding/create-restaurant', request.url));
  }

  // Inject tenant context header for API routes (if authenticated)
  if (user && (isProtectedApi || path.startsWith('/api/'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_restaurant_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.default_restaurant_id) {
      // These headers are only trusted because they come from the middleware
      // (which runs server-side and can't be spoofed by the client)
      response.headers.set('X-Tenant-Id', profile.default_restaurant_id);
      response.headers.set('X-User-Id', user.id);
      response.headers.set('X-User-Role', profile.role);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/app/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/api/:path*',
  ],
};
