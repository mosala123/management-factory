'use client'

// app/dashboard/settings/page.tsx
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useProducts } from '@/hooks/useProducts'
import { buildInventoryReport, type ProductLike } from '@/lib/reporting'
import { formatCurrency } from '@/lib/utils'
export const dynamic = 'force-dynamic'
const SECTIONS = [
  { href: '/dashboard/inventory',  title: 'المخزون',         desc: 'راجع حالة الكميات — ما نفد وما يحتاج تدخل سريع.',     icon: '📦', tone: 'amber'   },
  { href: '/dashboard/production', title: 'الإنتاج',         desc: 'تابع خطة التشغيل اليومية والأصناف المقترحة للتصنيع.', icon: '🏭', tone: 'violet'  },
  { href: '/dashboard/products',   title: 'المنتجات',        desc: 'أضف أو عدّل بيانات المنتجات والأسعار والكميات.',       icon: '🏷️', tone: 'emerald' },
  { href: '/dashboard/reports',    title: 'التقارير',        desc: 'ملخصات إدارية جاهزة وسريعة الفهم.',                    icon: '📊', tone: 'cyan'    },
  { href: '/dashboard/charts',     title: 'الرسوم البيانية', desc: 'مؤشرات أداء بصرية لمتابعة الوضع دفعة واحدة.',         icon: '📈', tone: 'blue'    },
] as const

const toneMap = {
  amber:   { card: 'hover:border-amber-300   hover:bg-amber-50/50',    btn: 'bg-amber-600   hover:bg-amber-700'   },
  violet:  { card: 'hover:border-violet-300  hover:bg-violet-50/50',   btn: 'bg-violet-600  hover:bg-violet-700'  },
  emerald: { card: 'hover:border-emerald-300 hover:bg-emerald-50/50',  btn: 'bg-emerald-600 hover:bg-emerald-700' },
  cyan:    { card: 'hover:border-cyan-300    hover:bg-cyan-50/50',     btn: 'bg-cyan-600    hover:bg-cyan-700'    },
  blue:    { card: 'hover:border-blue-300    hover:bg-blue-50/50',     btn: 'bg-blue-600    hover:bg-blue-700'    },
}

export default function SettingsPage() {
  const { products, isLoading, fetchProducts } = useProducts()
  useEffect(() => { fetchProducts(1, 1000) }, [fetchProducts])
  const report = useMemo(() => buildInventoryReport(products as ProductLike[]), [products])

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-1" dir="rtl">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-bl from-slate-50 via-white to-yellow-50/20 p-7 shadow-sm">
        <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300/10 blur-2xl" />
        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚙️</span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">مركز التحكم</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">نظرة عامة على النظام</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-500">
            هذه الصفحة تعطيك لمحة سريعة عن حالة النظام كلها، وروابط مباشرة لكل قسم تحتاجه.
          </p>
        </div>
      </div>

      {/* حالة النظام الآن */}
      <div>
        <h2 className="mb-4 text-lg font-black text-slate-800">حالة النظام الآن</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'جاهزية المخزون',
              value: isLoading ? '...' : `${report.summary.readinessRate}%`,
              sub: 'نسبة المنتجات في وضع مستقر',
              icon: '✅',
              status: !isLoading && report.summary.readinessRate >= 70 ? 'good' : 'warn',
            },
            {
              label: 'تنبيهات نشطة',
              value: isLoading ? '...' : report.summary.needAction.toString(),
              sub: 'منتجات تحتاج متابعة أو إنتاج',
              icon: '🔔',
              status: !isLoading && report.summary.needAction === 0 ? 'good' : 'warn',
            },
            {
              label: 'قيمة المخزون',
              value: isLoading ? '...' : formatCurrency(report.summary.totalValue),
              sub: 'إجمالي قيمة البيع الحالية',
              icon: '💰',
              status: 'neutral',
            },
            {
              label: 'آخر تحديث',
              value: isLoading ? '...' : report.latestUpdateLabel,
              sub: 'آخر توقيت تسجيل لبيانات المخزون',
              icon: '🕐',
              status: 'neutral',
            },
          ].map((card) => {
            const cls =
              card.status === 'good' ? 'border-emerald-200/60 bg-emerald-50/70'
              : card.status === 'warn' && !isLoading && (card.label === 'تنبيهات نشطة' ? report.summary.needAction > 0 : report.summary.readinessRate < 70)
              ? 'border-amber-200/60 bg-amber-50/70'
              : 'border-slate-200/60 bg-white'
            const valCls =
              card.status === 'good' ? 'text-emerald-700'
              : card.status === 'warn' && !isLoading && (card.label === 'تنبيهات نشطة' ? report.summary.needAction > 0 : report.summary.readinessRate < 70)
              ? 'text-amber-700'
              : 'text-slate-800'
            return (
              <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${cls}`}>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-bold text-slate-600">{card.label}</p>
                  <span className="text-base">{card.icon}</span>
                </div>
                <p className={`mt-3 text-2xl font-black ${valCls}`}>{card.value}</p>
                <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* الأقسام الرئيسية */}
      <div>
        <h2 className="mb-4 text-lg font-black text-slate-800">الأقسام الرئيسية</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const t = toneMap[s.tone]
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`group flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all ${t.card}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl transition group-hover:scale-110">{s.icon}</span>
                  <svg className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <div>
                  <p className="font-black text-slate-800">{s.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{s.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ماذا يراجع صاحب المصنع + روابط سريعة */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* قائمة مراجعة يومية */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-black text-slate-800">قائمة المراجعة اليومية</h2>
          <p className="mb-4 text-sm text-slate-400">
            هذه هي الخطوات التي يتبعها صاحب المصنع كل يوم للتأكد من أن كل شيء سليم:
          </p>
          <div className="space-y-2.5">
            {[
              { n: '1', text: 'المنتجات غير المتوفرة (نفد)',    sub: 'هذه توقف البيع مباشرة — ابدأ بها',                   c: 'bg-red-500'    },
              { n: '2', text: 'المنتجات الحرجة',               sub: 'قرر ما يدخل الإنتاج اليوم',                           c: 'bg-orange-500' },
              { n: '3', text: 'مراجعة خطة الإنتاج',            sub: 'تأكد أن الكميات المقترحة منطقية',                    c: 'bg-violet-500' },
              { n: '4', text: 'قيمة المخزون الإجمالية',        sub: 'هل تتحرك في الاتجاه الصحيح؟',                        c: 'bg-blue-500'   },
              { n: '5', text: 'تحديث أي بيانات منتج تغيرت',   sub: 'سعر، كمية، أو حد أدنى',                               c: 'bg-emerald-500'},
            ].map((item) => (
              <div key={item.n} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ${item.c}`}>
                  {item.n}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-700">{item.text}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* روابط سريعة */}
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-black text-slate-800">إجراءات سريعة</h2>
          <div className="grid gap-2.5">
            {[
              { href: '/dashboard/products/new',  icon: '➕', title: 'إضافة منتج جديد',    sub: 'سجّل صنفاً جديداً في المخزون'  },
              { href: '/dashboard/inventory',     icon: '📦', title: 'مراجعة المخزون',     sub: 'اعرف النواقص والتنبيهات الآن'  },
              { href: '/dashboard/production',    icon: '🏭', title: 'تخطيط الإنتاج',     sub: 'ترتيب التشغيل بناءً على العجز'  },
              { href: '/dashboard/reports',       icon: '📊', title: 'فتح التقارير',       sub: 'ملخص إداري سريع وشامل'          },
              { href: '/dashboard/charts',        icon: '📈', title: 'الرسوم البيانية',   sub: 'مؤشرات أداء بصرية'              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
              >
                <span className="text-xl">{link.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">{link.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{link.sub}</p>
                </div>
                <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}