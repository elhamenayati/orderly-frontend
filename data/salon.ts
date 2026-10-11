export type TabId = "home" | "services" | "stylists" | "reviews" | "about";

export type Category = {
  id: string;
  name: string;
  count: number;
  icon: "brows" | "skin" | "makeup" | "nails" | "color" | "hair";
};

export type Service = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  duration: number;
  image: string;
  popular?: boolean;
};

export type Stylist = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  image: string;
  categoryId: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  service: string;
};

export const salon = {
  name: "لوکس بیوتی",
  tag: "سالن زیبایی",
  rating: 4.8,
  reviewCount: 128,
  description:
    "سالن زیبایی لوکس بیوتی با تیمی حرفه‌ای، فضایی آرام و خدمات تخصصی پوست، مو، ناخن و میکاپ، تجربه‌ای متفاوت از زیبایی را برای شما رقم می‌زند.",
  phone: "۰۹۱۲ ۳۴۵ ۶۷۸۹",
  phoneHref: "tel:+989123456789",
  address: "تهران، الهیه، خیابان فرشته، پلاک ۲۴",
  mapUrl: "https://maps.google.com/?q=Elahiyeh+Tehran",
  hoursSummary: "شنبه تا چهارشنبه ۹–۲۰، پنجشنبه ۱۰–۱۶",
  hours: [
    { days: "شنبه تا چهارشنبه", time: "۹:۰۰ – ۲۰:۰۰" },
    { days: "پنجشنبه", time: "۱۰:۰۰ – ۱۶:۰۰" },
    { days: "جمعه", time: "تعطیل" },
  ],
  about:
    "لوکس بیوتی از سال ۱۳۹۶ در الهیه تهران فعالیت می‌کند. تمرکز ما روی کیفیت مواد، بهداشت محیط و همراهی دقیق با سلیقه شماست. هر خدمت با مشاوره کوتاه شروع می‌شود تا نتیجه طبیعی، ماندگار و متناسب با چهره شما باشد.",
  amenities: ["پارکینگ اختصاصی", "پذیرایی نوشیدنی", "مشاوره رایگان", "مواد اورجینال"],
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1633681926022-84c1235ec811?auto=format&fit=crop&w=1400&q=80",
      alt: "فضای داخلی سالن زیبایی",
    },
    {
      src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80",
      alt: "صندلی‌های سالن مو",
    },
    {
      src: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1400&q=80",
      alt: "میز آرایش و میکاپ",
    },
    {
      src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1400&q=80",
      alt: "خدمات ناخن",
    },
    {
      src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1400&q=80",
      alt: "خدمات رنگ مو",
    },
  ],
};

export const categories: Category[] = [
  { id: "brows", name: "ابرو و مژه", count: 7, icon: "brows" },
  { id: "skin", name: "پوست و زیبایی", count: 5, icon: "skin" },
  { id: "makeup", name: "میکاپ", count: 4, icon: "makeup" },
  { id: "nails", name: "ناخن", count: 6, icon: "nails" },
  { id: "color", name: "رنگ و مش", count: 5, icon: "color" },
  { id: "hair", name: "مراقبت از مو", count: 6, icon: "hair" },
];

export const services: Service[] = [
  {
    id: "s1",
    name: "بالیاژ",
    categoryId: "color",
    price: 1800000,
    duration: 120,
    popular: true,
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s2",
    name: "کاشت ناخن",
    categoryId: "nails",
    price: 950000,
    duration: 90,
    popular: true,
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s3",
    name: "فیشیال",
    categoryId: "skin",
    price: 1200000,
    duration: 75,
    popular: true,
    image:
      "https://images.unsplash.com/photo-1570172619604-71fd74736576?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s4",
    name: "میکاپ عروس",
    categoryId: "makeup",
    price: 3500000,
    duration: 150,
    popular: true,
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s5",
    name: "اصلاح ابرو",
    categoryId: "brows",
    price: 280000,
    duration: 30,
    image:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s6",
    name: "رنگ ابرو",
    categoryId: "brows",
    price: 350000,
    duration: 40,
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s7",
    name: "لمینت ابرو",
    categoryId: "brows",
    price: 680000,
    duration: 50,
    image:
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s8",
    name: "اکستنشن مژه",
    categoryId: "brows",
    price: 1450000,
    duration: 110,
    image:
      "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s9",
    name: "لیفت مژه",
    categoryId: "brows",
    price: 890000,
    duration: 60,
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s10",
    name: "لمینت مژه",
    categoryId: "brows",
    price: 920000,
    duration: 70,
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s11",
    name: "میکروبلیدینگ",
    categoryId: "brows",
    price: 4200000,
    duration: 150,
    image:
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s12",
    name: "پاکسازی پوست",
    categoryId: "skin",
    price: 850000,
    duration: 60,
    image:
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s13",
    name: "هیدرافیشیال",
    categoryId: "skin",
    price: 1650000,
    duration: 80,
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s14",
    name: "ماسک طلا",
    categoryId: "skin",
    price: 2100000,
    duration: 70,
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s15",
    name: "مزوتراپی",
    categoryId: "skin",
    price: 2800000,
    duration: 50,
    image:
      "https://images.unsplash.com/photo-1570172619604-71fd74736576?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s16",
    name: "میکاپ روزانه",
    categoryId: "makeup",
    price: 750000,
    duration: 45,
    image:
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s17",
    name: "میکاپ شب",
    categoryId: "makeup",
    price: 1100000,
    duration: 70,
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s18",
    name: "میکاپ و اصلاح ابرو",
    categoryId: "makeup",
    price: 980000,
    duration: 60,
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s19",
    name: "ژل پولیش",
    categoryId: "nails",
    price: 480000,
    duration: 50,
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s20",
    name: "طراحی ناخن",
    categoryId: "nails",
    price: 620000,
    duration: 70,
    image:
      "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s21",
    name: "ترمیم کاشت",
    categoryId: "nails",
    price: 550000,
    duration: 60,
    image:
      "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s22",
    name: "مانیکور",
    categoryId: "nails",
    price: 380000,
    duration: 40,
    image:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s23",
    name: "پدیکور",
    categoryId: "nails",
    price: 450000,
    duration: 50,
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s24",
    name: "رنگ ریشه",
    categoryId: "color",
    price: 890000,
    duration: 75,
    image:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s25",
    name: "مش فویلی",
    categoryId: "color",
    price: 1600000,
    duration: 130,
    image:
      "https://images.unsplash.com/photo-1595475878913-84df92227454?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s26",
    name: "آمبره",
    categoryId: "color",
    price: 1950000,
    duration: 140,
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s27",
    name: "دکلره",
    categoryId: "color",
    price: 1400000,
    duration: 100,
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s28",
    name: "کراتین",
    categoryId: "hair",
    price: 3200000,
    duration: 180,
    image:
      "https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s29",
    name: "بوتاکس مو",
    categoryId: "hair",
    price: 2400000,
    duration: 120,
    image:
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s30",
    name: "احیای مو",
    categoryId: "hair",
    price: 1800000,
    duration: 90,
    image:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s31",
    name: "کوتاهی",
    categoryId: "hair",
    price: 450000,
    duration: 40,
    image:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s32",
    name: "براشینگ",
    categoryId: "hair",
    price: 380000,
    duration: 45,
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "s33",
    name: "پروتئین‌تراپی",
    categoryId: "hair",
    price: 2100000,
    duration: 100,
    image:
      "https://images.unsplash.com/photo-1633681926022-84c1235ec811?auto=format&fit=crop&w=900&q=80",
  },
];

export const stylists: Stylist[] = [
  {
    id: "st1",
    name: "نازنین احمدی",
    specialty: "رنگ و مش",
    rating: 4.9,
    categoryId: "color",
    image:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "st2",
    name: "سارا محمدی",
    specialty: "میکاپ",
    rating: 4.8,
    categoryId: "makeup",
    image:
      "https://images.unsplash.com/photo-1595475878913-84df92227454?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "st3",
    name: "مریم رضایی",
    specialty: "ناخن",
    rating: 4.7,
    categoryId: "nails",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "st4",
    name: "لیلا کریمی",
    specialty: "پوست و زیبایی",
    rating: 4.9,
    categoryId: "skin",
    image:
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80",
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    author: "هستی مرادی",
    rating: 5,
    date: "۱۲ مرداد ۱۴۰۵",
    service: "بالیاژ",
    text: "رنگ مو دقیقاً همان چیزی شد که می‌خواستم. فضا خیلی تمیز و آرامش‌بخش بود.",
  },
  {
    id: "r2",
    author: "نیلوفر کاظمی",
    rating: 5,
    date: "۲۸ تیر ۱۴۰۵",
    service: "میکاپ عروس",
    text: "میکاپ عروسم طبیعی و ماندگار بود. خانم محمدی خیلی حرفه‌ای کار می‌کنند.",
  },
  {
    id: "r3",
    author: "شیدا اکبری",
    rating: 4,
    date: "۱۵ تیر ۱۴۰۵",
    service: "کاشت ناخن",
    text: "طراحی ناخن عالی بود. فقط کمی معطلی داشتم، در کل راضی‌ام.",
  },
  {
    id: "r4",
    author: "بهاره نوری",
    rating: 5,
    date: "۳ تیر ۱۴۰۵",
    service: "فیشیال",
    text: "پوستم بعد از فیشیال واقعاً شفاف‌تر شد. حتماً دوباره می‌آیم.",
  },
  {
    id: "r5",
    author: "مینا حسینی",
    rating: 5,
    date: "۲۰ خرداد ۱۴۰۵",
    service: "اکستنشن مژه",
    text: "مژه‌ها خیلی طبیعی درآمد. پرسنل مودب و دقیق بودند.",
  },
  {
    id: "r6",
    author: "رعنا شریفی",
    rating: 4,
    date: "۸ خرداد ۱۴۰۵",
    service: "کراتین",
    text: "موهام بعد از کراتین نرم و لطیف شد. نتیجه بهتر از انتظارم بود.",
  },
];

export const tabs: { id: TabId; label: string }[] = [
  { id: "home", label: "خانه" },
  { id: "services", label: "خدمات" },
  { id: "stylists", label: "آرایشگران" },
  { id: "reviews", label: "نظرات" },
  { id: "about", label: "درباره ما" },
];
