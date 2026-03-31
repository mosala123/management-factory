// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* 404 Animation */}
        <div className="mb-8 relative">
          <div className="text-8xl md:text-9xl font-black text-primary/20 select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl md:text-4xl font-black text-secondary mb-4">
          الصفحة غير موجودة
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
          عذراً، الرابط الذي تبحث عنه غير متاح حالياً أو تم تغييره.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            العودة للوحة التحكم
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all duration-300"
          >
            تسجيل الدخول
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}