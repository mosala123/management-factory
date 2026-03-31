// app/(admin)/dashboard/products/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getCategoryLabel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProductsManagement() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStockStatus, setFilterStockStatus] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkUpdateValue, setBulkUpdateValue] = useState<number>(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showEditQuantityModal, setShowEditQuantityModal] = useState<any>(null);
  const [newQuantityValue, setNewQuantityValue] = useState<number>(0);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("حدث خطأ في جلب المنتجات"); }
    else { setProducts(data || []); }
    setIsLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  // تحديث الكمية مع Modal
  const handleSaveNewQuantity = async () => {
    if (!showEditQuantityModal) return;
    if (newQuantityValue < 0) {
      toast.error("الكمية يجب أن تكون رقم موجب");
      return;
    }

    setUpdatingQuantity(showEditQuantityModal.id);
    const product = products.find(p => p.id === showEditQuantityModal.id);
    if (!product) { setUpdatingQuantity(null); return; }

    const { error } = await supabase
      .from("products")
      .update({ quantity: newQuantityValue })
      .eq("id", showEditQuantityModal.id);

    if (error) {
      toast.error("حدث خطأ في تحديث الكمية");
      setUpdatingQuantity(null);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const change = newQuantityValue - product.quantity;
    await supabase.from("stock_movements").insert({
      product_id: showEditQuantityModal.id,
      product_name: product.name,
      movement_type: change > 0 ? "add" : "subtract",
      quantity_before: product.quantity,
      quantity_change: Math.abs(change),
      quantity_after: newQuantityValue,
      notes: "تعديل من صفحة المنتجات",
      created_by: user?.id || null,
      created_by_email: user?.email || null,
    });

    toast.success("تم تحديث الكمية بنجاح");
    fetchProducts();
    setShowEditQuantityModal(null);
    setNewQuantityValue(0);
    setUpdatingQuantity(null);
  };

  // تحديث الكمية بسرعة + تسجيل الحركة (للاستخدام القديم)
  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdatingQuantity(productId);

    const product = products.find(p => p.id === productId);
    if (!product) { setUpdatingQuantity(null); return; }

    const { error } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", productId);

    if (error) {
      toast.error("حدث خطأ في تحديث الكمية");
      setUpdatingQuantity(null);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const change = newQuantity - product.quantity;
    await supabase.from("stock_movements").insert({
      product_id: productId,
      product_name: product.name,
      movement_type: change > 0 ? "add" : "subtract",
      quantity_before: product.quantity,
      quantity_change: Math.abs(change),
      quantity_after: newQuantity,
      notes: "تعديل يدوي من صفحة المنتجات",
      created_by: user?.id || null,
      created_by_email: user?.email || null,
    });

    toast.success("تم تحديث الكمية بنجاح");
    fetchProducts();
    setUpdatingQuantity(null);
  };

  const handleBulkUpdate = async () => {
    if (selectedProducts.size === 0) { toast.error("يرجى اختيار المنتجات"); return; }
    if (bulkUpdateValue < 0) { toast.error("الكمية يجب أن تكون رقم موجب"); return; }

    setIsLoading(true);
    const productIds = Array.from(selectedProducts);
    const { error } = await supabase.from("products").update({ quantity: bulkUpdateValue }).in("id", productIds);

    if (error) { toast.error("حدث خطأ في التحديث الجماعي"); }
    else {
      // تسجيل الحركة لكل منتج
      const { data: { user } } = await supabase.auth.getUser();
      const movements = products
        .filter(p => productIds.includes(p.id))
        .map(p => ({
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
      toast.success(`تم تحديث ${selectedProducts.size} منتج بنجاح`);
      setSelectedProducts(new Set());
      setShowBulkUpdate(false);
      fetchProducts();
    }
    setIsLoading(false);
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) { newSelected.delete(productId); }
    else { newSelected.add(productId); }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    if (selectedProducts.size === filteredProducts.length) { setSelectedProducts(new Set()); }
    else { setSelectedProducts(new Set(filteredProducts.map(p => p.id))); }
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast.error("حدث خطأ في حذف المنتج"); }
    else { toast.success("تم حذف المنتج بنجاح"); fetchProducts(); }
    setShowDeleteModal(null);
  };

  const exportToCSV = () => {
    const headers = ["الاسم", "الفئة", "السعر", "الكمية", "الحد الأدنى", "الحالة"];
    const rows = filteredProducts.map(p => [
      p.name, getCategoryLabel(p.category), p.price, p.quantity, p.min_stock,
      p.quantity <= p.min_stock ? "مخزون منخفض" : "مخزون كاف"
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", "products_report.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير التقرير بنجاح");
  };

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter(p => p.quantity <= p.min_stock).length,
    outOfStock: products.filter(p => p.quantity === 0).length,
    totalInventoryValue: products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
    avgStock: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.quantity, 0) / products.length) : 0,
  }), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      let matchesStock = true;
      if (filterStockStatus === "low") matchesStock = product.quantity <= product.min_stock;
      else if (filterStockStatus === "out") matchesStock = product.quantity === 0;
      else if (filterStockStatus === "in") matchesStock = product.quantity > product.min_stock;
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
    <div className="space-y-6">
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تصدير التقرير
          </button>
          <Link
            href="/dashboard/products/new"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة منتج جديد
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-b-4 border-primary">
          <div className="text-2xl font-black text-primary">{stats.total}</div>
          <div className="text-xs text-gray-500">إجمالي المنتجات</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-b-4 border-amber-500">
          <div className="text-2xl font-black text-amber-600">{stats.lowStock}</div>
          <div className="text-xs text-gray-500">مخزون منخفض</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-b-4 border-red-500">
          <div className="text-2xl font-black text-red-600">{stats.outOfStock}</div>
          <div className="text-xs text-gray-500">غير متوفر</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-b-4 border-emerald-500">
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalInventoryValue)}</div>
          <div className="text-xs text-gray-500">قيمة المخزون</div>
        </div>
        <div className="bg-white rounded-xl p-4 text-center shadow-sm border-b-4 border-blue-500">
          <div className="text-2xl font-black text-blue-600">{stats.avgStock}</div>
          <div className="text-xs text-gray-500">متوسط الكمية</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ابحث باسم المنتج، الوصف، أو التاغ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white">
            <option value="all">كل الفئات</option>
            <option value="men">رجالي</option>
            <option value="women">حريمي</option>
            <option value="kids">أطفال</option>
            <option value="uniform">يونيفورم</option>
          </select>
          <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none bg-white">
            <option value="all">كل المنتجات</option>
            <option value="low">⚠️ مخزون منخفض</option>
            <option value="out">❌ غير متوفر</option>
            <option value="in">✅ مخزون كاف</option>
          </select>
          {filteredProducts.length > 0 && (
            <button onClick={() => setShowBulkUpdate(true)} className="px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-all">
              تحديث جماعي
            </button>
          )}
        </div>
        <div className="mt-3 text-xs text-gray-400">
          عرض {filteredProducts.length} منتج من أصل {products.length}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const isLowStock = product.quantity <= product.min_stock;
          const isOutOfStock = product.quantity === 0;
          const stockPercentage = Math.min(100, Math.round((product.quantity / product.min_stock) * 100));
          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group ${isOutOfStock ? "border-r-4 border-r-red-500" : isLowStock ? "border-r-4 border-r-amber-500" : "border-r-4 border-r-transparent"
                }`}
            >
              <div className="relative h-48 overflow-hidden">
                <img src={product.hero_image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {product.badge && (
                  <span className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded-lg text-xs font-bold">{product.badge}</span>
                )}
                {isOutOfStock && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold animate-pulse">❌ غير متوفر</span>
                )}
                {isLowStock && !isOutOfStock && (
                  <span className="absolute top-3 left-3 bg-amber-500 text-white px-2 py-1 rounded-lg text-xs font-bold">⚠️ مخزون منخفض</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">{getCategoryLabel(product.category)}</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(product.price)}</span>
                </div>
                <h3 className="font-bold text-secondary mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.summary}</p>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">الكمية المتوفرة</span>
                    <span className={`font-bold ${isLowStock ? "text-amber-600" : "text-gray-700"}`}>
                      {product.quantity} / {product.min_stock}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${isOutOfStock ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowEditQuantityModal(product);
                      setNewQuantityValue(product.quantity);
                    }}
                    className="flex-1 mr-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-sm transition-all"
                  >
                    الكمية: {product.quantity}
                  </button>
                  <div className="flex gap-1">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="p-2 text-gray-500 hover:text-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button onClick={() => setShowDeleteModal(product.id)} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-secondary mb-2">لا توجد منتجات</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchTerm ? "لا توجد نتائج مطابقة للبحث" : "لم تقم بإضافة أي منتجات بعد"}
          </p>
          <Link href="/dashboard/products/new" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة منتج جديد
          </Link>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-secondary">تحديث كميات متعددة</h3>
              <p className="text-gray-500 text-sm mt-1">اختر المنتجات ثم أدخل الكمية الجديدة</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-semibold">المنتجات المختارة ({selectedProducts.size})</span>
                <button onClick={selectAll} className="text-xs text-primary font-semibold hover:underline">
                  {selectedProducts.size === filteredProducts.length ? "إلغاء الكل" : "اختيار الكل"}
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredProducts.slice(0, 10).map(product => (
                  <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => toggleSelectProduct(product.id)} className="w-4 h-4 rounded border-gray-300 text-primary" />
                    <span className="text-sm flex-1">{product.name}</span>
                    <span className="text-xs text-gray-500">الكمية: {product.quantity}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية الجديدة</label>
                <input
                  type="number"
                  value={bulkUpdateValue}
                  onChange={(e) => setBulkUpdateValue(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                  min="0"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowBulkUpdate(false); setSelectedProducts(new Set()); }} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">إلغاء</button>
                <button onClick={handleBulkUpdate} className="flex-1 px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark">تحديث ({selectedProducts.size})</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">تأكيد الحذف</h3>
              <p className="text-gray-500 mb-6">هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(null)} className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">إلغاء</button>
                <button onClick={() => handleDeleteProduct(showDeleteModal)} className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700">حذف</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quantity Modal */}
      {showEditQuantityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-secondary mb-4">تحديث الكمية - {showEditQuantityModal.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية الحالية: {showEditQuantityModal.quantity}</label>
                <input
                  type="number"
                  value={newQuantityValue}
                  onChange={(e) => setNewQuantityValue(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-lg font-semibold"
                  min="0"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  التغيير: {newQuantityValue > showEditQuantityModal.quantity ? "+" : ""}{newQuantityValue - showEditQuantityModal.quantity}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <p className="text-sm text-blue-700 font-semibold">
                  ℹ️ سيتم تسجيل هذا التعديل تلقائياً في حركات المخزون
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditQuantityModal(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveNewQuantity}
                  disabled={updatingQuantity === showEditQuantityModal.id}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {updatingQuantity === showEditQuantityModal.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ التعديل"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}