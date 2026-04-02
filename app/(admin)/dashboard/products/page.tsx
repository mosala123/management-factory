"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORY_LABELS: Record<string, string> = {
  men: "رجالي",
  women: "حريمي",
  kids: "أطفال",
  uniform: "يونيفورم",
};

export default function ProductsManagement() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkUpdateValue, setBulkUpdateValue] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showEditQuantityModal, setShowEditQuantityModal] = useState<any>(null);
  const [newQuantityValue, setNewQuantityValue] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("حدث خطأ في جلب المنتجات");
    else setProducts(data || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-products-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void fetchProducts();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [fetchProducts, supabase]);

  // ✅ الحذف الفوري من الـ UI نهائياً
  const handleDeleteProduct = async () => {
    if (!showDeleteModal) return;
    const productId = showDeleteModal.id;
    setIsDeleting(true);

    // 1. أغلق الـ modal فوراً
    setShowDeleteModal(null);

    // 2. ابدأ animation الحذف
    setDeletingId(productId);

    // 3. بعد 350ms (وقت الـ animation) شيل من الـ state بشكل نهائي
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error?.message || "حدث خطأ في حذف المنتج");
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("تم حذف المنتج بنجاح");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ في حذف المنتج");
      await fetchProducts();
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }

    return;

    // 4. احذف من الداتابيز في الخلفية
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      toast.error("حدث خطأ في حذف المنتج");
      // لو فشل، أرجع المنتج عن طريق إعادة الجلب
      fetchProducts();
    } else {
      toast.success("✅ تم حذف المنتج بنجاح");
    }

    setIsDeleting(false);
  };

  // ✅ تحديث الكمية فوري في الـ UI
  const handleSaveNewQuantity = async () => {
    if (!showEditQuantityModal) return;
    if (newQuantityValue < 0) { toast.error("الكمية يجب أن تكون رقم موجب"); return; }

    const productId = showEditQuantityModal.id;
    const oldQuantity = showEditQuantityModal.quantity;

    setUpdatingQuantity(productId);

    // تحديث فوري في الـ state
    setProducts((prev) =>
      prev.map((p) => p.id === productId ? { ...p, quantity: newQuantityValue } : p)
    );
    setShowEditQuantityModal(null);

    // تحديث في الداتابيز في الخلفية
    const { error } = await supabase
      .from("products")
      .update({ quantity: newQuantityValue })
      .eq("id", productId);

    if (error) {
      toast.error("حدث خطأ في تحديث الكمية");
      // لو فشل، أرجع الكمية القديمة
      setProducts((prev) =>
        prev.map((p) => p.id === productId ? { ...p, quantity: oldQuantity } : p)
      );
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const change = newQuantityValue - oldQuantity;
      await supabase.from("stock_movements").insert({
        product_id: productId,
        product_name: showEditQuantityModal.name,
        movement_type: change > 0 ? "add" : "subtract",
        quantity_before: oldQuantity,
        quantity_change: Math.abs(change),
        quantity_after: newQuantityValue,
        notes: "تعديل من صفحة المنتجات",
        created_by: user?.id || null,
        created_by_email: user?.email || null,
      });
      toast.success("✅ تم تحديث الكمية");
    }

    setUpdatingQuantity(null);
    setNewQuantityValue(0);
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.size === 0) { toast.error("يرجى اختيار المنتجات"); return; }
    if (bulkUpdateValue < 0) { toast.error("الكمية يجب أن تكون رقم موجب"); return; }

    const productIds = Array.from(selectedProducts);

    // تحديث فوري في الـ state
    setProducts((prev) =>
      prev.map((p) => productIds.includes(p.id) ? { ...p, quantity: bulkUpdateValue } : p)
    );
    setSelectedProducts(new Set());
    setShowBulkUpdate(false);

    const { error } = await supabase.from("products").update({ quantity: bulkUpdateValue }).in("id", productIds);
    if (error) {
      toast.error("حدث خطأ في التحديث الجماعي");
      fetchProducts(); // أرجع الداتا الصحيحة
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const movements = products
        .filter((p) => productIds.includes(p.id))
        .map((p) => ({
          product_id: p.id,
          product_name: p.name,
          movement_type: bulkUpdateValue > p.quantity ? "add" : "subtract",
          quantity_before: p.quantity,
          quantity_change: Math.abs(bulkUpdateValue - p.quantity),
          quantity_after: bulkUpdateValue,
          notes: "تحديث جماعي",
          created_by: user?.id || null,
          created_by_email: user?.email || null,
        }));
      await supabase.from("stock_movements").insert(movements);
      toast.success(`✅ تم تحديث ${productIds.length} منتج`);
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) newSelected.delete(productId);
    else newSelected.add(productId);
    setSelectedProducts(newSelected);
  };

  const exportToCSV = () => {
    const headers = ["الاسم", "الفئة", "السعر", "الكمية", "الحد الأدنى", "الحالة"];
    const rows = filteredProducts.map((p) => [
      p.name, getCategoryLabel(p.category), p.price, p.quantity, p.min_stock,
      p.quantity === 0 ? "غير متوفر" : p.quantity <= p.min_stock ? "مخزون منخفض" : "مخزون كاف",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "products_report.csv";
    link.click();
    toast.success("تم تصدير التقرير");
  };

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter((p) => p.quantity > 0 && p.quantity <= p.min_stock).length,
    outOfStock: products.filter((p) => p.quantity === 0).length,
    totalInventoryValue: products.reduce((sum, p) => sum + p.quantity * p.price, 0),
    avgStock: products.length > 0
      ? Math.round(products.reduce((sum, p) => sum + p.quantity, 0) / products.length)
      : 0,
  }), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      const matchesStock =
        filterStockStatus === "all" ? true :
        filterStockStatus === "low" ? p.quantity > 0 && p.quantity <= p.min_stock :
        filterStockStatus === "out" ? p.quantity === 0 :
        p.quantity > p.min_stock;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, filterCategory, filterStockStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">إدارة المنتجات</h1>
          <p className="text-gray-500 mt-1">إضافة وتعديل وحذف المنتجات ومتابعة الكميات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تصدير
          </button>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            منتج جديد
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي المنتجات", value: stats.total, color: "border-primary text-primary" },
          { label: "مخزون منخفض", value: stats.lowStock, color: "border-amber-500 text-amber-600" },
          { label: "غير متوفر", value: stats.outOfStock, color: "border-red-500 text-red-600" },
          { label: "قيمة المخزون", value: formatCurrency(stats.totalInventoryValue), color: "border-emerald-500 text-emerald-600" },
          { label: "متوسط الكمية", value: stats.avgStock, color: "border-blue-500 text-blue-600" },
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-xl p-4 text-center shadow-sm border-b-4 ${stat.color.split(" ")[0]}`}>
            <div className={`text-2xl font-black ${stat.color.split(" ")[1]}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ابحث بالاسم أو التاغ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white text-sm">
            <option value="all">كل الفئات</option>
            <option value="men">رجالي</option>
            <option value="women">حريمي</option>
            <option value="kids">أطفال</option>
            <option value="uniform">يونيفورم</option>
          </select>
          <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white text-sm">
            <option value="all">كل الحالات</option>
            <option value="low">⚠️ منخفض</option>
            <option value="out">❌ غير متوفر</option>
            <option value="in">✅ كافي</option>
          </select>
          <button onClick={() => setShowBulkUpdate(true)} className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
            تحديث جماعي
          </button>
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              ≡
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">عرض {filteredProducts.length} من {products.length} منتج</p>
      </div>

      {/* ══════════ GRID VIEW ══════════ */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((product) => {
            const isLow = product.quantity > 0 && product.quantity <= product.min_stock;
            const isOut = product.quantity === 0;
            const stockPct = Math.min(100, product.min_stock > 0 ? Math.round((product.quantity / (product.min_stock * 2)) * 100) : 100);
            const isDeleting_ = deletingId === product.id;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-lg overflow-hidden group transition-all duration-300 ${
                  isDeleting_ ? "opacity-0 scale-95 pointer-events-none" : "opacity-100 scale-100"
                } ${isOut ? "border-r-4 border-r-red-500" : isLow ? "border-r-4 border-r-amber-500" : ""}`}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  <img
                    src={product.hero_image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span className="absolute top-2 right-2 bg-primary text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                      {product.badge}
                    </span>
                  )}
                  {isOut && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold animate-pulse">
                      غير متوفر
                    </span>
                  )}
                  {isLow && !isOut && (
                    <span className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                      ⚠️ منخفض
                    </span>
                  )}
                  {/* Quick actions overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title="معاينة"
                    >
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title="تعديل"
                    >
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(product)}
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title="حذف"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[product.category] || product.category}
                    </span>
                    <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.summary}</p>

                  {/* Stock bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">المخزون</span>
                      <span className={`font-bold ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-700"}`}>
                        {product.quantity} / {product.min_stock}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOut ? "bg-red-500" : isLow ? "bg-amber-400" : "bg-emerald-500"}`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setShowEditQuantityModal(product); setNewQuantityValue(product.quantity); }}
                      disabled={updatingQuantity === product.id}
                      className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      {updatingQuantity === product.id ? (
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>📦 {product.quantity} قطعة</>
                      )}
                    </button>
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(product)}
                      className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ TABLE VIEW ══════════ */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المنتج</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الفئة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">السعر</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">المخزون</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">الحالة</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">إجراءات</th>
               </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, i) => {
                const isLow = product.quantity > 0 && product.quantity <= product.min_stock;
                const isOut = product.quantity === 0;
                const isDeleting_ = deletingId === product.id;
                return (
                  <tr
                    key={product.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 transition-all duration-300 ${
                      isDeleting_ ? "opacity-0 scale-y-0" : "opacity-100 scale-y-100"
                    } ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.hero_image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                        <div>
                          <p className="font-semibold text-gray-900 line-clamp-1">{product.name}</p>
                          {product.badge && <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{product.badge}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[product.category]}</td>
                    <td className="px-4 py-3 font-bold text-primary">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setShowEditQuantityModal(product); setNewQuantityValue(product.quantity); }}
                        className="flex items-center gap-1.5 font-semibold hover:text-primary transition-colors"
                      >
                        <span className={isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-gray-800"}>
                          {product.quantity}
                        </span>
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isOut ? "bg-red-100 text-red-700" : isLow ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      }`}>
                        {isOut ? "❌ غير متوفر" : isLow ? "⚠️ منخفض" : "✅ متوفر"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/products/${product.slug}`} target="_blank" className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors" title="معاينة">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link href={`/dashboard/products/${product.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button onClick={() => setShowDeleteModal(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500 text-sm mb-6">
            {searchTerm ? `لا توجد نتائج لـ "${searchTerm}"` : "لم يتم إضافة أي منتجات بعد"}
          </p>
          {!searchTerm && (
            <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة منتج جديد
            </Link>
          )}
        </div>
      )}

      {/* ══════════ DELETE MODAL ══════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              {/* صورة المنتج المراد حذفه */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-4 text-right">
                <img src={showDeleteModal.hero_image} alt="" className="w-12 h-12 object-cover rounded-lg" />
                <div>
                  <p className="font-bold text-gray-800 text-sm">{showDeleteModal.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(showDeleteModal.price)}</p>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 text-sm mb-6">
                هل أنت متأكد من حذف هذا المنتج؟ <br />
                <span className="text-red-500 font-semibold">لا يمكن التراجع عن هذا الإجراء.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "🗑️ حذف المنتج"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EDIT QUANTITY MODAL ══════════ */}
      {showEditQuantityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <img src={showEditQuantityModal.hero_image} alt="" className="w-12 h-12 object-cover rounded-xl" />
              <div>
                <h3 className="font-bold text-gray-900">{showEditQuantityModal.name}</h3>
                <p className="text-sm text-gray-500">تحديث الكمية</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <label className="font-semibold text-gray-700">الكمية الجديدة</label>
                  <span className="text-gray-400">الحالية: {showEditQuantityModal.quantity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewQuantityValue((v) => Math.max(0, v - 1))}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors flex items-center justify-center"
                  >−</button>
                  <input
                    type="number"
                    value={newQuantityValue}
                    onChange={(e) => setNewQuantityValue(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 text-center px-4 py-2.5 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-xl font-bold"
                    min="0"
                    autoFocus
                  />
                  <button
                    onClick={() => setNewQuantityValue((v) => v + 1)}
                    className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors flex items-center justify-center"
                  >+</button>
                </div>
                {newQuantityValue !== showEditQuantityModal.quantity && (
                  <p className={`text-xs mt-2 font-medium text-center ${newQuantityValue > showEditQuantityModal.quantity ? "text-green-600" : "text-red-600"}`}>
                    {newQuantityValue > showEditQuantityModal.quantity ? "▲" : "▼"} التغيير: {Math.abs(newQuantityValue - showEditQuantityModal.quantity)} قطعة
                  </p>
                )}
              </div>

              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                ℹ️ سيتم تسجيل هذا التعديل في حركات المخزون تلقائياً
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowEditQuantityModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                  إلغاء
                </button>
                <button
                  onClick={handleSaveNewQuantity}
                  disabled={updatingQuantity === showEditQuantityModal.id}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {updatingQuantity === showEditQuantityModal.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ BULK UPDATE MODAL ══════════ */}
      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">تحديث كميات متعددة</h3>
            <p className="text-sm text-gray-500 mb-4">اختر المنتجات وأدخل الكمية الجديدة</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="text-sm font-semibold text-gray-700">المختار: {selectedProducts.size}</span>
                <button
                  onClick={() => {
                    if (selectedProducts.size === filteredProducts.length) setSelectedProducts(new Set());
                    else setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
                  }}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  {selectedProducts.size === filteredProducts.length ? "إلغاء الكل" : "اختيار الكل"}
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                {filteredProducts.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(p.id)}
                      onChange={() => toggleSelectProduct(p.id)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <img src={p.hero_image} alt="" className="w-8 h-8 object-cover rounded-lg" />
                    <span className="flex-1 text-sm font-medium line-clamp-1">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.quantity}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية الجديدة لجميع المختارين</label>
                <input
                  type="number"
                  value={bulkUpdateValue}
                  onChange={(e) => setBulkUpdateValue(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-lg font-bold"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowBulkUpdate(false); setSelectedProducts(new Set()); }} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                  إلغاء
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={selectedProducts.size === 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  تحديث ({selectedProducts.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
