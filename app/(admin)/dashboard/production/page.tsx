'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { buildInventoryReport, type ProductLike } from '@/lib/reporting';
import { getCategoryLabel } from '@/lib/utils';

type Priority = 'critical' | 'high' | 'medium';

type ProductionItem = {
  id: string;
  name: string;
  quantity: number;
  minStock: number;
  shortage: number;
  recommendedBatch: number;
  category?: string;
  priority: Priority;
};

const priorityConfig = {
  critical: {
    label: 'عاجل جدًا',
    card: 'border-red-200 bg-red-50/70 text-red-700',
    progress: 'from-red-500 to-rose-500',
  },
  high: {
    label: 'عاجل',
    card: 'border-orange-200 bg-orange-50/70 text-orange-700',
    progress: 'from-orange-500 to-amber-500',
  },
  medium: {
    label: 'مطلوب',
    card: 'border-amber-200 bg-amber-50/70 text-amber-700',
    progress: 'from-amber-500 to-yellow-400',
  },
} as const;

export default function ProductionPage() {
  const { products, isLoading, fetchProducts } = useProducts();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts(1, 1000);
  }, [fetchProducts]);

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  );

  const productionQueue = useMemo<ProductionItem[]>(() => {
    return report.products
      .filter((product) => product.gap > 0)
      .map((product) => {
        let recommendedBatch = Math.max(product.gap, Math.ceil(product.minStock * 0.5));
        let priority: Priority = 'medium';

        if (product.quantity === 0) {
          recommendedBatch = Math.max(product.minStock, Math.ceil(product.minStock * 1.5));
          priority = 'critical';
        } else if (product.gap >= product.minStock * 0.7) {
          recommendedBatch = Math.max(product.gap, Math.ceil(product.minStock * 0.8));
          priority = 'high';
        }

        return {
          id: product.id,
          name: product.name,
          quantity: product.quantity,
          minStock: product.minStock,
          shortage: product.gap,
          recommendedBatch,
          category: product.category,
          priority,
        };
      })
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2 };
        return order[a.priority] - order[b.priority] || b.shortage - a.shortage;
      });
  }, [report.products]);

  const totals = useMemo(() => {
    return productionQueue.reduce(
      (acc, item) => {
        acc.products += 1;
        acc.units += item.recommendedBatch;
        if (item.priority === 'critical') acc.critical += 1;
        if (item.priority === 'high') acc.high += 1;
        if (item.quantity === 0) acc.stopped += 1;
        return acc;
      },
      { products: 0, units: 0, critical: 0, high: 0, stopped: 0 }
    );
  }, [productionQueue]);

  const handleSelectItem = (id: string) => {
    setSelectedItems((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCompleteSelected = () => {
    alert(`تم تجهيز ${selectedItems.size} منتج لأوامر التشغيل.`);
    setSelectedItems(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500">جاري تجهيز خطة الإنتاج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(244,114,182,0.16),_transparent_33%),linear-gradient(135deg,_#ffffff_0%,_#faf5ff_45%,_#f8fafc_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-violet-700">خطة الإنتاج</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary">
              صفحة توضح لصاحب المصنع ماذا ينتج الآن وماذا يمكن تأجيله
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              كل بطاقة هنا مبنية تلقائيًا من حالة المخزون الحالية، بحيث تتحول
              الفجوة إلى توصية تشغيل مفهومة وسريعة التنفيذ.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/inventory"
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 shadow-sm transition hover:bg-amber-100"
            >
              راجع المخزون
            </Link>
            <Link
              href="/dashboard/reports"
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Reports
            </Link>
            <Link
              href="/dashboard/charts"
              className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-700 shadow-sm transition hover:bg-cyan-100"
            >
              Charts
            </Link>
            {selectedItems.size > 0 && (
              <button
                onClick={handleCompleteSelected}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                اعتماد المحدد ({selectedItems.size})
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="أصناف تحتاج إنتاج" value={totals.products.toLocaleString('ar-EG')} hint="كل الأصناف الناقصة" tone="violet" />
        <MetricCard title="كمية مقترحة" value={totals.units.toLocaleString('ar-EG')} hint="إجمالي تشغيل مقترح" tone="amber" />
        <MetricCard title="متوقف تمامًا" value={totals.stopped.toLocaleString('ar-EG')} hint="أعلى أولوية للتشغيل" tone="red" />
        <MetricCard title="جاهزية المخزون" value={`${report.summary.readinessRate}%`} hint="بعد معالجة الأولويات" tone="blue" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-slate-50/70 px-6 py-5">
            <h2 className="text-lg font-black text-secondary">أولويات التشغيل</h2>
            <p className="mt-1 text-sm text-gray-500">
              مرتبة حسب الحاجة الفعلية وتأثيرها على التشغيل اليومي
            </p>
          </div>

          {productionQueue.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-lg font-bold text-emerald-700">كل شيء تحت السيطرة</p>
              <p className="mt-2 text-sm text-gray-500">
                لا توجد منتجات تحتاج تصنيع في الوقت الحالي.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {productionQueue.map((item, index) => {
                const config = priorityConfig[item.priority];
                const progress = Math.max(
                  Math.round((item.quantity / Math.max(item.minStock, 1)) * 100),
                  item.quantity > 0 ? 6 : 0
                );
                const isSelected = selectedItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`px-6 py-5 transition ${isSelected ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectItem(item.id)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600">
                              {index + 1}
                            </span>
                            <h3 className="text-lg font-black text-gray-900">{item.name}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${config.card}`}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getCategoryLabel(item.category || '')}
                            </span>
                          </div>

                          <div className="grid gap-2 text-sm text-gray-600 sm:grid-cols-4">
                            <p>المتوفر: {item.quantity}</p>
                            <p>الحد الأدنى: {item.minStock}</p>
                            <p>العجز: {item.shortage}</p>
                            <p>التشغيل المقترح: {item.recommendedBatch}</p>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${config.progress}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Link
                          href={`/dashboard/products/${item.id}/edit`}
                          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          تعديل المنتج
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-violet-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-secondary">كيف تستخدم الصفحة؟</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <GuideRow text="ابدأ بالعناصر المصنفة عاجل جدًا لأنها توقف البيع أو التسليم." />
              <GuideRow text="اختَر أكثر من منتج لو ستنفذ أمر تشغيل واحد مجمع." />
              <GuideRow text="بعد انتهاء التشغيل عدّل الكميات من صفحة المنتج أو المخزون." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-secondary">روابط سريعة</h2>
            <div className="mt-4 grid gap-3">
              <FastLink href="/dashboard/inventory" title="العودة للمخزون" subtitle="راجع الكميات الحالية" />
              <FastLink href="/dashboard/reports" title="فتح Reports" subtitle="ملخص إداري سريع" />
              <FastLink href="/dashboard/charts" title="فتح Charts" subtitle="مؤشرات ورسوم أوضح" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: 'violet' | 'amber' | 'red' | 'blue';
}) {
  const toneMap = {
    violet: 'border-violet-100 bg-violet-50/70 text-violet-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    red: 'border-red-100 bg-red-50/70 text-red-700',
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
  } as const;

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs opacity-85">{hint}</p>
    </div>
  );
}

function GuideRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-slate-50/70 px-4 py-3 shadow-sm">
      {text}
    </div>
  );
}

function FastLink({
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
