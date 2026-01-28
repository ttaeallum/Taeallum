import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { CourseCard } from "@/components/ui/course-card";
import { tracks } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PlayCircle, BookOpen, Clock, Sparkles, Target, CheckCircle2, Users } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl"></div>

        <div className="container relative z-10 px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
            <div className="flex-1 text-center md:text-right">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-primary border-primary/20 bg-primary/5 text-sm font-medium rounded-full w-fit mx-auto md:mx-0">
                🚀 منصة التعليم الأولى في الشرق الأوسط
              </Badge>
              <h1 className="font-heading font-black text-4xl md:text-6xl lg:text-7xl leading-tight text-foreground mb-6">
                تعلّم — <span className="text-primary relative">
                  منصة تعلم
                  <svg className="absolute w-full h-3 -bottom-1 right-0 text-emerald-400/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span> إلكتروني متميزة
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                تعلّم هي منصة تعلم إلكتروني عربية تقدم كورسات ومسارات عملية في البرمجة والتقنية، مع مشاريع تطبيقية تساعدك على التعلم من الصفر حتى الاحتراف.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link href="/ai-agent">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold shadow-xl shadow-primary/20 gap-2">
                    <Sparkles className="w-5 h-5" />
                    احصل على مدرب شخصي
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold">تصفح الكورسات المجانية</Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border border-border/50">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  alt="Learning"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Trainer Section - NEW */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-y border-primary/20">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 gap-2">
              <Sparkles className="w-4 h-4" />
              مدربك الشخصي بالذكاء الاصطناعي
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">خطة دراسية مخصصة لك</h2>
            <p className="text-muted-foreground text-lg">دع مدربك الذكي ينشئ لك خطة دراسية مخصصة تناسب أهدافك وطموحك</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1: Plan Only */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-card rounded-3xl border border-border/50 hover:border-primary/50 transition-colors p-8 md:p-10">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-2">خطة مخصصة</h3>
                <p className="text-muted-foreground mb-6 text-sm">بناء خطة دراسية كاملة من الصفر للاحتراف</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black text-primary">49</span>
                    <span className="text-muted-foreground">$ / مرة واحدة</span>
                  </div>
                  <p className="text-xs text-muted-foreground">خطة دراسية شاملة مدى الحياة</p>
                </div>

                <Link href="/ai-agent">
                  <Button className="w-full h-12 mb-6 font-bold">ابدأ الآن</Button>
                </Link>

                <div className="space-y-3">
                  {[
                    "10 أسئلة ذكية لفهم أهدافك",
                    "خطة دراسية مفصلة وشاملة",
                    "قائمة الدورات المقترحة",
                    "مراحل النمو والأهداف",
                    "وصول مدى الحياة للخطة"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Plan 2: Plan + Coaching */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl border-2 border-primary/50 hover:border-primary transition-colors p-8 md:p-10 ring-2 ring-primary/20">
                <div className="absolute -top-4 right-8">
                  <Badge className="bg-primary text-primary-foreground gap-2">
                    <Sparkles className="w-3 h-3" />
                    الأفضل
                  </Badge>
                </div>
                
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-2">خطة + متابعة</h3>
                <p className="text-muted-foreground mb-6 text-sm">خطة مخصصة مع متابعة شخصية مستمرة</p>
                
                <div className="mb-8">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black text-primary">149</span>
                    <span className="text-muted-foreground">$ / شهر</span>
                  </div>
                  <p className="text-xs text-muted-foreground">متابعة مستمرة وتوصيات شخصية</p>
                </div>

                <Link href="/ai-agent">
                  <Button className="w-full h-12 mb-6 font-bold">ابدأ الآن</Button>
                </Link>

                <div className="space-y-3">
                  {[
                    "كل مميزات الخطة المخصصة",
                    "متابعة أسبوعية من المدرب",
                    "توصيات مخصصة بناءً على التقدم",
                    "تقييم الأداء والتحسينات",
                    "دعم فني مباشر",
                    "وصول مدى الحياة"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 italic">لماذا تختار منصة تعلّم؟</h2>
            <p className="text-muted-foreground text-lg">نحن نوفر لك كل ما تحتاجه للنجاح في سوق العمل التقني.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: BookOpen, title: "محتوى عربي متميز", desc: "نقدم لك شروحات عميقة باللغة العربية تجمع بين السهولة والدقة العلمية." },
              { icon: Clock, title: "تعلم في أي وقت", desc: "وصول غير محدود لجميع الكورسات والدروس، تعلم بالسرعة التي تناسب جدولك." },
              { icon: PlayCircle, title: "تطبيق عملي", desc: "مشاريع حقيقية وتطبيقات عملية تضمن لك فهم المادة العلمية." }
            ].map((feature, i) => (
              <div key={i} className="bg-muted/30 p-8 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors group">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations Section */}
      <section className="py-20 bg-muted/20 border-y border-border/40">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 gap-2">
              التخصصات
            </Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">اختر تخصصك وابدأ</h2>
            <p className="text-muted-foreground text-lg">
              جميع التخصصات متاحة الآن لتصميم مسارك التعليمي بسهولة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {specializationsLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))
            ) : specializations?.length > 0 ? (
              specializations.map((cat: any) => (
                <Link key={cat.id} href={`/courses?category=${cat.slug}`}>
                  <div className="group bg-card rounded-2xl border border-border/50 p-6 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        تخصص
                      </Badge>
                      <ArrowLeft className="w-4 h-4 text-primary/60 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {cat.description || "ابدأ مسارك في هذا التخصص."}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">
                لا توجد تخصصات متاحة حالياً.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Free Courses Highlight */}
      <section className="py-16 bg-muted/20 border-y border-border/40">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="bg-gradient-to-r from-primary/10 to-emerald-400/10 rounded-3xl border border-primary/20 p-8 md:p-12 text-center">
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 gap-2 justify-center">
              <BookOpen className="w-4 h-4" />
              كورسات مجانية
            </Badge>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">جميع الكورسات مجانية!</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              استمتع بوصول غير محدود لجميع الكورسات والمسارات التعليمية مجاناً. فقط خدمة المدرب الشخصي بالذكاء الاصطناعي مدفوعة.
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

      {/* Tracks Section */}
      <section className="py-20 bg-background">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-2">المسارات التعليمية</h2>
              <p className="text-muted-foreground">خطط دراسية متكاملة تأخذك من الصفر للاحتراف</p>
            </div>
            <Link href="/tracks">
              <Button variant="ghost" className="gap-2 hidden md:flex">
                عرض الكل <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tracks.map((track) => (
              <Link key={track.id} href={`/tracks`}>
                <div className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img src={track.image} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                      <div className="text-white">
                        <p className="text-xs font-medium bg-primary px-2 py-1 rounded mb-2 w-fit">{track.level}</p>
                        <h3 className="font-bold text-lg">{track.title}</h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{track.description}</p>
                    <div className="flex items-center justify-between text-xs font-medium text-foreground/80">
                      <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-primary" /> {track.coursesCount} دورات</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" /> {track.duration}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Courses Section */}
      <section className="py-20 bg-muted/20">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-2">أحدث الكورسات</h2>
              <p className="text-muted-foreground">اكتشف أحدث ما تم إضافته للمنصة</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="gap-2 hidden md:flex">
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
                    category: course.category?.name || "عام",
                    duration: "متنوع",
                    lessonsCount: 0,
                    rating: 5.0,
                    students: 0
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
      <section className="py-24 bg-primary relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-6">احصل على مدربك الشخصي الآن</h2>
          <p className="text-xl md:text-2xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            دع الذكاء الاصطناعي ينشئ لك خطة دراسية مخصصة تناسب أهدافك وطموحك
          </p>
          <Link href="/ai-agent">
            <Button
              size="lg"
              variant="secondary"
              className="h-16 px-10 text-xl font-bold text-primary hover:bg-white rounded-xl shadow-2xl gap-2"
            >
              <Sparkles className="w-6 h-6" />
              ابدأ الآن
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
