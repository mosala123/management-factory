// lib/site-data.ts
import { Category, CategoryItem, FAQ, NavLink, Order, Product, Testimonial } from "./types";

// Navigation Links
export const navLinks: NavLink[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/products", label: "المنتجات" },
  { href: "/about", label: "عن المصنع" },
  { href: "/contact", label: "اتصل بنا" },
];

// Categories for Filtering
export const categories: CategoryItem[] = [
  { id: "all", label: "الكل" },
  { id: "men", label: "رجالي" },
  { id: "women", label: "حريمي" },
  { id: "kids", label: "أطفال" },
  { id: "uniform", label: "يونيفورم" },
];

// Highlights data for homepage
export const highlights = [
  { value: "+10", label: "سنوات خبرة" },
  { value: "+500", label: "عميل مميز" },
  { value: "+50K", label: "قطعة منتجة" },
  { value: "72h", label: "تجهيز العينة" },
];

// Services list
export const services = [
  "تصنيع عينات أولية خلال 72 ساعة",
  "إنتاج كميات صغيرة وكبيرة حسب الطلب",
  "تطوير موديلات خاصة للبراندات",
  "يونيفورم للمطاعم والفنادق والشركات",
  "تطريز وشعارات حسب الهوية البصرية",
  "تغليف وتجهيز نهائي للبيع",
  "استشارات فنية لاختيار الأقمشة المناسبة",
  "توصيل سريع لجميع المحافظات",
];

// Testimonials
export const testimonials: Testimonial[] = [
  {
    name: "أحمد محمود",
    company: "متجر نمط",
    quote: "تعامل محترف وجودة ثابتة في كل دفعة. أنصح بالتعامل معهم لأي براند ناشئ.",
  },
  {
    name: "منى السيد",
    company: "مطعم سفرة",
    quote: "يونيفورم متين وشكل راقي، والتسليم كان في المعاد المتفق عليه بالضبط.",
  },
  {
    name: "خالد إبراهيم",
    company: "شركة المتحدة",
    quote: "فريق محترف ومرن في التعديلات. العينة طلعت مطابقة للمطلوب 100%.",
  },
  {
    name: "سارة علي",
    company: "ماركة لمسة",
    quote: "جودة ممتازة وسعر مناسب. التعاون معهم كان تجربة رائعة وسنكررها.",
  },
];

// FAQs
export const faqs: FAQ[] = [
  {
    question: "كم تستغرق مدة تجهيز العينة؟",
    answer: "تتراوح مدة تجهيز العينة بين 3 إلى 7 أيام حسب تعقيد الموديل ونوع الخامة المطلوبة. نوفر خدمة العينة السريعة خلال 72 ساعة للموديلات البسيطة.",
  },
  {
    question: "ما هي أقل كمية للطلب؟",
    answer: "نقبل الطلبات من 50 قطعة كحد أدنى، مع إمكانية تنفيذ كميات أقل للبراندات الناشئة حسب التفاهم المسبق.",
  },
  {
    question: "هل تقومون بتطريز الشعارات؟",
    answer: "نعم، نوفر خدمة تطريز وطباعة الشعارات حسب الهوية البصرية للعميل، بأحدث التقنيات وبأعلى جودة.",
  },
  {
    question: "ما هي طرق الدفع المتاحة؟",
    answer: "نقبل الدفع المقدم بنسبة 50%، والرصيد المتبقي قبل التسليم أو عند الاستلام حسب الاتفاق. نوفر خيارات دفع متعددة.",
  },
  {
    question: "هل تقومون بالتوصيل خارج القاهرة؟",
    answer: "نعم، نوفر خدمة الشحن لجميع محافظات مصر وبعض الدول العربية حسب الاتفاق، مع متابعة دقيقة.",
  },
  {
    question: "هل يمكن تعديل التصميم بعد العينة؟",
    answer: "نعم، نقبل تعديلات محدودة بعد العينة، ويتم احتساب أي تعديلات إضافية حسب الاتفاق.",
  },
  {
    question: "ما هي الخامات المتوفرة؟",
    answer: "نوفر مجموعة واسعة من الخامات: قطن 100%، بوليستر، مزيج قطن-بوليستر، فسكوز، وغيرها حسب الطلب.",
  },
  {
    question: "هل توفرون خدمة التغليف؟",
    answer: "نعم، نوفر خدمة تغليف احترافية للمنتجات النهائية حسب متطلبات العميل.",
  },
];

// Helper to get category label
export const getCategoryLabel = (category: Category): string => {
  const found = categories.find((c) => c.id === category);
  return found ? found.label : category;
};

// Helper to format currency
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString()} ج.م`;
};

// Products Data - محسنة
export const products: Product[] = [
  {
    id: "1",
    slug: "classic-polo-shirt",
    name: "قميص بولو كلاسيك",
    category: "men",
    price: 350,
    heroImage: "https://images.unsplash.com/photo-1586363104864-3c5f2b3e4f3e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1586363104864-3c5f2b3e4f3e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "قميص بولو قطن 100%، مناسب للاستخدام اليومي والمكاتب",
    description: "قميص بولو مصنوع من قطن فاخر بوزن 210 جرام، متوفر بألوان متعددة. يتميز بياقة مبطنة وأزرار عالية الجودة. مناسب للاستخدام اليومي أو كزي موحد للشركات. متوفر بجميع المقاسات مع إمكانية إضافة الشعار.",
    specs: ["قطن 100%", "وزن 210 جرام", "مقاوم للانكماش", "متوفر بمقاسات من S إلى XXL", "ألوان متعددة"],
    tags: ["بولو", "رجالي", "قطن", "صيفي", "كلاسيك"],
    badge: "الأكثر مبيعاً",
    inStock: true,
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    slug: "women-blouse",
    name: "بلوزة أنيقة",
    category: "women",
    price: 420,
    heroImage: "https://images.unsplash.com/photo-1598554747436-c9293d6a5884?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598554747436-c9293d6a5884?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "بلوزة بقصة مميزة وخامة فاخرة",
    description: "بلوزة نسائية بتصميم عصري، مصنوعة من قماش فسكوز ناعم. مناسبة للمناسبات والعمل اليومي. تتميز بقصة مريحة وتفاصيل أنيقة على الأكمام والياقة.",
    specs: ["فسكوز 95%", "إيلاستين 5%", "قصة كلاسيك", "متوفرة بمقاسات XS إلى XL", "غسيل يدوي"],
    tags: ["بلوزة", "حريمي", "فسكوز", "صيفي", "أنيق"],
    inStock: true,
    createdAt: "2025-01-15",
  },
  {
    id: "3",
    slug: "kids-t-shirt",
    name: "تيشرت أطفال",
    category: "kids",
    price: 180,
    heroImage: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622298430911-942a1e53c510?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "تيشرت قطني مريح للأطفال",
    description: "تيشرت أطفال مصنوع من قطن 100% ناعم على البشرة، بألوان زاهية ورسومات ممتعة. مثالي للعب والاستخدام اليومي. متوفر بمجموعة متنوعة من الرسومات والألوان.",
    specs: ["قطن 100%", "خامة ناعمة", "مقاسات من 2 إلى 12 سنة", "مطبوعات عالية الجودة", "ألوان زاهية"],
    tags: ["أطفال", "قطن", "تيشرت", "صيفي", "مريح"],
    badge: "جديد",
    inStock: true,
    createdAt: "2025-02-01",
  },
  {
    id: "4",
    slug: "corporate-uniform",
    name: "يونيفورم شركات",
    category: "uniform",
    price: 550,
    heroImage: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "يونيفورم احترافي للشركات والمؤسسات",
    description: "يونيفورم مخصص للشركات، مصنوع من قماش متين مع إمكانية إضافة شعار الشركة. متوفر بعدة تصاميم تناسب مختلف القطاعات. مثالي للفنادق والمطاعم والشركات.",
    specs: ["بوليستر 65% - قطن 35%", "مقاوم للتجعد", "متوفر بعدة ألوان", "تطريز شعار حسب الطلب", "مقاسات خاصة"],
    tags: ["يونيفورم", "شركات", "رسمي", "شتوي", "احترافي"],
    inStock: true,
    createdAt: "2025-01-10",
  },
  {
    id: "5",
    slug: "slim-fit-shirt",
    name: "قميص سليم فت",
    category: "men",
    price: 480,
    heroImage: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "قميص بقصة عصرية وخامة فاخرة",
    description: "قميص رجالي بقصة سليم فت، مصنوع من قميص مصري 100%. مناسب للمناسبات الرسمية والعمل. يتميز بتفاصيل دقيقة وجودة عالية.",
    specs: ["قطن مصري 100%", "قصة سليم فت", "أزرار عرق اللؤلؤ", "مقاوم للكي", "مقاسات خاصة"],
    tags: ["قميص", "رجالي", "رسمي", "كلاسيك", "أنيق"],
    inStock: true,
    createdAt: "2025-02-10",
  },
  {
    id: "6",
    slug: "summer-dress",
    name: "فستان صيفي",
    category: "women",
    price: 650,
    heroImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "فستان صيفي أنيق بطباعة مميزة",
    description: "فستان صيفي مصنوع من قماش قطني ناعم، بطباعة عصرية وقصة مريحة تناسب الأجواء الحارة. مثالي للإطلالات اليومية والمناسبات الصيفية.",
    specs: ["قطن 100%", "طباعة رقمية", "قصة واسعة", "جيبان جانبيان", "غسيل يدوي"],
    tags: ["فستان", "حريمي", "صيفي", "قطن", "طباعة"],
    badge: "تخفيض",
    inStock: true,
    createdAt: "2025-03-01",
  },
  {
    id: "7",
    slug: "hoodie-sweatshirt",
    name: "هودي قطني",
    category: "men",
    price: 580,
    heroImage: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1509942774463-acf339cf87d5?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "هودي قطني ثقيل للشتاء",
    description: "هودي مصنوع من قطن ثقيل الوزن، مناسب للطقس البارد. يتميز بجيب أمامي وجيوب جانبية وغطاء رأس مريح.",
    specs: ["قطن 80% - بوليستر 20%", "وزن 320 جرام", "متوفر بمقاسات S-XXL", "ألوان متعددة", "غسيل آلي"],
    tags: ["هودي", "رجالي", "شتوي", "قطن", "كاجوال"],
    badge: "جديد",
    inStock: true,
    createdAt: "2025-03-10",
  },
  {
    id: "8",
    slug: "kids-pants",
    name: "بنطلون أطفال",
    category: "kids",
    price: 220,
    heroImage: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    ],
    summary: "بنطلون قطني مريح للأطفال",
    description: "بنطلون أطفال مصنوع من قطن 100% مع إضافة إيلاستين للمرونة. مناسب للعب والحركة اليومية. متوفر بألوان متعددة.",
    specs: ["قطن 98% - إيلاستين 2%", "مرن ومريح", "مقاسات من 2-12 سنة", "ألوان متعددة", "غسيل آلي"],
    tags: ["أطفال", "بنطلون", "قطن", "كاجوال", "مريح"],
    inStock: true,
    createdAt: "2025-02-20",
  },
];

// Orders Data - محسنة
export const orders: Order[] = [
  {
    id: "ORD-001",
    customer: "أحمد محمود",
    productName: "قميص بولو كلاسيك",
    status: "قيد التنفيذ",
    quantity: 150,
    total: 52500,
    eta: "2026-04-15",
    notes: "يرجى إضافة شعار الشركة على الصدر",
    createdAt: "2026-03-01",
  },
  {
    id: "ORD-002",
    customer: "منى السيد",
    productName: "يونيفورم شركات",
    status: "جاهز للشحن",
    quantity: 85,
    total: 46750,
    eta: "2026-03-28",
    notes: "تغليف خاص حسب الطلب",
    createdAt: "2026-03-05",
  },
  {
    id: "ORD-003",
    customer: "خالد إبراهيم",
    productName: "بلوزة أنيقة",
    status: "تم التسليم",
    quantity: 200,
    total: 84000,
    eta: "2026-03-20",
    notes: "",
    createdAt: "2026-02-20",
  },
  {
    id: "ORD-004",
    customer: "سارة علي",
    productName: "تيشرت أطفال",
    status: "قيد التنفيذ",
    quantity: 300,
    total: 54000,
    eta: "2026-04-10",
    notes: "مقاسات متنوعة حسب الجدول المرفق",
    createdAt: "2026-03-10",
  },
  {
    id: "ORD-005",
    customer: "محمد سعيد",
    productName: "قميص سليم فت",
    status: "جاهز للشحن",
    quantity: 50,
    total: 24000,
    eta: "2026-03-30",
    notes: "",
    createdAt: "2026-03-12",
  },
];