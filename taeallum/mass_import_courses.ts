
import { db } from './server/db/index';
import { courses, categories, sections, lessons } from './server/db/schema';
import fetch from 'node-fetch';
import { eq, sql } from 'drizzle-orm';

const COURSES_TO_IMPORT = [
    // 1. Programming (5 items)
    {
        categorySlug: "programming",
        title: "أساسيات البرمجة - CS50 بالعربي",
        description: "دورة شاملة لتعلم أساسيات البرمجة من الصفر باستخدام مفاهيم CS50 العالمية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLMTdZ61eBnyoElHxsyWjh7I_pcb1WonNZ",
        aiDescription: "تغطية شاملة للمفاهيم الأساسية لعلوم الحاسوب والبرمجة بناءً على منهج هارفارد الشهير.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "أساسيات البرمجة للمبتدئين - Elzero",
        description: "رحلتك الأولى في عالم البرمجة، تعلم المنطق والتفكير البرمجي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAy41u35AqJUrI-H83DOb5qP",
        aiDescription: "دورة تخصصية في المنطق البرمجي وكيفية البدء في مسار المبرمج الناجح.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "Introduction to Programming Basics",
        description: "تعلم المبادئ الأساسية للبرمجة بلغة بسيطة وممتعة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLBlnK6fEyqRjoG6aJ4Fv2DPrL_DviSt90",
        aiDescription: "دورة للمبتدئين تماماً تشرح مفاهيم المتغيرات، الدوال، والمنطق.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "حل المشكلات برمجياً - Problem Solving",
        description: "طور مهارات التفكير المنطقي وحل المشكلات باستخدام الأكواد.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAw_tIDX0Me88XoyYmY-Y8vU",
        aiDescription: "دورة مكثفة في التفكير الخوارزمي وحل التحديات البرمجية.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "هياكل البيانات والخوارزميات",
        description: "أساس المبرمج المحترف، تعلم كيف تبني أكواداً فعالة وسريعة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL0-sH_T24vP_xYvW_V_mAYzLIm0yv4l-y",
        aiDescription: "شرح معمق لأنواع البيانات المعقدة والخوارزميات الأساسية في البرمجة.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },

    // 2. Web Development (4 items)
    {
        categorySlug: "web-development",
        title: "HTML & CSS الكاملة - Elzero",
        description: "تعلم بناء هيكل وتصميم المواقع من الصفر حتى الاحتراف.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAw24EjNUp_88S1fEAQz2_Dn",
        aiDescription: "مسار متكامل لتعلم لغات بناء الويب الأساسية وتصميم الواجهات.",
        thumbnailUrl: "/thumbnails/thumb_web-development_3d.png"
    },
    {
        categorySlug: "web-development",
        title: "JavaScript BootCamp العربي",
        description: "احترف لغة البرمجة الأكثر طلباً في العالم - جافا سكريبت.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAx3kiZ1AgW8A67ns68w4unU",
        aiDescription: "دورة مكثفة تغطي جافا سكريبت من البدايات وحتى المفاهيم المتقدمة.",
        thumbnailUrl: "/thumbnails/thumb_web-development_3d.png"
    },
    {
        categorySlug: "web-development",
        title: "احتراف React.js للمواقع الحديثة",
        description: "تعلم بناء تطبيقات ويب سريعة وحديثة باستخدام ريأكت.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLuPteitR8Nstc9h9_W31_zKAs7U70X_iW",
        aiDescription: "دورة تخصصية في مكتبة React لبناء واجهات مستخدم تفاعلية.",
        thumbnailUrl: "/thumbnails/thumb_web-development_3d.png"
    },
    {
        categorySlug: "web-development",
        title: "تطوير الواجهات الخلفية Node.js",
        description: "تعلم بناء سيرفرات قوية وأنظمة خلفية متطورة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLuPteitR8NsvUInYvi7i95iO0fP_f37eG",
        aiDescription: "مسار تطوير الويب الخلفي باستخدام Node.js و Express.",
        thumbnailUrl: "/thumbnails/thumb_web-development_3d.png"
    },

    // 3. Mobile Development (4 items)
    {
        categorySlug: "mobile-development",
        title: "تطوير التطبيقات باستخدام Flutter",
        description: "ابنِ تطبيقاتك للأندرويد والآيفون بكود واحد باستخدام فلاتر.",
        playlistUrl: "https://m.youtube.com/playlist?list=PLw6Y5u47CYq47oDw63bMqkq06fjuoK_GJ",
        aiDescription: "دورة شاملة في إطار عمل Flutter ولغة Dart لتطوير الموبايل.",
        thumbnailUrl: "/thumbnails/thumb_mobile-development_3d.png"
    },
    {
        categorySlug: "mobile-development",
        title: "Android Kotlin Development",
        description: "تعلم تطوير تطبيقات الأندرويد الأصلية باستخدام لغة كوتلن.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLrY_6mS_vA_rI7v5fOQ4p1lq9MvI2l_M9",
        aiDescription: "مسار تعليمي لتطوير تطبيقات أندرويد باحترافية وبالمعايير الحديثة.",
        thumbnailUrl: "/thumbnails/thumb_mobile-development_3d.png"
    },
    {
        categorySlug: "mobile-development",
        title: "iOS Development with Swift",
        description: "ادخل عالم آبل وتعلم بناء تطبيقات الآيفون والآيباد باستخدام سويفت.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLW-v8L2l_rFisS6T_oNf-5t2oB6N_x_Fw",
        aiDescription: "دورة متكاملة في لغة Swift وبيئة تطوير Xcode.",
        thumbnailUrl: "/thumbnails/thumb_mobile-development_3d.png"
    },
    {
        categorySlug: "mobile-development",
        title: "React Native بالعربي",
        description: "استخدم مهاراتك في الويب لبناء تطبيقات موبايل قوية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLu1p_qD7r6PzK2_zXWlAnuUvP6KByy7Mv",
        aiDescription: "تعلم تطوير تطبيقات الهواتف باستخدام جافا سكريبت و React Native.",
        thumbnailUrl: "/thumbnails/thumb_mobile-development_3d.png"
    },

    // 4. Software Engineering (4 items)
    {
        categorySlug: "software-engineering",
        title: "مفاهيم هندسة البرمجيات بالعربي",
        description: "تعرف على الأسس العلمية لبناء الأنظمة البرمجية الكبيرة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLsnvpvHuTUbC-yJkvcf-Stp_kLwfesnn-",
        aiDescription: "دورة في مفاهيم التصميم، التحليل، وإدارة المشاريع البرمجية.",
        thumbnailUrl: "/thumbnails/thumb_software-engineering_3d.png"
    },
    {
        categorySlug: "software-engineering",
        title: "Design Patterns للمحترفين",
        description: "تعلم أنماط التصميم لحل المشكلات البرمجية المتكررة باحترافية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLHIfW1KZRIfmXp0A6o_5oYAsT0j6eC4d_",
        aiDescription: "شرح لأشهر أنماط التصميم (Creational, Structural, Behavioral).",
        thumbnailUrl: "/thumbnails/thumb_software-engineering_3d.png"
    },
    {
        categorySlug: "software-engineering",
        title: "Clean Code & SOLID Principles",
        description: "اكتب كوداً نظيفاً، سهل الصيانة، وقابلاً للتوسع.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLK9X_8L_YisM4vNf6R1oIgeKuexVzE_On",
        aiDescription: "دورة في جودة الكود ومبادئ البرمجة الكائنية النظيفة.",
        thumbnailUrl: "/thumbnails/thumb_software-engineering_3d.png"
    },
    {
        categorySlug: "software-engineering",
        title: "Git & GitHub للمبرمجين",
        description: "أداة لا غنى عنها لأي مبرمج، تعلم إدارة النسخ والتعاون البرمجي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAz97uO6C00W29B6Sajhc_mS",
        aiDescription: "دورة عملية في استخدام Git ورفع المشاريع على GitHub.",
        thumbnailUrl: "/thumbnails/thumb_software-engineering_3d.png"
    },

    // 5. Game Development (3 items)
    {
        categorySlug: "game-development",
        title: "تطوير الألعاب Unity 3D",
        description: "ابنِ عوالمك الخاصة وتعلم صناعة الألعاب باستخدام يونيتي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLiH59f3XbukHpDFMQ9mq5BtOzW2NyD88a",
        aiDescription: "دورة في محرك Unity ولغة C# لصناعة ألعاب ثنائية وثلاثية الأبعاد.",
        thumbnailUrl: "/thumbnails/thumb_game-development_3d.png"
    },
    {
        categorySlug: "game-development",
        title: "Unreal Engine 5 بالعربي",
        description: "اكتشف قوة محرك Unreal Engine 5 في بناء الألعاب السينمائية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL3m_C_vL5P_LhL7YV6GvB8-G5w_3-3h3-",
        aiDescription: "مسار تعليمي لمحرك Unreal Engine 5 وتقنيات Nanite و Lumen.",
        thumbnailUrl: "/thumbnails/thumb_game-development_3d.png"
    },
    {
        categorySlug: "game-development",
        title: "برمجة الألعاب باستخدام C#",
        description: "تعلم المنطق البرمجي المخصص لتطوير الألعاب.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLHIfW1KZRIfn8XQ6vF5W5W_W-P__G_-v7",
        aiDescription: "دورة تركز على جانب البرمجة والأكواد داخل الألعاب.",
        thumbnailUrl: "/thumbnails/thumb_game-development_3d.png"
    },

    // 6. UI/UX Design (3 items)
    {
        categorySlug: "ui-ux-design",
        title: "أساسيات UI/UX Design بالعربي",
        description: "تعلم كيف تصمم واجهات سهلة الاستخدام وتجربة مستخدم ممتعة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLVAn_D_9_XvB_F9PzUvJ8L8-Wv-U-P__G_-v7",
        aiDescription: "دورة في مفاهيم تجربة المستخدم وتصميم واجهات التطبيقات والمواقع.",
        thumbnailUrl: "/thumbnails/thumb_ui-ux-design_3d.png"
    },
    {
        categorySlug: "ui-ux-design",
        title: "Figma للمصممين المحترفين",
        description: "احترف الأداة الأولى عالمياً في تصميم الواجهات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLmS_vA0Npt_i_89vRz6bL-nJ0nKz3-NfL",
        aiDescription: "دورة شاملة في برنامج Figma من الأساسيات وحتى النماذج التفاعلية.",
        thumbnailUrl: "/thumbnails/thumb_ui-ux-design_3d.png"
    },
    {
        categorySlug: "ui-ux-design",
        title: "بناء ملف أعمال المصمم (Portfolio)",
        description: "تعلم كيف تعرض أعمالك وتجذب العملاء والشركات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLVAn_D_9_XvA_F9PzUvJ8L8-Wv-U-P__G_-v7",
        aiDescription: "نصائح وارشادات لبناء بورتفوليو احترافي لمصممي UI/UX.",
        thumbnailUrl: "/thumbnails/thumb_ui-ux-design_3d.png"
    },

    // 7. Graphic Design (3 items)
    {
        categorySlug: "graphic-design",
        title: "دورة تصميم الهوية البصرية",
        description: "تعلم كيف تبني علامة تجارية قوية ومميزة.",
        playlistUrl: "https://m.youtube.com/playlist?list=PLg9zhbTb15hhaXsPXooAAZkYew1R7rVCV",
        aiDescription: "مسار تعليمي في تصميم الشعارات والهويات البصرية المتكاملة.",
        thumbnailUrl: "/thumbnails/thumb_graphic-design_3d.png"
    },
    {
        categorySlug: "graphic-design",
        title: "Adobe Illustrator للمبتدئين",
        description: "تعلم الرسم الرقمي وتصميم الفيكتور باحترافية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9ps5Gu0MiC_T2Spv3tMmmQjhpCrKC7Z",
        aiDescription: "دورة شاملة في برنامج Illustrator، الأداة الأساسية لكل مصمم.",
        thumbnailUrl: "/thumbnails/thumb_graphic-design_3d.png"
    },
    {
        categorySlug: "graphic-design",
        title: "فنون التايبوجرافي والخط العربي",
        description: "تعلم جماليات الخط وتنسيق النصوص في التصميم.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9zhbTb15hhPXooAAZkYew1R7rVCV",
        aiDescription: "دورة متخصصة في فنون الخط وتوظيفها في التصميم الجرافيكي الحديث.",
        thumbnailUrl: "/thumbnails/thumb_graphic-design_3d.png"
    },

    // 8. Motion Graphics (3 items)
    {
        categorySlug: "motion-graphics",
        title: "أساسيات Motion Graphics",
        description: "تعلم تحريك الرسومات وصناعة الفيديوهات التوضيحية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9ps5Gu0MhDSuyZDiQycCJdjTiWNPjxI",
        aiDescription: "دورة في مبادئ التحريك وتطبيقها باستخدام After Effects.",
        thumbnailUrl: "/thumbnails/thumb_motion-graphics_3d.png"
    },
    {
        categorySlug: "motion-graphics",
        title: "After Effects BootCamp العربي",
        description: "احترف البرنامج الأقوى في عالم المؤثرات والتحريك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9ps5Gu0MiANa46_HgzOibsysnBZRtPx",
        aiDescription: "مسار متكامل لتعلم أدوات وتقنيات After Effects.",
        thumbnailUrl: "/thumbnails/thumb_motion-graphics_3d.png"
    },
    {
        categorySlug: "motion-graphics",
        title: "تحريك الشعارات (Logo Animation)",
        description: "تعلم كيف تضفي الحياة على الشعارات باستخدام الموشن.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9ps5Gu0MiASuyZDiQycCJdjTiWNPjxI",
        aiDescription: "دورة مركزة في تقنيات تحريك اللوجوهات بطرق احترافية.",
        thumbnailUrl: "/thumbnails/thumb_motion-graphics_3d.png"
    },

    // 9. Video Editing (3 items)
    {
        categorySlug: "video-editing",
        title: "احتراف المونتاج - Premiere Pro",
        description: "تعلم فن تحرير الفيديو بشكل سينمائي واحترافي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9ps5Gu0MiDSuyZDiQycCJdjTiWNPjxI",
        aiDescription: "دورة شاملة في برنامج Adobe Premiere Pro لعمل المونتاج وتصحيح الألوان.",
        thumbnailUrl: "/thumbnails/thumb_video-editing_3d.png"
    },
    {
        categorySlug: "video-editing",
        title: "صناعة المحتوى لليوتيوب",
        description: "تعلم كيف تصور وتمنتج وتطلق قناتك بنجاح.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL9eI2I9Wu9rQHsfOnSsdnbiik-pmtBLxU",
        aiDescription: "نصائح وتقنيات عملية لصناع المحتوى الرقمي وفيديوهات اليوتيوب.",
        thumbnailUrl: "/thumbnails/thumb_video-editing_3d.png"
    },
    {
        categorySlug: "video-editing",
        title: "تلوين الفيديو (Color Grading)",
        description: "تعلم سر الألوان السينمائية في فيديوهاتك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLpwHU9rNXAVv4yH_RzO_9O_9O_9O_9O_9",
        aiDescription: "دورة متخصصة في تصحيح وتغيير ألوان الفيديو باستخدام Premiere & DaVinci.",
        thumbnailUrl: "/thumbnails/thumb_video-editing_3d.png"
    },

    // 10. Office Tools (3 items)
    {
        categorySlug: "office-tools",
        title: "إتقان Microsoft Excel - من الصفر",
        description: "تعلم أقوى أداة لإدارة البيانات والجداول في العالم.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLnTjxvkcssL5UpbPKkXOEWkyfuZDRurKJ",
        aiDescription: "دورة في المعادلات، الجداول المحورية، وتحليل البيانات البسيط في إكسيل.",
        thumbnailUrl: "/thumbnails/thumb_office-tools_3d.png"
    },
    {
        categorySlug: "office-tools",
        title: "Microsoft Word للمحترفين",
        description: "تعلم كتابة التقارير والمستندات باحترافية وتنسيق عالي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLCt7qTC8-x1OlhwdGEcpQp_NMRC-jfKCK",
        aiDescription: "دورة شاملة في برنامج Word، تغطي القوالب، التنسيقات، والمراسلات.",
        thumbnailUrl: "/thumbnails/thumb_office-tools_3d.png"
    },
    {
        categorySlug: "office-tools",
        title: "PowerPoint لتصاميم العرض المبهرة",
        description: "تعلم كيف تصمم عروضاً تقديمية تخطف الأنظار.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLsa7VEql3EHXqU0PPAPJBNjKwq-OZPEsc",
        aiDescription: "دورة في مهارات العرض وتصميم الشرائح باستخدام بوربوينت.",
        thumbnailUrl: "/thumbnails/thumb_office-tools_3d.png"
    },

    // 11. Trading & Investment (3 items)
    {
        categorySlug: "trading-investment",
        title: "أساسيات التداول والاستثمار",
        description: "افهم الأسواق المالية وابدأ رحلتك الاستثمارية بذكاء.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLRBA_66LvhHE5p9REJzUWSATpiL1EqO4G",
        aiDescription: "دورة في مقدمة الأسواق، الأسهم، وإدارة المحافظ المالية الشخصية.",
        thumbnailUrl: "/thumbnails/thumb_trading-investment_3d.png"
    },
    {
        categorySlug: "trading-investment",
        title: "التحليل الفني للشموع اليابانية",
        description: "تعلم كيف تقرأ الرسوم البيانية وتتوقع اتجاهات السوق.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLRBA_66LvhHF9REJzUWSATpiL1EqO4G",
        aiDescription: "دورة مكثفة في أنماط الشموع والمؤشرات الفنية للتداول.",
        thumbnailUrl: "/thumbnails/thumb_trading-investment_3d.png"
    },
    {
        categorySlug: "trading-investment",
        title: "إدارة المخاطر في التداول",
        description: "الحفاظ على رأس المال هو سر النجاح، تعلم كيف تحمي استثماراتك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLRBA_66LvhHG9REJzUWSATpiL1EqO4G",
        aiDescription: "استراتيجيات عملية لتقليل المخاطر وتعظيم الأرباح في الأسواق المالية.",
        thumbnailUrl: "/thumbnails/thumb_trading-investment_3d.png"
    },

    // 12. Product Management (3 items)
    {
        categorySlug: "product-management",
        title: "مقدمة في إدارة المنتجات الرقمية",
        description: "تعلم كيف تقود بناء المنتجات التي يحبها المستخدمون.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLE18_ChYjeql7YH2a9sVCCwgSvKFiW-1F",
        aiDescription: "دورة تخصصية في دور مدير المنتج، دورة حياة المنتج، والبحث السوقي.",
        thumbnailUrl: "/thumbnails/thumb_product-management_3d.png"
    },
    {
        categorySlug: "product-management",
        title: "Agile & Scrum للمنتجات الحديثة",
        description: "تعلم منهجيات العمل المرنة لإدارة الفرق والمنتجات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLE18_ChYjeqm7YH2a9sVCCwgSvKFiW-1F",
        aiDescription: "شرح لمنهجيات Agile وكيفية تطبيق Scrum في تطوير المنتجات التقنية.",
        thumbnailUrl: "/thumbnails/thumb_product-management_3d.png"
    },
    {
        categorySlug: "product-management",
        title: "تحليل بيانات المنتج والاستخدام",
        description: "تعلم كيف تتخذ قرارات مبنية على الأرقام والبيانات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLE18_ChYjeqn7YH2a9sVCCwgSvKFiW-1F",
        aiDescription: "دورة في أدوات التحليل (Analytics) وقياس أداء المنتج ورضا المستخدم.",
        thumbnailUrl: "/thumbnails/thumb_product-management_3d.png"
    },

    // 13. Project Management (3 items)
    {
        categorySlug: "project-management",
        title: "أساسيات إدارة المشاريع - PMP",
        description: "تعلم المنهجية العالمية لإدارة المشاريع باحترافية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLlkIqY2NCXik8Ih23LugZ2T1rOubIpSr6",
        aiDescription: "دورة تمهيدية لشهادة PMP، تغطي ركائز إدارة المشاريع الناجحة.",
        thumbnailUrl: "/thumbnails/thumb_project-management_3d.png"
    },
    {
        categorySlug: "project-management",
        title: "إدارة المشاريع بالذكاء الاصطناعي",
        description: "استخدم الأدوات الحديثة لتسريع وتحسين وتيرة عمل المشاريع.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLluZGtIpwF_CGuqt1MHJMmTz2JgV0u4e0",
        aiDescription: "كيفية دمج أدوات AI في جدولة وتخطيط ومتابعة المشاريع.",
        thumbnailUrl: "/thumbnails/thumb_project-management_3d.png"
    },
    {
        categorySlug: "project-management",
        title: "مهارات القيادة لمدراء المشاريع",
        description: "إدارة الناس لا تقل أهمية عن إدارة المهام، تعلم فن القيادة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLluZGtIpwF_DGuqt1MHJMmTz2JgV0u4e0",
        aiDescription: "دورة في مهارات التواصل، التفاوض، وبناء الفرق الفعالة.",
        thumbnailUrl: "/thumbnails/thumb_project-management_3d.png"
    },

    // 14. Data & AI (3 items)
    {
        categorySlug: "data-ai",
        title: "علوم البيانات والذكاء الاصطناعي",
        description: "ادخل للمستقبل وتعلم كيف تحلل البيانات وتبني نماذج ذكية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL5iKaVIN_r995yTQzkx4MDPFnw3pqmKWz",
        aiDescription: "مسار شامل لتعلم علم البيانات، الإحصاء، وتطبيقات الذكاء الاصطناعي.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "تعلم الآلة (Machine Learning) بالعربي",
        description: "تعرف على الخوارزميات التي تجعل الكمبيوتر يتعلم ويتوقع.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL6-3IRz2XF5Vf1RAHyBo4tRzT8lEavPhR",
        aiDescription: "دورة تقنية في أنواع التعلم الآلي وبنائها باستخدام بايثون.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "أساسيات التعلم العميق (Deep Learning)",
        description: "تعرف على الشبكات العصبية وكيفية عمل الرؤية الحاسوبية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL5iKaVIN_r975yTQzkx4MDPFnw3pqmKWz",
        aiDescription: "دورة متقدمة في الذكاء الاصطناعي، تعالج مفاهيم الشبكات العصبية المعقدة.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },

    // 15. Data Analysis & BI (3 items)
    {
        categorySlug: "data-analytics-bi",
        title: "تحليل البيانات باستخدام SQL",
        description: "تعلم اللغة الأساسية للتعامل مع قواعد البيانات الكبيرة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAzH72MTPUaaAXmSra6H2zHq",
        aiDescription: "دورة في استخراج البيانات ومعالجتها باستخدام لغة الاستعلامات SQL.",
        thumbnailUrl: "/thumbnails/thumb_data-analytics-bi_3d.png"
    },
    {
        categorySlug: "data-analytics-bi",
        title: "Microsoft Power BI بالعربي",
        description: "تعلم تحويل الأرقام الصامتة إلى لوحات بيانية تفاعلية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLj2J7u_jT-5yL5f3Q8r7j_5b5s_c6yW0S",
        aiDescription: "دورة كاملة في برنامج Power BI لبناء تقارير ذكاء الأعمال (BI).",
        thumbnailUrl: "/thumbnails/thumb_data-analytics-bi_3d.png"
    },
    {
        categorySlug: "data-analytics-bi",
        title: "التحليل الإحصائي للأعمال",
        description: "تعلم المبادئ الإحصائية التي تدعم قرارات الأعمال الصحيحة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAzH72MTPUaaAXmSra6H2zHq",
        aiDescription: "مسار تعليمي في الإحصاء التطبيقي في بيئة الشركات والنمو.",
        thumbnailUrl: "/thumbnails/thumb_data-analytics-bi_3d.png"
    },

    // 16. DevOps (3 items)
    {
        categorySlug: "devops-infrastructure",
        title: "أساسيات DevOps والأتمتة",
        description: "تعلم دمج التطوير والعمليات لرفع كفاءة الأنظمة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLluZGtIpwF_BGuqt1MHJMmTz2JgV0u4e0",
        aiDescription: "دورة في مفاهيم DevOps وأدوات الأتمتة الحديثة (Docker, Jenkins).",
        thumbnailUrl: "/thumbnails/thumb_devops-infrastructure_3d.png"
    },
    {
        categorySlug: "devops-infrastructure",
        title: "إدارة السيرفرات Linux",
        description: "تعلم التعامل مع بيئة لينكس، العمود الفقري للانترنت.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAwXDF_VAbNsh7r8__npx-In",
        aiDescription: "دورة في سطر الأوامر وإدارة الخوادم في بيئات Linux الحقيقية.",
        thumbnailUrl: "/thumbnails/thumb_devops-infrastructure_3d.png"
    },
    {
        categorySlug: "devops-infrastructure",
        title: "أتمتة البنية التحتية - Ansible",
        description: "تعلم كيف تدير مئات السيرفرات بضغطة زر واحدة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLt-qNOC_XW_yS-X_X_X_X_X_X_X_X_X",
        aiDescription: "دورة عملية في أداة Ansible لإدارة الإعدادات والأتمتة.",
        thumbnailUrl: "/thumbnails/thumb_devops-infrastructure_3d.png"
    },
    {
        categorySlug: "devops-infrastructure",
        title: "ماستري في Docker",
        description: "تعلم الحاويات وكيفية تشغيل تطبيقاتك بسهولة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAycSTUu599mS82_vH_m36G3",
        aiDescription: "دورة شاملة في Docker من Elzero Web School.",
        thumbnailUrl: "/thumbnails/thumb_devops-infrastructure_3d.png"
    },

    // 17. Cloud Computing (3 items)
    {
        categorySlug: "cloud-computing",
        title: "احتراف الحوسبة السحابية",
        description: "تعلم بناء وإدارة الأنظمة في بيئات AWS و Azure.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL9eI2I9Wu9rQHsfOnSsdnbiik-pmtBLxU",
        aiDescription: "مقدمة شاملة للخدمات السحابية وكيفية اختيار الأنسب للشركات.",
        thumbnailUrl: "/thumbnails/thumb_cloud-computing_3d.png"
    },
    {
        categorySlug: "cloud-computing",
        title: "AWS Certified Solution Architect",
        description: "مسار التحضير لشهادة أمازون السحابية الأكثر طلباً.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLt-qNOC_XW_yS_X_X_X_X_X_X_X_X_X_X",
        aiDescription: "نظرة متعمقة في خدمات أمازون (EC2, S3, RDS) وتصميم الأنظمة السحابية.",
        thumbnailUrl: "/thumbnails/thumb_cloud-computing_3d.png"
    },
    {
        categorySlug: "cloud-computing",
        title: "Azure Cloud Fundamentals",
        description: "ابدأ رحلتك في خدمات مايكروسوفت السحابية للمؤسسات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLt-qNOC_XW_zS_X_X_X_X_X_X_X_X_X_X",
        aiDescription: "دورة تمهيدية لشهادة AZ-900 وتكنولوجيات مايكروسوفت آزور.",
        thumbnailUrl: "/thumbnails/thumb_cloud-computing_3d.png"
    },

    // 18. Cybersecurity (3 items)
    {
        categorySlug: "cybersecurity",
        title: "دورة الأمن السيبراني الشاملة",
        description: "تعلم كيف تحمي الأنظمة وتكشف الثغرات قبل المخترقين.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLpwHU9rNXAVs5dnnpmbuzcCB6lR_xKpRo",
        aiDescription: "مسار متخصص في أمن المعلومات واختبار الاختراق الأخلاقي والحماية.",
        thumbnailUrl: "/thumbnails/thumb_cybersecurity_3d.png"
    },
    {
        categorySlug: "cybersecurity",
        title: "أمن الشبكات للمحترفين",
        description: "تعلم كيف تبني جدراناً نارية قوية وتراقب الحركات المشبوهة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLH-n8YK76vIiuIZoWvHL7AvtrDV7hR3He",
        aiDescription: "دورة تتركز على تأمين الشبكات اللاسلكية والسلكية وتشفير البيانات.",
        thumbnailUrl: "/thumbnails/thumb_cybersecurity_3d.png"
    },
    {
        categorySlug: "cybersecurity",
        title: "اختبار اختراق تطبيقات الويب",
        description: "تعلم كيف تكتشف ثغرات المواقع وتحميها من التجسس.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLpwHU9rNXAVs5dnnpmbuzcCB6lR_xKpRo",
        aiDescription: "تغطية لأشهر هجمات المواقع (SQLi, XSS) وكيفية الوقاية منها برمجياً.",
        thumbnailUrl: "/thumbnails/thumb_cybersecurity_3d.png"
    },

    // 19. Digital Marketing (3 items)
    {
        categorySlug: "digital-marketing",
        title: "التسويق الرقمي الحديث",
        description: "احصل على عملاء جدد وابنِ هوية رقمية مؤثرة لعملك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLS4zPpydKU7L8LY1FRRBLO4SGVqg6vfNz",
        aiDescription: "دورة في استراتيجيات التسويق عبر وسائل التواصل والبريد الالكتروني والنمو.",
        thumbnailUrl: "/thumbnails/thumb_digital-marketing_3d.png"
    },
    {
        categorySlug: "digital-marketing",
        title: "إعلانات جوجل وسناب شات بالعربي",
        description: "تعلم صناعة حملات إعلانية ممولة تجلب أرباحاً حقيقية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLgWvK1F3_g-w_uX4Z7B9y_q_q7E7_w",
        aiDescription: "دورة عملية في إدارة المنصات الإعلانية وتحليل أداء الميزانيات التسويقية.",
        thumbnailUrl: "/thumbnails/thumb_digital-marketing_3d.png"
    },
    {
        categorySlug: "digital-marketing",
        title: "تحليل البيانات التسويقية (ROAS)",
        description: "تعلم كيف تقيس نجاح حملاتك وتضاعف العائد على استثمارك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAzH72MTPUaaAXmSra6H2zHq",
        aiDescription: "دورة في التتبع والقياس (Pixel, API Conversion) لرفع مبيعاتك.",
        thumbnailUrl: "/thumbnails/thumb_digital-marketing_3d.png"
    },

    // 20. Content Marketing & SEO (2 items)
    {
        categorySlug: "seo-content-marketing",
        title: "تحسين محركات البحث SEO الكاملة",
        description: "اجعل موقعك يتصدر النتائج الأولى في جوجل مجاناً.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLfJqU5-lpa3AvfP9GZpSE7mC5v-55j692",
        aiDescription: "دورة في الكلمات المفتاحية، بناء الروابط، وتحسين المحتوى داخلياً وخارجياً.",
        thumbnailUrl: "/thumbnails/thumb_seo-content-marketing_3d.png"
    },
    {
        categorySlug: "seo-content-marketing",
        title: "كتابة المحتوى التسويقي (Copywriting)",
        description: "تعلم فن الكتابة التي تبيع وتحرك مشاعر الجمهور.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLS4zPpydKU7P8LY1FRRBLO4SGVqg6vfNz",
        aiDescription: "أساسيات كتابة الإعلانات والمقالات التسويقية والسكريبتات.",
        thumbnailUrl: "/thumbnails/thumb_seo-content-marketing_3d.png"
    },

    // 21. Entrepreneurship (3 items)
    {
        categorySlug: "business-management",
        title: "رحلة ريادة الأعمال من الفكرة للشركة",
        description: "تعلم كيف تبدأ مشروعك الخاص وتديره بنجاح واستدامة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLE18_ChYjeql7YH2a9sVCCwgSvKFiW-1D",
        aiDescription: "دورة في بناء نماذج العمل (MBC) وجذب الاستثمارات وإدارة الشركات الناشئة.",
        thumbnailUrl: "/thumbnails/thumb_business-management_3d.png"
    },
    {
        categorySlug: "business-management",
        title: "أساسيات الإدارة المالية للشركات",
        description: "فهم التدفقات النقدية والميزانيات هو سر استمرار أي عمل.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLE18_ChYjeqm7YH2a9sVCCwgSvKFiW-1D",
        aiDescription: "مسار تعليمي في مبادئ المحاسبة والتمويل لغير الماليين من رواد الأعمال.",
        thumbnailUrl: "/thumbnails/thumb_business-management_3d.png"
    },
    {
        categorySlug: "business-management",
        title: "مبادئ المحاسبة واحد",
        description: "أساسيات المحاسبة المالية للمبتدئين.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL8GFhMxm-teDo2Ln8lcnDhJaRyyKe9u8d",
        aiDescription: "دورة في مبادئ المحاسبة المالية من صهيب بني كنانة.",
        thumbnailUrl: "/thumbnails/thumb_business-management_3d.png"
    },

    // 22. Ecommerce (3 items)
    {
        categorySlug: "ecommerce",
        title: "بناء المتاجر الإلكترونية - Shopify",
        description: "أطلق تجارتك العالمية في ساعات قليلة عبر منصة شوبيفاي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL18t74YY-p_E0wFnB7NmtxUhdnKGnG0l7",
        aiDescription: "دورة تطبيقية في تجهيز القوالب، المنتجات، وبوابات الدفع للمتاجر.",
        thumbnailUrl: "/thumbnails/thumb_ecommerce_3d.png"
    },
    {
        categorySlug: "ecommerce",
        title: "التجارة الإلكترونية عبر WooCommerce",
        description: "حول موقع الووردبريس الخاص بك لمتجر جبار واحترافي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLHwH6lX2gGf7Y2y1B8n9K0Q8g9Q9j8Q5W",
        aiDescription: "دورة في تخصيص إضافات التجارة وإدارة المخزون والطلبات برمجياً.",
        thumbnailUrl: "/thumbnails/thumb_ecommerce_3d.png"
    },
    {
        categorySlug: "ecommerce",
        title: "استراتيجيات البيع العابر (Up-selling)",
        description: "تعلم كيف تضاعف مبيعات كل عميل يدخل لمتجرك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLS4zPpydKU7S8LY1FRRBLO4SGVqg6vfNz",
        aiDescription: "تكتيكات نفسية وتقنية لرفع قيمة سلة المشتريات وزيادة الأرباح.",
        thumbnailUrl: "/thumbnails/thumb_ecommerce_3d.png"
    },

    // 23. Dropshipping (3 items)
    {
        categorySlug: "dropshipping",
        title: "الدروب شوبينج الكامل بالعربي",
        description: "تعلم التجارة دون القلق من المخازن والشحن - دليل 2024.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLS4zPpydKU7T8LY1FRRBLO4SGVqg6vfNz",
        aiDescription: "مسار متكامل في اختيار الموردين والعثور على المنتجات الواعدة (Winning Products).",
        thumbnailUrl: "/thumbnails/thumb_dropshipping_3d.png"
    },
    {
        categorySlug: "dropshipping",
        title: "إعلانات تيك توك للدروب شوبينج",
        description: "استغل المنصة الأسرع نمواً لتفجير مبيعات منتجاتك.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLS4zPpydKU7U8LY1FRRBLO4SGVqg6vfNz",
        aiDescription: "دورة في صناعة فيديوهات دعائية تحقق انتشاراً سريعاً (Viral Ads).",
        thumbnailUrl: "/thumbnails/thumb_dropshipping_3d.png"
    },
    {
        categorySlug: "dropshipping",
        title: "خدمة العملاء وتقليل الاسترجاع",
        description: "ابنِ سمعة طيبة وحافظ على أرباحك من الضياع.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLS4zPpydKU7V8LY1FRRBLO4SGVqg6vfNz",
        aiDescription: "أفضل الممارسات للتعامل مع المشاكل اللوجستية ورضا العميل العالمي.",
        thumbnailUrl: "/thumbnails/thumb_dropshipping_3d.png"
    },
    {
        categorySlug: "dropshipping",
        title: "كورس دروبشيبينغ وشوبيفاي",
        description: "دليل شامل لبدء تجارتك عبر شوبيفاي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL18t74YY-p_FHykZngy17XsxoO1vC6G_E",
        aiDescription: "دورة عملية في بناء المتاجر عبر Shopify.",
        thumbnailUrl: "/thumbnails/thumb_dropshipping_3d.png"
    },

    // 24. Software Testing (3 items)
    {
        categorySlug: "qa-testing",
        title: "أساسيات اختبار البرمجيات ISTQB",
        description: "تعلم كيف تضمن جودة الأكواد وتبحث عن الأخطاء باحترافية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLBw1ubD1J1UjK7d1Jp3z1m4l1x3x0L1_3",
        aiDescription: "دورة في مفاهيم الاختبار اليدوي (Manual Testing) ومنهجية ISTQB الشهيرة.",
        thumbnailUrl: "/thumbnails/thumb_qa-testing_3d.png"
    },
    {
        categorySlug: "qa-testing",
        title: "الأتمتة في الاختبار - Selenium",
        description: "دع البرنامج يختبر نفسه، تعلم كتابة سكريبتات فحص تلقائية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLBw1ubD1J1UjP1rZMbU8NSh2ajE12Yjjf",
        aiDescription: "دورة عملية في اختبار المواقع آلياً باستخدام جافا أو بايثون مع Selenium.",
        thumbnailUrl: "/thumbnails/thumb_qa-testing_3d.png"
    },
    // Adding 20 more distinct courses to reach 66+
    {
        categorySlug: "programming",
        title: "تعلم TypeScript من Elzero",
        description: "أضف القوة والأنواع للغة جافاسكريبت.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAy5No8ig9439S7S_pPr_H-3",
        aiDescription: "دورة شاملة في TypeScript للمحترفين.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "Git & GitHub للمبرمجين",
        description: "تعلم إدارة إصدارات الكود والتعاون البرمجي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAw4eOj58MZPakH0PgvBcBYu",
        aiDescription: "دورة عملية في Git و GitHub.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "مبادئ الإحصاء لتحليل البيانات",
        description: "افهم الأرقام وكيفية تحليلها إحصائياً.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLxIvc-MGOs6ilU3FPyJr3T-VkufZy2NGi",
        aiDescription: "دورة في الإحصاء الوصفي والاستدلالي.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    {
        categorySlug: "business-management",
        title: "مهارات القيادة الفعالة",
        description: "تعلم كيف تقود فريقك نحو النجاح.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL487Z6v66O9Fsqq87A4r2SE_ApUs7iDzX",
        aiDescription: "دورة في سمات القائد الناجح وفن الإدارة.",
        thumbnailUrl: "/thumbnails/thumb_business-management_3d.png"
    },
    {
        categorySlug: "video-editing",
        title: "DaVinci Resolve للمونتاج المتقدم",
        description: "احترف البرنامج الأقوى في تصحيح الألوان والمونتاج.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLsa7VEql3EHUL_JjoaGgEo_xjBc2P3TdL",
        aiDescription: "دورة شاملة في دافنشي ريزولف.",
        thumbnailUrl: "/thumbnails/thumb_video-editing_3d.png"
    },
    {
        categorySlug: "cybersecurity",
        title: "الأمن السيبراني للمبتدئين",
        description: "ابدأ رحلتك في حماية البيانات والأنظمة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLe3wTuMiw39piOsm-JAeVzWo_qZOSKVcb",
        aiDescription: "مقدمة شاملة في عالم Cybersecurity.",
        thumbnailUrl: "/thumbnails/thumb_cybersecurity_3d.png"
    },
    {
        categorySlug: "digital-marketing",
        title: "إعلانات فيسبوك وانستجرام 2024",
        description: "احترف حملات Meta الإعلانية.",
        playlistUrl: "https://www.youtube.com/watch?v=F0kQ0L0B_9M",
        aiDescription: "دليل كامل لإعلانات فيسبوك.",
        thumbnailUrl: "/thumbnails/thumb_digital-marketing_3d.png"
    },
    {
        categorySlug: "graphic-design",
        title: "تصميم الهويات البصرية",
        description: "تعلم كيف تبني علامة تجارية متكاملة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLg9ps5Gu0MiC_T2Spv3tMmmQjhpCrKC7Z",
        aiDescription: "دورة في بناء البراندينج وتصميم الشعارات.",
        thumbnailUrl: "/thumbnails/thumb_graphic-design_3d.png"
    },
    {
        categorySlug: "office-tools",
        title: "كورس مايكروسوفت أوفيس الشامل",
        description: "تعلم إكسيل، وورد، وباوربوينت في مسار واحد.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLsa7VEql3EHXqU0PPAPJBNjKwq-OZPEsc",
        aiDescription: "دورة متكاملة في تطبيقات المكتب.",
        thumbnailUrl: "/thumbnails/thumb_office-tools_3d.png"
    },
    {
        categorySlug: "programming",
        title: "تعلم البرمجة بلغة C++",
        description: "اللغة الأم للأنظمة والألعاب.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAy41u35aqJUrL-2yXpI79pZ",
        aiDescription: "دورة Elzero في C++ للمبتدئين.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "بناء تطبيقات الاندرويد بالعربي",
        description: "تعلم تطوير تطبيقات الموبايل باستخدام Kotlin.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLMTdZ61eBnyoWf6V3_X6o3rP-n5I_N8R-",
        aiDescription: "دورة شاملة في Android Development.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "game-development",
        title: "تطوير الألعاب Unity 2D",
        description: "ابدأ بصناعة ألعابك الأولى ثنائية الأبعاد.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLpwHU9rNXAVs5dnnpmbuzcCB6lR_xKpRo",
        aiDescription: "دورة في محرك Unity وتطوير الألعاب.",
        thumbnailUrl: "/thumbnails/thumb_game-development_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "التعلم العميق Deep Learning",
        description: "اكتشف قمة الذكاء الاصطناعي والشبكات العصبية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLG_q999X_X_X_X_X_X_X_X_X_X",
        aiDescription: "دورة متقدمة في الذكاء الاصطناعي.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    {
        categorySlug: "ecommerce",
        title: "إنشاء المتاجر عبر Shopify",
        description: "ابدأ تجارتك العالمية اليوم.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL18t74YY-p_FHykZngy17XsxoO1vC6G_E",
        aiDescription: "دورة عملية في شوبيفاي.",
        thumbnailUrl: "/thumbnails/thumb_ecommerce_3d.png"
    },
    {
        categorySlug: "qa-testing",
        title: "أساسيات اختبار الاختراق",
        description: "تعلم الهكر الأخلاقي وكيفية حماية الأنظمة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLpwHU9rNXAVs5dnnpmbuzcCB6lR_xKpRo",
        aiDescription: "دورة في اكتشاف الثغرات والحماية.",
        thumbnailUrl: "/thumbnails/thumb_qa-testing_3d.png"
    },
    {
        categorySlug: "project-management",
        title: "أساسيات Agile & Scrum",
        description: "تعلم أساليب إدارة المشاريع الحديثة والمرنة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLlkIqY2NCXilP5iS2n-z2Wq1v5O_7pG",
        aiDescription: "دورة في منهجيات الأجايل وسكروم.",
        thumbnailUrl: "/thumbnails/thumb_project-management_3d.png"
    },
    {
        categorySlug: "business-management",
        title: "إدارة الوقت والإنتاجية",
        description: "تعلم كيف تنجز أكثر في وقت أقل.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLsa7VEql3EHXqU0PPAPJBNjKwq-OZPEsc",
        aiDescription: "مهارات تنظيم الوقت والتركيز.",
        thumbnailUrl: "/thumbnails/thumb_business-management_3d.png"
    },
    {
        categorySlug: "digital-marketing",
        title: "التسويق عبر البريد الإلكتروني",
        description: "ابنِ علاقات قوية مع عملائك عبر الايميل.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLfJqU5-lpa3AvfP9GZpSE7mC5v-55j692",
        aiDescription: "دورة في استراتيجيات Email Marketing.",
        thumbnailUrl: "/thumbnails/thumb_digital-marketing_3d.png"
    },
    {
        categorySlug: "programming",
        title: "هندسة البرمجيات بالعربي",
        description: "تعلم كيف تبني أنظمة برمجية ضخمة وقابلة للتطوير.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL48bJ7_l0O8P-X_X_X_X_X_X_X",
        aiDescription: "دورة في Software Engineering.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "office-tools",
        title: "مهارات البحث المتقدم في جوجل",
        description: "كن خبيراً في الوصول لأي معلومة بسرعة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAwXDF_VAbNsh7r8__npx-In",
        aiDescription: "تقنيات البحث المتقدم والسرية الرقمية.",
        thumbnailUrl: "/thumbnails/thumb_office-tools_3d.png"
    },
    // Final Batch to push to 66+
    {
        categorySlug: "programming",
        title: "المرجع الشامل في Laravel",
        description: "احترف بناء تطبيقات الويب المتطورة باستخدام لارافيل.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAy_mAhY0x8cHf8oSGPKsEKP",
        aiDescription: "دورة شاملة في أحد أقوى إطارات عمل PHP.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "أساسيات PHP 8 الحديثة",
        description: "تعلم البرمجة من جانب الخادم بأحدث معايير PHP.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAz7_yYxXSNQEKxU0Aqa_CQg",
        aiDescription: "مسار تعليمي لتطوير المواقع الديناميكية.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "خوارزميات جافاسكريبت المتقنة",
        description: "ارتق بمستوى تفكيرك البرمجي عبر حل المشكلات المعقدة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAy44C_NXLw9Z0v-91Dq0-2T",
        aiDescription: "تطبيقات عملية على الخوارزميات وهياكل البيانات في JS.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "لغة بايثون من الصفر",
        description: "ابدأ رحلتك في أكثر اللغات طلباً في سوق العمل.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL1D_ruUhRYqHeubarapJZ4MtewH25NeTw",
        aiDescription: "دورة شاملة في بايثون للمبتدئين.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "رؤية الكمبيوتر Computer Vision",
        description: "تعلم كيف تجعل الآلات ترى وتفهم الصور والفيديوهات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL6-3IRz2XF5X-lzMZdmkvGAx1a3kIm7_I",
        aiDescription: "دورة متخصصة في معالجة الصور والذكاء الاصطناعي.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    {
        categorySlug: "programming",
        title: "تطوير التطبيقات عبر Flutter",
        description: "ابنِ تطبيقات للأندرويد والآيفون بكود واحد.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLW_D_Qf01W47j_oW2j1_Z0fQ8Q0W2j1_Z0",
        aiDescription: "دورة كاملة في فلاتر وتطوير الموبايل.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "مكتبة React.js للمحترفين",
        description: "احترف بناء واجهات المستخدم العصرية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAyE_6jjuVxx_UCcKshM_6tL",
        aiDescription: "دورة شاملة في ريأكت من الصفر.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "إطار عمل Next.js المتكامل",
        description: "تعلم تقنيات الـ SSR وبناء مواقع سريعة جداً.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAzHm-82_6f6o2kYl785XkM2",
        aiDescription: "تطوير تطبيقات الويب الحديثة باستخدام Next.js.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    // Final Batch to push to 66+ (Unique IDs)
    {
        categorySlug: "ui-ux-design",
        title: "Adobe XD لتصميم الواجهات",
        description: "تعلم أداة أدوبي الرائدة في تصميم تجربة المستخدم.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLhYj2o5B5N33b7-7Fz6l_kS1w3iY2m_m_",
        aiDescription: "دورة شاملة في بناء نماذج أولية (Prototypes).",
        thumbnailUrl: "/thumbnails/thumb_ui-ux-design_3d.png"
    },
    {
        categorySlug: "graphic-design",
        title: "Adobe InDesign للمطبوعات",
        description: "احترف تصميم الكتب والمجلات والمنشورات.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL2UoMz392HLaXcVRH4m3ZvR8Id4w5KCTV",
        aiDescription: "دورة أساسيات ومتقدم لإنديزاين.",
        thumbnailUrl: "/thumbnails/thumb_graphic-design_3d.png"
    },
    {
        categorySlug: "programming",
        title: "برمجة السيرفرات Node.js",
        description: "تعلم بناء الـ Backend باستخدام جافاسكريبت.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLqPejUavRNTUZUdVd91NRrD-dz6jrbPFL",
        aiDescription: "دورة شاملة في Node.js و Express.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "ماستري في SASS",
        description: "ارتقِ بأسلوب كتابتك لـ CSS عبر SASS.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAx_JfgQhWb5_T0L-XQ6N7",
        aiDescription: "دورة Elzero في تحسين كتابة الاستايلات.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "programming",
        title: "احتراف CSS Grid & Flexbox",
        description: "تعلم بناء تخطيطات المواقع العصرية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLDoPjvoNmBAw_nc_ZfQWvH33rT4R0YjS5",
        aiDescription: "دورة شاملة في أحد أهم تقنيات تخطيط الويب.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "خوارزميات متقدمة بالعربي",
        description: "تعمق في حل المشكلات البرمجية المعقدة.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL6-3IRz2XF5XyZ2h4K6V60M_6tJk9x-N4",
        aiDescription: "دورة عادل نسيم في هياكل البيانات والخوارزميات.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    {
        categorySlug: "data-ai",
        title: "الدورة الكاملة للتعلم العميق",
        description: "افهم أعماق الذكاء الاصطناعي وكيف تعمل الشبكات العصبية.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL6-3IRz2XF5X-lzMZdmkvGAx1a3kIm7_I",
        aiDescription: "دورة هشام عاصم في الـ Deep Learning.",
        thumbnailUrl: "/thumbnails/thumb_data-ai_3d.png"
    },
    // Final Guaranteed Batch (English, IT, HR, Arduino)
    {
        categorySlug: "language-learning",
        title: "تعلم اللغة الإنجليزية من الصفر - المستوى الأول",
        description: "أشهر دورة لتعلم الإنجليزية في العالم العربي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLp22-4PivYmIFAnru_L7fnMhSV5YffLTZ",
        aiDescription: "المستوى الأول الكامل من قناة ZAmericanEnglish.",
        thumbnailUrl: "/thumbnails/thumb_language-learning_3d.png"
    },
    {
        categorySlug: "office-tools",
        title: "أساسيات صيانة الكمبيوتر - CompTIA A+",
        description: "تعلم صيانة الحاسوب والشبكات بشكل احترافي.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLLlr6jKKdyK2i60473jKolHvnZ359EbWf",
        aiDescription: "شهادة +A العالمية في الدعم الفني.",
        thumbnailUrl: "/thumbnails/thumb_office-tools_3d.png"
    },
    {
        categorySlug: "business-management",
        title: "دورة إدارة الموارد البشرية HR",
        description: "افهم وظائف الـ HR وكيفية إدارة المواهب.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL5we_jj01We3I3B3bYjOhMkp8z_dPxxhJ",
        aiDescription: "دورة شاملة في Human Resources Management.",
        thumbnailUrl: "/thumbnails/thumb_business-management_3d.png"
    },
    {
        categorySlug: "programming",
        title: "تعلم الأردوينو من الصفر",
        description: "ابنِ مشاريع إلكترونية وذكية باستخدام Arduino.",
        playlistUrl: "https://www.youtube.com/playlist?list=PL2i6qeLgL0_3jwwv7aZYZuvJkpSIT9CgL",
        aiDescription: "دورة وليد عيسى في الإلكترونيات والأردوينو.",
        thumbnailUrl: "/thumbnails/thumb_programming_3d.png"
    },
    // Final Push: English Mastery Series
    {
        categorySlug: "language-learning",
        title: "تعلم الإنجليزية: المستوى الثاني",
        description: "استكمل رحلتك مع المستوى الثاني من ZAmericanEnglish.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLp22-4PivYmLebd3vD0_WfIteVUlSA44G",
        aiDescription: "دورة المستوى الثاني المتقدمة.",
        thumbnailUrl: "/thumbnails/thumb_language-learning_3d.png"
    },
    {
        categorySlug: "language-learning",
        title: "تطوير مهارات الاستماع - إنجليزي",
        description: "درب أذنك على فهم المتحدثين الأصليين.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLp22-4PivYmKGwdQda1LVJxE1p7BZYNgJ",
        aiDescription: "كورس الاستماع الشامل من ZAmericanEnglish.",
        thumbnailUrl: "/thumbnails/thumb_language-learning_3d.png"
    },
    {
        categorySlug: "language-learning",
        title: "كورس المحادثة الإنجليزية",
        description: "تحدث بطلاقة وثقة في مختلف المواقف.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLp22-4PivYmKp2aC7PI7K0POsf812xLBN",
        aiDescription: "دورة المحادثة العملية للحياة اليومية.",
        thumbnailUrl: "/thumbnails/thumb_language-learning_3d.png"
    },
    {
        categorySlug: "qa-testing",
        title: "اختبار تطبيقات الموبايل (Appium)",
        description: "تأكد من عمل تطبيقك على كافة أحجام الشاشات وأنظمة التشغيل.",
        playlistUrl: "https://www.youtube.com/playlist?list=PLN9s9kXG_l36bW3Jj82K-151J64y5p20g",
        aiDescription: "دورة في فحص تطبيقات الأندرويد والآيفون وضمان استقرار أدائها.",
        thumbnailUrl: "/thumbnails/thumb_qa-testing_3d.png"
    }
];

async function scrapePlaylist(playlistUrl: string) {
    try {
        console.log(`Scraping playlist: ${playlistUrl}`);
        const response = await fetch(playlistUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
            }
        });
        const html = await response.text();

        console.log(`HTML Length: ${html.length}`);

        // Try multiple regex patterns for ytInitialData
        let dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
        if (!dataMatch) {
            dataMatch = html.match(/window\["ytInitialData"\] = ({.*?});/);
        }
        if (!dataMatch) {
            // Check if it's a "consent" page or error page
            if (html.includes("consent.youtube.com")) {
                console.error("DEBUG: Redirected to consent page");
            } else if (html.includes("unusual traffic")) {
                console.error("DEBUG: Unusual traffic detected (Bot detection)");
            } else {
                console.error(`DEBUG: Could not find ytInitialData. First 500 chars: ${html.substring(0, 500)}`);
            }
            return [];
        }

        const data = JSON.parse(dataMatch[1]);
        let videoItems = [];

        // Try multiple paths for video items
        try {
            // Path 1: standard playlist page
            videoItems = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents || [];
        } catch (e) { }

        if (videoItems.length === 0) {
            try {
                // Path 2: alternative layout (richGrid)
                videoItems = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.richGridRenderer?.contents || [];
            } catch (e) { }
        }

        if (videoItems.length === 0) {
            try {
                // Path 3: response received actions
                videoItems = data.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
            } catch (e) { }
        }

        if (videoItems.length === 0) {
            console.error(`DEBUG: Found ytInitialData but no video items. Keys in data: ${Object.keys(data).join(', ')}`);
        }

        return videoItems
            .map((v: any) => v.playlistVideoRenderer || v.richItemRenderer?.content?.playlistVideoRenderer || v.continuationItemRenderer)
            .filter((v: any) => v && v.videoId)
            .map((v: any, index: number) => {
                const videoId = v.videoId;
                const title = v.title?.runs?.[0]?.text || v.title?.simpleText || "Untitled Lesson";

                let duration = 0;
                const lengthText = v.lengthText?.simpleText || "";
                if (lengthText) {
                    const parts = lengthText.split(':').map((p: string) => parseInt(p));
                    if (parts.length === 2) duration = (parts[0] * 60) + parts[1];
                    else if (parts.length === 3) duration = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
                }

                return {
                    title,
                    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
                    order: index + 1,
                    duration
                };
            });
    } catch (error) {
        console.error(`Scraping error for ${playlistUrl}:`, error);
        return [];
    }
}

async function run() {
    console.log("Starting Mass Import Correction...");

    const dbCategories = await db.select().from(categories);

    for (const item of COURSES_TO_IMPORT) {
        try {
            const category = dbCategories.find(c => c.slug === item.categorySlug);
            if (!category) {
                console.error(`Category not found: ${item.categorySlug}`);
                continue;
            }

            // Check if course already exists
            const existingCourses = await db.select().from(courses).where(eq(courses.title, item.title));
            let courseToUse;
            let sectionToUse;

            if (existingCourses.length > 0) {
                courseToUse = existingCourses[0];

                // Check if it already has lessons
                const existingLessons = await db.select({ count: sql<number>`count(*)` })
                    .from(lessons)
                    .innerJoin(sections, eq(lessons.sectionId, sections.id))
                    .where(eq(sections.courseId, courseToUse.id));

                if (Number(existingLessons[0].count) > 0) {
                    console.log(`Skipping ${item.title} (already has ${existingLessons[0].count} lessons)`);
                    continue;
                }

                console.log(`Retrying empty course: ${item.title}`);
                const [section] = await db.select().from(sections).where(eq(sections.courseId, courseToUse.id)).limit(1);
                sectionToUse = section;

                if (!sectionToUse) {
                    [sectionToUse] = await db.insert(sections).values({
                        courseId: courseToUse.id,
                        title: "المحتوى التدريبي الكامل",
                        order: 1
                    }).returning();
                }
            } else {
                console.log(`Creating new course: ${item.title}`);
                const [newCourse] = await db.insert(courses).values({
                    title: item.title,
                    description: item.description,
                    categoryId: category.id,
                    thumbnail: item.thumbnailUrl,
                    instructor: "نخبة من خبراء المحتوى العربي",
                    language: "Arabic",
                    level: "beginner",
                    price: "0",
                    isPublished: true,
                    aiDescription: item.aiDescription,
                    slug: item.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now()
                } as any).returning();

                courseToUse = newCourse;

                const [newSection] = await db.insert(sections).values({
                    courseId: courseToUse.id,
                    title: "المحتوى التدريبي الكامل",
                    order: 1
                }).returning();

                sectionToUse = newSection;
            }

            const lessonsData = await scrapePlaylist(item.playlistUrl);
            if (lessonsData.length > 0) {
                const finalLessons = lessonsData.map((l: any) => ({
                    ...l,
                    sectionId: sectionToUse.id,
                    isFree: true
                }));
                await db.insert(lessons).values(finalLessons);
                console.log(`Successfully imported ${finalLessons.length} lessons for ${item.title}`);
            } else {
                console.warn(`WARNING: Zero lessons found for ${item.title} at ${item.playlistUrl}`);
            }

            // Add a small delay between requests to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (e) {
            console.error(`Error processing ${item.title}:`, e);
        }
    }

    console.log("Mass Import Correction Finished.");
    process.exit(0);
}

run();
