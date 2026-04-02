"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

// ─── helpers ───────────────────────────────────────────────
function isValidImg(src: string) {
  const s = src.trim();
  if (!s) return false;
  if (s.startsWith("data:image/") || s.startsWith("blob:")) return true;
  try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
}

function slugify(name: string) {
  const map: Record<string, string> = {
    ا:"a",ب:"b",ت:"t",ث:"th",ج:"g",ح:"h",خ:"kh",د:"d",ذ:"th",ر:"r",ز:"z",
    س:"s",ش:"sh",ص:"s",ض:"d",ط:"t",ظ:"z",ع:"a",غ:"gh",ف:"f",ق:"q",ك:"k",
    ل:"l",م:"m",ن:"n",ه:"h",و:"w",ي:"y",ة:"h",ى:"a",
  };
  return name.toLowerCase()
    .replace(/[^\x00-\x7F]/g, (c) => map[c] || "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

const CATS = [
  { value:"men",   label:"رجالي",   icon:"👔" },
  { value:"women", label:"حريمي",   icon:"👗" },
  { value:"kids",  label:"أطفال",   icon:"🧸" },
  { value:"uniform",label:"يونيفورم",icon:"🦺" },
];

const STEPS = [
  { id:1, label:"المعلومات",  icon:"📦" },
  { id:2, label:"الصور",      icon:"🖼️" },
  { id:3, label:"التفاصيل",  icon:"📝" },
  { id:4, label:"المخزون",   icon:"🏪" },
];

type FormData = {
  id: string; name: string; slug: string;
  category: "men"|"women"|"kids"|"uniform";
  price: string; quantity: string; min_stock: string;
  heroImage: string; gallery: string[];
  summary: string; description: string;
  specs: string[]; tags: string[];
  badge: string; inStock: boolean;
};

// ─── component ─────────────────────────────────────────────
export default function EditProductPage() {
  const router  = useRouter();
  const params  = useParams();
  const supabase = createClient();
  const productId = params.id as string;

  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [slugLoading, setSlugLoading] = useState(false);
  const [hasChanges, setHasChanges]   = useState(false);
  const originalRef = useRef<FormData | null>(null);

  const [form, setForm] = useState<FormData>({
    id:"", name:"", slug:"", category:"men",
    price:"", quantity:"0", min_stock:"10",
    heroImage:"", gallery:[],
    summary:"", description:"",
    specs:[], tags:[], badge:"", inStock:true,
  });

  const [newSpec, setNewSpec]   = useState("");
  const [newTag, setNewTag]     = useState("");
  const [newImg, setNewImg]     = useState("");

  // ── fetch product ──
  useEffect(() => {
    if (!productId) return;
    (async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).single();
      if (error) { toast.error("حدث خطأ في جلب المنتج"); router.push("/dashboard/products"); return; }
      const loaded: FormData = {
        id: data.id, name: data.name, slug: data.slug,
        category: data.category,
        price: data.price.toString(),
        quantity: (data.quantity ?? 0).toString(),
        min_stock: (data.min_stock ?? 10).toString(),
        heroImage: data.hero_image,
        gallery: data.gallery ?? [],
        summary: data.summary ?? "",
        description: data.description ?? "",
        specs: data.specs ?? [],
        tags: data.tags ?? [],
        badge: data.badge ?? "",
        inStock: data.in_stock ?? true,
      };
      setForm(loaded);
      originalRef.current = loaded;
      setLoading(false);
    })();
  }, [productId]);

  // ── track changes ──
  useEffect(() => {
    if (!originalRef.current) return;
    setHasChanges(JSON.stringify(form) !== JSON.stringify(originalRef.current));
  }, [form]);

  const set = (key: keyof FormData, value: any) =>
    setForm(p => ({ ...p, [key]: value }));

  // ── auto-generate unique slug ──
  const autoSlug = useCallback(async (name: string) => {
    if (!name || !form.id) return;
    setSlugLoading(true);
    const base = slugify(name);
    let slug = base; let i = 1;
    while (true) {
      const { data } = await supabase.from("products").select("id").eq("slug", slug).neq("id", form.id).maybeSingle();
      if (!data) break;
      slug = `${base}-${i++}`;
    }
    set("slug", slug);
    setSlugLoading(false);
  }, [form.id, supabase]);

  // ── handle name change → auto-slug ──
  const handleNameChange = (v: string) => {
    set("name", v);
    if (v.length > 2) autoSlug(v);
  };

  // ── file upload ──
  const readFile = (file: File, cb: (b64: string) => void) => {
    const r = new FileReader();
    r.onloadend = () => cb(r.result as string);
    r.readAsDataURL(file);
  };

  // ── submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.heroImage) {
      toast.error("يرجى ملء الحقول المطلوبة"); return;
    }
    setSaving(true);

    const { error } = await supabase.from("products").update({
      name: form.name,
      slug: form.slug,
      category: form.category,
      price: parseInt(form.price),
      quantity: parseInt(form.quantity) || 0,
      min_stock: parseInt(form.min_stock) || 10,
      hero_image: form.heroImage,
      gallery: form.gallery,
      summary: form.summary,
      description: form.description,
      specs: form.specs,
      tags: form.tags,
      badge: form.badge || null,
      in_stock: form.inStock,
    }).eq("id", form.id);

    if (error) {
      toast.error("حدث خطأ في تحديث المنتج");
    } else {
      toast.success("✅ تم تحديث المنتج بنجاح");
      originalRef.current = { ...form };
      setHasChanges(false);
      router.push("/dashboard/products");
    }
    setSaving(false);
  };

  // ── derived stock state ──
  const qty     = parseInt(form.quantity) || 0;
  const minStk  = parseInt(form.min_stock) || 10;
  const isOut   = qty === 0;
  const isLow   = qty > 0 && qty <= minStk;
  const stockOk = !isOut && !isLow;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">جاري تحميل المنتج...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50" dir="rtl">

      {/* ── sticky header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/products"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                تعديل: <span className="text-primary">{form.name || "..."}</span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-400">الخطوة {step} من {STEPS.length}</p>
                {hasChanges && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    • تغييرات غير محفوظة
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* step pills */}
          <div className="hidden md:flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <button type="button"
                  onClick={() => s.id < step && setStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    s.id === step      ? "bg-primary text-white shadow-sm" :
                    s.id < step        ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200" :
                                         "bg-gray-100 text-gray-400"
                  }`}>
                  <span>{s.id < step ? "✓" : s.icon}</span>
                  <span className="hidden lg:block">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 ${s.id < step ? "bg-green-300" : "bg-gray-200"}`}/>
                )}
              </div>
            ))}
          </div>

          {/* preview link */}
          <Link href={`/products/${form.slug}`} target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-gray-50 border border-gray-200 shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            معاينة
          </Link>
        </div>

        {/* mobile progress bar */}
        <div className="md:hidden h-1 bg-gray-100">
          <div className="h-full bg-primary transition-all duration-500" style={{ width:`${(step/STEPS.length)*100}%` }}/>
        </div>
      </div>

      {/* ── stock alert banner ── */}
      {(isOut || isLow) && (
        <div className={`mx-auto max-w-5xl px-6 pt-4`}>
          <div className={`rounded-2xl p-4 flex items-center gap-3 ${isOut ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
            <span className="text-2xl">{isOut ? "❌" : "⚠️"}</span>
            <div>
              <p className={`font-bold text-sm ${isOut ? "text-red-700" : "text-amber-700"}`}>
                {isOut ? "المنتج غير متوفر في المخزون!" : "مخزون منخفض!"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {isOut ? "الكمية صفر — يرجى التحديث من الخطوة الأخيرة." : `الكمية (${qty}) أقل من الحد الأدنى (${minStk}).`}
              </p>
            </div>
            <button onClick={() => setStep(4)}
              className={`mr-auto text-xs font-semibold px-3 py-1.5 rounded-lg ${isOut ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"} transition-colors`}>
              تحديث المخزون
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* ════════════ STEP 1 ════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📦</div>
                <h2 className="text-2xl font-bold text-gray-900">المعلومات الأساسية</h2>
                <p className="text-gray-500 mt-1 text-sm">اسم المنتج والفئة والسعر</p>
              </div>

              {/* name */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  اسم المنتج <span className="text-red-400">*</span>
                </label>
                <input type="text" value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-lg transition-all"
                  placeholder="مثال: قميص بولو كلاسيك" required/>
                {/* slug preview */}
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-xs text-gray-400 font-mono truncate">
                    🔗 /products/{slugLoading ? "..." : form.slug || "..."}
                  </p>
                  {slugLoading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"/>}
                </div>
              </div>

              {/* category */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3">الفئة <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATS.map(c => (
                    <button key={c.value} type="button"
                      onClick={() => set("category", c.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.category === c.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      <span>{c.icon}</span><span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* price + badge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">السعر (ج.م) <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type="number" value={form.price}
                      onChange={e => set("price", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-2xl font-bold transition-all"
                      placeholder="0" required/>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">ج.م</span>
                  </div>
                  {form.price && (
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      💰 {parseInt(form.price).toLocaleString("ar-EG")} جنيه
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">شارة المنتج (اختياري)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {["الأكثر مبيعاً","جديد","خصم","محدود","مميز"].map(b => (
                      <button key={b} type="button"
                        onClick={() => set("badge", form.badge === b ? "" : b)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${form.badge === b ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={form.badge}
                    onChange={e => set("badge", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="شارة مخصصة..."/>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ STEP 2 ════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🖼️</div>
                <h2 className="text-2xl font-bold text-gray-900">صور المنتج</h2>
                <p className="text-gray-500 mt-1 text-sm">الصورة الرئيسية ومعرض الصور</p>
              </div>

              {/* hero image */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  الصورة الرئيسية <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <input type="url" value={form.heroImage}
                      onChange={e => set("heroImage", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                      placeholder="الصق رابط الصورة..."/>
                    <div className="text-center text-gray-400 text-xs">— أو —</div>
                    <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 cursor-pointer hover:border-primary hover:text-primary transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                      </svg>
                      <span className="text-sm font-medium">اختر من جهازك</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f, b => set("heroImage", b)); }}/>
                    </label>
                  </div>
                  <div className="flex items-center justify-center">
                    {isValidImg(form.heroImage) ? (
                      <div className="relative group">
                        <img src={form.heroImage} alt="معاينة" className="w-40 h-40 object-cover rounded-2xl shadow-md"/>
                        <button type="button" onClick={() => set("heroImage", "")}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">×</button>
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">✓ تم</div>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span className="text-xs">معاينة</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* gallery */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  معرض الصور <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <div className="flex gap-2 mb-4">
                  <input type="url" value={newImg}
                    onChange={e => setNewImg(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); if(newImg.trim()&&isValidImg(newImg.trim())){set("gallery",[...form.gallery,newImg.trim()]);setNewImg("");} }}}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                    placeholder="رابط صورة إضافية..."/>
                  <button type="button"
                    onClick={() => { if(!newImg.trim())return; if(!isValidImg(newImg.trim())){toast.error("رابط غير صالح");return;} set("gallery",[...form.gallery,newImg.trim()]);setNewImg(""); }}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">إضافة</button>
                  <label className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium cursor-pointer hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                    📁 رفع
                    <input type="file" accept="image/*" multiple className="hidden"
                      onChange={e => Array.from(e.target.files||[]).forEach(f => readFile(f, b => set("gallery",[...form.gallery,b])))}/>
                  </label>
                </div>

                {form.gallery.length > 0 ? (
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                    {form.gallery.map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        {isValidImg(img)
                          ? <img src={img} alt="" className="w-full h-full object-cover rounded-xl"/>
                          : <div className="w-full h-full rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-400 text-xs">!</div>}
                        <button type="button" onClick={() => set("gallery", form.gallery.filter((_,j)=>j!==i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300 cursor-pointer hover:border-primary hover:text-primary transition-all">
                      <span className="text-xl">+</span>
                      <input type="file" accept="image/*" multiple className="hidden"
                        onChange={e => Array.from(e.target.files||[]).forEach(f => readFile(f, b => set("gallery",[...form.gallery,b])))}/>
                    </label>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                    لا توجد صور في المعرض
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ STEP 3 ════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">📝</div>
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل المنتج</h2>
                <p className="text-gray-500 mt-1 text-sm">الوصف والمواصفات والتاغات</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">ملخص المنتج <span className="text-red-400">*</span></label>
                      <span className="text-xs text-gray-400">{form.summary.length} حرف</span>
                    </div>
                    <textarea value={form.summary} onChange={e => set("summary", e.target.value)} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none text-sm transition-all"
                      placeholder="وصف قصير يظهر في بطاقة المنتج..." required/>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-semibold text-gray-700">الوصف التفصيلي <span className="text-red-400">*</span></label>
                      <span className="text-xs text-gray-400">{form.description.length} حرف</span>
                    </div>
                    <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={7}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none text-sm transition-all"
                      placeholder="وصف مفصل للمنتج، خامات، مميزات..." required/>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* specs */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">المواصفات</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={newSpec} onChange={e => setNewSpec(e.target.value)}
                        onKeyDown={e => { if(e.key==="Enter"){e.preventDefault(); if(newSpec.trim()){set("specs",[...form.specs,newSpec.trim()]);setNewSpec("");}} }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                        placeholder="مثال: قطن 100%"/>
                      <button type="button" onClick={() => { if(newSpec.trim()){set("specs",[...form.specs,newSpec.trim()]);setNewSpec("");} }}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 font-medium">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.specs.length === 0 && <p className="text-xs text-gray-400">لا توجد مواصفات بعد</p>}
                      {form.specs.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                          {s}
                          <button type="button" onClick={() => set("specs", form.specs.filter((_,j)=>j!==i))}
                            className="text-gray-400 hover:text-red-500 mr-1 text-xs leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* tags */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">التاغات</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if(e.key==="Enter"){e.preventDefault(); if(newTag.trim()){set("tags",[...form.tags,newTag.trim()]);setNewTag("");}} }}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-primary outline-none text-sm"
                        placeholder="مثال: صيفي"/>
                      <button type="button" onClick={() => { if(newTag.trim()){set("tags",[...form.tags,newTag.trim()]);setNewTag("");} }}
                        className="px-3 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 font-medium">+</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.tags.length === 0 && <p className="text-xs text-gray-400">لا توجد تاغات بعد</p>}
                      {form.tags.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                          #{t}
                          <button type="button" onClick={() => set("tags", form.tags.filter((_,j)=>j!==i))}
                            className="text-primary/50 hover:text-red-500 mr-1 text-xs">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════ STEP 4 ════════════ */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🏪</div>
                <h2 className="text-2xl font-bold text-gray-900">المخزون والنشر</h2>
                <p className="text-gray-500 mt-1 text-sm">الكمية والحالة قبل الحفظ</p>
              </div>

              {/* quantity inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية المتوفرة <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => set("quantity", String(Math.max(0, qty-1)))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors flex items-center justify-center">−</button>
                    <input type="number" value={form.quantity} min="0"
                      onChange={e => set("quantity", e.target.value)}
                      className={`flex-1 text-center px-4 py-2.5 rounded-xl border-2 outline-none text-xl font-bold transition-all ${
                        isOut ? "border-red-300 bg-red-50" : isLow ? "border-amber-300 bg-amber-50" : "border-gray-200 focus:border-primary"
                      }`}/>
                    <button type="button" onClick={() => set("quantity", String(qty+1))}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors flex items-center justify-center">+</button>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isOut?"bg-red-500":isLow?"bg-amber-500":"bg-green-500"}`}/>
                    <p className={`text-xs font-medium ${isOut?"text-red-600":isLow?"text-amber-600":"text-green-600"}`}>
                      {isOut ? "سيظهر غير متوفر" : isLow ? "مخزون منخفض" : "مخزون كافي ✓"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">حد التنبيه (الأدنى)</label>
                  <input type="number" value={form.min_stock} min="0"
                    onChange={e => set("min_stock", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-xl font-bold transition-all"/>
                  <p className="text-xs text-gray-400 mt-2">تنبيه عندما تنخفض الكمية عن هذا الرقم</p>
                </div>
              </div>

              {/* stock bar */}
              {qty > 0 && minStk > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <p className="text-sm font-semibold text-gray-700 mb-3">مستوى المخزون</p>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isOut?"bg-red-500":isLow?"bg-amber-400":"bg-green-500"}`}
                      style={{ width:`${Math.min(100,(qty/(minStk*3))*100)}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>0</span>
                    <span>حد التنبيه: {minStk}</span>
                    <span>{minStk*3}+</span>
                  </div>
                </div>
              )}

              {/* in-stock toggle */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-700">حالة النشر في المتجر</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {form.inStock ? "✅ المنتج ظاهر ومتاح للشراء" : "🔴 المنتج مخفي من المتجر"}
                    </p>
                  </div>
                  <button type="button" onClick={() => set("inStock", !form.inStock)}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${form.inStock ? "bg-green-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.inStock ? "right-1" : "left-1"}`}/>
                  </button>
                </div>
              </div>

              {/* summary card */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
                <p className="text-sm font-bold text-primary mb-4">ملخص المنتج قبل الحفظ</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["الاسم", form.name||"—"],
                    ["السعر", form.price ? `${parseInt(form.price).toLocaleString("ar-EG")} ج.م` : "—"],
                    ["الفئة", CATS.find(c=>c.value===form.category)?.label||"—"],
                    ["الكمية", `${form.quantity} قطعة`],
                    ["الصور", isValidImg(form.heroImage)?`${1+form.gallery.length} صورة`:"لا توجد"],
                    ["الحالة", form.inStock ? "✅ منشور" : "🔴 مخفي"],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <span className="text-gray-500">{k}: </span>
                      <span className="font-medium text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
                {hasChanges && (
                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 font-medium">
                      ⚠️ لديك تغييرات غير محفوظة — اضغط "حفظ التغييرات" لتأكيدها
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── navigation ── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setStep(s=>s-1)} disabled={step===1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              السابق
            </button>

            <span className="text-sm text-gray-400">{step} / {STEPS.length}</span>

            {step < STEPS.length ? (
              <button type="button"
                onClick={() => {
                  if (step===1 && (!form.name||!form.price)) { toast.error("يرجى إكمال الاسم والسعر"); return; }
                  if (step===2 && !isValidImg(form.heroImage)) { toast.error("يرجى إضافة صورة رئيسية"); return; }
                  setStep(s=>s+1);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors">
                التالي
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            ) : (
              <button type="submit" disabled={saving||!hasChanges}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  hasChanges
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                } disabled:opacity-70`}>
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>جاري الحفظ...</>
                ) : hasChanges ? (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>حفظ التغييرات</>
                ) : (
                  "لا توجد تغييرات"
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}