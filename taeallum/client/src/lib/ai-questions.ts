export interface Question {
  id: number;
  text: string;
  description?: string;
  type: "text" | "select" | "multiselect" | "number" | "range";
  options?: string[];
  category: "personal" | "goal" | "experience" | "time" | "learning_style" | "constraints" | "preferences";
  required: boolean;
  tier?: "free" | "personal" | "pro"; // Which tier can access this question
}

// Enhanced questions for AI Assistant (20 questions for Personal, unlimited for Pro)
export const aiQuestions: Question[] = [
  // Personal Information (Questions 1-3)
  {
    id: 1,
    text: "ما هو اسمك الأول؟",
    description: "سنستخدمه لتخصيص تجربتك",
    type: "text",
    category: "personal",
    required: true,
  },
  {
    id: 2,
    text: "كم عمرك؟",
    description: "لفهم مرحلتك الحياتية بشكل أفضل",
    type: "number",
    category: "personal",
    required: true,
  },
  {
    id: 3,
    text: "ما هو مستواك التعليمي الحالي؟",
    description: "اختر المستوى الذي يعكس وضعك الحالي",
    type: "select",
    options: [
      "طالب ثانوي",
      "طالب جامعي",
      "خريج جامعي",
      "دراسات عليا (ماجستير/دكتوراه)",
      "بدون شهادة جامعية",
    ],
    category: "personal",
    required: true,
  },

  // Goals & Objectives (Questions 4-7)
  {
    id: 4,
    text: "ما هو مجال التخصص الذي تود تعلمه؟",
    description: "اختر المجال الذي يثير اهتمامك أكثر",
    type: "select",
    options: [
      "تطوير الويب (Web Development)",
      "تطوير تطبيقات الهاتف (Mobile Development)",
      "تصميم الواجهات (UI/UX Design)",
      "إدارة المنتجات (Product Management)",
      "البيانات والذكاء الاصطناعي (Data & AI)",
      "DevOps والبنية التحتية",
      "الأمن السيبراني (Cybersecurity)",
      "التسويق الرقمي (Digital Marketing)",
      "إدارة الأعمال (Business Management)",
      "التصميم الجرافيكي (Graphic Design)",
      "أخرى",
    ],
    category: "goal",
    required: true,
  },
  {
    id: 5,
    text: "ما هو هدفك النهائي من التعلم؟",
    description: "ما الذي تريد تحقيقه؟",
    type: "select",
    options: [
      "الحصول على وظيفة جديدة",
      "تطوير مهاراتي الحالية في وظيفتي",
      "بدء مشروع شخصي/تجاري",
      "الترقية في وظيفتي الحالية",
      "تغيير مسار حياتي المهني بالكامل",
      "التعلم للمتعة والمعرفة فقط",
      "الحصول على شهادة معتمدة",
    ],
    category: "goal",
    required: true,
  },
  {
    id: 6,
    text: "ما هو الإطار الزمني المتوقع للوصول لهدفك؟",
    description: "متى تريد تحقيق هدفك؟",
    type: "select",
    options: [
      "في أسرع وقت ممكن (شهر - شهرين)",
      "خلال 3 أشهر",
      "خلال 6 أشهر",
      "خلال سنة",
      "أكثر من سنة",
      "لا يهمني الوقت، أريد التعلم بجودة عالية",
    ],
    category: "goal",
    required: true,
  },
  {
    id: 7,
    text: "ما هي أولويتك الأساسية في التعلم؟",
    description: "ركز على الشيء الأهم بالنسبة لك",
    type: "text",
    category: "goal",
    required: true,
  },

  // Experience Level (Questions 8-10)
  {
    id: 8,
    text: "ما هو مستوى خبرتك الحالي في المجال الذي اخترته؟",
    description: "اختر المستوى الذي يعكس معرفتك الحالية",
    type: "select",
    options: [
      "مبتدئ تماماً (لم أتعلم شيئاً من قبل)",
      "مبتدئ (معرفة أساسية بسيطة)",
      "متوسط (خبرة عملية بسيطة)",
      "متقدم (خبرة عملية جيدة)",
      "خبير (خبرة عملية واسعة)",
    ],
    category: "experience",
    required: true,
  },
  {
    id: 9,
    text: "هل لديك خبرة برمجية أو تقنية سابقة؟",
    description: "هل تعاملت مع البرمجة أو التقنية من قبل؟",
    type: "select",
    options: [
      "لا، هذه أول مرة",
      "نعم، معرفة بسيطة جداً",
      "نعم، لغة أو أداة واحدة",
      "نعم، عدة لغات أو أدوات",
      "نعم، وعملت في مشاريع حقيقية",
      "نعم، وأملك خبرة احترافية",
    ],
    category: "experience",
    required: true,
  },
  {
    id: 10,
    text: "هل عملت على مشاريع عملية من قبل؟",
    description: "مشاريع شخصية، جامعية، أو عملية",
    type: "select",
    options: [
      "لا، لم أعمل على أي مشروع",
      "نعم، مشروع واحد بسيط",
      "نعم، عدة مشاريع بسيطة",
      "نعم، مشاريع متوسطة التعقيد",
      "نعم، مشاريع احترافية معقدة",
    ],
    category: "experience",
    required: true,
  },

  // Time & Commitment (Questions 11-13)
  {
    id: 11,
    text: "كم ساعة في الأسبوع يمكنك تخصيصها للتعلم؟",
    description: "كن صريحاً معنا لننشئ خطة واقعية",
    type: "select",
    options: [
      "أقل من 5 ساعات",
      "5 - 10 ساعات",
      "10 - 15 ساعة",
      "15 - 20 ساعة",
      "20 - 30 ساعة",
      "أكثر من 30 ساعة (متفرغ)",
    ],
    category: "time",
    required: true,
  },
  {
    id: 12,
    text: "ما هو أفضل وقت للتعلم بالنسبة لك؟",
    description: "متى تكون أكثر تركيزاً وإنتاجية؟",
    type: "multiselect",
    options: [
      "الصباح الباكر (5-9 صباحاً)",
      "الصباح (9-12 ظهراً)",
      "بعد الظهر (12-5 مساءً)",
      "المساء (5-9 مساءً)",
      "الليل (9-12 منتصف الليل)",
      "متأخر في الليل (بعد 12)",
    ],
    category: "time",
    required: true,
  },
  {
    id: 13,
    text: "هل لديك التزامات أخرى قد تؤثر على وقت التعلم؟",
    description: "مثل: وظيفة، دراسة، عائلة، إلخ",
    type: "multiselect",
    options: [
      "وظيفة بدوام كامل",
      "وظيفة بدوام جزئي",
      "دراسة جامعية",
      "التزامات عائلية",
      "مشاريع جانبية",
      "لا يوجد التزامات كبيرة",
    ],
    category: "time",
    required: true,
  },

  // Learning Style (Questions 14-16)
  {
    id: 14,
    text: "ما هو أسلوب التعلم الذي تفضله؟",
    description: "كيف تتعلم بشكل أفضل؟ (يمكنك اختيار أكثر من خيار)",
    type: "multiselect",
    options: [
      "مقاطع فيديو شرح مفصلة",
      "مشاريع عملية وتطبيقية",
      "قراءة وثائق وشروحات نصية",
      "تمارين وتحديات برمجية",
      "حل مشاكل واقعية",
      "التعلم من الأمثلة والكود الجاهز",
      "التعلم الجماعي والنقاشات",
      "التعلم الفردي والذاتي",
    ],
    category: "learning_style",
    required: true,
  },
  {
    id: 15,
    text: "ما هي سرعة التعلم المفضلة لك؟",
    description: "كيف تحب أن تتقدم في التعلم؟",
    type: "select",
    options: [
      "سريع جداً (أريد إنهاء المحتوى بأسرع وقت)",
      "سريع (أفضل التقدم السريع مع الفهم)",
      "متوازن (توازن بين السرعة والفهم العميق)",
      "متأني (أفضل الفهم العميق على السرعة)",
      "بطيء جداً (أريد إتقان كل تفصيلة)",
    ],
    category: "learning_style",
    required: true,
  },
  {
    id: 16,
    text: "هل تفضل التعلم باللغة العربية أم الإنجليزية؟",
    description: "أو مزيج من الاثنين؟",
    type: "select",
    options: [
      "العربية فقط",
      "الإنجليزية فقط",
      "مزيج من العربية والإنجليزية",
      "لا يهم، المهم جودة المحتوى",
    ],
    category: "preferences",
    required: true,
  },

  // Challenges & Constraints (Questions 17-18)
  {
    id: 17,
    text: "ما هي أكبر التحديات التي تواجهك في التعلم؟",
    description: "اختر ما ينطبق عليك (يمكنك اختيار أكثر من خيار)",
    type: "multiselect",
    options: [
      "نقص الوقت والانشغالات",
      "صعوبة فهم المفاهيم المعقدة",
      "عدم وجود مشاريع عملية كافية",
      "الشعور بالملل والرتابة",
      "عدم معرفة من أين أبدأ",
      "الخوف من الفشل أو عدم النجاح",
      "عدم وجود دعم أو توجيه",
      "صعوبة الالتزام والاستمرارية",
      "نقص الموارد المالية",
      "عدم وجود بيئة مناسبة للتعلم",
    ],
    category: "constraints",
    required: true,
  },
  {
    id: 18,
    text: "هل لديك أي متطلبات خاصة أو قيود؟",
    description: "مثلاً: لغة معينة، أدوات معينة، ميزانية محددة، إلخ",
    type: "text",
    category: "constraints",
    required: false,
  },

  // Preferences & Expectations (Questions 19-20)
  {
    id: 19,
    text: "ما مدى أهمية الحصول على شهادة معتمدة بالنسبة لك؟",
    description: "هل الشهادة مهمة لأهدافك؟",
    type: "select",
    options: [
      "مهمة جداً (أحتاجها للوظيفة)",
      "مهمة (أفضل الحصول عليها)",
      "غير مهمة كثيراً (المهارة أهم)",
      "غير مهمة إطلاقاً",
    ],
    category: "preferences",
    required: true,
  },
  {
    id: 20,
    text: "ما هي توقعاتك من المساعد الذكي؟",
    description: "كيف يمكننا مساعدتك بشكل أفضل؟",
    type: "text",
    category: "preferences",
    required: false,
  },
];

// Additional questions for Pro tier (unlimited questions via chat)
export const proAdditionalQuestions: Question[] = [
  {
    id: 21,
    text: "هل لديك مشروع محدد تريد العمل عليه؟",
    type: "text",
    category: "goal",
    required: false,
    tier: "pro",
  },
  {
    id: 22,
    text: "ما هي الأدوات أو التقنيات التي تريد تعلمها بشكل خاص؟",
    type: "text",
    category: "preferences",
    required: false,
    tier: "pro",
  },
  // Pro users can ask unlimited custom questions via chat
];

export interface UserProfile {
  // Personal Info
  name: string;
  age: number;
  educationLevel: string;

  // Goals
  field: string;
  goal: string;
  timeline: string;
  priority: string;

  // Experience
  experienceLevel: string;
  programmingExperience: string;
  projectExperience: string;

  // Time & Commitment
  hoursPerWeek: string;
  preferredTime: string[];
  commitments: string[];

  // Learning Style
  learningStyle: string[];
  learningSpeed: string;
  languagePreference: string;

  // Challenges & Constraints
  challenges: string[];
  specialRequirements?: string;

  // Preferences
  certificateImportance: string;
  expectations?: string;
}

export interface StudyPlan {
  id?: string;
  title: string;
  description: string;
  duration: string;
  totalHours: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "mixed";

  // Courses from the 500 free courses
  courses: PlanCourse[];

  // Weekly breakdown
  weeklySchedule: WeeklySchedule[];

  // Milestones
  milestones: Milestone[];

  // Resources
  resources: Resources;

  // Recommendations
  recommendations: Recommendations;

  // Tracking
  progress?: number;
  status?: "active" | "completed" | "paused";
}

export interface PlanCourse {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g., "4 weeks"
  hours: number;
  level: "مبتدئ" | "متوسط" | "متقدم";
  topics: string[];
  projects: string[];
  order: number;
  startWeek: number;
  endWeek: number;
}

export interface WeeklySchedule {
  week: number;
  focus: string;
  courses: string[]; // Course IDs
  hours: number;
  topics: string[];
  deliverables: string[];
  checkpoints: string[];
}

export interface Milestone {
  week: number;
  title: string;
  description: string;
  deliverables: string[];
  skills: string[];
}

export interface Resources {
  courses: string[];
  books?: string[];
  tools: string[];
  communities?: string[];
  documentation?: string[];
}

export interface Recommendations {
  nextSteps: string[];
  tips: string[];
  warnings: string[];
  alternativePaths?: string[];
}

// Example study plan (will be replaced with AI-generated plans)
export const exampleStudyPlan: StudyPlan = {
  title: "مسار مطور الويب Full-Stack",
  description: "خطة شاملة لتصبح مطور ويب محترف من الصفر",
  duration: "6 أشهر",
  totalHours: 240,
  difficulty: "mixed",
  courses: [
    {
      id: "1",
      title: "أساسيات HTML و CSS",
      description: "تعلم بناء صفحات ويب ثابتة باستخدام HTML و CSS",
      duration: "4 أسابيع",
      hours: 40,
      level: "مبتدئ",
      topics: ["HTML5", "CSS3", "Responsive Design", "Flexbox", "Grid"],
      projects: ["موقع شخصي بسيط", "مدونة ثابتة"],
      order: 1,
      startWeek: 1,
      endWeek: 4,
    },
    {
      id: "2",
      title: "JavaScript الأساسي",
      description: "تعلم أساسيات JavaScript وجعل صفحاتك تفاعلية",
      duration: "6 أسابيع",
      hours: 60,
      level: "مبتدئ",
      topics: ["Variables", "Functions", "DOM", "Events", "Async"],
      projects: ["آلة حاسبة", "لعبة بسيطة", "To-Do App"],
      order: 2,
      startWeek: 5,
      endWeek: 10,
    },
    {
      id: "3",
      title: "React للمبتدئين",
      description: "تعلم بناء تطبيقات ويب باستخدام React",
      duration: "8 أسابيع",
      hours: 80,
      level: "متوسط",
      topics: ["Components", "Hooks", "State", "Props", "Routing"],
      projects: ["تطبيق Todo متقدم", "متجر إلكتروني بسيط"],
      order: 3,
      startWeek: 11,
      endWeek: 18,
    },
    {
      id: "4",
      title: "Node.js و Express",
      description: "بناء خوادم ويب باستخدام Node.js و Express",
      duration: "6 أسابيع",
      hours: 60,
      level: "متوسط",
      topics: ["HTTP", "Routing", "Middleware", "Authentication", "APIs"],
      projects: ["REST API", "نظام مصادقة"],
      order: 4,
      startWeek: 19,
      endWeek: 24,
    },
  ],
  weeklySchedule: [
    {
      week: 1,
      focus: "مقدمة HTML",
      courses: ["1"],
      hours: 10,
      topics: ["HTML Basics", "Tags", "Attributes"],
      deliverables: ["صفحة HTML بسيطة"],
      checkpoints: ["فهم بنية HTML"],
    },
    // ... more weeks
  ],
  milestones: [
    {
      week: 4,
      title: "إتقان HTML و CSS",
      description: "يجب أن تكون قادراً على بناء صفحات ويب ثابتة جميلة",
      deliverables: ["موقع شخصي", "3 صفحات ثابتة"],
      skills: ["HTML5", "CSS3", "Responsive Design"],
    },
    {
      week: 10,
      title: "إتقان JavaScript",
      description: "يجب أن تكون قادراً على كتابة كود JavaScript فعال",
      deliverables: ["3 مشاريع JavaScript", "فهم DOM و Events"],
      skills: ["JavaScript ES6+", "DOM Manipulation", "Async Programming"],
    },
  ],
  resources: {
    courses: ["HTML/CSS Course", "JavaScript Course", "React Course"],
    tools: ["VS Code", "Git", "Chrome DevTools"],
    communities: ["مجتمع تعلّم", "Discord Server"],
  },
  recommendations: {
    nextSteps: [
      "ابدأ بدورة HTML/CSS",
      "خصص 10 ساعات أسبوعياً",
      "طبق كل درس بمشروع صغير",
    ],
    tips: [
      "ركز على الفهم قبل الحفظ",
      "طبق كل درس بمشروع صغير",
      "لا تتخطى أي مرحلة",
      "شارك مشاريعك مع الآخرين",
      "اطلب مساعدة عند الحاجة",
    ],
    warnings: [
      "لا تحاول تعلم كل شيء مرة واحدة",
      "الاستمرارية أهم من الكثافة",
    ],
  },
};

// Pricing tiers
// Pricing tiers
export const pricingTiers = {
  pro: {
    id: "pro",
    name: "اشتراك حمزة الذكي (Smart AI)",
    price: {
      usd: 10,
      eur: 9.5,
      gbp: 8,
      aed: 37,
      sar: 37.5,
      egp: 480,
      jod: 7,
      iqd: 13000,
    },
    features: [
      "ذكاء اصطناعي فائق مدعوم بـ GPT-4o",
      "إنشاء مسارات تعليمية مخصصة لا نهائية",
      "تحليل دقيق لمهاراتك وأهدافك المهنية",
      "مساعد شخصي متاح 24/7 للإجابة على تساؤلاتك",
      "ربط مباشر مع كورسات المنصة في خريطة الطريق",
      "تحديثات دورية ومتابعة ذكية لتقدمك",
      "دعم فني متميز للمشتركين",
      "إلغاء الاشتراك متاح في أي وقت"
    ],
    limits: {
      questions: -1, // unlimited
      planUpdates: -1, // unlimited
      aiChat: true,
      consultations: 0,
    },
  },
  // Placeholders for legacy compatibility if needed
  personal: {
    id: "personal",
    name: "خطة مجانية",
    price: { usd: 0, eur: 0, gbp: 0, aed: 0, sar: 0, egp: 0, jod: 0, iqd: 0 },
    features: ["تصفح الكورسات المجانية", "عرض المسارات العامة"],
    limits: { questions: 0, planUpdates: 0, aiChat: false }
  }
};
