import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useParams, useLocation } from "wouter";
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Download, BookOpen, Loader2, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function LearnCourse() {
    const { courseId } = useParams();
    const [, setLocation] = useLocation();
    const [activeLesson, setActiveLesson] = useState<any>(null);

    const { data: user } = useQuery({
        queryKey: ["auth-me"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me", {
                credentials: "include"
            });
            if (!res.ok) {
                setLocation(`/auth?next=/learn/${courseId}`);
                return null;
            }
            return res.json();
        }
    });

    const { data: access, isLoading: accessLoading } = useQuery({
        queryKey: ["course-access", courseId],
        enabled: !!courseId && !!user,
        queryFn: async () => {
            const res = await fetch(`/api/access/course/${courseId}`, {
                credentials: "include"
            });
            if (!res.ok) return { allowed: false };
            return res.json();
        }
    });

    const { data: course, isLoading: courseLoading } = useQuery({
        queryKey: ["course-learn", courseId],
        enabled: !!courseId,
        queryFn: async () => {
            const res = await fetch(`/api/courses`);
            if (!res.ok) throw new Error("Failed to fetch courses");
            const courses = await res.json();
            return courses.find((c: any) => c.id === courseId);
        }
    });

    const { data: curriculum, isLoading: curriculumLoading } = useQuery({
        queryKey: ["course-curriculum", courseId],
        enabled: !!courseId && !!access?.allowed,
        queryFn: async () => {
            const res = await fetch(`/api/course-content/${courseId}/curriculum`);
            if (!res.ok) throw new Error("Failed to fetch curriculum");
            return res.json();
        }
    });

    // Helper to set first lesson as active initially
    if (!activeLesson && curriculum && curriculum.length > 0 && curriculum[0].lessons.length > 0) {
        setActiveLesson(curriculum[0].lessons[0]);
    }

    if (accessLoading || courseLoading || curriculumLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (access && !access.allowed) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4" dir="rtl">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                    <Lock className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold">عذراً، ليس لديك صلاحية للوصول لهذا المحتوى</h1>
                <p className="text-muted-foreground max-w-md">
                    تحتاج لشراء هذا الكورس لتتمكن من مشاهدة الدروس والمحتوى التعليمي.
                </p>
                <Link href={`/checkout/${courseId}`}>
                    <Button size="lg" className="font-bold px-8">شراء الكورس</Button>
                </Link>
            </div>
        );
    }

    const renderVideoPlayer = () => {
        if (!activeLesson) return null;

        const videoUrl = activeLesson.videoUrl;
        if (!videoUrl) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                        <PlayCircle className="w-12 h-12 text-white/50" />
                    </div>
                    <p className="text-white/40 mt-4">بانتظار رفع الفيديو لهذا الدرس</p>
                </div>
            );
        }

        // Handle both iframe tags AND direct URLs (like Bunny.net/Mediashare)
        const isIframeTag = videoUrl.trim().startsWith("<iframe");
        const isDirectUrl = videoUrl.startsWith("http") || videoUrl.startsWith("/");

        if (isIframeTag) {
            return (
                <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: videoUrl }} />
            );
        }

        if (isDirectUrl) {
            // If it's a direct URL, wrap it in a professional iframe
            return (
                <div className="w-full h-full flex items-center justify-center bg-black">
                    <iframe
                        src={videoUrl}
                        loading="lazy"
                        style={{ border: 0, width: "100%", height: "100%" }}
                        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                        allowFullScreen
                    ></iframe>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                <p className="text-white/40">تنسيق الفيديو غير مدعوم</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden" dir="rtl">
            {/* Header */}
            <header className="h-16 border-b border-border/40 flex items-center justify-between px-4 shrink-0 bg-background z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="font-bold text-lg hidden md:block">{course?.title || "تحميل..."}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-primary text-white font-bold">اكتمال الدرس</Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden flex-row">
                {/* Main Content (Player) */}
                <main className="flex-1 overflow-y-auto bg-black flex flex-col">
                    <div className="w-full aspect-video bg-zinc-900 relative group overflow-hidden">
                        {renderVideoPlayer()}
                        <div className="absolute top-4 right-4 text-white/30 text-xs pointer-events-none select-none">
                            محتوى تعليمي آمن - {user?.fullName} ({user?.email})
                        </div>
                    </div>
                    <div className="w-full bg-card p-6 border-t border-border/40 text-right">
                        <h2 className="text-xl font-bold mb-2">{activeLesson?.title || "حدد درساً للبدء"}</h2>
                        <div
                            className="text-muted-foreground prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: activeLesson?.content || "" }}
                        />
                    </div>
                </main>

                {/* Sidebar (Curriculum) */}
                <aside className="w-80 border-l border-border/40 bg-card hidden lg:flex flex-col shrink-0">
                    <div className="p-4 border-b border-border/40 text-right">
                        <h2 className="font-bold">محتوى الكورس</h2>
                        <div className="w-full bg-muted h-2 rounded-full mt-2 overflow-hidden">
                            <div className="bg-primary h-full w-[0%] transition-all duration-500"></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">جاري بدء التعلم...</p>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-border/20">
                            {curriculum?.map((section: any, sIdx: number) => (
                                <div key={section.id}>
                                    <div className="px-4 py-3 bg-muted/20 text-sm font-bold text-muted-foreground text-right">
                                        {section.title}
                                    </div>
                                    <div className="text-right">
                                        {section.lessons?.map((lesson: any, lIdx: number) => {
                                            const isActive = activeLesson?.id === lesson.id;
                                            return (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => setActiveLesson(lesson)}
                                                    className={cn(
                                                        "px-4 py-3 flex gap-3 hover:bg-muted/30 cursor-pointer transition-colors border-r-2 flex-row",
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
                                                    <div className="flex-1">
                                                        <p className={cn("text-sm font-medium", isActive && "text-primary")}>
                                                            {lesson.title}
                                                        </p>
                                                        {lesson.duration && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">{lesson.duration} دقيقة</p>
                                                        )}
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
