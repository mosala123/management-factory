'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { buildInventoryReport, type ProductLike } from '@/lib/reporting'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { products, isLoading, fetchProducts } = useProducts()

  useEffect(() => { fetchProducts(1, 1000) }, [fetchProducts])

  const report = useMemo(
    () => buildInventoryReport(products as ProductLike[]),
    [products]
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور'

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-100 border-t-blue-500" />
        </div>
        <p className="text-sm font-medium text-slate-400">جاري تحميل بيانات المصنع...</p>
      </div>
    )
  }

  const statusItems = [
    { label: 'مستقر',     value: report.summary.good,       color: 'bg-emerald-500', light: 'bg-emerald-50  text-emerald-700 border-emerald-200' },
    { label: 'منخفض',    value: report.summary.low,        color: 'bg-amber-400',   light: 'bg-amber-50   text-amber-700   border-amber-200'   },
    { label: 'حرج',       value: report.summary.critical,   color: 'bg-orange-500',  light: 'bg-orange-50  text-orange-700  border-orange-200'  },
    { label: 'نفد تماماً', value: report.summary.outOfStock, color: 'bg-red-500',     light: 'bg-red-50     text-red-700     border-red-200'     },
  ]

  const quickLinks = [
    { href: '/dashboard/inventory',  label: 'المخزون',        icon: '📦', desc: 'تتبع الكميات والنواقص',         badge: report.summary.needAction,                              color: 'hover:border-amber-300   hover:bg-amber-50/40'   },
    { href: '/dashboard/production', label: 'الإنتاج',        icon: '🏭', desc: 'خطة التشغيل اليومية',           badge: report.summary.critical + report.summary.outOfStock,    color: 'hover:border-violet-300  hover:bg-violet-50/40'  },
    { href: '/dashboard/products',   label: 'المنتجات',       icon: '🏷️', desc: 'إضافة وتعديل بيانات المنتجات', badge: 0,                                                       color: 'hover:border-emerald-300 hover:bg-emerald-50/40' },
    { href: '/dashboard/reports',    label: 'التقارير',       icon: '📊', desc: 'ملخصات إدارية شاملة',            badge: 0,                                                       color: 'hover:border-cyan-300    hover:bg-cyan-50/40'    },
    { href: '/dashboard/charts',     label: 'الرسوم البيانية', icon: '📈', desc: 'مؤشرات الأداء بشكل بصري',       badge: 0,                                                       color: 'hover:border-blue-300    hover:bg-blue-50/40'    },
    { href: '/dashboard/settings',   label: 'الإعدادات',      icon: '⚙️', desc: 'إدارة النظام والحساب',           badge: 0,                                                       color: 'hover:border-slate-300   hover:bg-slate-50/40'   },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-1" dir="rtl">

      {/* ═══════════════════════════════════════════════
          بانر الترحيب
      ═══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-xl">
        {/* خلفية زخرفية */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-16 right-1/3 h-48 w-48 rounded-full bg-violet-500/10 blur-2xl" />
          <div className="absolute left-1/2 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-base">👋</span>
              <span className="text-sm font-medium text-white/60">{greeting}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">
              لوحة التحكم الرئيسية
            </h1>
            <p className="max-w-lg text-sm leading-7 text-white/50">
              كل ما يحدث في المصنع الآن — المخزون والإنتاج والتنبيهات — في صفحة واحدة واضحة.
            </p>

            {/* تنبيه مخزون */}
            {report.summary.needAction > 0 && (
              <Link href="/dashboard/inventory" className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                {report.summary.needAction} منتج يحتاج تدخل فوري
                <span className="text-amber-400/60">←</span>
              </Link>
            )}
          </div>

          {/* أرقام الملخص السريع */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
            {[
              { label: 'جاهزية المخزون', value: `${report.summary.readinessRate}%`,  sub: 'نسبة المنتجات المستقرة' },
              { label: 'قيمة المخزون',   value: formatCurrency(report.summary.totalValue), sub: 'إجمالي قيمة البيع'        },
              { label: 'إجمالي المنتجات', value: report.summary.totalProducts.toLocaleString('ar-EG'), sub: `${report.summary.totalUnits.toLocaleString('ar-EG')} قطعة` },
              { label: 'تنبيهات نشطة',  value: report.summary.needAction.toString(), sub: 'تحتاج قرار أو إنتاج'  },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-white/50">{s.label}</p>
                <p className="mt-1.5 text-2xl font-black text-white">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-white/35">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          توزيع حالة المخزون
      ═══════════════════════════════════════════════ */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">

        {/* الدوائر + الأشرطة */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-black text-slate-800">حالة المخزون الآن</h2>
          <p className="mb-6 text-sm text-slate-400">توزيع المنتجات حسب مستوى التوفر</p>

          <div className="space-y-4">
            {statusItems.map((s) => {
              const pct = report.summary.totalProducts > 0
                ? Math.max((s.value / report.summary.totalProducts) * 100, s.value > 0 ? 3 : 0)
                : 0
              return (
                <div key={s.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                      <span className="font-semibold text-slate-700">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{s.value} منتج</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${s.light}`}>
                        {Math.round(pct)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${s.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* مؤشر الجاهزية */}
          <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-700">مؤشر الجاهزية العام</span>
              <span className="text-lg font-black text-emerald-700">{report.summary.readinessRate}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${Math.max(report.summary.readinessRate, 3)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-emerald-600/70">
              كلما ارتفع المؤشر كان المخزون أكثر استقراراً
            </p>
          </div>
        </div>

        {/* أولويات التصنيع */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">أولويات التصنيع</h2>
              <p className="mt-0.5 text-sm text-slate-400">المنتجات الأعلى عجزاً عن الحد الأدنى المطلوب</p>
            </div>
            <Link href="/dashboard/production" className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 transition hover:bg-violet-100">
              خطة الإنتاج الكاملة ←
            </Link>
          </div>

          {report.topShortages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <span className="text-2xl">✅</span>
              </div>
              <p className="font-bold text-emerald-700">المخزون في وضع ممتاز</p>
              <p className="mt-1 text-sm text-slate-400">لا توجد منتجات تحتاج تصنيع الآن</p>
            </div>
          ) : (
            <div className="space-y-3">
              {report.topShortages.slice(0, 6).map((item, i) => {
                const pct = Math.max((item.quantity / Math.max(item.minStock, 1)) * 100, item.quantity > 0 ? 3 : 0)
                const isOut = item.quantity === 0
                return (
                  <div key={item.id} className={`flex items-center gap-4 rounded-2xl border p-3.5 transition hover:shadow-sm ${isOut ? 'border-red-200 bg-red-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${isOut ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-black ${isOut ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          +{item.gap} مطلوب
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${isOut ? 'bg-red-400' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        متوفر: {item.quantity} · الحد الأدنى: {item.minStock}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          اختصارات الأقسام
      ═══════════════════════════════════════════════ */}
      <div>
        <h2 className="mb-4 text-lg font-black text-slate-800">الأقسام الرئيسية</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-all ${link.color}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl transition group-hover:scale-105">
                {link.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{link.label}</p>
                  {!!link.badge && link.badge > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-black text-white">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-400">{link.desc}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          أفضل المنتجات استقراراً
      ═══════════════════════════════════════════════ */}
      {report.healthiest.length > 0 && (
        <div className="rounded-3xl border border-emerald-200/50 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">أكثر المنتجات استقراراً</h2>
              <p className="mt-0.5 text-sm text-slate-400">نسبة المخزون الحالي مقارنة بالحد الأدنى المطلوب</p>
            </div>
            <Link href="/dashboard/inventory" className="text-xs font-bold text-emerald-600 transition hover:underline">
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.healthiest.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                <p className="mt-3 text-2xl font-black text-emerald-700">{item.stockPercentage}%</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(item.stockPercentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تذييل */}
      <p className="pb-2 text-center text-xs text-slate-300">
        آخر تحديث للبيانات: {report.latestUpdateLabel}
      </p>
    </div>
  )
}