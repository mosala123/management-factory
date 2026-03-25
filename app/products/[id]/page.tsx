// app/products/[id]/page.tsx
"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatCurrency, getCategoryLabel } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/client";
import { addToCart } from "@/lib/cart";

// مكون معرض الصور
const ImageGallery = ({ images, productName }: { images: string[]; productName: string }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const allImages = images.filter(img => img);

  if (allImages.length === 0) return null;

  return (
    <div className="space-y-4">
      <div 
        className="relative rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <div className="relative h-[500px] overflow-hidden">
          <img
            src={allImages[selectedImage]}
            alt={`${productName}`}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isZoomed ? "scale-150" : "scale-100"
            }`}
          />
        </div>
        
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                selectedImage === index
                  ? "border-primary shadow-lg scale-95"
                  : "border-transparent hover:border-primary/50"
              }`}
            >
              <img
                src={image}
                alt={`${productName}`}
                className="w-full h-24 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ProductDetailsPage() {
  const params = useParams();
  const supabase = createClient();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs">("description");

  const slug = params.id as string;

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setIsLoading(true);
    
    const { data: productData } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (productData) {
      setProduct(productData);
      
      const { data: related } = await supabase
        .from("products")
        .select("*")
        .eq("category", productData.category)
        .neq("id", productData.id)
        .limit(3);
      
      setRelatedProducts(related || []);
    }
    
    setIsLoading(false);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    const result = await addToCart(product, quantity);
    
    if (result.error) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error.message || "حدث خطأ غير متوقع";

      if (errorMessage.includes("تسجيل الدخول")) {
        toast.error("✋ يجب تسجيل الدخول أولاً", {
          duration: 4000,
          icon: "🔐",
        });
      } else {
        toast.error("❌ فشل إضافة المنتج للسلة", {
          duration: 3000,
        });
      }
    } else {
      toast.success(`✅ تم إضافة ${product.name} إلى السلة`, {
        duration: 3000,
        icon: "🛒",
      });
    }
    setIsAddingToCart(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">جاري تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const allImages = [product.hero_image, ...(product.gallery || [])].filter(Boolean);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="container-custom mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/products" className="text-gray-500 hover:text-primary transition-colors">
              المنتجات
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-primary font-semibold line-clamp-1">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="container-custom mx-auto py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="animate-fade-in-up">
            <ImageGallery images={allImages} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="animate-fade-in-up delay-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                {getCategoryLabel(product.category)}
              </span>
              {product.badge && (
                <span className="text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-dark px-3 py-1.5 rounded-full">
                  {product.badge}
                </span>
              )}
              {product.in_stock ? (
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                  متوفر في المخزون
                </span>
              ) : (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                  غير متوفر
                </span>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-secondary mb-4">
              {product.name}
            </h1>

            <div className="mb-6">
              <span className="text-3xl font-black text-primary">
                {formatCurrency(product.price)}
              </span>
              <span className="text-gray-500 mr-2">/ للقطعة</span>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                الكمية المطلوبة
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-16 text-center text-xl font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <span className="text-gray-500 text-sm mr-2">قطعة</span>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الإجمالي التقريبي:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(product.price * quantity)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                *السعر النهائي يحدد حسب الكمية والمواصفات المطلوبة
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-70"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإضافة...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    أضف للسلة
                  </>
                )}
              </button>
              <Link
                href="/products"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold hover:border-primary hover:text-primary transition-all duration-300"
              >
                العودة للمنتجات
              </Link>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-16">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 text-lg font-semibold transition-all duration-300 relative ${
                  activeTab === "description"
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                الوصف التفصيلي
                {activeTab === "description" && (
                  <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              {product.specs && product.specs.length > 0 && (
                <button
                  onClick={() => setActiveTab("specs")}
                  className={`pb-4 text-lg font-semibold transition-all duration-300 relative ${
                    activeTab === "specs"
                      ? "text-primary"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  المواصفات الفنية
                  {activeTab === "specs" && (
                    <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="py-8">
            {activeTab === "description" ? (
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6">
                <ul className="space-y-3">
                  {product.specs?.map((spec: string, index: number) => (
                    <li key={index} className="flex items-center gap-3 text-gray-600">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-secondary mb-8">
              منتجات مشابهة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/products/${related.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={related.hero_image}
                      alt={related.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-secondary mb-2 line-clamp-1">
                      {related.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {related.summary}
                    </p>
                    <p className="text-primary font-bold">
                      {formatCurrency(related.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark py-16 mt-12">
        <div className="container-custom mx-auto text-center">
          <h2 className="text-2xl lg:text-3xl font-black text-white mb-4">
            هل تريد تخصيص هذا المنتج؟
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            يمكننا تعديل المواصفات والألوان والمقاسات حسب احتياجاتك الخاصة
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            اطلب عرض سعر مخصص
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
