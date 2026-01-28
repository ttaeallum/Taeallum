import { Layout } from "@/components/layout";
import { CourseCard } from "@/components/ui/course-card";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Courses() {
  const [query, setQuery] = useState("");
  const initialCategory = new URLSearchParams(window.location.search).get("category") || "all";
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
      <div className="bg-muted/30 py-12 border-b border-border/40">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">تصفح الكورسات</h1>
              <p className="text-muted-foreground">اكتشف مئات الكورسات في مختلف المجالات التقنية والإبداعية</p>
            </div>

            <div className="flex w-full md:w-auto gap-2 flex-wrap">
              <div className="relative flex-1 md:w-80 min-w-[220px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن كورس..."
                  className="pr-10 bg-background"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px] bg-background">
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
      </div>

      <div className="container px-4 md:px-8 max-w-screen-2xl py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground text-sm">
                عرض {courses?.length || 0} كورس
                {query.trim() ? ` (نتائج البحث عن: "${query.trim()}")` : ""}
              </p>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ترتيب حسب" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="popular">الأكثر شعبية</SelectItem>
                  <SelectItem value="price-low">السعر: من الأقل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[350px] rounded-xl" />
                ))
              ) : courses?.length > 0 ? (
                courses.map((course: any) => (
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
                <div className="col-span-full text-center py-10 text-muted-foreground">
                  لا توجد كورسات مطابقة لبحثك.
                </div>
              )}
            </div>

            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" className="min-w-[200px]">تحميل المزيد</Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
