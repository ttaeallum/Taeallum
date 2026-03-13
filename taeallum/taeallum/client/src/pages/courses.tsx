import { Layout } from "@/components/layout";
import { CourseCard } from "@/components/ui/course-card";
import { AdSection } from "@/components/AdSection";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Seo } from "@/components/seo";

export default function Courses() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const { data: categories } = useQuery({
    queryKey: ["course-categories"],
    queryFn: async () => {
      const res = await fetch("/api/courses/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["all-courses", query, selectedCategory],
    queryFn: async () => {
      const res = await fetch(`/api/courses`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();

      let filtered = data;

      if (selectedCategory !== "all") {
        filtered = filtered.filter((c: any) =>
          c.category?.slug === selectedCategory || c.category?.id === selectedCategory
        );
      }

      // Client-side filtering for simplicity now, or we could add backend search
      if (!query.trim()) return filtered;
      const q = query.toLowerCase();
      return filtered.filter((c: any) =>
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.category?.name.toLowerCase().includes(q)
      );
    },
  });

  return (
    <Layout>
      <Seo
        title="دورات مجانية ومهارات تقنية"
        description="استكشف مكتبة منصة تعلّم (Taallm) التي تضم مئات الـ دورات المجانية والـ مهارات المجانية في البرمجة، الذكاء الاصطناعي، وتطوير الويب باللغة العربية."
        type="website"
      />
      {courses && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": courses.map((course: any, index: number) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Course",
                "name": course.title,
                "description": course.description,
                "provider": {
                  "@type": "Organization",
                  "name": "منصة تعلّم"
                }
              }
            }))
          })}
        </script>
      )}
      <div className="bg-mesh-gradient py-12 md:py-20 border-b border-border/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container px-4 md:px-8 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-right gap-10 md:gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                استكشف المعرفة
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tighter">مكتبة الدورات الاحترافية</h1>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl font-medium">اكتشف مئات الدورات المجانية في البرمجة والذكاء الاصطناعي بمستوى عالمي</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col sm:flex-row w-full md:w-auto gap-4"
            >
              <div className="relative w-full md:w-80 group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="ماذا تريد أن تتعلم اليوم؟"
                  className="pr-12 bg-background/50 backdrop-blur-md h-14 md:h-16 rounded-2xl border-white/10 group-focus-within:border-primary/50 transition-all font-bold text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[220px] bg-background/50 backdrop-blur-md h-14 md:h-16 rounded-2xl border-white/10 font-bold text-lg">
                  <SelectValue placeholder="التخصص" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="glass-morphism rounded-2xl">
                  <SelectItem value="all">كل التخصصات</SelectItem>
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Grid Area */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-primary rounded-full" />
                <p className="text-foreground font-black text-xl">
                  {courses?.length || 0} دورة متاحة
                  {query.trim() ? <span className="text-muted-foreground text-sm font-medium mr-2">نتائج البحث عن "{query.trim()}"</span> : ""}
                </p>
              </div>

              <div className="hidden sm:block">
                <Select defaultValue="newest">
                  <SelectTrigger className="w-[200px] h-11 bg-muted/30 border-none rounded-xl font-bold">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent dir="rtl" className="glass-morphism rounded-xl">
                    <SelectItem value="newest">الأحدث أولاً</SelectItem>
                    <SelectItem value="popular">الأكثر شعبية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[400px] rounded-3xl" />
                ))
              ) : courses?.length > 0 ? (
                courses.map((course: any) => (
                  <motion.div
                    key={course.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CourseCard
                      course={{
                        ...course,
                        image: course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
                        category: course.category?.name || course.category || "عام",
                        duration: course.duration,
                        lessonsCount: course.lessonsCount,
                        students: course.students || 0
                      }}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 glass-card rounded-3xl flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">لا توجد نتائج</h3>
                  <p className="text-muted-foreground font-medium">حاول البحث بكلمات أخرى أو تغيير التخصص</p>
                  <Button
                    variant="link"
                    className="mt-4 text-primary font-black"
                    onClick={() => { setQuery(""); setSelectedCategory("all"); }}
                  >
                    عرض جميع الدورات
                  </Button>
                </div>
              )}
            </motion.div>

            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" className="min-w-[200px]">تحميل المزيد</Button>
            </div>
          </div>

          <div className="w-full lg:w-80 space-y-6">
            <div className="p-6 rounded-2xl border bg-card shadow-sm">
              <h3 className="font-bold mb-4">تصفية حسب</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">القسم</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="اختر التخصص" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">كل التخصصات</SelectItem>
                      {categories?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sidebar Ad Slot */}
            <AdSection variant="sidebar" location="sidebar" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
