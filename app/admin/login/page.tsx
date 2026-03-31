'use client';

import { FormEvent, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

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

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error('فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.');
        return;
      }

      toast.success('تم تسجيل الدخول بنجاح');
      router.replace('/dashboard');
      router.refresh();
    });
  };

  if (checkingSession) {
    return (
      <section className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-[2rem] border border-primary/10 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-sm">
          <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full bg-primary/15" />
          <h1 className="text-2xl font-black text-secondary">جاري تجهيز صفحة الدخول</h1>
          <p className="mt-3 text-sm text-gray-600">
            نتحقق من حالة الجلسة حتى نوجهك للمسار الصحيح.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(196,122,58,0.16),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(27,42,56,0.12),_transparent_30%)]" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-primary/10 bg-white/80 shadow-2xl backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden bg-[linear-gradient(145deg,rgba(27,42,56,0.96),rgba(16,28,39,0.92))] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
              لوحة إدارة المصنع
            </span>
            <h1 className="mt-6 text-4xl font-black leading-tight text-white">
              دخول سريع وآمن لإدارة المخزون والإنتاج
            </h1>
            <p className="mt-4 text-base leading-8 text-white/75">
              استخدم بيانات حسابك للدخول إلى لوحة التحكم ومتابعة المنتجات والتقارير من مكان واحد.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/8 p-5">
              <p className="text-sm font-bold text-white">متابعة المخزون</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                مراجعة النواقص والكميات الحالية واتخاذ قرارات أسرع.
              </p>
            </div>
            <div className="rounded-3xl border border-primary-light/20 bg-primary/10 p-5">
              <p className="text-sm font-bold text-white">تقارير تشغيلية أوضح</p>
              <p className="mt-2 text-sm leading-7 text-white/70">
                الوصول إلى المؤشرات والمنتجات وخطة الإنتاج بعد تسجيل الدخول مباشرة.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center md:text-right">
              <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                /admin/login
              </span>
              <h2 className="mt-5 text-3xl font-black text-secondary">تسجيل الدخول</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">
                أدخل البريد الإلكتروني وكلمة المرور الخاصة بحساب الإدارة.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-secondary">البريد الإلكتروني</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-gray-900 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  dir="ltr"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-secondary">كلمة المرور</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-gray-900 shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  dir="ltr"
                />
              </label>

              <button
                type="submit"
                disabled={isPending}
                className="flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3.5 text-base font-black text-white shadow-lg shadow-primary/30 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? 'جاري تسجيل الدخول...' : 'دخول إلى لوحة التحكم'}
              </button>
            </form>

            <div className="mt-6 rounded-3xl border border-primary/10 bg-primary/5 p-4 text-sm leading-7 text-gray-700">
              في حالة نجاح تسجيل الدخول سيتم تحويلك مباشرة إلى صفحة <span className="font-bold text-secondary">Dashboard</span>.
            </div>

            <div className="mt-6 text-center text-sm text-gray-600 md:text-right">
              <Link href="/" className="font-bold text-primary hover:text-primary-dark">
                العودة إلى الصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
