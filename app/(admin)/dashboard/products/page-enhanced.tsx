"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";

const CATEGORY_LABELS: Record<string, string> = {
  men: "رجالي",
  women: "حريمي",
  kids: "أطفال",
  uniform: "يونيفورم",
  fabric: "قماش",
  accessories: "إكسسوارات",
};

export default function ProductsManagementEnhanced() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "created">("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  const handleDeleteProduct = async () => {
    if (!showDeleteModal) return;
    const productId = showDeleteModal.id;
    setIsDeleting(true);
    setShowDeleteModal(null);
    setDeletingId(productId);

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
    let filtered = products.filter((p) => {
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

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "price":
          aVal = a.price;
          bVal = b.price;
          break;
        case "stock":
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case "created":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          aVal = a.created_at;
          bVal = b.created_at;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, filterCategory, filterStockStatus, sortBy, sortOrder]);

  const exportToCSV = () => {
    const headers = ["الاسم", "الفئة", "السعر", "الكمية", "الحد الأدنى", "الحالة", "الخامة", "الألوان"];
    const rows = filteredProducts.map((p) => [
      p.name,
      getCategoryLabel(p.category),
      p.price,
      p.quantity,
      p.min_stock,
      p.quantity === 0 ? "غير متوفر" : p.quantity <= p.min_stock ? "مخزون منخفض" : "مخزون كاف",
      p.fabric_spec?.type || "-",
      p.colors?.length || 0,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString()}.csv`;
    link.click();
    toast.success("تم تصدير التقرير");
  };

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
          <p className="text-gray-500 mt-1">إضافة وتعديل وحذف المنتجات ومتابعة الكميات والصور</p>
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
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            منتج جديد
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">إجمالي المنتجات</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">مخزون منخفض</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">غير متوفر</div>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">قيمة المخزون</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalInventoryValue)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-600 mb-1">متوسط المخزون</div>
          <div className="text-2xl font-bold text-blue-600">{stats.avgStock}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
          >
            <option value="all">جميع الفئات</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="in">متوفر</option>
            <option value="low">مخزون منخفض</option>
            <option value="out">غير متوفر</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
          >
            <option value="created">الأحدث</option>
            <option value="name">الاسم</option>
            <option value="price">السعر</option>
            <option value="stock">المخزون</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            title={sortOrder === "asc" ? "تصاعدي" : "تنازلي"}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          <div className="flex gap-2 border-l border-gray-200 pl-4">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2.5 rounded-xl transition-all ${viewMode === "table" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              ≡
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          عرض {filteredProducts.length} من {products.length} منتج
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all ${
                deletingId === product.id ? "opacity-50 scale-95" : ""
              }`}
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100 overflow-hidden group">
                {product.hero_image ? (
                  <img
                    src={product.hero_image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-lg text-xs font-semibold">
                    {product.badge}
                  </div>
                )}

                {/* Stock Status */}
                <div className="absolute bottom-2 left-2">
                  {product.quantity === 0 ? (
                    <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">غير متوفر</span>
                  ) : product.quantity <= product.min_stock ? (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">مخزون منخفض</span>
                  ) : (
                    <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">متوفر</span>
                  )}
                </div>

                {/* Gallery Count */}
                {product.gallery && product.gallery.length > 0 && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs">
                    🖼️ {product.gallery.length}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{CATEGORY_LABELS[product.category]}</p>
                </div>

                {/* Fabric Info */}
                {product.fabric_spec && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {product.fabric_spec.type && <div>🧵 {product.fabric_spec.type}</div>}
                    {product.fabric_spec.composition && <div>📋 {product.fabric_spec.composition}</div>}
                  </div>
                )}

                {/* Colors & Sizes */}
                <div className="flex gap-2 text-xs">
                  {product.colors && product.colors.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">🎨 {product.colors.length} ألوان</span>
                  )}
                  {product.sizes && product.sizes.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">📏 {product.sizes.length} أحجام</span>
                  )}
                </div>

                {/* Price & Stock */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{formatCurrency(product.price)}</div>
                    <div className="text-xs text-gray-500">الكمية: {product.quantity}</div>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/dashboard/products/${product.id}/edit`}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      title="تعديل"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(product)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">المنتج</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">الفئة</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">الخامة</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">السعر</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">الكمية</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">الصور</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${deletingId === product.id ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.hero_image && (
                          <img src={product.hero_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.sku || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{CATEGORY_LABELS[product.category]}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{product.fabric_spec?.type || "-"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{product.quantity}</td>
                    <td className="px-6 py-4 text-sm">
                      {product.quantity === 0 ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">غير متوفر</span>
                      ) : product.quantity <= product.min_stock ? (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">منخفض</span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">متوفر</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex gap-1">
                        {product.gallery && product.gallery.length > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">🖼️ {product.gallery.length}</span>
                        )}
                        {product.colors && product.colors.length > 0 && (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">🎨 {product.colors.length}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          تعديل
                        </Link>
                        <button
                          onClick={() => setShowDeleteModal(product)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">حذف المنتج</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد من رغبتك في حذف "{showDeleteModal.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  "حذف"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
