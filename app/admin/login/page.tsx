'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { ADMIN_EMAIL } from '@/lib/auth-role';

function getLoginErrorMessage(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? '';

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'البريد الإلكتروني غير مفعّل. تواصل مع المسؤول.';
  }

  if (normalizedMessage.includes('invalid email')) {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }

  return 'فشل تسجيل الدخول. تأكد من بياناتك وحاول مجدداً.';
}

const FEATURES = [
  {
    title: 'إدارة المخزون',
    description: 'تتبّع الكميات المتاحة والنواقص لحظةً بلحظة، واتخذ قرارات الشراء بثقة.',
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
    description: 'مؤشرات الأداء وخطة الإنتاج والتوقعات — كلها في لوحة تحكم واحدة.',
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
    description: 'صلاحيات محكومة تضمن وصول الشخص المناسب فقط إلى بيانات المصنع.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
];

function FeatureIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20">
      <svg
        className="h-4 w-4 text-primary-light"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        {children}
      </svg>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (user) {
        router.replace('/dashboard');
        return;
      }

      setCheckingSession(false);
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [router, supabase.auth]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        const msg = getLoginErrorMessage(error.message);
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      toast.success('تم تسجيل الدخول بنجاح');
      router.replace('/dashboard');
      router.refresh();
    });
  };

  /* ── Loading state ── */
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-gray-400">جاري التحقق من الجلسة…</p>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="grid min-h-screen md:grid-cols-2">

      {/* ════════════════════════════
          LEFT — Dark sidebar
      ════════════════════════════ */}
      <div className="hidden flex-col justify-between bg-secondary p-10 md:flex">

        {/* Top section */}
        <div>
          {/* Logo mark */}
          <div className="mb-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20">
            <svg
              className="h-5 w-5 text-primary-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-black leading-tight text-white">
            لوحة إدارة<br />المصنع
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            منصة متكاملة تجمع الإنتاج والمخزون والتقارير في مكان واحد،
            لتساعدك على اتخاذ قرارات أذكى بشكل أسرع.
          </p>

          {/* Divider */}
          <div className="my-8 h-px w-16 bg-white/10" />

          {/* Feature list */}
          <ul className="flex flex-col gap-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <FeatureIcon>{f.icon}</FeatureIcon>
                <div>
                  <p className="text-sm font-bold text-white">{f.title}</p>
                  <p className="mt-1 text-xs leading-6 text-white/45">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <p className="text-xs text-white/20">
          نظام إدارة المصنع &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* ════════════════════════════
          RIGHT — Login form
      ════════════════════════════ */}
      <div className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm" dir="rtl">

          {/* Header */}
          <div className="mb-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
              لوحة التحكم
            </p>
            <h2 className="text-3xl font-black text-secondary">مرحباً بعودتك</h2>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              أدخل بيانات حسابك للوصول إلى بيانات المصنع ومتابعة العمليات.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-secondary">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                dir="ltr"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-secondary">
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
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-20 text-left text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-secondary shadow-sm ring-1 ring-gray-100 transition hover:ring-primary/30"
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMessage ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <p className="text-sm leading-6 text-red-700">{errorMessage}</p>
              </div>
            ) : null}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  جاري تسجيل الدخول…
                </>
              ) : (
                'دخول إلى لوحة التحكم'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="text-sm text-gray-400 transition hover:text-primary"
            >
              ← العودة إلى الصفحة الرئيسية
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}