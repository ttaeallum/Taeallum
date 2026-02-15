import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlayCircle,
  Clock,
  BookOpen,
  Users,
  Star,
  Lock,
  CheckCircle2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Seo } from "@/components/seo";

export default function CourseDetail() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${slug}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
  });

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false
  });

  const { data: access } = useQuery({
    queryKey: ["course-access", course?.id],
    enabled: !!course?.id && !!user,
    queryFn: async () => {
      const res = await fetch(`/api/access/course/${course.id}`);
      if (!res.ok) return { allowed: false };
      return res.json();
    }
  });

  const { data: curriculum, isLoading: curriculumLoading } = useQuery({
    queryKey: ["course-curriculum", course?.id],
    enabled: !!course?.id,
    queryFn: async () => {
      const res = await fetch(`/api/courses/${course.id}/curriculum`);
      if (!res.ok) throw new Error("Failed to fetch curriculum");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-12 px-4 md:px-8 max-w-screen-2xl space-y-8">
          <Skeleton className="h-64 rounded-3xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold">الكورس غير موجود</h1>
          <Link href="/courses">
            <Button className="mt-4">تصفح المكتبة</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleStartLearning = () => {
    if (!user) {
      setLocation(`/auth?next=/courses/${slug}`);
      return;
    }

    if (access?.allowed) {
      setLocation(`/learn/${course.id}`);
    } else {
      setLocation(`/checkout/${course.id}`);
    }
  };

  return (
    <Layout>
      <Seo
        title={course.title}
        description={course.description}
        image={course.thumbnail}
        type="course"
      />
      {/* Course Hero */}
      <div className="bg-muted/30 border-b border-border/40 py-12 lg:py-20" dir="rtl">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            <div className="flex-1 space-y-6 text-right">
              <div className="flex flex-wrap gap-2 justify-end lg:justify-start">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {course.category?.name || "عام"}
                </Badge>
                <Badge variant="outline">{course.level === "beginner" ? "مبتدئ" : course.level === "intermediate" ? "متوسط" : "متقدم"}</Badge>
              </div>

              <h1 className="text-3xl md:text-5xl font-heading font-black leading-tight">
                {course.title}
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-6 items-center text-sm font-medium text-foreground/80 pt-4">
                <span className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> +50 طالب</span>
                <span className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> {course.lessonsCount || 0} درس</span>
                <span className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> {course.duration ? Math.floor(course.duration / 3600) + ' ساعة' : '00:00'}</span>
              </div>

              <div className="flex items-center gap-4 pt-6">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt={course.instructor} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مدرس الدورة</p>
                  <p className="font-bold">{course.instructor}</p>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[450px] shrink-0 sticky top-24">
              <div className="bg-card border-2 border-border/40 rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative aspect-video">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
                    <PlayCircle className="w-16 h-16 text-white group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div className="p-8 space-y-6 text-right">
                  <div className="flex items-baseline gap-2 justify-end">
                    <span className="text-4xl font-black text-primary">
                      {Number(course.price) === 0 ? "مجاناً" : `${course.price} ر.س`}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={handleStartLearning} className="w-full h-14 text-lg font-bold gap-3 shadow-xl shadow-primary/20">
                      {user ? (
                        <>
                          <PlayCircle className="w-5 h-5" />
                          ابدأ التعلم الآن
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5" />
                          سجل دخولك للبدء مجاناً
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">الوصول كامل ومجاني لجميع المسجلين</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-8 max-w-screen-2xl py-16" dir="rtl">
        <Tabs defaultValue="overview" className="space-y-12">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto gap-8">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4 px-0 text-lg font-bold">نظرة عامة</TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-4 px-0 text-lg font-bold">المنهاج</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="max-w-3xl space-y-8">
              <section className="space-y-4">
                <h3 className="text-2xl font-bold">وصف الدورة</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {course.description}
                </p>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="curriculum">
            <div className="max-w-3xl space-y-4 text-right">
              {curriculumLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
              ) : curriculum?.length > 0 ? (
                curriculum.map((section: any, idx: number) => (
                  <div key={section.id} className="border border-border/40 rounded-2xl overflow-hidden bg-card">
                    <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-b border-border/40">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-background">القسم {idx + 1}</Badge>
                        <h4 className="text-lg font-bold">{section.title}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground">{section.lessons?.length || 0} درس</span>
                    </div>
                    <div className="divide-y divide-border/20">
                      {section.lessons?.map((lesson: any) => (
                        <div key={lesson.id} className="px-8 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-3">
                            <PlayCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{lesson.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  لا يوجد منهج متاح لهذا الكورس حالياً.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
