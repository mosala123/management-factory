'use client'

// app/dashboard/charts/page.tsx
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { buildInventoryReport, type ProductLike } from '@/lib/reporting'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export default function ChartsPage() {
  const { products, isLoading, fetchProducts } = useProducts()
  useEffect(() => { fetchProducts(1, 1000) }, [fetchProducts])
  const report = useMemo(() => buildInventoryReport(products as ProductLike[]), [products])

  if (isLoading) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12"><div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-100 border-t-blue-500" /></div>
      <p className="text-sm font-medium text-slate-400">جاري رسم البيانات...</p>
    </div>
  )

  const total = report.summary.totalProducts
  const statusData = [
    { label: 'مستقر',     value: report.summary.good,         color: '#22c55e', light: 'bg-emerald-500', textCls: 'text-emerald-700', bgCls: 'bg-emerald-50' },
    { label: 'منخفض',    value: report.summary.low,           color: '#f59e0b', light: 'bg-amber-400',   textCls: 'text-amber-700',   bgCls: 'bg-amber-50'   },
    { label: 'حرج',       value: report.summary.critical,      color: '#f97316', light: 'bg-orange-500',  textCls: 'text-orange-700',  bgCls: 'bg-orange-50'  },
    { label: 'نفد تماماً', value: report.summary.outOfStock,   color: '#ef4444', light: 'bg-red-500',     textCls: 'text-red-700',     bgCls: 'bg-red-50'     },
  ]

  const maxCat = Math.max(...report.categoryBreakdown.map(c => c.value), 1)
  const maxShortage = Math.max(...report.topShortages.map(s => s.gap), 1)

  // حساب زوايا الدائرة
  let cumPct = 0
  const slices = statusData.filter(s => s.value > 0).map((s) => {
    const pct = total > 0 ? (s.value / total) * 100 : 0
    const start = cumPct
    cumPct += pct
    return { ...s, pct, start }
  })

  const describeArc = (pct: number, start: number) => {
    if (pct >= 100) return `M 0 -40 A 40 40 0 1 1 -0.001 -40 Z`
    const startRad = ((start - 90) * Math.PI) / 180
    const endRad = (((start + pct) - 90) * Math.PI) / 180
    const x1 = 40 * Math.cos(startRad)
    const y1 = 40 * Math.sin(startRad)
    const x2 = 40 * Math.cos(endRad)
    const y2 = 40 * Math.sin(endRad)
    const large = pct > 50 ? 1 : 0
    return `M 0 0 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-1" dir="rtl">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-sky-200/40 bg-gradient-to-bl from-sky-50/60 via-white to-blue-50/20 p-7 shadow-sm">
        <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/15 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-600">الرسوم البيانية</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">مؤشرات الأداء البصرية</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              صور بيانية واضحة تساعدك على فهم حالة المخزون دفعة واحدة — بدون أرقام معقدة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" asChild size="sm"><Link href="/dashboard/reports">التقارير</Link></Button>
            <Button asChild size="sm"><Link href="/dashboard/production">خطة الإنتاج</Link></Button>
          </div>
        </div>
      </div>

      {/* الصف الأول: دائرة الحالة + القيمة حسب الفئة */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* توزيع حالات المخزون */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-black text-slate-800">توزيع حالات المخزون</h2>
          <p className="mb-6 text-sm text-slate-400">نسبة كل حالة من إجمالي المنتجات</p>

          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* الدائرة */}
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg viewBox="-50 -50 100 100" className="h-full w-full -rotate-90">
                {slices.length === 0 ? (
                  <circle cx="0" cy="0" r="40" fill="#f1f5f9" />
                ) : (
                  slices.map((s) => (
                    <path key={s.label} d={describeArc(s.pct, s.start)} fill={s.color} />
                  ))
                )}
                <circle cx="0" cy="0" r="26" fill="white" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-2xl font-black text-slate-800">{total}</p>
                <p className="text-[11px] text-slate-400">منتج</p>
              </div>
            </div>

            {/* مفتاح الألوان */}
            <div className="w-full space-y-3">
              {statusData.map((s) => {
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
                return (
                  <div key={s.label}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.light}`} />
                        <span className="font-semibold text-slate-700">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{s.value}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${s.bgCls} ${s.textCls}`}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full transition-all duration-700 ${s.light}`} style={{ width: `${Math.max(pct, s.value > 0 ? 3 : 0)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* القيمة حسب الفئة */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-black text-slate-800">القيمة حسب الفئة</h2>
          <p className="mb-6 text-sm text-slate-400">أي فئة تمثل أكبر قيمة في المخزون</p>

          {report.categoryBreakdown.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-slate-400">لا توجد بيانات كافية</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.categoryBreakdown.map((cat) => {
                const widthPct = Math.max((cat.value / maxCat) * 100, 8)
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-700">{cat.label}</span>
                      <span className="font-black text-slate-800">{formatCurrency(cat.value)}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-xl bg-slate-100">
                      <div
                        className="flex h-full items-center rounded-xl bg-gradient-to-l from-cyan-500 to-blue-500 px-3 transition-all duration-700"
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-xs font-bold text-white">{cat.count} منتج</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* الصف الثاني: عجز المخزون + مؤشرات القيمة */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* أعلى عجز */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-black text-slate-800">عجز المخزون الأعلى</h2>
          <p className="mb-6 text-sm text-slate-400">المنتجات التي تحتاج أكبر كمية للوصول للحد الأدنى</p>

          {report.topShortages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <span className="mb-2 text-3xl">✅</span>
              <p className="font-bold text-emerald-700">لا يوجد عجز حالياً</p>
              <p className="mt-1 text-sm text-slate-400">المخزون في وضع جيد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.topShortages.map((item) => {
                const pct = Math.max((item.gap / maxShortage) * 100, 8)
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-semibold text-slate-700">{item.name}</span>
                      <span className="font-black text-amber-700">+{item.gap} مطلوب</span>
                    </div>
                    <div className="h-7 overflow-hidden rounded-xl bg-amber-50">
                      <div
                        className="flex h-full items-center rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 px-3 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      >
                        <span className="text-xs font-bold text-white">{item.gap}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">متوفر: {item.quantity} · أدنى: {item.minStock}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* مؤشرات القيمة والجاهزية */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-black text-slate-800">مؤشرات القيمة والجاهزية</h2>
          <p className="mb-6 text-sm text-slate-400">أهم الأرقام التي يحتاجها صاحب المصنع</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'إجمالي القطع',        value: report.summary.totalUnits.toLocaleString('ar-EG'),       bg: 'bg-emerald-50 border-emerald-200/50', val: 'text-emerald-700' },
              { label: 'قيمة المخزون',        value: formatCurrency(report.summary.totalValue),                bg: 'bg-sky-50     border-sky-200/50',     val: 'text-sky-700'     },
              { label: 'منتجات غير مستقرة',  value: report.summary.needAction.toString(),                     bg: 'bg-rose-50    border-rose-200/50',     val: 'text-rose-700'    },
              { label: 'متوسط سعر البيع',    value: formatCurrency(report.summary.averagePrice),              bg: 'bg-violet-50  border-violet-200/50',   val: 'text-violet-700'  },
            ].map((card) => (
              <div key={card.label} className={`rounded-2xl border p-4 ${card.bg}`}>
                <p className={`text-xs font-bold ${card.val}`}>{card.label}</p>
                <p className={`mt-2 text-xl font-black leading-tight ${card.val}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* مؤشر الجاهزية الكبير */}
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-bold text-slate-700">مؤشر الجاهزية العام</p>
              <span className="text-xl font-black text-slate-800">{report.summary.readinessRate}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-1000"
                style={{ width: `${Math.max(report.summary.readinessRate, 4)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {report.summary.readinessRate >= 80
                ? 'ممتاز — المخزون في وضع مستقر للغاية'
                : report.summary.readinessRate >= 60
                ? 'جيد — لكن يوجد منتجات تحتاج متابعة'
                : 'يحتاج تدخل — نسبة كبيرة من المنتجات غير مستقرة'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}