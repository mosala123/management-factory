'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import {
  buildActivityFeed,
  buildInventoryReport,
  type ProductLike,
} from '@/lib/reporting';
import { formatCurrency, getCategoryLabel } from '@/lib/utils';

export default function AdminDashboard() {
  const { products, isLoading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts(1, 1000);
  }, [fetchProducts]);

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  );
  const activityFeed = useMemo(() => buildActivityFeed(report), [report]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-gray-500">جاري تحميل لوحة المصنع...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_34%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_58%,_#eefbf6_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-sky-700">لوحة تشغيل يومية</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary">
              كل ما يحتاجه صاحب المصنع في مكان واحد
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              الصفحة دي بتعطيك حالة المخزون، أهم التنبيهات، أفضل المنتجات، وأسرع
              الطرق للوصول للمهام اليومية بدون لف كثير داخل النظام.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/inventory"
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 shadow-sm transition hover:bg-amber-100"
            >
              {report.summary.needAction} منتجات تحتاج متابعة
            </Link>
            <Link
              href="/dashboard/production"
              className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-violet-100"
            >
              افتح خطة الإنتاج اليومية
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="إجمالي المنتجات" value={report.summary.totalProducts.toLocaleString('ar-EG')} hint="عدد الأصناف المسجلة" tone="blue" />
        <SummaryCard label="إجمالي القطع" value={report.summary.totalUnits.toLocaleString('ar-EG')} hint="كل القطع المتوفرة حاليًا" tone="emerald" />
        <SummaryCard label="قيمة المخزون" value={formatCurrency(report.summary.totalValue)} hint="القيمة الحالية للبيع" tone="amber" />
        <SummaryCard label="جاهزية التشغيل" value={`${report.summary.readinessRate}%`} hint={`${report.summary.good} منتج مستقر`} tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-secondary">ما الذي يحتاج قرار الآن؟</h2>
              <p className="text-sm text-gray-500">أهم التنبيهات التي تستحق الانتباه أولًا</p>
            </div>
            <Link href="/dashboard/reports" className="text-sm font-bold text-primary">
              كل التقارير
            </Link>
          </div>

          <div className="space-y-3">
            {activityFeed.map((event) => (
              <Link
                key={event.id}
                href={event.href}
                className="block rounded-3xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{event.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 shadow-sm">
                    {event.meta}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-black text-secondary">توزيع الفئات</h2>
            <p className="text-sm text-gray-500">يعرفك بسرعة أين تتركز قيمة المخزون</p>
          </div>

          <div className="space-y-4">
            {report.categoryBreakdown.map((category) => (
              <div key={category.key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{category.label}</p>
                    <p className="text-xs text-gray-500">
                      {category.count} منتج | {category.quantity.toLocaleString('ar-EG')} قطعة
                    </p>
                  </div>
                  <p className="text-sm font-bold text-secondary">{category.share}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"
                    style={{ width: `${Math.max(category.share, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-amber-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-secondary">المنتجات التي تحتاج تصنيع</h2>
              <p className="text-sm text-gray-500">أولوية اليوم بناء على فجوة المخزون</p>
            </div>
            <Link href="/dashboard/production" className="text-sm font-bold text-amber-700">
              افتح الإنتاج
            </Link>
          </div>

          <div className="space-y-3">
            {report.topShortages.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-3xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{getCategoryLabel(item.category || '')}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-amber-700">+{item.gap}</p>
                    <p className="text-xs text-gray-500">مطلوب</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-secondary">أفضل المنتجات استقرارًا</h2>
              <p className="text-sm text-gray-500">الأصناف التي وضعها مطمئن ويمكن الاعتماد عليها</p>
            </div>
            <Link href="/dashboard/charts" className="text-sm font-bold text-emerald-700">
              عرض الرسوم
            </Link>
          </div>

          <div className="space-y-3">
            {report.healthiest.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <span className="text-sm font-bold text-emerald-700">{item.stockPercentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.max(item.stockPercentage, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <QuickLink href="/dashboard/products/new" title="إضافة منتج" subtitle="سجل صنف جديد بسرعة" tone="blue" />
        <QuickLink href="/dashboard/inventory" title="المخزون" subtitle="راجع الكميات الحالية" tone="amber" />
        <QuickLink href="/dashboard/products" title="المنتجات" subtitle="أسعار وصور وبيانات" tone="emerald" />
        <QuickLink href="/dashboard/production" title="الإنتاج" subtitle="رتب الأولويات اليومية" tone="violet" />
        <QuickLink href="/dashboard/reports" title="Reports" subtitle="ملخصات جاهزة للإدارة" tone="cyan" />
        <QuickLink href="/dashboard/settings" title="الإعدادات" subtitle="مركز وصول سريع" tone="slate" />
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const toneMap = {
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    rose: 'border-rose-100 bg-rose-50/70 text-rose-700',
  } as const;

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs opacity-80">{hint}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  subtitle,
  tone,
}: {
  href: string;
  title: string;
  subtitle: string;
  tone: 'blue' | 'amber' | 'emerald' | 'violet' | 'cyan' | 'slate';
}) {
  const toneMap = {
    blue: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
    amber: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
    emerald: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100',
    violet: 'border-violet-200 bg-violet-50 hover:bg-violet-100',
    cyan: 'border-cyan-200 bg-cyan-50 hover:bg-cyan-100',
    slate: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
  } as const;

  return (
    <Link
      href={href}
      className={`rounded-[1.5rem] border p-4 text-center shadow-sm transition ${toneMap[tone]}`}
    >
      <h3 className="text-sm font-black text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-600">{subtitle}</p>
    </Link>
  );
}
