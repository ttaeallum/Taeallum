import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { CourseCard } from "@/components/ui/course-card";

import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, BookOpen, Clock, Sparkles, Target, CheckCircle2, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Seo } from "@/components/seo";

export default function Home() {
  const { data: featuredCourses, isLoading } = useQuery({
    queryKey: ["featured-courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses/featured");
      if (!res.ok) throw new Error("Failed to fetch featured courses");
      return res.json();
    },
  });
  const { data: specializations, isLoading: specializationsLoading } = useQuery({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const res = await fetch("/api/courses/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const res = await fetch("/api/courses/stats");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return null;
        return res.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5
  });

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  // Structured Data for Featured Courses
  const coursesSchema = featuredCourses?.map((course: any) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "منصة تعلّم",
      "sameAs": "https://tallm.com"
    }
  }));

  return (
    <Layout>
      <Seo
        title="تعلّم (Tallm) | احترف البرمجة مجاناً"
        description="منصة تعلّم (Tallm) هي وجهتك الأولى لاحتراف البرمجة والتقنيات الأكثر طلباً في سوق العمل من خلال دورات مجانية واحترافية باللغة العربية."
      />
      {coursesSchema && (
        <script type="application/ld+json">
          {JSON.stringify(coursesSchema)}
        </script>
      )}
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-12 pb-20 bg-mesh-gradient">
        {/* Cinematic Background Elements */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute top-[-20%] right-[-10%] w-[500px] md:w-[1000px] h-[500px] md:h-[1000px] bg-primary/20 rounded-full blur-[120px] md:blur-[220px] animate-pulse-glow"
          />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] md:w-[700px] h-[300px] md:h-[700px] bg-emerald-500/10 rounded-full blur-[90px] md:blur-[180px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-right"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary/30 bg-primary/5 text-primary rounded-full font-black tracking-widest uppercase text-xs backdrop-blur-sm">
                  مستقبل التعليم التقني 2026
                </Badge>
              </motion.div>

              <h1 className="font-black text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-[1] text-foreground mb-8 tracking-tighter">
                بوابتك لـ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-emerald-400 to-primary animate-gradient-x text-glow">
                  احتراف الكود
                </span>
              </h1>

              <p className="text-lg md:text-2xl text-muted-foreground mb-12 max-w-2xl ml-auto leading-relaxed font-medium opacity-90">
                حوّل طموحاتك إلى واقع مع <span className="text-primary font-black underline underline-offset-8 decoration-primary/30">دورات مدعومة بالذكاء الاصطناعي</span> ومسارات تعليمية مصممة لأعلى المعايير العالمية.
              </p>

              <div className="flex flex-col sm:flex-row-reverse gap-5 md:gap-8 justify-center sm:justify-start items-center">
                <Link href="/ai-pricing" className="w-full sm:w-auto">
                  <Button size="lg" className="h-16 md:h-20 px-10 md:px-14 text-xl md:text-2xl font-black shadow-[0_20px_50px_rgba(var(--primary),0.3)] gap-4 rounded-[2rem] hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90 w-full group">
                    ابدأ رحلتك الآن
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
                  </Button>
                </Link>
                <Link href="/courses" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="h-16 md:h-20 px-10 md:px-14 text-xl md:text-2xl font-black rounded-[2rem] border-2 backdrop-blur-md hover:bg-primary/5 transition-all w-full border-border/40">
                    تصفح المكتبة
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative mt-16 lg:mt-0 perspective-1000"
            >
              <div className="relative z-10 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/20 backdrop-blur-3xl group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-emerald-500/10 opacity-60 mix-blend-overlay group-hover:opacity-40 transition-opacity duration-700" />
                <img
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=90"
                  alt="Future of Tech"
                  className="w-full h-auto aspect-video sm:aspect-[4/5] object-cover transition-transform duration-1000 group-hover:scale-105"
                />

                {/* Floating Micro UI Element */}
                <div className="absolute bottom-8 left-8 right-8 z-20 glass-card p-6 rounded-3xl border border-white/10 animate-float">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-white font-black text-sm">مساعد ذكي نشط</p>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">مدعوم بـ GPT-4o</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Rings */}
              <div className="absolute -inset-10 border border-primary/20 rounded-full blur-sm animate-spin-slow pointer-events-none" />
              <div className="absolute -inset-20 border border-emerald-500/10 rounded-full blur-md animate-reverse-spin-slow pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-black mb-4 md:mb-6">لماذا منصة تعلّم؟</h2>
            <p className="text-lg md:text-xl text-muted-foreground font-medium">نبتكر تجربة تعليمية فريدة تمزج بين تطوير المهارات وجودة المحتوى وقوة التقنية</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: BookOpen,
                title: "محتوى عربي متميز",
                desc: "نقدم لك شروحات عميقة باللغة العربية تجمع بين السهولة والدقة العلمية لتناسب احتياجات السوق.",
                color: "bg-blue-500/10 text-blue-500"
              },
              {
                icon: Clock,
                title: "تعلم بمرونة كاملة",
                desc: "وصول غير محدود لجميع الكورسات، تعلم بالسرعة التي تناسبك وفي الوقت الذي تختاره.",
                color: "bg-amber-500/10 text-amber-500"
              },
              {
                icon: Sparkles,
                title: "تجربة تعلم متكاملة",
                desc: "استمتع ببيئة تعليمية متطورة تساعدك على التركيز والإبداع في تعلم المهارات والتخصصات الأكثر طلباً.",
                color: "bg-emerald-500/10 text-emerald-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="relative p-10 rounded-[2.5rem] bg-muted/30 border border-border/50 hover:border-primary/50 transition-all group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors"></div>
                <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Courses Highlight */}
      <section className="py-12 md:py-16 bg-muted/20 border-y border-border/40">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary/10 to-emerald-400/10 rounded-3xl border border-primary/20 p-8 md:p-12 text-center">
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 gap-2 justify-center">
              <BookOpen className="w-4 h-4" />
              كورسات مجانية
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">جميع الكورسات مجانية!</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              استمتع بوصول غير محدود لجميع الكورسات والمسارات التعليمية مجاناً وحصرياً على منصتنا.
            </p>
            <Link href="/courses">
              <Button size="lg" className="gap-2">
                <BookOpen className="w-5 h-5" />
                تصفح الكورسات المجانية
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Courses Section */}
      <section className="py-12 md:py-20 bg-muted/20">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-right gap-4 mb-10 md:mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">أحدث الكورسات</h2>
              <p className="text-muted-foreground">اكتشف أحدث ما تم إضافته للمنصة</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="gap-2 sm:flex">
                تصفح المكتبة <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[350px] rounded-xl" />
              ))
            ) : featuredCourses?.length > 0 ? (
              featuredCourses.map((course: any) => (
                <CourseCard
                  key={course.id}
                  course={{
                    ...course,
                    image: course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
                    category: course.category?.name || course.category || "عام",
                    duration: course.duration,
                    lessonsCount: course.lessonsCount,
                    students: course.students || 0
                  }}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">لا توجد كورسات متاحة حالياً.</p>
            )}
          </div>
        </div>
      </section>



      {/* CTA Section - Updated */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto relative z-10">
          <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(var(--primary),0.4)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <h2 className="text-3xl md:text-5xl font-heading font-black mb-6 md:mb-8 text-white">ابدأ تطوير مهاراتك اليوم</h2>
              <p className="text-lg md:text-2xl text-primary-foreground/80 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                انضم إلى أكبر تجمع للمبرمجين العرب واستفد من خبرات المدرب الذكي والمسارات الاحترافية في عالم الكود.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/ai-pricing">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 md:h-16 px-8 md:px-10 text-lg md:text-xl font-black text-primary hover:bg-white rounded-2xl shadow-2xl gap-3 transition-all hover:scale-105"
                  >
                    احصل على خطتك الرئيسية
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
