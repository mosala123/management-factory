# My Clothing Factory - نظام إدارة مصنع الملابس 👕

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

نظام متكامل لإدارة مصنع الملابس يتضمن إدارة المنتجات والطلبات والمخزون والإنتاج.

---

## ✨ المميزات الرئيسية

✅ **إدارة المنتجات** - إنشاء وتعديل وحذف المنتجات
✅ **إدارة الطلبات** - تتبع الطلبات من الإنشاء حتى التسليم
✅ **إدارة المخزون** - تتبع المخزون والمنتجات ذات المخزون المنخفض
✅ **إدارة الإنتاج** - تتبع مراحل الإنتاج والعمال
✅ **إدارة المستخدمين** - إدارة الموظفين والأدوار والصلاحيات
✅ **لوحة تحكم شاملة** - إحصائيات وتقارير فورية
✅ **نظام مصادقة آمن** - تسجيل الدخول عبر Supabase
✅ **API متكاملة** - RESTful API endpoints لجميع العمليات
✅ **واجهة عربية** - دعم كامل للغة العربية

---

## 🛠️ المتطلبات

- **Node.js** >= 18.0.0
- **npm** أو **yarn**
- **Supabase** account (مجاني)
- **Git**

---

## 🚀 التثبيت والإعداد

### 1️⃣ استنساخ المستودع

```bash
git clone <repository-url>
cd my-clothing-factory
```

### 2️⃣ تثبيت الاعتماديات

```bash
npm install
# أو
yarn install
```

### 3️⃣ إعداد متغيرات البيئة

```bash
# انسخ ملف المثال
cp .env.example .env.local

# أضف بيانات Supabase الخاصة بك
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 4️⃣ إعداد قاعدة البيانات

انسخ الـ SQL من [API_DOCS.md](./API_DOCS.md) وأنشئ الجداول في Supabase.

### 5️⃣ تشغيل التطبيق

```bash
npm run dev
# الآن تطبيقك يعمل على http://localhost:3000
```

---

## 📁 هيكل المشروع

```
My-Clothing-Factory/
├── app/                              # تطبيق Next.js
│   ├── api/                          # API endpoints
│   │   ├── products/  [id]/route.ts  # منتجات CRUD
│   │   ├── orders/    [id]/route.ts  # طلبات CRUD
│   │   ├── users/     [id]/route.ts  # مستخدمين CRUD
│   │   ├── inventory/ route.ts       # مخزون
│   │   └── production/[id]/route.ts  # إنتاج CRUD
│   ├── (admin)/                      # Admin pages
│   │   ├── dashboard/                # لوحة تحكم
│   │   ├── products/                 # إدارة المنتجات
│   │   ├── inventory/                # إدارة المخزون
│   │   ├── orders/                   # إدارة الطلبات
│   │   ├── production/               # إدارة الإنتاج
│   │   └── users/                    # إدارة المستخدمين
│   ├── login/                        # صفحة تسجيل الدخول
│   ├── layout.tsx                    # تخطيط رئيسي
│   └── page.tsx                      # الصفحة الرئيسية
│
├── components/                       # مكونات React
│   ├── forms/
│   │   ├── ProductForm.tsx           # نموذج المنتج
│   │   ├── OrderForm.tsx             # نموذج الطلب
│   │   └── UserForm.tsx              # نموذج المستخدم
│   ├── LoadingSpinner.tsx            # مؤشر التحميل
│   └── EmptyState.tsx                # حالة فارغة
│
├── hooks/                            # Custom React hooks
│   ├── useApi.ts                     # hook عام للـ API
│   ├── useProducts.ts                # hook للمنتجات
│   ├── useOrders.ts                  # hook للطلبات
│   ├── useUsers.ts                   # hook للمستخدمين
│   ├── useInventory.ts               # hook للمخزون
│   └── useProduction.ts              # hook للإنتاج
│
├── lib/                              # دوال مساعدة
│   ├── helpers.ts                    # دوال مساعدة عامة
│   ├── auth-utils.ts                 # دوال المصادقة
│   ├── auth-role.ts                  # الأدوار والصلاحيات
│   ├── validation.ts                 # التحقق من البيانات
│   ├── site-data.ts                  # بيانات الموقع
│   ├── types/
│   │   ├── api.ts                    # أنواع API
│   │   └── database.ts               # أنواع قاعدة البيانات
│   └── supabase/
│       ├── client.ts                 # عميل Supabase للمتصفح
│       └── server.ts                 # عميل Supabase للخادم
│
├── public/                           # ملفات ثابتة
├── middleware.ts                     # middleware للحماية
├── next.config.ts                    # إعدادات Next.js
├── tailwind.config.js                # إعدادات Tailwind
├── tsconfig.json                     # إعدادات TypeScript
├── package.json                      # الاعتماديات
├── .env.example                      # مثال على متغيرات البيئة
├── API_DOCS.md                       # توثيق API
└── README.md                         # هذا الملف
```

---

## 🔐 نظام الأدوار والصلاحيات

### الأدوار المتاحة:

| الدور | الوصف | الصلاحيات |
|------|-------|---------|
| **مدير** | إدارة شاملة للنظام | جميع الصلاحيات |
| **مشرف المنتجات** | إدارة المنتجات والإنتاج | تعديل وإضافة المنتجات + تتبع الإنتاج |
| **مشرف المخزون** | إدارة المخزون | تحديث المخزون فقط |
| **عارض** | عرض البيانات فقط | عرض قراءة فقط |
| **عميل** | عميل خارجي | إنشاء طلبات فقط |

---

## 📡 استخدام API

### مثال: جلب المنتجات

```typescript
import { useProducts } from '@/hooks/useProducts';

export function ProductList() {
  const { products, isLoading, fetchProducts } = useProducts();

  useEffect(() => {
    fetchProducts(1, 10, 'men'); // الصفحة 1، 10 عناصر، فئة رجالي
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {products.map(p => (
        <div key={p.id}>{p.name} - {p.price}</div>
      ))}
    </div>
  );
}
```

### مثال: إنشاء طلب

```typescript
import { useOrders } from '@/hooks/useOrders';

export function CreateOrder() {
  const { createOrder, isLoading } = useOrders();

  const handleSubmit = async (formData) => {
    await createOrder({
      customer_name: 'أحمد محمد',
      customer_email: 'ahmed@example.com',
      customer_phone: '+201001234567',
      shipping_address: 'القاهرة',
      items: [
        { product_id: 'uuid', quantity: 5 }
      ]
    });
  };

  return <OrderForm onSubmit={handleSubmit} isLoading={isLoading} />;
}
```

---

## 🎨 المكونات المتاحة

### Forms
- `ProductForm` - نموذج إنشاء/تعديل المنتجات
- `OrderForm` - نموذج إنشاء الطلبات
- `UserForm` - نموذج إنشاء/تعديل المستخدمين

### Utilities
- `LoadingSpinner` - مؤشر تحميل
- `EmptyState` - حالة عدم وجود بيانات
- Helper functions في `lib/helpers.ts`

---

## 📦 الاعتماديات الرئيسية

- **Next.js 16** - Framework React حديث
- **React 19** - مكتبة واجهات المستخدم
- **TypeScript** - نوع آمن JavaScript
- **Tailwind CSS 4** - تنسيق الواجهة
- **Supabase** - Backend و Authentication
- **React Hot Toast** - إشعارات سريعة

---

## 📝 التكوينات

### Tailwind CSS
تم تكوينها بألوان مخصصة وأنماط عربية في `tailwind.config.js`

### TypeScript
إعدادات صارمة في `tsconfig.json` لضمان سلامة الكود

### ESLint
فحص جودة الكود في `eslint.config.mjs`

---

## 🚀 النشر

### النشر على Vercel

```bash
# تسجيل الدخول
vercel login

# النشر
vercel deploy
```

### متغيرات البيئة المطلوبة
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## 🧪 الاختبار

```bash
# تشغيل linting
npm run lint

# بناء الإنتاج
npm run build
```

---

## 📖 التوثيق

راجع [API_DOCS.md](./API_DOCS.md) للتوثيق الكامل للـ API endpoints والأمثلة.

---

## 🤝 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/amazing`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing`)
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License - انظر ملف [LICENSE](./LICENSE) للتفاصيل.

---

## 👥 الفريق

- **المطور** - Full Stack Developer
- **التصميم** - UI/UX Designer

---

## 📧 دعم

للأسئلة والدعم، يرجى التواصل:
- **البريد الإلكتروني:** support@ibdaa.com
- **الهاتف:** +20 (0) 1001234567

---

## 🎯 خارطة الطريق

- [ ] إضافة تقارير متقدمة
- [ ] تكامل الدفع الإلكتروني
- [ ] تطبيق الهاتف المحمول
- [ ] نظام الإشعارات الفورية
- [ ] التكامل مع الشركات اللوجستية

---

**شكراً لاستخدامك نظام إدارة مصنع الملابس!** 🙏
