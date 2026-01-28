import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Download, MessageSquare, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function LessonPlayer() {
  const [, params] = useRoute("/lesson/:id");
  const { data: curriculum, isLoading } = useQuery({
    queryKey: ["course-curriculum", params?.id],
    queryFn: async () => {
      // First find the lesson to get its courseId
      const lessonRes = await fetch(`/api/courses/lesson/${params?.id}`);
      if (!lessonRes.ok) throw new Error("Failed to fetch lesson");
      const lessonData = await lessonRes.json();
      
      const res = await fetch(`/api/courses/${lessonData.courseId}/curriculum`);
      if (!res.ok) throw new Error("Failed to fetch curriculum");
      return res.json();
    },
    enabled: !!params?.id
  });

  const activeLessonData = curriculum?.flatMap((s: any) => s.lessons).find((l: any) => l.id === params?.id);
  
  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-4 shrink-0 bg-background z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
             <Button variant="ghost" size="icon">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg hidden md:block">{activeLessonData?.title}</h1>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
             <Download className="w-4 h-4" /> مصادر الدرس
           </Button>
           <Button size="sm" className="bg-primary text-white">اكتمال الدرس</Button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content (Player) */}
        <main className="flex-1 overflow-y-auto bg-black flex flex-col items-center justify-center relative">
          <div className="w-full h-full max-h-[80vh] aspect-video bg-zinc-900 flex items-center justify-center relative group">
             {activeLessonData?.videoUrl ? (
               <div 
                 className="w-full h-full"
                 dangerouslySetInnerHTML={{ __html: activeLessonData.videoUrl.includes('<iframe') ? activeLessonData.videoUrl : `<iframe src="${activeLessonData.videoUrl}" className="w-full h-full" frameBorder="0" allowFullScreen></iframe>` }}
               />
             ) : (
               <div className="text-white text-center">
                 <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-20" />
                 <p>لا يوجد فيديو متاح لهذا الدرس</p>
               </div>
             )}
          </div>
          {activeLessonData?.content && (
            <div className="w-full max-w-4xl mx-auto p-8 text-white prose prose-invert">
              <h2 className="text-2xl font-bold mb-4">وصف الدرس</h2>
              <p>{activeLessonData.content}</p>
            </div>
          )}
        </main>
        
        {/* Sidebar (Curriculum) */}
        <aside className="w-80 border-r border-border/40 bg-card hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b border-border/40">
            <h2 className="font-bold">محتوى الكورس</h2>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/20">
              {curriculum?.map((section: any) => (
                <div key={section.id}>
                  <div className="px-4 py-3 bg-muted/20 text-sm font-bold text-muted-foreground">
                    {section.title}
                  </div>
                  <div>
                    {section.lessons?.map((lesson: any) => {
                      const isActive = lesson.id === params?.id;
                      return (
                        <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                          <div 
                            className={cn(
                              "px-4 py-3 flex gap-3 hover:bg-muted/30 cursor-pointer transition-colors border-l-2",
                              isActive ? "bg-primary/5 border-primary" : "border-transparent"
                            )}
                          >
                            <div className="mt-0.5">
                              {isActive ? (
                                <PlayCircle className="w-4 h-4 text-primary fill-current/20" />
                              ) : (
                                 <div className="w-4 h-4 rounded-full border border-muted-foreground/40"></div>
                              )}
                            </div>
                            <div>
                              <p className={cn("text-sm font-medium", isActive && "text-primary")}>
                                {lesson.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration} دقيقة</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
