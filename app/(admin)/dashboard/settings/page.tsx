'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { buildInventoryReport, type ProductLike } from '@/lib/reporting';
import { formatCurrency } from '@/lib/utils';

const sections = [
  {
    title: 'المخزون',
    description: 'راجع حالة الكميات واعرف ما الذي يحتاج تدخل سريع.',
    href: '/dashboard/inventory',
    cta: 'افتح المخزون',
    tone: 'amber',
  },
  {
    title: 'الإنتاج',
    description: 'تابع خطة التشغيل اليومية والأصناف المقترحة للتصنيع.',
    href: '/dashboard/production',
    cta: 'افتح الإنتاج',
    tone: 'violet',
  },
  {
    title: 'المنتجات',
    description: 'عدل البيانات، الأسعار، والصور الخاصة بكل منتج.',
    href: '/dashboard/products',
    cta: 'افتح المنتجات',
    tone: 'emerald',
  },
  {
    title: 'Reports',
    description: 'ملخصات إدارية جاهزة وسريعة الفهم لصاحب المصنع.',
    href: '/dashboard/reports',
    cta: 'فتح Reports',
    tone: 'cyan',
  },
  {
    title: 'Charts',
    description: 'رسوم بيانية مبسطة لمتابعة الأداء وحالة المخزون بصريًا.',
    href: '/dashboard/charts',
    cta: 'فتح Charts',
    tone: 'blue',
  },
];

export default function SettingsPage() {
  const { products, isLoading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts(1, 1000);
  }, [fetchProducts]);

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.12),_transparent_34%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_62%,_#fefce8_100%)] p-6 shadow-sm">
        <p className="text-sm font-bold text-slate-700">مركز التحكم السريع</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary">
          صفحة إعدادات مبسطة وواضحة لصاحب المصنع
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
          بدل ما تكون الصفحة مجرد مكان فارغ، أصبحت بوابة توضح حالة النظام الحالية
          وتوصلك فورًا للأجزاء التي تحتاج قرار أو متابعة أو تعديل.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SmallMetric title="جاهزية المخزون" value={`${report.summary.readinessRate}%`} hint="نسبة المنتجات المستقرة" />
        <SmallMetric title="تنبيهات نشطة" value={report.summary.needAction.toLocaleString('ar-EG')} hint="منتجات تحتاج تدخل" />
        <SmallMetric title="قيمة المخزون" value={isLoading ? '...' : formatCurrency(report.summary.totalValue)} hint="قيمة البيع الحالية" />
        <SmallMetric title="آخر تحديث" value={isLoading ? '...' : report.latestUpdateLabel} hint="آخر توقيت مسجل" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <SectionCard
            key={section.href}
            title={section.title}
            description={section.description}
            href={section.href}
            cta={section.cta}
            tone={section.tone}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-secondary">ماذا يراجع صاحب المصنع عادة؟</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <Checklist text="المنتجات غير المتوفرة أو الحرجة." />
            <Checklist text="خطة الإنتاج لليوم والكمية المقترحة." />
            <Checklist text="قيمة المخزون الحالية وأعلى الفئات تأثيرًا." />
            <Checklist text="هل هناك منتج يحتاج تعديل سعر أو بيانات؟" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-secondary">روابط يفضل الوصول لها بسرعة</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <QuickAction href="/dashboard/products/new" title="إضافة منتج" subtitle="سجل صنف جديد" />
            <QuickAction href="/dashboard/inventory" title="مراجعة المخزون" subtitle="اعرف النواقص فورًا" />
            <QuickAction href="/dashboard/production" title="تخطيط الإنتاج" subtitle="ترتيب التشغيل اليومي" />
            <QuickAction href="/dashboard/reports" title="Reports" subtitle="ملخص إداري سريع" />
          </div>
        </div>
      </section>
    </div>
  );
}

function SmallMetric({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-secondary">{value}</p>
      <p className="mt-2 text-xs text-gray-500">{hint}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  href,
  cta,
  tone,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: string;
}) {
  const toneMap: Record<string, string> = {
    amber: 'border-amber-200 bg-amber-50/60',
    violet: 'border-violet-200 bg-violet-50/60',
    emerald: 'border-emerald-200 bg-emerald-50/60',
    cyan: 'border-cyan-200 bg-cyan-50/60',
    blue: 'border-blue-200 bg-blue-50/60',
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${toneMap[tone]}`}>
      <h3 className="text-lg font-black text-secondary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}

function Checklist({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-slate-50/60 px-4 py-3 shadow-sm">
      {text}
    </div>
  );
}

function QuickAction({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
    >
      <p className="font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </Link>
  );
}
