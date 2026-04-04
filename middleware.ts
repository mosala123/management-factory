// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // أولاً: حط الكوكيز على الـ request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // ثانياً: عمل response جديد بالكوكيز المحدثة
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️ مهم: لا تحذف السطرين دول
  // بيعمل refresh للـ session ويحدّث الكوكيز تلقائياً
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // لو مش مسجل دخول وبيحاول يدخل dashboard → رجّعه للـ login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/admin/login') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // لو مسجل دخول وبيفتح login → رجّعه للـ dashboard
  if (user && request.nextUrl.pathname.startsWith('/admin/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * شغّل الـ middleware على كل المسارات ما عدا:
     * - _next/static  (ملفات ستاتيك)
     * - _next/image   (تحسين الصور)
     * - favicon.ico
     * - ملفات الصور
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}