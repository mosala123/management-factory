'use client';

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { buildInventoryReport, type ProductLike } from "@/lib/reporting";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-secondary">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export default function ReportsPage() {
  const { products, isLoading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts(1, 1000);
  }, [fetchProducts]);

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-gray-500">جاري تجهيز التقارير التلقائية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_58%,_#ecfeff_100%)] p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <SectionHeader
          title="التقارير"
          subtitle="ملخصات تلقائية لحالة المخزون والفئات والمنتجات الأكثر أهمية."
        />

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/charts">عرض الرسوم البيانية</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/inventory">مراجعة المخزون</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">جاهزية المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-emerald-700">{report.summary.readinessRate}%</p>
            <p className="mt-2 text-sm text-emerald-700/80">
              {report.summary.good} منتج في وضع مستقر
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">منتجات تحتاج تدخل</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-amber-700">{report.summary.needAction}</p>
            <p className="mt-2 text-sm text-amber-700/80">
              منخفض: {report.summary.low} | حرج: {report.summary.critical} | غير متوفر: {report.summary.outOfStock}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي قيمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">{formatCurrency(report.summary.totalValue)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              متوسط سعر البيع: {formatCurrency(report.summary.averagePrice)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">آخر تحديث مرصود</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-secondary">{report.latestUpdateLabel}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              متوسط القطع لكل منتج: {report.summary.averageStock.toLocaleString("ar-EG")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-slate-50/80">
            <CardTitle>ملخص الفئات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {report.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد بيانات فئات متاحة حاليًا.</p>
            ) : (
              report.categoryBreakdown.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{category.label}</p>
                      <p className="text-sm text-gray-500">
                        {category.count} منتج | {category.quantity.toLocaleString("ar-EG")} قطعة
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-secondary">{formatCurrency(category.value)}</p>
                      <p className="text-sm text-gray-500">{category.share}% من القيمة</p>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500"
                      style={{ width: `${Math.max(category.share, 6)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-rose-50/70">
            <CardTitle>أولوية التصنيع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {report.topShortages.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                المخزون في وضع جيد حاليًا، ولا توجد منتجات بحاجة عاجلة لإعادة تصنيع.
              </div>
            ) : (
              report.topShortages.map((item, index) => (
                <div key={item.id} className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {index + 1}. {item.name}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {getCategoryLabel(item.category || "")}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                      +{item.gap} مطلوب
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span>المتوفر: {item.quantity}</span>
                    <span>الحد الأدنى: {item.minStock}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-emerald-50/60">
            <CardTitle>أعلى المنتجات قيمة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {report.topValue.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity.toLocaleString("ar-EG")} قطعة
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-700">{formatCurrency(item.value)}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(item.price)} للوحدة</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-sky-50/60">
            <CardTitle>أفضل المنتجات استقرارًا</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {report.healthiest.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="truncate font-semibold text-gray-900">{item.name}</p>
                    <span className="text-sm font-medium text-sky-700">{item.stockPercentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${Math.max(item.stockPercentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
