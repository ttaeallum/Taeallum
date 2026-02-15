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
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
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
      "sameAs": "https://taallm.com"
    }
  }));

  return (
    <Layout>
      <Seo
        title="الرئيسية"
        description="منصة تعلّم هي بوابتك لاحتراف البرمجة، تطوير الويب، تطبيقات الموبايل والذكاء الاصطناعي باللغة العربية."
      />
      {coursesSchema && (
        <script type="application/ld+json">
          {JSON.stringify(coursesSchema)}
        </script>
      )}
      {/* Hero Section */}
      <section className="relative min-h-[90vh] md:min-h-screen flex items-center overflow-hidden pt-12 pb-16 md:pt-20 md:pb-20">
        {/* Futuristic Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-primary/20 rounded-full blur-[80px] md:blur-[160px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-emerald-500/10 rounded-full blur-[70px] md:blur-[140px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-8 max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-right"
            >
              <h1 className="font-black text-4xl sm:text-6xl md:text-8xl lg:text-9xl leading-tight md:leading-[0.9] text-foreground mb-4 md:mb-10 tracking-tighter">
                بوابتك نحو <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary via-emerald-500 to-primary animate-gradient-x">
                  إتقان المستقبل
                </span>
              </h1>

              <p className="text-base md:text-2xl text-muted-foreground mb-6 md:mb-12 max-w-2xl ml-auto leading-relaxed font-medium opacity-80">
                استثمر في مستقبلك وتعلم مهارات المستقبل والتقنيات الحديثة مجاناً عبر محتوى عربي احترافي، متاح الآن للجميع دون استثناء.
              </p>

              <div className="flex flex-col sm:flex-row-reverse gap-4 md:gap-6 justify-center sm:justify-start">
                <Link href="/ai-pricing" className="w-full sm:w-auto">
                  <Button size="lg" className="h-14 md:h-20 px-6 md:px-12 text-lg md:text-2xl font-black shadow-[0_15px_40px_rgba(var(--primary),0.25)] gap-3 rounded-2xl md:rounded-[2rem] hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    اشترك مع المساعد الذكي
                  </Button>
                </Link>
                <Link href="/courses" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="h-14 md:h-20 px-6 md:px-12 text-lg md:text-2xl font-black rounded-2xl md:rounded-[2rem] border-2 backdrop-blur-md hover:bg-primary/5 transition-all w-full sm:w-auto">
                    تصفح الدورات
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative mt-12 lg:mt-0"
            >
              <div className="relative z-10 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] border-4 md:border-[12px] border-background/30 backdrop-blur-xl group">
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-700 z-10" />
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80"
                  alt="Modern Learning"
                  className="w-full h-auto aspect-[4/5] object-cover transition-transform duration-1000 group-hover:scale-110"
                />
              </div>

              {/* Floating Ultra Elements - Hidden on small mobile, visible on larger screens */}
              <div className="absolute -bottom-10 -right-4 md:-right-10 z-20 bg-background/90 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-primary/20 max-w-[220px] md:max-w-[280px] hidden sm:block">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Target className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <p className="font-black text-base md:text-lg">تعلم ذكي</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">توجيه مخصص لكل طالب</p>
                  {stats?.totalUsers >= 1000 && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm font-black">+1000 مستخدم</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute top-10 md:top-20 -left-2 md:-left-16 z-20 bg-primary p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shadow-primary/40 rotate-[-8deg] md:rotate-[-12deg] group-hover:rotate-0 transition-transform duration-700 hidden sm:block">
                <p className="text-primary-foreground font-black text-center leading-none">
                  <span className="text-xl md:text-4xl block mb-1">Knowledge</span>
                  <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em]">Limitless</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
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
        <div className="container px-4 md:px-8 max-w-screen-2xl">
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
        <div className="container px-4 md:px-8 max-w-screen-2xl">
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
        <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10">
          <div className="bg-primary rounded-[2rem] md:rounded-[3rem] p-8 md:p-20 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(var(--primary),0.4)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <h2 className="text-3xl md:text-7xl font-heading font-black mb-6 md:mb-8 text-white">ابدأ تطوير مهاراتك اليوم</h2>
              <p className="text-lg md:text-3xl text-primary-foreground/80 mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                انضم إلى أكبر تجمع للمبرمجين والمبدعين العرب واستفد من خبرات المدرب الذكي والمسارات الاحترافية.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/auth">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-14 md:h-18 px-8 md:px-12 text-lg md:text-2xl font-black text-primary hover:bg-white rounded-[1rem] md:rounded-[1.5rem] shadow-2xl gap-3 transition-all hover:scale-105"
                  >
                    إنشاء حساب والبدء مجاناً
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
