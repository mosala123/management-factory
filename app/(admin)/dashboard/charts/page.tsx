'use client';

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { buildInventoryReport, type ProductLike } from "@/lib/reporting";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusPalette = {
  good: "from-emerald-500 to-teal-400",
  low: "from-yellow-500 to-amber-400",
  critical: "from-orange-500 to-amber-500",
  out: "from-rose-500 to-red-500",
} as const;

export default function ChartsPage() {
  const { products, isLoading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts(1, 1000);
  }, [fetchProducts]);

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  );

  const statusData = [
    { key: "good", label: "مستقر", value: report.summary.good },
    { key: "low", label: "منخفض", value: report.summary.low },
    { key: "critical", label: "حرج", value: report.summary.critical },
    { key: "out", label: "غير متوفر", value: report.summary.outOfStock },
  ] as const;

  const maxCategoryValue = Math.max(...report.categoryBreakdown.map((item) => item.value), 1);
  const maxShortage = Math.max(...report.topShortages.map((item) => item.gap), 1);

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500">جاري رسم البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-sky-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_45%,_#ecfeff_100%)] p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">الرسوم البيانية</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            لوحة بصرية تلقائية لحالة المخزون والقيمة والتصنيع المقترح.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/reports">العودة للتقارير</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/production">خطة الإنتاج</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-slate-50/70">
            <CardTitle>توزيع حالات المخزون</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
              <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#10b981_0_55%,#fbbf24_55%_75%,#f97316_75%_90%,#ef4444_90%_100%)] p-6 shadow-inner">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center">
                  <p className="text-sm text-gray-500">إجمالي المنتجات</p>
                  <p className="text-4xl font-bold text-secondary">{report.summary.totalProducts}</p>
                </div>
              </div>

              <div className="space-y-4">
                {statusData.map((item) => (
                  <div key={item.key} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-900">{item.label}</span>
                      <span className="text-gray-500">{item.value} منتج</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${statusPalette[item.key]}`}
                        style={{
                          width: `${report.summary.totalProducts > 0 ? Math.max((item.value / report.summary.totalProducts) * 100, item.value > 0 ? 8 : 0) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-cyan-50/60">
            <CardTitle>القيمة حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-5">
              {report.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد بيانات كافية لعرض الرسم.</p>
              ) : (
                report.categoryBreakdown.map((category) => (
                  <div key={category.key} className="grid gap-2 md:grid-cols-[140px_1fr_120px] md:items-center">
                    <p className="font-semibold text-gray-900">{category.label}</p>
                    <div className="h-10 overflow-hidden rounded-2xl bg-slate-100">
                      <div
                        className="flex h-full items-center rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-4 text-sm font-semibold text-white"
                        style={{ width: `${Math.max((category.value / maxCategoryValue) * 100, 16)}%` }}
                      >
                        {category.count} منتج
                      </div>
                    </div>
                    <p className="text-right text-sm font-semibold text-secondary">
                      {formatCurrency(category.value)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-amber-50/70">
            <CardTitle>عجز المخزون الأعلى</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {report.topShortages.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  لا يوجد عجز حالي في المخزون.
                </div>
              ) : (
                report.topShortages.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">موجود {item.quantity} من أصل {item.minStock}</p>
                      </div>
                      <span className="text-sm font-semibold text-amber-700">+{item.gap}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-amber-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${Math.max((item.gap / maxShortage) * 100, 10)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-emerald-50/70">
            <CardTitle>القيمة مقابل الجاهزية</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-700">إجمالي القطع</p>
                <p className="mt-3 text-4xl font-bold text-emerald-700">
                  {report.summary.totalUnits.toLocaleString("ar-EG")}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
                <p className="text-sm font-medium text-sky-700">إجمالي قيمة المخزون</p>
                <p className="mt-3 text-2xl font-bold text-sky-700">
                  {formatCurrency(report.summary.totalValue)}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
                <p className="text-sm font-medium text-rose-700">منتجات غير مستقرة</p>
                <p className="mt-3 text-4xl font-bold text-rose-700">{report.summary.needAction}</p>
              </div>
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                <p className="text-sm font-medium text-violet-700">متوسط سعر البيع</p>
                <p className="mt-3 text-2xl font-bold text-violet-700">
                  {formatCurrency(report.summary.averagePrice)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-100 bg-[linear-gradient(135deg,_#f8fafc_0%,_#ffffff_100%)] p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-gray-900">مؤشر الجاهزية العام</p>
                <span className="text-sm font-bold text-secondary">{report.summary.readinessRate}%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500"
                  style={{ width: `${Math.max(report.summary.readinessRate, 6)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-gray-500">
                كلما ارتفع المؤشر كان توازن المخزون أفضل واستقرار التشغيل أعلى.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
