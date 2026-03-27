// app/components/Footer.tsx
"use client";

import Link from "next/link";

const quickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/about", label: "عن المصنع" },
  { href: "/contact", label: "اتصل بنا" },
  { href: "/orders", label: "طلباتي" },
];

const legalLinks = [
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/terms", label: "الشروط والأحكام" },
];

const contactInfo = {
  phone: "+20 100 123 4567",
  email: "hello@ibdaa-factory.com",
  address: "المحلة الكبرى، المنطقة الصناعية",
  hours: "السبت إلى الخميس، 9 صباحًا حتى 6 مساءً",
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-black to-gray-900 text-white mt-auto">
      {/* القسم الرئيسي */}
      <div className="container-custom mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* معلومات المصنع */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-black">م</span>
              </div>
              <div>
                <div className="text-xl font-black">مصنع الإبداع</div>
                <div className="text-sm text-gray-400">
                  تصنيع ملابس ويونيفورم بجودة ثابتة
                </div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm">
              نجهز خطوط إنتاج مرنة للملابس الرجالي والحريمي والأطفال واليونيفورم،
              مع عينات أولية سريعة وتشطيب مناسب للمتاجر والشركات.
            </p>
            <div className="flex gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300"
              >
                ابدأ مشروعك
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 border border-gray-600 text-gray-300 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-primary hover:text-primary transition-all duration-300"
              >
                تصفح المنتجات
              </Link>
            </div>
          </div>

          {/* روابط سريعة */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative">
              روابط سريعة
              <span className="absolute -bottom-2 right-0 w-12 h-0.5 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <svg
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* قانوني */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative">
              روابط قانونية
              <span className="absolute -bottom-2 right-0 w-12 h-0.5 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <svg
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* بيانات التواصل */}
          <div>
            <h3 className="text-lg font-bold mb-6 relative">
              بيانات التواصل
              <span className="absolute -bottom-2 right-0 w-12 h-0.5 bg-primary rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <svg className="w-5 h-5 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${contactInfo.phone}`} className="text-gray-400 hover:text-primary transition-colors">
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <svg className="w-5 h-5 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${contactInfo.email}`} className="text-gray-400 hover:text-primary transition-colors">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400">{contactInfo.address}</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400">{contactInfo.hours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* حقوق الملكية */}
      <div className="border-t border-gray-800">
        <div className="container-custom mx-auto py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center">
            <p className="text-gray-500 text-sm">
              جميع الحقوق محفوظة © {currentYear} مصنع الإبداع للملابس
            </p>
            <div className="flex gap-4">
              <Link href="/privacy" className="text-gray-500 text-sm hover:text-primary transition-colors">
                سياسة الخصوصية
              </Link>
              <span className="text-gray-600">|</span>
              <Link href="/terms" className="text-gray-500 text-sm hover:text-primary transition-colors">
                الشروط والأحكام
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}