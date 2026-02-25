import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useRoute } from "wouter";
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Download, MessageSquare, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const formatDuration = (seconds: number) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

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

  const activeLessonData = useMemo(() => {
    if (!curriculum) return null;
    return curriculum.flatMap((s: any) => s.lessons || []).find((l: any) => l.id === params?.id);
  }, [curriculum, params?.id]);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background" dir="rtl">
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

      {/* Sidebar (Curriculum) */}
      <aside className="w-80 border-l border-border/40 bg-card hidden lg:flex flex-col shrink-0">
        <div className="p-4 border-b border-border/40">
          <h2 className="font-bold text-right">محتوى الكورس</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-border/20">
            {curriculum?.map((section: any) => (
              <div key={section.id}>
                <div className="px-4 py-3 bg-muted/20 text-sm font-bold text-muted-foreground text-right">
                  {section.title}
                </div>
                <div className="text-right">
                  {section.lessons?.map((lesson: any) => {
                    const isActive = lesson.id === params?.id;
                    return (
                      <Link key={lesson.id} href={`/lesson/${lesson.id}`}>
                        <div
                          className={cn(
                            "px-4 py-3 flex gap-3 hover:bg-muted/30 cursor-pointer transition-colors border-r-2",
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
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium break-words leading-tight", isActive && "text-primary")}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(lesson.duration)}</p>
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

      {/* Main Content (Player) */}
      <main className="flex-1 bg-black flex flex-col items-center relative">
        <div className="w-full relative pb-[56.25%] h-0 bg-zinc-900 group">
          {activeLessonData?.videoUrl ? (
            <div className="w-full h-full">
              {(() => {
                const videoUrl = activeLessonData.videoUrl;

                // 1. YouTube Detection & Transformation (Prioritize for customization)
                const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
                const ytMatch = videoUrl.match(ytRegex);
                if (ytMatch && ytMatch[1]) {
                  const videoId = ytMatch[1];
                  return (
                    <div className="absolute inset-0 w-full h-full">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&color=white&iv_load_policy=3&showinfo=0&disablekb=0&fs=1`}
                        className="absolute inset-0 w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  );
                }

                // 2. Check if it's already an iframe (non-YouTube)
                if (videoUrl.includes('<iframe')) {
                  return <div className="absolute inset-0 w-full h-full" dangerouslySetInnerHTML={{ __html: videoUrl }} />;
                }

                // 3. Direct Video Files (MP4, WEBM, etc.)
                const isDirectVideo = /\.(mp4|webm|ogg|mov)$/i.test(videoUrl);
                if (isDirectVideo) {
                  return (
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-contain bg-black"
                      controlsList="nodownload"
                    />
                  );
                }

                // 4. Bunny.net / Other Transformation
                let finalUrl = videoUrl;
                const libId = import.meta.env.VITE_BUNNY_LIBRARY_ID || "583591";

                if (videoUrl.includes("video.bunny.net/play/")) {
                  finalUrl = videoUrl.replace("video.bunny.net/play/", "iframe.mediadelivery.net/embed/");
                }

                const bunnyVideoIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (bunnyVideoIdRegex.test(videoUrl)) {
                  finalUrl = `https://iframe.mediadelivery.net/embed/${libId}/${videoUrl}`;
                }

                return (
                  <div className="absolute inset-0 w-full h-full">
                    <iframe
                      src={finalUrl}
                      className="absolute inset-0 w-full h-full"
                      frameBorder="0"
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                      allowFullScreen
                    ></iframe>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-white text-center">
              <PlayCircle className="w-20 h-20 mx-auto mb-4 opacity-20" />
              <p>لا يوجد فيديو متاح لهذا الدرس</p>
            </div>
          )}
        </div>
        {activeLessonData?.content && (
          <div className="w-full max-w-4xl mx-auto p-8 text-white prose prose-invert">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">وصف الدرس</h2>
              {activeLessonData.videoOwnerUrl && (
                <a
                  href={activeLessonData.videoOwnerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2 text-sm"
                >
                  رابط صاحب الفيديو الأصلي
                  <ChevronLeft className="w-4 h-4 rotate-180" />
                </a>
              )}
            </div>
            <p>{activeLessonData.content}</p>
          </div>
        )}
      </main>
    </div>
  );
}
