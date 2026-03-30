import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // IMPORTANT: supabaseResponse must be reassigned inside setAll so that
  // refreshed session tokens are written to both the request and response.
  // If you use a plain `response` variable, token rotation silently fails
  // and the user gets kicked back to /login on every navigation.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Step 1: write refreshed cookies into the request so subsequent
          //         code in this middleware sees the updated values
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Step 2: recreate the response with the mutated request so the
          //         updated cookies are forwarded to the browser
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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
    return supabaseResponse
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
    return supabaseResponse
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
    const role: string =
      user.app_metadata?.role ?? user.user_metadata?.role ?? 'user'

    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return supabaseResponse
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
