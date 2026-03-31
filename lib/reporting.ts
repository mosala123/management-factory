import type { Product } from "@/lib/types";
import { getCategoryLabel } from "@/lib/utils";

export type ProductLike = Product & {
  category?: string;
  hero_image?: string;
  cost?: number;
  updated_at?: string;
};

export type InventoryStatus = "out" | "critical" | "low" | "good";

export type ReportProduct = ProductLike & {
  quantity: number;
  minStock: number;
  gap: number;
  value: number;
  status: InventoryStatus;
  stockPercentage: number;
};

export type CategorySummary = {
  key: string;
  label: string;
  count: number;
  quantity: number;
  value: number;
  share: number;
};

export type InventoryReport = {
  products: ReportProduct[];
  summary: {
    totalProducts: number;
    totalUnits: number;
    totalValue: number;
    outOfStock: number;
    critical: number;
    low: number;
    good: number;
    needAction: number;
    averagePrice: number;
    averageStock: number;
    readinessRate: number;
  };
  categoryBreakdown: CategorySummary[];
  topShortages: ReportProduct[];
  topValue: ReportProduct[];
  healthiest: ReportProduct[];
  latestUpdateLabel: string;
};

export type ActivityEvent = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "critical" | "warning" | "info" | "success";
  cta: string;
  meta: string;
};

export function buildInventoryReport(products: ProductLike[]): InventoryReport {
  const normalizedProducts: ReportProduct[] = products
    .map((product) => {
      const quantity = Number(product.quantity || 0);
      const minStock = Number(product.min_stock || 10);
      const gap = Math.max(minStock - quantity, 0);
      const value = quantity * Number(product.price || 0);

      let status: InventoryStatus = "good";
      if (quantity === 0) status = "out";
      else if (quantity <= Math.floor(minStock / 2)) status = "critical";
      else if (quantity <= minStock) status = "low";

      return {
        ...product,
        quantity,
        minStock,
        gap,
        value,
        status,
        stockPercentage: Math.min(
          Math.round((quantity / Math.max(minStock, 1)) * 100),
          100
        ),
      };
    })
    .sort((a, b) => b.value - a.value);

  const summary = normalizedProducts.reduce(
    (acc, product) => {
      acc.totalProducts += 1;
      acc.totalUnits += product.quantity;
      acc.totalValue += product.value;
      acc.averagePriceTotal += Number(product.price || 0);

      if (product.status === "out") acc.outOfStock += 1;
      if (product.status === "critical") acc.critical += 1;
      if (product.status === "low") acc.low += 1;
      if (product.status === "good") acc.good += 1;
      if (product.status !== "good") acc.needAction += 1;

      return acc;
    },
    {
      totalProducts: 0,
      totalUnits: 0,
      totalValue: 0,
      outOfStock: 0,
      critical: 0,
      low: 0,
      good: 0,
      needAction: 0,
      averagePriceTotal: 0,
    }
  );

  const categoryMap = new Map<string, CategorySummary>();

  for (const product of normalizedProducts) {
    const key = product.category || "uncategorized";
    const current = categoryMap.get(key) || {
      key,
      label: getCategoryLabel(key || "غير مصنف"),
      count: 0,
      quantity: 0,
      value: 0,
      share: 0,
    };

    current.count += 1;
    current.quantity += product.quantity;
    current.value += product.value;
    categoryMap.set(key, current);
  }

  const categoryBreakdown = Array.from(categoryMap.values())
    .sort((a, b) => b.value - a.value)
    .map((category) => ({
      ...category,
      share:
        summary.totalValue > 0
          ? Math.round((category.value / summary.totalValue) * 100)
          : 0,
    }));

  const latestUpdate = normalizedProducts
    .map((product) => product.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    products: normalizedProducts,
    summary: {
      totalProducts: summary.totalProducts,
      totalUnits: summary.totalUnits,
      totalValue: summary.totalValue,
      outOfStock: summary.outOfStock,
      critical: summary.critical,
      low: summary.low,
      good: summary.good,
      needAction: summary.needAction,
      averagePrice:
        summary.totalProducts > 0
          ? Math.round(summary.averagePriceTotal / summary.totalProducts)
          : 0,
      averageStock:
        summary.totalProducts > 0
          ? Math.round(summary.totalUnits / summary.totalProducts)
          : 0,
      readinessRate:
        summary.totalProducts > 0
          ? Math.round((summary.good / summary.totalProducts) * 100)
          : 0,
    },
    categoryBreakdown,
    topShortages: normalizedProducts
      .filter((product) => product.gap > 0)
      .sort((a, b) => b.gap - a.gap || a.quantity - b.quantity)
      .slice(0, 5),
    topValue: normalizedProducts.slice(0, 5),
    healthiest: [...normalizedProducts]
      .sort((a, b) => b.stockPercentage - a.stockPercentage || b.quantity - a.quantity)
      .slice(0, 5),
    latestUpdateLabel: latestUpdate
      ? new Intl.DateTimeFormat("ar-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(latestUpdate))
      : "لا يوجد تحديث بعد",
  };
}

export function buildActivityFeed(report: InventoryReport): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  if (report.summary.outOfStock > 0) {
    events.push({
      id: "out-of-stock",
      title: `${report.summary.outOfStock} منتج غير متوفر`,
      description: "هناك منتجات نفدت بالكامل وتحتاج قرار تصنيع أو تحديث عاجل.",
      href: "/dashboard/inventory",
      tone: "critical",
      cta: "راجع المخزون",
      meta: "أولوية عالية",
    });
  }

  if (report.summary.critical > 0) {
    events.push({
      id: "critical-stock",
      title: `${report.summary.critical} منتج في حالة حرجة`,
      description: "المخزون الحالي أقل من نصف الحد الأدنى لبعض المنتجات.",
      href: "/dashboard/production",
      tone: "warning",
      cta: "افتح الإنتاج",
      meta: "توصية تشغيل",
    });
  }

  const topShortage = report.topShortages[0];
  if (topShortage) {
    events.push({
      id: `shortage-${topShortage.id}`,
      title: `${topShortage.name} يحتاج ${topShortage.gap} قطعة`,
      description: "هذا المنتج يمثل أكبر فجوة حالية بين المتوفر والحد الأدنى.",
      href: `/dashboard/products/${topShortage.id}/edit`,
      tone: "warning",
      cta: "عدل المنتج",
      meta: getCategoryLabel(topShortage.category || ""),
    });
  }

  const topValue = report.topValue[0];
  if (topValue) {
    events.push({
      id: `value-${topValue.id}`,
      title: `${topValue.name} الأعلى قيمة`,
      description: `يمثل ${formatCompactCurrency(topValue.value)} من قيمة المخزون الحالية.`,
      href: "/dashboard/reports",
      tone: "info",
      cta: "عرض التقارير",
      meta: "قيمة المخزون",
    });
  }

  if (report.summary.needAction === 0) {
    events.push({
      id: "all-good",
      title: "المخزون مستقر",
      description: "لا توجد منتجات تحتاج تدخل فوري في الوقت الحالي.",
      href: "/dashboard/charts",
      tone: "success",
      cta: "عرض المؤشرات",
      meta: `${report.summary.readinessRate}% جاهزية`,
    });
  }

  return events.slice(0, 5);
}

function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
