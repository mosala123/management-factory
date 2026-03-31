'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import {
  buildInventoryReport,
  type InventoryStatus,
  type ProductLike,
} from '@/lib/reporting';
import { formatCurrency, getCategoryLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterStatus = InventoryStatus | 'all';

const statusConfig = {
  out: {
    label: 'غير متوفر',
    badge: 'border-red-200 bg-red-50 text-red-700',
    bar: 'from-red-500 to-rose-500',
  },
  critical: {
    label: 'حرج',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    bar: 'from-orange-500 to-amber-500',
  },
  low: {
    label: 'منخفض',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    bar: 'from-amber-500 to-yellow-400',
  },
  good: {
    label: 'مستقر',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    bar: 'from-emerald-500 to-teal-400',
  },
} as const;

export default function InventoryPage() {
  const { products, isLoading, fetchProducts } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchProducts(1, 1000);
  }, [fetchProducts]);

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  );

  const filteredItems = useMemo(() => {
    return report.products
      .filter((item) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          getCategoryLabel(item.category || '').toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const priority = { out: 0, critical: 1, low: 2, good: 3 };
        return priority[a.status] - priority[b.status] || a.quantity - b.quantity;
      });
  }, [report.products, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500">جاري تجهيز صفحة المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#fffaf0_45%,_#f8fafc_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-amber-700">إدارة المخزون</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-secondary">
              صفحة بسيطة لكنها توضح كل حالة مهمة في المخزون
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              من هنا تقدر تعرف بسرعة ما الذي يحتاج تدخل، ما الذي وضعه مطمئن،
              وأي منتج يجب توجيهه للإنتاج أو التعديل.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/reports">Reports</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/charts">Charts</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/production">فتح الإنتاج</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/products/new">إضافة منتج جديد</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard title="يحتاج متابعة" value={report.summary.needAction.toLocaleString('ar-EG')} hint="منتجات أقل من المطلوب" tone="amber" />
        <InsightCard title="غير متوفر" value={report.summary.outOfStock.toLocaleString('ar-EG')} hint="منتجات نفدت بالكامل" tone="red" />
        <InsightCard title="إجمالي القطع" value={report.summary.totalUnits.toLocaleString('ar-EG')} hint="كل الكميات الحالية" tone="blue" />
        <InsightCard title="قيمة المخزون" value={formatCurrency(report.summary.totalValue)} hint={`آخر تحديث: ${report.latestUpdateLabel}`} tone="emerald" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] border-gray-100 shadow-sm">
          <CardHeader className="border-b bg-slate-50/70">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>قائمة المنتجات</CardTitle>
                <p className="mt-1 text-sm text-gray-500">
                  ابحث أو فلتر الحالة للوصول السريع لأي صنف
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث بالاسم أو الفئة..."
                  className="lg:w-72"
                />
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as FilterStatus)}
                >
                  <SelectTrigger className="w-full lg:w-44">
                    <SelectValue placeholder="فلتر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    <SelectItem value="out">غير متوفر</SelectItem>
                    <SelectItem value="critical">حرج</SelectItem>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="good">مستقر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredItems.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500">
                لا توجد منتجات مطابقة لبحثك الحالي.
              </div>
            ) : (
              <div className="divide-y">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="truncate text-base font-bold text-gray-900">{item.name}</p>
                        <Badge variant="outline" className={statusConfig[item.status].badge}>
                          {statusConfig[item.status].label}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {getCategoryLabel(item.category || '')}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                        <p>المتوفر: {item.quantity.toLocaleString('ar-EG')}</p>
                        <p>الحد الأدنى: {item.minStock.toLocaleString('ar-EG')}</p>
                        <p>القيمة: {formatCurrency(item.value)}</p>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${statusConfig[item.status].bar}`}
                          style={{ width: `${Math.max(item.stockPercentage, item.quantity > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.gap > 0 && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                          +{item.gap} مطلوب
                        </div>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/products/${item.id}/edit`}>تعديل</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-amber-100 shadow-sm">
            <CardHeader className="border-b bg-amber-50/70">
              <CardTitle>ما الذي تبدأ به اليوم؟</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 text-sm text-gray-600">
              <TipRow text="ابدأ أولًا بالمنتجات غير المتوفرة، لأنها توقف البيع مباشرة." />
              <TipRow text="بعدها راجع المنتجات الحرجة وحدد ماذا يدخل الإنتاج اليوم." />
              <TipRow text="أي منتج مستقر يمكن تأجيله، لكن سجّل التعديلات أولًا بأول." />
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-emerald-100 shadow-sm">
            <CardHeader className="border-b bg-emerald-50/70">
              <CardTitle>أكثر المنتجات استقرارًا</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {report.healthiest.slice(0, 4).map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <span className="text-sm font-bold text-emerald-700">
                      {item.stockPercentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${Math.max(item.stockPercentage, 10)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: 'amber' | 'red' | 'blue' | 'emerald';
}) {
  const toneMap = {
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    red: 'border-red-100 bg-red-50/70 text-red-700',
    blue: 'border-blue-100 bg-blue-50/70 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50/70 text-emerald-700',
  } as const;

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${toneMap[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs opacity-85">{hint}</p>
    </div>
  );
}

function TipRow({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      {text}
    </div>
  );
}
