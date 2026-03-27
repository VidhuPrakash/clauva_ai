import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated users can only access auth routes
  if (!user) {
    const isAuthRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password')

    if (!isAuthRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Block unverified email users from the app
  if (!user.email_confirmed_at) {
    const isAuthRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password')
    if (!isAuthRoute) {
      // Sign them out and redirect to login
      const redirectRes = NextResponse.redirect(new URL('/login', request.url))
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith('sb-')) redirectRes.cookies.delete(name)
      })
      return redirectRes
    }
    return response
  }

  // Authenticated + verified users shouldn't access auth routes
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password')

  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Only admins can access /admin routes
  if (pathname.startsWith('/admin')) {
    const role = user.app_metadata?.role ?? user.user_metadata?.role ?? 'user'
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, robots.txt
     * - API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|api/).*)',
  ],
}
