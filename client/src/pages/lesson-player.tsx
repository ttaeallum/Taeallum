import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Download, MessageSquare } from "lucide-react";
import { courses } from "@/lib/mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function LessonPlayer() {
  const [, params] = useRoute("/lesson/:id");
  const [activeLesson, setActiveLesson] = useState(1);
  
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
          <h1 className="font-bold text-lg hidden md:block">مقدمة في تصميم واجهة المستخدم UI/UX</h1>
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
             {/* Mock Video Player */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <PlayCircle className="w-12 h-12 text-white fill-current" />
                </div>
             </div>
             <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
               <div className="w-1/3 h-full bg-primary relative">
                 <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow cursor-pointer hover:scale-150 transition-transform"></div>
               </div>
             </div>
             <p className="absolute top-4 left-4 text-white/50 text-sm">Mock Video Player</p>
          </div>
        </main>
        
        {/* Sidebar (Curriculum) */}
        <aside className="w-80 border-r border-border/40 bg-card hidden lg:flex flex-col shrink-0">
          <div className="p-4 border-b border-border/40">
            <h2 className="font-bold">محتوى الكورس</h2>
            <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full w-[35%]"></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">35% مكتمل</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border/20">
              {[1, 2, 3, 4, 5].map((section) => (
                <div key={section}>
                  <div className="px-4 py-3 bg-muted/20 text-sm font-bold text-muted-foreground">
                    القسم {section}: الأساسيات
                  </div>
                  <div>
                    {[1, 2, 3].map((lesson) => {
                      const id = section * 10 + lesson;
                      const isActive = id === 11; // Mock active state
                      return (
                        <div 
                          key={id} 
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
                              {lesson}. مقدمة الدرس وما سيتم شرحه
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">12:30 دقيقة</p>
                          </div>
                        </div>
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
