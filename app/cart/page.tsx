// app/cart/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { resolveUserRole } from "@/lib/auth-role";
import { formatCurrency } from "@/lib/site-data";
import { getCart, updateCartItemQuantity, removeFromCart, clearCart, submitOrder } from "@/lib/cart";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const router = useRouter();
  const supabase = createClient();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [canViewCart, setCanViewCart] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // جلب بيانات السلة
  const loadCart = async () => {
    setIsLoading(true);
    const { items, total } = await getCart();
    setCartItems(items);
    setTotal(total);
    setIsLoading(false);
  };

  // جلب منتجات مميزة للسلة الفارغة
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .limit(4);
      
      if (data) setFeaturedProducts(data);
    };
    fetchFeaturedProducts();
  }, [supabase]);

  useEffect(() => {
    const initializeCartPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("id", user.id)
          .single();

        const userRole = resolveUserRole(user.email, profile?.role);
        if (userRole === "admin") {
          toast.error("صفحة السلة متاحة للعملاء فقط");
          router.replace("/dashboard");
          return;
        }

        setCustomerInfo(prev => ({
          ...prev,
          email: user.email || "",
          name: profile?.name || "",
        }));
      }

      setCanViewCart(true);
      await loadCart();
    };

    initializeCartPage();
  }, [router, supabase]);

  if (!canViewCart && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري التحقق من صلاحية الوصول...</p>
        </div>
      </div>
    );
  }

  // تحديث الكمية
  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const result = await updateCartItemQuantity(itemId, newQuantity);
    if (result.success) {
      loadCart();
      toast.success("تم تحديث الكمية");
    } else {
      toast.error("حدث خطأ");
    }
  };

  // حذف منتج
  const handleRemoveItem = async (itemId: string, productName: string) => {
    const result = await removeFromCart(itemId);
    if (result.success) {
      loadCart();
      toast.success(`تم إزالة ${productName} من السلة`);
    } else {
      toast.error("حدث خطأ");
    }
  };

  // تفريغ السلة
  const handleClearCart = async () => {
    if (confirm("هل أنت متأكد من تفريغ السلة بالكامل؟")) {
      await clearCart();
      loadCart();
      toast.success("تم تفريغ السلة");
    }
  };

  // تقديم الطلب
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await submitOrder(customerInfo);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("تم إرسال الطلب بنجاح! سيتم التواصل معك قريباً");
      setShowCheckoutForm(false);
      router.push("/orders");
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل السلة...</p>
        </div>
      </div>
    );
  }

  // صفحة السلة الفارغة - تصميم محسن
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom mx-auto">
          {/* Hero Empty Cart */}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 animate-bounce">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-secondary mb-3">سلة التسوق فارغة</h1>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              يبدو أنك لم تقم بإضافة أي منتجات إلى السلة بعد. استعرض منتجاتنا واختر ما يناسبك.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                استعرض المنتجات
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
              >
                طلب عرض سعر مخصص
              </Link>
            </div>
          </div>

          {/* منتجات مقترحة */}
          {featuredProducts.length > 0 && (
            <div className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-secondary">قد يعجبك أيضاً</h2>
                <p className="text-gray-500 mt-1">اكتشف منتجاتنا الأكثر مبيعاً</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={product.hero_image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {product.badge && (
                        <span className="absolute top-3 right-3 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-secondary mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-2">{product.summary}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">{formatCurrency(product.price)}</span>
                        <span className="text-xs text-primary/70">عرض التفاصيل →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
                >
                  عرض جميع المنتجات
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}

          {/* روابط مساعدة */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-secondary mb-1">جودة مضمونة</h3>
                <p className="text-sm text-gray-500">جميع منتجاتنا مطابقة لأعلى معايير الجودة</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-secondary mb-1">توصيل سريع</h3>
                <p className="text-sm text-gray-500">شحن لجميع المحافظات في أسرع وقت</p>
              </div>
              <div className="p-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-secondary mb-1">دعم فني</h3>
                <p className="text-sm text-gray-500">فريق متخصص للرد على استفساراتك</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container-custom mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-secondary">سلة التسوق</h1>
          <p className="text-gray-500 mt-1">مراجعة المنتجات المضافة وإتمام الطلب</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-secondary">{item.product_name}</h3>
                        <p className="text-primary font-bold mt-1">
                          {formatCurrency(item.product_price)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id, item.product_name)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Quantity */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-500 mr-2">قطعة</span>
                    </div>
                  </div>
                  
                  {/* Item Total */}
                  <div className="text-left">
                    <p className="text-sm text-gray-500">الإجمالي</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(item.product_price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <button
              onClick={handleClearCart}
              className="text-red-500 text-sm font-semibold hover:text-red-600 transition-colors"
            >
              تفريغ السلة بالكامل
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-secondary mb-4">ملخص الطلب</h2>
              
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(item.product_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  *السعر النهائي يحدد بعد تأكيد الطلب من قبل فريق المبيعات
                </p>
              </div>

              {!showCheckoutForm ? (
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  متابعة إتمام الطلب
                </button>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      رقم الهاتف *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      ملاحظات إضافية
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none resize-none"
                      placeholder="أي تفاصيل إضافية عن الطلب..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCheckoutForm(false)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      رجوع
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all disabled:opacity-70"
                    >
                      {isSubmitting ? "جاري الإرسال..." : "تأكيد الطلب"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
