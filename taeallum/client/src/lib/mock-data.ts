import { LucideIcon, BookOpen, Clock, Trophy, Star, PlayCircle, Users, Layout, Video } from "lucide-react";

export interface Course {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  lessonsCount: number;
  level: "مبتدئ" | "متوسط" | "متقدم";
  rating: number;
  students: number;
  image: string;
  category: string;
  price: number;
  isNew?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  coursesCount: number;
  duration: string;
  image: string;
  level: "شامل" | "تخصصي";
  milestones: Milestone[];
}

export const courses: Course[] = [
  {
    id: "1",
    title: "مقدمة في تصميم واجهة المستخدم UI/UX",
    instructor: "أحمد محمد",
    duration: "5 ساعات",
    lessonsCount: 24,
    level: "مبتدئ",
    rating: 4.8,
    students: 1200,
    image: "https://images.unsplash.com/photo-1586717791821-3f44a5638d48?w=800&q=80",
    category: "تصميم",
    price: 0,
    isNew: true
  },
  {
    id: "2",
    title: "احتراف التسويق الرقمي",
    instructor: "سارة علي",
    duration: "8 ساعات",
    lessonsCount: 35,
    level: "متوسط",
    rating: 4.9,
    students: 850,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    category: "تسويق",
    price: 0,
    isNew: true
  },
  {
    id: "3",
    title: "تطوير تطبيقات الويب باستخدام React",
    instructor: "كريم حسن",
    duration: "12 ساعة",
    lessonsCount: 60,
    level: "متقدم",
    rating: 4.7,
    students: 2300,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    category: "برمجة",
    price: 0
  },
  {
    id: "4",
    title: "أساسيات ريادة الأعمال",
    instructor: "نور الدين",
    duration: "4 ساعات",
    lessonsCount: 15,
    level: "مبتدئ",
    rating: 4.6,
    students: 500,
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80",
    category: "أعمال",
    price: 0
  }
];

export const tracks: Track[] = [
  {
    id: "1",
    title: "مسار مطور الواجهات الأمامية (Frontend)",
    description: "ابدأ رحلتك لتصبح مطور واجهات محترف من الصفر حتى الاحتراف الكامل.",
    coursesCount: 5,
    duration: "40 ساعة",
    image: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&q=80",
    level: "شامل",
    milestones: [
      { id: "m1", title: "أساسيات الويب", description: "HTML5, CSS3 وفهم آلية عمل الإنترنت" },
      { id: "m2", title: "لغة البرمجة JavaScript", description: "المتغيرات، الدوال، والتعامل مع DOM" },
      { id: "m3", title: "أطر العمل الحديثة", description: "React.js وبناء تطبيقات الصفحة الواحدة" },
      { id: "m4", title: "إدارة الحالة والبيانات", description: "Redux, API Integration" },
      { id: "m5", title: "مشروع التخرج", description: "بناء متجر إلكتروني متكامل" }
    ]
  },
  {
    id: "2",
    title: "مسار المصمم المحترف (UI/UX)",
    description: "تعلم أسس التصميم الجرافيكي وتجربة المستخدم وأدوات التصميم الحديثة.",
    coursesCount: 4,
    duration: "25 ساعة",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    level: "شامل",
    milestones: [
      { id: "m1", title: "مبادئ التصميم البصري", description: "الألوان، التباين، والتايبوغراف" },
      { id: "m2", title: "أدوات التصميم", description: "إتقان Figma و Adobe XD" },
      { id: "m3", title: "تجربة المستخدم UX", description: "البحث، رحلة المستخدم، والبروتوتايب" },
      { id: "m4", title: "بناء معرض أعمال", description: "تجهيز Portfolio وعرض المشاريع" }
    ]
  },
  {
    id: "3",
    title: "مسار إدارة المنتجات الرقمية",
    description: "كيف تحول الأفكار إلى منتجات رقمية ناجحة ومربحة.",
    coursesCount: 3,
    duration: "18 ساعة",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    level: "تخصصي",
    milestones: [
      { id: "m1", title: "استراتيجية المنتج", description: "تحديد الرؤية وتحليل السوق" },
      { id: "m2", title: "دورة حياة المنتج", description: "من الفكرة إلى الإطلاق والنمو" },
      { id: "m3", title: "قياس الأداء", description: "KPIs وتحليل بيانات المستخدمين" }
    ]
  }
];
