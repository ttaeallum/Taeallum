import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Star, Users, ArrowRight } from "lucide-react";
import { Course } from "@/lib/mock-data";
import { Link } from "wouter";

export function CourseCard({ course }: { course: any }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <div className="group cursor-pointer h-full">
        <Card className="h-full overflow-hidden border-border/40 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={course.image}
              alt={course.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3 flex flex-wrap gap-2 justify-end">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur text-foreground font-medium shadow-sm">
                {course.category?.name || course.category}
              </Badge>
              <Badge variant="outline" className="bg-background/80 backdrop-blur text-[10px] font-bold border-primary/20">
                {course.level === "beginner" ? "مبتدئ" : course.level === "intermediate" ? "متوسط" : "متقدم"}
              </Badge>
              {course.isNew && (
                <Badge className="bg-primary text-primary-foreground font-medium shadow-sm animate-pulse">
                  جديد
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1 bg-muted/20 px-2 py-1 rounded-md whitespace-nowrap">
                <Clock className="w-3.5 h-3.5" />
                {course.duration && !isNaN(Number(course.duration)) ? (
                  `${Math.floor(Number(course.duration) / 3600) > 0 ? Math.floor(Number(course.duration) / 3600) + ':' : ''}${String(Math.floor((Number(course.duration) % 3600) / 60)).padStart(2, '0')}:${String(Number(course.duration) % 60).padStart(2, '0')}`
                ) : (
                  "00:00"
                )}
              </span>
              <span className="flex items-center gap-1 bg-muted/20 px-2 py-1 rounded-md whitespace-nowrap">
                <BookOpen className="w-3.5 h-3.5" />
                {course.lessonsCount || 0} درس
              </span>
              {course.students >= 50 && (
                <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md font-bold whitespace-nowrap">
                  <Users className="w-3.5 h-3.5" />
                  +50 طالب
                </span>
              )}
            </div>

            <h3 className="font-heading font-bold text-base md:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>

            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              مع المدرب: <span className="text-foreground font-medium">{course.instructor}</span>
            </p>
          </CardContent>

          <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between">
            <div className="text-sm font-bold text-primary">
              مجاني
            </div>
            <Button size="sm" variant="ghost" className="gap-2 group-hover:bg-primary/10 group-hover:text-primary">
              التفاصيل
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Link>
  );
}
