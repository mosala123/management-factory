// app/signup/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { resolveUserRole } from "@/lib/auth-role";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

// ─── مكون الـ Input ───────────────────────────────────────────────────────────
const FormInput = ({
  label,
  icon,
  error,
  required = false,
  hint,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-bold text-gray-700 mb-2">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <div className="relative">
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        {icon}
      </span>
      {children}
    </div>
    {hint && !error && <p className="text-gray-400 text-xs mt-1.5 mr-1">{hint}</p>}
    {error && (
      <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 mr-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

// ─── الصفحة ───────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const accountRole = resolveUserRole(formData.email, null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim())
      newErrors.name = "الاسم الكامل مطلوب";
    else if (formData.name.trim().length < 3)
      newErrors.name = "الاسم يجب أن يكون 3 أحرف على الأقل";

    if (!formData.email.trim())
      newErrors.email = "البريد الإلكتروني مطلوب";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "صيغة البريد الإلكتروني غير صحيحة";

    if (!formData.password)
      newErrors.password = "كلمة المرور مطلوبة";
    else if (formData.password.length < 6)
      newErrors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "كلمة المرور غير متطابقة";

    if (!formData.agreeTerms)
      newErrors.agreeTerms = "يجب الموافقة على الشروط والأحكام للمتابعة";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    // ── 1. إنشاء الحساب في Supabase Auth ──────────────────────────────────────
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // بنبعت البيانات في الـ metadata عشان نحفظها لو الـ insert اشتغل في الـ trigger
        data: {
          name: formData.name,
          phone: formData.phone || null,
          role: accountRole,
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setErrors({ email: "هذا البريد الإلكتروني مسجل بالفعل، جرب تسجيل الدخول" });
      } else {
        toast.error("حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى");
      }
      setIsLoading(false);
      return;
    }

    if (signUpData.user) {
      // ── 2. upsert في profiles (أكثر أماناً من insert) ─────────────────────
      //    لو عندك RLS: تأكد إن في policy تسمح للـ authenticated user يكتب لـ id = auth.uid()
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: signUpData.user.id,
            email: formData.email,
            name: formData.name.trim(),
            phone: formData.phone.trim() || null,
            role: accountRole,
          },
          { onConflict: "id" }
        );

      if (profileError) {
        // ── لو فشل الـ upsert — ممكن يكون RLS ── بنطلع تحذير بس مش error فادح
        console.warn("Profile upsert failed:", profileError.message);
        // الـ user اتعمل في Auth بنجاح، المشكلة في الـ profiles table بس
        // ممكن تشتغل عليها لاحقاً عن طريق Supabase trigger أو بعد login
        toast.success("تم إنشاء الحساب! يمكنك تسجيل الدخول الآن");
      } else {
        toast.success("تم إنشاء الحساب بنجاح! سجل دخولك الآن 🎉");
      }

      router.push("/login?registered=true");
    }

    setIsLoading(false);
  };

  // ─── أيقونات ────────────────────────────────────────────────────────────────
  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );

  const inputBase = (hasError: boolean) =>
    `w-full pr-11 pl-4 py-3 rounded-xl border text-sm outline-none transition-all bg-gray-50 focus:bg-white ${
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/15"
        : "border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4 relative overflow-hidden">
      {/* خلفية */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-primary/4 to-secondary/4 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-100">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-3xl font-black">م</span>
            </div>
            <h1 className="text-2xl font-black text-secondary">إنشاء حساب جديد</h1>
            <p className="text-gray-400 text-sm mt-1.5">
              انضم إلينا لمتابعة طلباتك والحصول على عروض حصرية
            </p>
          </div>

          <div className="space-y-4">

            {/* الاسم */}
            <FormInput
              label="الاسم الكامل"
              required
              error={errors.name}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            >
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputBase(!!errors.name)}
                placeholder="أدخل اسمك الكامل"
                autoComplete="name"
              />
            </FormInput>

            {/* البريد الإلكتروني */}
            <FormInput
              label="البريد الإلكتروني"
              required
              error={errors.email}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputBase(!!errors.email)}
                placeholder="أدخل بريدك الإلكتروني"
                autoComplete="email"
              />
            </FormInput>

            {/* رقم الهاتف */}
            <FormInput
              label="رقم الهاتف"
              hint="اختياري — للتواصل معك بخصوص طلباتك"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            >
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputBase(false)}
                placeholder="مثال: 01012345678"
                autoComplete="tel"
              />
            </FormInput>

            {/* كلمة المرور */}
            <FormInput
              label="كلمة المرور"
              required
              error={errors.password}
              hint={!errors.password ? "6 أحرف على الأقل" : undefined}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6-4h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4V8a4 4 0 00-8 0v3h8z" />
                </svg>
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`${inputBase(!!errors.password)} pl-11`}
                placeholder="أدخل كلمة المرور"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon open={showPassword} />
              </button>
            </FormInput>

            {/* تأكيد كلمة المرور */}
            <FormInput
              label="تأكيد كلمة المرور"
              required
              error={errors.confirmPassword}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            >
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${inputBase(!!errors.confirmPassword)} pl-11`}
                placeholder="أعد كتابة كلمة المرور"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </FormInput>

            {/* الشروط والأحكام */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    errors.agreeTerms
                      ? "border-red-400"
                      : formData.agreeTerms
                      ? "bg-primary border-primary"
                      : "border-gray-300 group-hover:border-primary/50"
                  }`}>
                    {formData.agreeTerms && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600 leading-relaxed select-none">
                  أوافق على{" "}
                  <Link href="/terms" className="text-primary font-bold hover:underline">
                    الشروط والأحكام
                  </Link>
                  {" "}و{" "}
                  <Link href="/privacy" className="text-primary font-bold hover:underline">
                    سياسة الخصوصية
                  </Link>
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 mr-7">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.agreeTerms}
                </p>
              )}
            </div>

            {/* زر الإنشاء */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-light to-primary-dark text-white py-3.5 rounded-xl font-black text-sm hover:shadow-[0_8px_24px_rgba(196,122,58,0.4)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري إنشاء الحساب...
                </span>
              ) : (
                "إنشاء الحساب"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
            <p className="text-gray-500 text-sm">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-primary font-black hover:text-primary-dark transition-colors">
                تسجيل الدخول
              </Link>
            </p>
            <Link href="/" className="inline-flex items-center gap-1.5 text-gray-400 text-xs hover:text-primary transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          بإنشاء حساب أنت توافق على الشروط والأحكام وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
}
