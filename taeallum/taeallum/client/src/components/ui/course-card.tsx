import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Star, Users, ArrowRight } from "lucide-react";
import { Course } from "@/lib/mock-data";
import { Link } from "wouter";
import { motion } from "framer-motion";

export function CourseCard({ course }: { course: any }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group cursor-pointer h-full"
      >
        <Card className="h-full overflow-hidden glass-card transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] hover:border-primary/50 flex flex-col">
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            <img
              src={course.image}
              alt={course.title}
              className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500" />
            <div className="absolute top-3 right-3 flex flex-wrap gap-2 justify-end">
              <Badge className="bg-primary/90 backdrop-blur text-primary-foreground font-black shadow-lg text-[10px] uppercase tracking-tighter">
                {course.category?.name || course.category}
              </Badge>
              <Badge variant="outline" className="bg-black/40 backdrop-blur text-white text-[10px] font-black border-white/20">
                {course.level === "beginner" ? "مبتدئ" : course.level === "intermediate" ? "متوسط" : "متقدم"}
              </Badge>
            </div>

            {/* Hover Play Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/20 backdrop-blur-[2px]">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <CardContent className="p-5 md:p-6 flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/80 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                <Clock className="w-3.5 h-3.5" />
                {course.duration && !isNaN(Number(course.duration)) ? (
                  `${Math.floor(Number(course.duration) / 3600) > 0 ? Math.floor(Number(course.duration) / 3600) + ':' : ''}${String(Math.floor((Number(course.duration) % 3600) / 60)).padStart(2, '0')}:${String(Number(course.duration) % 60).padStart(2, '0')}`
                ) : (
                  "00:00"
                )}
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">
                <BookOpen className="w-3.5 h-3.5" />
                {course.lessonsCount || 0} درس
              </span>
            </div>

            <h3 className="font-heading font-black text-lg md:text-xl mb-3 line-clamp-2 leading-[1.3] group-hover:text-primary transition-colors duration-300">
              {course.title}
            </h3>

            <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  {/* YouTube icon */}
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold">بواسطة</p>
                  {course.instructorUrl ? (
                    <a
                      href={course.instructorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-black truncate max-w-[100px] text-red-500 hover:text-red-400 hover:underline transition-colors block"
                    >
                      {course.instructor}
                    </a>
                  ) : (
                    <p className="text-xs font-black truncate max-w-[100px]">{course.instructor}</p>
                  )}
                </div>
              </div>
              <div className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">
                مجاني
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
