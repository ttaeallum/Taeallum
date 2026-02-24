import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link, useParams, useLocation } from "wouter";
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Download, BookOpen, Loader2, Lock, ArrowRight, Video, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

export default function LearnCourse() {
    const { courseId } = useParams();
    const [, setLocation] = useLocation();
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const isRtl = true; // Platform is always RTL (Arabic)

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

    // Memoize flat lessons list to prevent recalculating on every render
    const flatLessons = useMemo(() => {
        if (!curriculum) return [];
        return curriculum.flatMap((s: any) => s.lessons || []);
    }, [curriculum]);

    // Calculate progress percentage with memoization
    const progress = useMemo(() => {
        if (!flatLessons.length || !activeLesson) return 0;
        const currentIndex = flatLessons.findIndex((l: any) => l.id === activeLesson.id);
        if (currentIndex === -1) return 0;
        return Math.round(((currentIndex + 1) / flatLessons.length) * 100);
    }, [flatLessons, activeLesson?.id]);

    // Helper to set first lesson as active initially AND update if curriculum changes (reactive)
    useEffect(() => {
        if (!curriculum || curriculum.length === 0) return;

        // If no active lesson, set the first one
        if (!activeLesson) {
            const firstLesson = flatLessons[0];
            if (firstLesson) {
                setActiveLesson(firstLesson);
            }
        } else {
            // Find current active lesson in NEW curriculum to get potentially updated data
            const updated = flatLessons.find((l: any) => l.id === activeLesson.id);
            if (updated && (updated.videoUrl !== activeLesson.videoUrl || updated.title !== activeLesson.title)) {
                setActiveLesson(updated);
            }
        }
    }, [curriculum, flatLessons]);

    // Find next and previous lessons for navigation
    const { prevLesson, nextLesson } = useMemo(() => {
        if (!flatLessons.length || !activeLesson) return { prevLesson: null, nextLesson: null };
        const currentIndex = flatLessons.findIndex((l: any) => l.id === activeLesson.id);
        return {
            prevLesson: currentIndex > 0 ? flatLessons[currentIndex - 1] : null,
            nextLesson: currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null
        };
    }, [flatLessons, activeLesson?.id]);

    if (accessLoading || courseLoading || curriculumLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (access && !access.allowed) {
        // Redundant with server logic, but keep for safety. Redirect to auth if logic fails.
        setLocation("/auth");
        return null;
    }

    const renderVideoPlayer = () => {
        if (!activeLesson) return null;

        const videoUrl = activeLesson.videoUrl?.trim();
        if (!videoUrl) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-white/5 rounded-2xl">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <PlayCircle className="w-12 h-12 text-white/20" />
                    </div>
                    <p className="text-white/40 mt-4 font-bold">بانتظار رفع الفيديو لهذا الدرس</p>
                </div>
            );
        }

        // Handle both iframe tags AND direct URLs (like Bunny.net/Mediashare)
        const isIframeTag = videoUrl.trim().startsWith("<iframe");
        const isDirectUrl = videoUrl.startsWith("http") || videoUrl.startsWith("/");
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const ytMatch = videoUrl.match(ytRegex);

        // If it's YouTube (either iframe OR direct link), extract ID and rebuild to be clean
        if (ytMatch && ytMatch[1]) {
            const videoId = ytMatch[1];
            return (
                <div className="absolute inset-0 w-full h-full bg-black">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=0&color=white&iv_load_policy=3&showinfo=0&disablekb=0&fs=1`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
                        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                        allowFullScreen
                    ></iframe>
                </div>
            );
        }

        if (isIframeTag) {
            return (
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:max-w-full"
                    style={{ maxWidth: '100vw' }}
                    dangerouslySetInnerHTML={{ __html: videoUrl }}
                />
            );
        }

        if (isDirectUrl) {
            // Transform Vimeo links to embed versions if necessary (YouTube already handled above)
            let finalUrl = videoUrl.trim();

            // Vimeo transformation
            const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
            const vimeoMatch = finalUrl.match(vimeoRegex);
            if (vimeoMatch && vimeoMatch[1] && !finalUrl.includes("player.vimeo.com")) {
                finalUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            }

            // If it's a direct URL, wrap it in a professional iframe
            return (
                <div className="absolute inset-0 w-full h-full bg-black">
                    <iframe
                        src={finalUrl}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full"
                        style={{ border: 0 }}
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
        <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden" dir="rtl">
            {/* Cinematic Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-black/60 backdrop-blur-2xl sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-full text-zinc-400">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <h1 className="font-bold text-sm md:text-lg leading-tight tracking-tight text-white/90 truncate max-w-[140px] xs:max-w-[200px] md:max-w-md">
                            {course?.title || "تحميل..."}
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[80px]">
                                <div
                                    className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-primary/80 font-black uppercase tracking-widest">{progress}% مكتمل</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 px-3 md:px-5 rounded-full h-9 md:h-10 text-xs transition-all active:scale-95 shadow-xl shadow-black/40 group">
                                <BookOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                <span className="hidden sm:inline font-bold">محتوى الكورس</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-zinc-950 border-white/10 shadow-2xl">
                            <SheetHeader className="p-8 border-b border-white/10 bg-zinc-900/50">
                                <SheetTitle className="text-right text-white font-black text-2xl tracking-tight">محتوى الكورس</SheetTitle>
                                <div className="space-y-3 mt-6 text-right">
                                    <div className="flex justify-between text-[11px] text-zinc-500 uppercase font-black tracking-widest">
                                        <span>تقدم المرحلة</span>
                                        <span className="text-primary">{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-1.5 bg-white/5" />
                                </div>
                            </SheetHeader>
                            <ScrollArea className="flex-1 overflow-y-auto">
                                <div className="divide-y divide-white/5">
                                    {curriculum?.map((section: any) => (
                                        <div key={section.id} className="group/section">
                                            <div className="px-8 py-4 bg-zinc-900/40 text-[11px] font-black text-zinc-500 group-hover/section:text-primary transition-colors text-right uppercase tracking-[0.15em]">
                                                {section.title}
                                            </div>
                                            <div className="text-right">
                                                {section.lessons?.map((lesson: any) => {
                                                    const isActive = activeLesson?.id === lesson.id;
                                                    return (
                                                        <div
                                                            key={lesson.id}
                                                            onClick={() => setActiveLesson(lesson)}
                                                            className={cn(
                                                                "px-4 py-5 flex gap-3 hover:bg-white/[0.03] cursor-pointer transition-all duration-300 group relative",
                                                                isActive ? "bg-primary/[0.08]" : ""
                                                            )}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary shadow-[0_0_20px_rgba(34,197,94,0.6)] z-10" />
                                                            )}
                                                            <div className="mt-0.5">
                                                                {isActive ? (
                                                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.9)]" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-primary/40 transition-all flex items-center justify-center">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-white/5 group-hover:bg-primary/20 transition-all" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("text-sm font-bold transition-all break-words leading-tight", isActive ? "text-primary" : "text-zinc-400 group-hover:text-white")}>
                                                                    {lesson.title}
                                                                </p>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    {lesson.duration && (
                                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold tracking-wider">
                                                                            <Video className="w-3 h-3 opacity-40" />
                                                                            {formatDuration(lesson.duration)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>

                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-black shadow-[0_8px_20px_rgba(34,197,94,0.25)] h-9 md:h-10 rounded-full px-5 md:px-7 transition-all active:scale-95 border-b-4 border-primary-foreground/20">
                        اكتمال الدرس
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden flex-row">
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-black flex flex-col items-center custom-scrollbar">
                    {/* Cinematic Video Area (Large) - Full Width for Mobile & Desktop */}
                    <div className="w-full bg-zinc-950 border-b border-white/5 shadow-2xl relative z-10 group/player overflow-hidden">
                        <div className="w-full aspect-video relative max-h-[50vh] min-h-[180px] md:max-h-none overflow-hidden">
                            {/* Player Wrapper with refined shadows */}
                            <div className="w-full h-full relative z-20">
                                {renderVideoPlayer()}

                                {/* Professional Watermark */}
                                <div className="absolute top-6 right-6 flex items-center gap-2 text-white/20 text-[10px] font-black pointer-events-none select-none bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                    <Lock className="w-3 h-3 opacity-50" />
                                    <span>محتوى تعليمي آمن - {user?.fullName}</span>
                                </div>

                                {/* Floating Next/Prev Overlays (appear on hover) */}
                                <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-all duration-500 z-30 pointer-events-none">
                                    {prevLesson && (
                                        <Button
                                            size="icon"
                                            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-primary hover:border-primary transition-all pointer-events-auto"
                                            onClick={() => setActiveLesson(prevLesson)}
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                    )}
                                </div>
                                <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-center opacity-0 group-hover/player:opacity-100 transition-all duration-500 z-30 pointer-events-none">
                                    {nextLesson && (
                                        <Button
                                            size="icon"
                                            className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-primary hover:border-primary transition-all pointer-events-auto"
                                            onClick={() => setActiveLesson(nextLesson)}
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Cinematic Background Glow (Synchronized with Player) */}
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] opacity-30 pointer-events-none z-0" />
                        </div>
                    </div>

                    {/* Content Section below video */}
                    <div className="w-full max-w-[1400px] px-4 md:px-6 lg:px-12 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Left Side: Lesson info and navigation */}
                            <div className="lg:col-span-2 space-y-10 order-2 lg:order-1">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                                    <div className="space-y-4 text-right">
                                        <div className="flex items-center gap-3 justify-end">
                                            <span className="bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full border border-primary/20 tracking-widest uppercase">
                                                درس نشط الآن
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
                                            {activeLesson?.title || "حدد درساً للبدء"}
                                        </h2>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 px-6 h-12 rounded-2xl font-bold transition-all w-full sm:w-auto order-2 sm:order-1"
                                            disabled={!prevLesson}
                                            onClick={() => prevLesson && setActiveLesson(prevLesson)}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                            {isRtl ? "السابق" : "Prev"}
                                        </Button>
                                        <Button
                                            className="bg-primary hover:bg-primary/90 text-white gap-2 px-6 h-12 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-95 w-full sm:w-auto order-1 sm:order-2"
                                            disabled={!nextLesson}
                                            onClick={() => nextLesson && setActiveLesson(nextLesson)}
                                        >
                                            {isRtl ? "التالي" : "Next"}
                                            <ChevronLeft className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-6 text-right">
                                    <h3 className="text-lg font-bold text-white/90 flex items-center gap-3 justify-end">
                                        تفاصيل الدرس
                                        <div className="w-8 h-[2px] bg-primary/40" />
                                    </h3>
                                    <div
                                        className="text-zinc-400 text-lg leading-relaxed prose prose-invert prose-p:text-zinc-400 prose-headings:text-white max-w-none"
                                        dangerouslySetInnerHTML={{ __html: activeLesson?.content || "لا يوجد وصف متوفر لهذا الدرس." }}
                                    />
                                </div>
                            </div>

                            {/* Right Side: Sidebar/Extras */}
                            <div className="space-y-8 order-1 lg:order-2">
                                <Card className="bg-zinc-900/40 border-white/5 p-6 backdrop-blur-xl rounded-3xl space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest text-right">عن الكورس</p>
                                        <div className="flex items-center gap-4 justify-end">
                                            <div className="text-right">
                                                <p className="font-bold text-white line-clamp-2">{course?.title}</p>
                                                <p className="text-xs text-muted-foreground mt-1">بواسطة {course?.instructor || "تعلّم"}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                                                <BookOpen className="w-6 h-6 text-primary" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm font-bold text-white">{progress}%</span>
                                            <span className="text-xs text-muted-foreground font-medium text-right">إجمالي الإكمال</span>
                                        </div>
                                        <Progress value={progress} className="h-2 bg-white/5" />
                                    </div>

                                    <Button variant="ghost" className="w-full justify-center gap-2 h-12 text-primary font-bold hover:bg-primary/5 rounded-2xl border border-primary/10">
                                        <Download className="w-4 h-4" />
                                        تحميل المصادر
                                    </Button>
                                </Card>

                                <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 rounded-3xl border border-primary/10 relative overflow-hidden group">
                                    <Sparkles className="absolute top-[-10px] left-[-10px] w-20 h-20 text-primary/5 group-hover:rotate-12 transition-transform duration-1000" />
                                    <h4 className="font-black text-white mb-2 text-right">هل تواجه صعوبة؟</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed text-right mb-6">يمكنك دائماً سؤال المساعد الذكي حول أي جزئية في هذا الدرس.</p>
                                    <Link href="/ai-agent">
                                        <Button size="sm" className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl h-10">
                                            فتح المساعد الذكي
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
