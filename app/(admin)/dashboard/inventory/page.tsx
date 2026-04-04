'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { buildInventoryReport, type InventoryStatus, type ProductLike } from '@/lib/reporting'
import { formatCurrency, getCategoryLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
export const dynamic = 'force-dynamic'
type FilterStatus = InventoryStatus | 'all'

const STATUS = {
  out:      { label: 'نفد',     badgeCls: 'border-red-200    bg-red-50    text-red-700',    barCls: 'bg-red-500',    rowCls: 'border-r-[3px] border-r-red-400    bg-red-50/20',    dotCls: 'bg-red-500    animate-pulse', priority: 0 },
  critical: { label: 'حرج',    badgeCls: 'border-orange-200 bg-orange-50 text-orange-700', barCls: 'bg-orange-500', rowCls: 'border-r-[3px] border-r-orange-400 bg-orange-50/15', dotCls: 'bg-orange-500',              priority: 1 },
  low:      { label: 'منخفض',  badgeCls: 'border-amber-200  bg-amber-50  text-amber-700',  barCls: 'bg-amber-400',  rowCls: 'border-r-[3px] border-r-amber-400  bg-amber-50/15',  dotCls: 'bg-amber-400',               priority: 2 },
  good:     { label: 'مستقر', badgeCls: 'border-emerald-200 bg-emerald-50 text-emerald-700', barCls: 'bg-emerald-500', rowCls: '', dotCls: 'bg-emerald-500', priority: 3 },
} as const

const FILTER_TABS: { value: FilterStatus; label: string; color: string }[] = [
  { value: 'all',      label: 'الكل',    color: 'bg-slate-700  text-white' },
  { value: 'out',      label: 'نفد',     color: 'bg-red-500    text-white' },
  { value: 'critical', label: 'حرج',    color: 'bg-orange-500 text-white' },
  { value: 'low',      label: 'منخفض',  color: 'bg-amber-400  text-white' },
  { value: 'good',     label: 'مستقر', color: 'bg-emerald-500 text-white' },
]

export default function InventoryPage() {
  const { products, isLoading, fetchProducts } = useProducts()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  useEffect(() => { fetchProducts(1, 1000) }, [fetchProducts])

  const report = useMemo(() => buildInventoryReport(products as ProductLike[]), [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return report.products
      .filter((item) => {
        const matchSearch = !q || item.name.toLowerCase().includes(q) || getCategoryLabel(item.category ?? '').toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || item.status === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => STATUS[a.status].priority - STATUS[b.status].priority || a.quantity - b.quantity)
  }, [report.products, search, statusFilter])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-100 border-t-amber-500" />
        </div>
        <p className="text-sm font-medium text-slate-400">جاري تحميل بيانات المخزون...</p>
      </div>
    )
  }

  const counts = {
    all:      report.products.length,
    out:      report.summary.outOfStock,
    critical: report.summary.critical,
    low:      report.summary.low,
    good:     report.summary.good,
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-1" dir="rtl">

      {/* ═══ Hero ═══ */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/40 bg-gradient-to-bl from-amber-50/80 via-white to-orange-50/30 p-7 shadow-sm">
        <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/15 blur-2xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">إدارة المخزون</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              ما الذي يحتاج تدخلاً الآن؟
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              المنتجات مرتبة تلقائياً حسب الأولوية — نفد أولاً، ثم حرج، ثم منخفض.
              أي منتج يظهر في الأعلى يعني أنه يحتاج قراراً اليوم.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" asChild size="sm"><Link href="/dashboard/reports">التقارير</Link></Button>
            <Button variant="outline" asChild size="sm"><Link href="/dashboard/production">خطة الإنتاج</Link></Button>
            <Button asChild size="sm"><Link href="/dashboard/products/new">+ إضافة منتج</Link></Button>
          </div>
        </div>
      </div>

      {/* ═══ KPIs ═══ */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'يحتاج متابعة',  value: report.summary.needAction,                  sub: 'أقل من الحد الأدنى المطلوب',    bg: 'bg-amber-50   border-amber-200/60',   val: 'text-amber-700',   sub2: 'text-amber-600/70'   },
          { label: 'نفد تماماً',    value: report.summary.outOfStock,                  sub: 'توقف عن التوفر للبيع',           bg: 'bg-red-50     border-red-200/60',     val: 'text-red-700',     sub2: 'text-red-600/70'     },
          { label: 'إجمالي القطع',  value: report.summary.totalUnits,                  sub: 'مجموع الكميات الحالية',          bg: 'bg-blue-50    border-blue-200/60',    val: 'text-blue-700',    sub2: 'text-blue-600/70'    },
          { label: 'قيمة المخزون', value: formatCurrency(report.summary.totalValue), sub: `آخر تحديث: ${report.latestUpdateLabel}`, bg: 'bg-emerald-50 border-emerald-200/60', val: 'text-emerald-700', sub2: 'text-emerald-600/70' },
        ].map((k) => (
          <div key={k.label} className={`rounded-2xl border p-5 shadow-sm ${k.bg}`}>
            <p className={`text-sm font-bold ${k.val}`}>{k.label}</p>
            <p className={`mt-2 text-3xl font-black ${k.val}`}>
              {typeof k.value === 'number' ? k.value.toLocaleString('ar-EG') : k.value}
            </p>
            <p className={`mt-1 text-xs ${k.sub2}`}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ═══ المحتوى الرئيسي ═══ */}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

        {/* قائمة المنتجات */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">

          {/* رأس + فلاتر */}
          <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
            <div className="flex flex-col gap-4">
              {/* فلاتر الحالة كأزرار */}
              <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((tab) => {
                  const active = statusFilter === tab.value
                  const count = counts[tab.value]
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setStatusFilter(tab.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                        active
                          ? tab.color
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${active ? 'bg-white/20' : 'bg-white text-slate-500'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* بحث */}
              <div className="relative">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث باسم المنتج أو الفئة..."
                  className="pr-10"
                />
                <svg className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <p className="text-sm text-slate-400">
                عرض <span className="font-bold text-slate-700">{filtered.length}</span> منتج
                {statusFilter !== 'all' && <span> · مصفّى حسب: <span className="font-bold text-slate-600">{STATUS[statusFilter as InventoryStatus]?.label}</span></span>}
              </p>
            </div>
          </div>

          {/* الصفوف */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="mb-3 text-4xl">🔍</span>
              <p className="font-bold text-slate-500">لا توجد نتائج مطابقة</p>
              <p className="mt-1 text-sm text-slate-400">جرب تغيير الفلتر أو تعديل كلمة البحث</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((item) => {
                const cfg = STATUS[item.status]
                const pct = Math.max(item.stockPercentage, item.quantity > 0 ? 3 : 0)
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50/70 md:flex-row md:items-center md:justify-between ${cfg.rowCls}`}
                  >
                    <div className="min-w-0 flex-1">
                      {/* اسم + حالة */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dotCls}`} />
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <Badge variant="outline" className={`text-xs ${cfg.badgeCls}`}>
                          {cfg.label}
                        </Badge>
                        <span className="text-xs text-slate-400">{getCategoryLabel(item.category ?? '')}</span>
                      </div>

                      {/* أرقام */}
                      <div className="grid gap-x-4 gap-y-0.5 text-sm text-slate-500 sm:grid-cols-3">
                        <span>المتوفر: <strong className="text-slate-700">{item.quantity.toLocaleString('ar-EG')}</strong></span>
                        <span>الحد الأدنى: <strong className="text-slate-700">{item.minStock.toLocaleString('ar-EG')}</strong></span>
                        <span>القيمة: <strong className="text-slate-700">{formatCurrency(item.value)}</strong></span>
                      </div>

                      {/* شريط */}
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all duration-700 ${cfg.barCls}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* أزرار */}
                    <div className="flex shrink-0 items-center gap-2">
                      {item.gap > 0 && (
                        <span className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">
                          +{item.gap} ناقص
                        </span>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/products/${item.id}/edit`}>تعديل</Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* اللوحة الجانبية */}
        <div className="space-y-4">

          {/* دليل الأولويات */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-black text-slate-800">كيف تقرأ الصفحة؟</h3>
            <div className="space-y-2.5">
              {[
                { dot: 'bg-red-500 animate-pulse', title: 'نفد تماماً',    desc: 'هذا المنتج لا يوجد منه أي قطعة — يؤثر على البيع فوراً' },
                { dot: 'bg-orange-500',             title: 'حرج',           desc: 'الكمية أقل بكثير من الحد الأدنى — يحتاج إنتاج عاجل' },
                { dot: 'bg-amber-400',              title: 'منخفض',         desc: 'الكمية منخفضة — ضعه في خطة الإنتاج القريبة' },
                { dot: 'bg-emerald-500',            title: 'مستقر',        desc: 'الكمية كافية — لا يحتاج تدخل الآن' },
              ].map((row) => (
                <div key={row.title} className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-3.5 py-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-700">{row.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">{row.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ملخص التوزيع */}
          <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-black text-slate-800">ملخص التوزيع</h3>
            <div className="space-y-2">
              {[
                { label: 'مستقر',     count: report.summary.good,         color: 'text-emerald-600 bg-emerald-50' },
                { label: 'منخفض',    count: report.summary.low,           color: 'text-amber-600   bg-amber-50'   },
                { label: 'حرج',       count: report.summary.critical,      color: 'text-orange-600  bg-orange-50'  },
                { label: 'نفد',      count: report.summary.outOfStock,    color: 'text-red-600     bg-red-50'     },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl px-3 py-2">
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${row.color}`}>
                    {row.count}
                  </span>
                </div>
              ))}
              <div className="mt-2 border-t border-slate-100 pt-2 flex items-center justify-between px-3">
                <span className="text-sm font-bold text-slate-700">الإجمالي</span>
                <span className="text-sm font-black text-slate-900">{report.summary.totalProducts}</span>
              </div>
            </div>
          </div>

          {/* أكثر المنتجات استقراراً */}
          {report.healthiest.length > 0 && (
            <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-black text-slate-800">أكثر المنتجات استقراراً</h3>
              <div className="space-y-3">
                {report.healthiest.slice(0, 4).map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate font-medium text-slate-700">{item.name}</span>
                      <span className="font-black text-emerald-600">{item.stockPercentage}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-emerald-50">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(item.stockPercentage, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}