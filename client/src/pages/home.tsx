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
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background pt-20 pb-20">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:44px_44px]"></div>
        </div>

        <div className="container relative z-10 px-4 md:px-8 max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-right"
            >
              <Badge variant="outline" className="mb-6 px-4 py-2 text-primary border-primary/20 bg-primary/5 text-sm font-semibold rounded-full tracking-wide">
                ✨ منصة التعليم الأولى في الشرق الأوسط
              </Badge>
              <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl leading-[1.1] text-foreground mb-8 tracking-tight">
                أتقن مستقبل <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-emerald-500">
                  البرمجة والتقنية
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl ml-auto leading-relaxed font-medium">
                تعلّم هي منصتك العربية الرائدة لاحتراف المهارات التقنية الأكثر طلباً. انضم لآلاف الطلاب وابدأ رحلتك من الصفر حتى سوق العمل.
              </p>
              <div className="flex flex-wrap gap-5 justify-start flex-row-reverse">
                <Link href="/ai-agent">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/30 gap-3 rounded-2xl hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                    المدرب الذكي
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 hover:bg-muted/50 transition-all">
                    تصفح الكورسات
                  </Button>
                </Link>
              </div>
              
              <div className="mt-12 flex items-center justify-end gap-6 text-muted-foreground border-t border-border/50 pt-8">
                <div className="flex -space-x-2 space-x-reverse">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold">+10,000 طالب انضموا إلينا</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] border-8 border-background/50 backdrop-blur-sm">
                <img
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80"
                  alt="Learning Tech"
                  className="w-full h-auto aspect-[4/3] object-cover"
                />
              </div>
              {/* Floating Cards */}
              <div className="absolute -bottom-6 -right-6 z-20 bg-card p-6 rounded-2xl shadow-2xl border border-border animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">محتوى معتمد</p>
                    <p className="text-sm text-muted-foreground">أحدث التقنيات 2026</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-1/4 -left-12 z-20 bg-background/80 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-primary">⭐ 4.9</span>
                    <span className="text-xs text-muted-foreground">تقييم الطلاب</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-muted/5">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "كورس متخصص", value: "+50" },
              { label: "طالب نشط", value: "+10K" },
              { label: "ساعة محتوى", value: "+200" },
              { label: "مدرب خبير", value: "+15" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-black text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-bold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-black mb-6">لماذا منصة تعلّم؟</h2>
            <p className="text-xl text-muted-foreground font-medium">نبتكر تجربة تعليمية فريدة تمزج بين جودة المحتوى وقوة التقنية</p>
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
                icon: PlayCircle, 
                title: "تطبيق عملي حقيقي", 
                desc: "مشاريع واقعية وتطبيقات عملية تضمن لك اكتساب المهارات اللازمة للتوظيف الفوري.",
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
      <section className="py-24 bg-background">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4 text-right">
            <Link href="/tracks">
              <Button variant="outline" className="gap-2 rounded-xl border-2 hidden md:flex hover:bg-primary hover:text-white transition-all">
                عرض جميع المسارات <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">المسارات الاحترافية</h2>
              <p className="text-xl text-muted-foreground">خطط دراسية متكاملة مصممة لنقلك إلى مستوى الاحتراف الحقيقي</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {tracks.map((track, i) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/tracks`}>
                  <div className="group cursor-pointer bg-card rounded-[2rem] overflow-hidden border border-border/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2">
                    <div className="relative h-64 overflow-hidden">
                      <img src={track.image} alt={track.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-8">
                        <div className="text-right w-full">
                          <Badge className="bg-primary/90 text-white px-3 py-1 rounded-lg mb-3 text-xs font-bold">{track.level}</Badge>
                          <h3 className="font-black text-2xl text-white mb-2 leading-tight">{track.title}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 text-right">
                      <p className="text-muted-foreground leading-relaxed mb-6 font-medium">{track.description}</p>
                      <div className="flex items-center justify-end gap-6 text-sm font-bold border-t border-border/50 pt-6">
                        <span className="flex items-center gap-2 text-primary">
                          {track.duration} <Clock className="w-5 h-5" />
                        </span>
                        <span className="flex items-center gap-2 text-primary">
                          {track.coursesCount} دورات <BookOpen className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
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
      <section className="py-24 relative overflow-hidden">
        <div className="container px-4 md:px-8 max-w-screen-2xl relative z-10">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(var(--primary),0.4)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <h2 className="text-5xl md:text-7xl font-heading font-black mb-8 text-white">ابدأ مستقبلك التقني اليوم</h2>
              <p className="text-2xl md:text-3xl text-primary-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                انضم إلى أكبر تجمع للمبرمجين العرب واستفد من خبرات المدرب الذكي والمسارات الاحترافية.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/ai-agent">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-18 px-12 text-2xl font-black text-primary hover:bg-white rounded-[1.5rem] shadow-2xl gap-3 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-7 h-7" />
                    تجربة المدرب الذكي
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="h-18 px-12 text-2xl font-black bg-white/10 hover:bg-white/20 text-white border-2 border-white/20 rounded-[1.5rem] transition-all"
                  >
                    إنشاء حساب مجاني
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
