'use client'

// app/admin/login/AdminLoginClient.tsx
// ─── Client Component ─────────────────────────────────────────────────────────
// مسؤول فقط عن: عرض الفورم + تسجيل الدخول + التوجيه بعد النجاح
// لا يوجد هنا أي checkSession — ده اتعمل على السيرفر في page.tsx

import { FormEvent, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_EMAIL } from '@/lib/auth-role'

// ─── ترجمة أخطاء Supabase لرسائل عربية مفهومة ───────────────────────────────
function getLoginErrorMessage(message?: string) {
  const msg = message?.toLowerCase() ?? ''
  if (msg.includes('invalid login credentials'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
  if (msg.includes('email not confirmed'))
    return 'البريد الإلكتروني غير مفعّل. تواصل مع المسؤول.'
  if (msg.includes('invalid email'))
    return 'صيغة البريد الإلكتروني غير صحيحة.'
  if (msg.includes('too many requests'))
    return 'محاولات كثيرة جداً. انتظر قليلاً ثم حاول مجدداً.'
  return 'فشل تسجيل الدخول. تأكد من بياناتك وحاول مجدداً.'
}

// ─── مميزات النظام المعروضة في الشريط الجانبي ────────────────────────────────
const FEATURES = [
  {
    title: 'إدارة المخزون',
    description:
      'تتبّع الكميات المتاحة والنواقص لحظةً بلحظة، واتخذ قرارات الشراء بثقة.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    ),
  },
  {
    title: 'تقارير تشغيلية',
    description:
      'مؤشرات الأداء وخطة الإنتاج والتوقعات — كلها في لوحة تحكم واحدة.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    title: 'دخول آمن ومحمي',
    description:
      'صلاحيات محكومة تضمن وصول الشخص المناسب فقط إلى بيانات المصنع.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
  {
    title: 'خطة إنتاج ذكية',
    description:
      'توصيات تشغيل تلقائية مبنية على الفجوات الحقيقية في المخزون.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
  },
]

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10">
      <svg
        className="h-5 w-5 text-white/80"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        {children}
      </svg>
    </div>
  )
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function AdminLoginClient() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState(ADMIN_EMAIL ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        const msg = getLoginErrorMessage(error.message)
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      toast.success('تم تسجيل الدخول بنجاح ✓')
      router.replace('/dashboard')
      router.refresh()
    })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2" dir="rtl">

      {/* ══════════════════════════════════════
          الشريط الجانبي — يظهر على الشاشات الكبيرة
      ══════════════════════════════════════ */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 lg:flex">

        {/* خلفية زخرفية */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02] blur-2xl" />
        </div>

        {/* المحتوى */}
        <div className="relative">
          {/* شعار */}
          <div className="mb-12 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-xl shadow-primary/30">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          {/* العنوان */}
          <h1 className="text-5xl font-black leading-tight tracking-tight text-white">
            لوحة إدارة
            <br />
            <span className="bg-gradient-to-l from-primary-light to-white bg-clip-text text-transparent">
              المصنع
            </span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/50">
            منصة متكاملة تجمع الإنتاج والمخزون والتقارير في مكان واحد،
            لتساعدك على اتخاذ قرارات أذكى بشكل أسرع.
          </p>

          {/* فاصل */}
          <div className="my-10 h-px w-20 bg-gradient-to-l from-transparent via-white/20 to-transparent" />

          {/* قائمة المميزات */}
          <ul className="flex flex-col gap-7">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <FeatureIcon>{f.icon}</FeatureIcon>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="mt-1 text-xs leading-6 text-white/40">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* أسفل الشريط */}
        <div className="relative flex items-center justify-between">
          <p className="text-xs text-white/20">
            نظام إدارة المصنع &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] text-white/40">النظام يعمل</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          الجانب الأيمن — فورم تسجيل الدخول
      ══════════════════════════════════════ */}
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">

          {/* شعار موبايل فقط */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="font-black text-secondary">مصنع الإبداع</p>
              <p className="text-xs text-gray-400">لوحة إدارة المصنع</p>
            </div>
          </div>

          {/* رأس الفورم */}
          <div className="mb-8">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              تسجيل الدخول
            </span>
            <h2 className="mt-3 text-4xl font-black leading-tight text-secondary">
              مرحباً بعودتك
            </h2>
            <p className="mt-2 text-sm leading-7 text-gray-400">
              أدخل بيانات حسابك للوصول إلى لوحة التحكم ومتابعة العمليات.
            </p>
          </div>

          {/* ─── الفورم ─── */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* البريد الإلكتروني */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-secondary">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  dir="ltr"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pr-11 text-left text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                {/* أيقونة */}
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-secondary">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  dir="ltr"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 pl-24 pr-11 text-left text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                {/* أيقونة */}
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                {/* زر إظهار / إخفاء */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-secondary shadow-sm ring-1 ring-gray-100 transition hover:ring-primary/30"
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            {errorMessage ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm leading-6 text-red-700">{errorMessage}</p>
              </div>
            ) : null}

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-primary-dark py-4 text-sm font-black text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {/* تأثير hover */}
              <span className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />

              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  جاري تسجيل الدخول…
                </>
              ) : (
                <>
                  دخول إلى لوحة التحكم
                  <svg className="h-4 w-4 transition group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* ─── تذييل الفورم ─── */}
          <div className="mt-8 space-y-4">
            {/* فاصل */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-xs text-gray-300">أو</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>

            {/* رجوع للرئيسية */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-primary"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>

          {/* نبذة أمان */}
          <div className="mt-10 flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-xs text-gray-400">
              هذه الصفحة محمية. البيانات مشفرة ولا يمكن الوصول إليها إلا من خلال حساب معتمد.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}