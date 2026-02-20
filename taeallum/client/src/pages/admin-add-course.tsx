import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionHeaders } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Trash2, GripVertical, Loader2, Upload, Youtube, Video, BookOpen, Sparkles, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Lesson {
    id?: string;
    title: string;
    description: string;
    videoUrl: string;
    videoOwnerUrl?: string;
    duration: string;
    order: number;
}

interface Module {
    id?: string;
    title: string;
    description: string;
    lessons: Lesson[];
    order: number;
}

export default function AdminAddCourse() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [location, setLocation] = useLocation();

    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        categoryId: "",
        instructor: "",
        image: "",
        price: "0",
        level: "beginner",
        aiDescription: "",
        isPublished: false
    });

    const [modules, setModules] = useState<Module[]>([]);
    const [expandedModule, setExpandedModule] = useState<number | null>(null);

    // YouTube import state
    const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [youtubeLoading, setYoutubeLoading] = useState(false);
    const [youtubeError, setYoutubeError] = useState("");

    // Auth check
    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ["auth-me"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return null;
            return res.json();
        }
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/categories", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        }
    });

    const createCourseMutation = useMutation({
        mutationFn: async (payload: { course: any; modules: Module[] }) => {
            console.log("[DEBUG] Starting course creation with payload:", payload);
            const res = await fetch("/api/admin-panel/courses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify(payload.course)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error("Failed to create course: " + errorText);
            }

            const createdCourse = await res.json();

            if (payload.modules?.length) {
                for (let moduleIndex = 0; moduleIndex < payload.modules.length; moduleIndex++) {
                    const module = payload.modules[moduleIndex];
                    const sectionRes = await fetch("/api/admin-panel/sections", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...getSessionHeaders()
                        } as Record<string, string>,
                        credentials: "include",
                        body: JSON.stringify({
                            courseId: createdCourse.id,
                            title: module.title || `وحدة ${moduleIndex + 1}`,
                            order: moduleIndex + 1
                        })
                    });

                    if (!sectionRes.ok) continue;

                    const section = await sectionRes.json();

                    if (module.lessons?.length) {
                        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex++) {
                            const lesson = module.lessons[lessonIndex];

                            let finalVideoUrl = lesson.videoUrl;
                            const durationValue = String(lesson.duration || "").trim();
                            let minutes = 0;
                            if (durationValue.includes(":")) {
                                const parts = durationValue.split(":");
                                minutes = (parseInt(parts[0], 10) || 0);
                            } else {
                                minutes = parseInt(durationValue, 10) || 0;
                            }

                            await fetch("/api/admin-panel/lessons", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    ...getSessionHeaders()
                                } as Record<string, string>,
                                credentials: "include",
                                body: JSON.stringify({
                                    sectionId: section.id,
                                    title: lesson.title || `درس ${lessonIndex + 1}`,
                                    content: lesson.description || "",
                                    videoUrl: finalVideoUrl || "",
                                    videoOwnerUrl: lesson.videoOwnerUrl || "",
                                    duration: minutes,
                                    order: lessonIndex + 1,
                                    isFree: false
                                })
                            });
                        }
                    }
                }
            }

            return createdCourse;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
            queryClient.invalidateQueries({ queryKey: ["featured-courses"] });
            toast({ title: "تم إنشاء الكورس", description: "تم إنشاء الكورس بنجاح" });
            setLocation("/admin/dashboard?tab=courses");
        },
        onError: (error: any) => {
            toast({
                title: "فشل إنشاء الكورس",
                description: error.message || "حدث خطأ غير متوقع",
                variant: "destructive"
            });
        }
    });

    if (userLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

    if (!userLoading && user?.role !== "admin") {
        setLocation("/admin/login");
        return null;
    }

    const handleAddModule = () => {
        const newModule: Module = {
            title: "",
            description: "",
            lessons: [],
            order: modules.length + 1
        };
        setModules([...modules, newModule]);
        setExpandedModule(modules.length);
    };

    // YouTube Playlist Import Handler
    const handleYoutubeImport = async () => {
        if (!youtubeUrl.trim()) return;
        setYoutubeLoading(true);
        setYoutubeError("");

        try {
            const res = await fetch("/api/youtube/playlist", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getSessionHeaders() } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify({ url: youtubeUrl.trim() })
            });

            const data = await res.json();

            if (!res.ok) {
                setYoutubeError(data.message || "فشل جلب البلاي ليست");
                return;
            }

            // Create a new module with all lessons from the playlist
            const newModule: Module = {
                title: `بلاي ليست يوتيوب (${data.totalVideos} فيديو)`,
                description: "",
                order: modules.length + 1,
                lessons: data.lessons.map((lesson: any) => ({
                    title: lesson.title,
                    description: "",
                    videoUrl: lesson.videoUrl,
                    videoOwnerUrl: lesson.videoOwnerUrl || "",
                    duration: String(lesson.duration || 0),
                    order: lesson.order
                }))
            };

            setModules(prev => [...prev, newModule]);
            setExpandedModule(modules.length);
            setShowYoutubeDialog(false);
            setYoutubeUrl("");

            toast({
                title: `تم استيراد ${data.totalVideos} فيديو بنجاح! 🎉`,
                description: "تم إضافة كل الفيديوهات كدروس. راجعها وعدّل لو تحتاج."
            });
        } catch (err: any) {
            setYoutubeError(err.message || "حدث خطأ غير متوقع");
        } finally {
            setYoutubeLoading(false);
        }
    };

    const handleUpdateModule = (index: number, field: string, value: any) => {
        const updated = [...modules];
        updated[index] = { ...updated[index], [field]: value };
        setModules(updated);
    };

    const handleAddLesson = (moduleIndex: number) => {
        const updated = [...modules];
        const newLesson: Lesson = {
            title: "",
            description: "",
            videoUrl: "",
            videoOwnerUrl: "",
            duration: "",
            order: updated[moduleIndex].lessons.length + 1
        };
        updated[moduleIndex].lessons.push(newLesson);
        setModules(updated);
    };

    const handleUpdateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
        const updated = [...modules];
        updated[moduleIndex].lessons[lessonIndex] = {
            ...updated[moduleIndex].lessons[lessonIndex],
            [field]: value
        };
        setModules(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!courseData.title.trim()) {
            toast({ title: "خطأ", description: "يرجى إدخال عنوان الكورس" });
            return;
        }

        if (!courseData.categoryId) {
            toast({ title: "خطأ", description: "يرجى اختيار تصنيف" });
            return;
        }

        const slugBase = courseData.title
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
        const slug = slugBase
            ? `${slugBase.slice(0, 50)}-${Date.now().toString(36).slice(-4)}`
            : `course-${Date.now().toString(36)}`;

        const coursePayload = {
            title: courseData.title.trim(),
            slug,
            description: courseData.description.trim() || "وصف الكورس قادم قريباً",
            categoryId: courseData.categoryId || null,
            instructor: courseData.instructor.trim() || "منصة تعلم",
            thumbnail: courseData.image.trim() || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
            price: String(courseData.price || "0"),
            level: courseData.level || "beginner",
            aiDescription: courseData.aiDescription.trim() || "",
            isPublished: courseData.isPublished
        };

        createCourseMutation.mutate({ course: coursePayload, modules });
    };

    return (
        <>
            <AdminLayout>
                <div className="bg-muted/30 py-8 border-b border-border/40 mb-8" dir="rtl">
                    <div className="max-w-screen-2xl">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Plus className="w-8 h-8 text-primary" />
                            إضافة كورس جديد
                        </h1>
                        <p className="text-muted-foreground text-lg">قم ببناء كورس متكامل مع الدروس والفيديوهات</p>
                    </div>
                </div>

                <div className="max-w-screen-2xl pb-12" dir="rtl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card className="border-primary/10 shadow-xl shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    معلومات الكورس الأساسية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold">عنوان الكورس</Label>
                                        <Input
                                            placeholder="مثال: تعلم React من الصفر للاحتراف"
                                            value={courseData.title}
                                            onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold">المدرب</Label>
                                        <Input
                                            placeholder="اسم المدرب"
                                            value={courseData.instructor}
                                            onChange={(e) => setCourseData({ ...courseData, instructor: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="font-bold">وصف الكورس (عام)</Label>
                                    <Textarea
                                        placeholder="اكتب وصفاً جذاباً للكورس..."
                                        value={courseData.description}
                                        onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                                        className="min-h-[120px]"
                                    />
                                </div>

                                <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/20">
                                    <Label className="font-bold flex items-center gap-2 text-primary">
                                        <Sparkles className="w-4 h-4" />
                                        وصف خاص للذكاء الاصطناعي (المساعد الذكي)
                                    </Label>
                                    <Textarea
                                        placeholder="اشرح للذكاء الاصطناعي متى يجب أن يقترح هذا الكورس للطالب..."
                                        value={courseData.aiDescription}
                                        onChange={(e) => setCourseData({ ...courseData, aiDescription: e.target.value })}
                                        className="min-h-[100px] bg-background"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold">تطوير المهارات</Label>
                                        <select
                                            value={courseData.categoryId}
                                            onChange={(e) => setCourseData({ ...courseData, categoryId: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-md bg-background h-11"
                                        >
                                            <option value="">اختر القسم</option>
                                            {categories?.map((cat: any) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold">المستوى</Label>
                                        <select
                                            value={courseData.level}
                                            onChange={(e) => setCourseData({ ...courseData, level: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-md bg-background h-11"
                                        >
                                            <option value="beginner">مبتدئ</option>
                                            <option value="intermediate">متوسط</option>
                                            <option value="advanced">متقدم</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold">صورة الكورس</Label>
                                        <div className="flex items-center gap-3">
                                            <div className="relative group flex-1">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    className="cursor-pointer h-11 pr-10"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const formData = new FormData();
                                                        formData.append("image", file);
                                                        try {
                                                            const res = await fetch("/api/admin-panel/upload", {
                                                                method: "POST",
                                                                body: formData,
                                                                credentials: "include",
                                                                headers: getSessionHeaders() as Record<string, string>
                                                            });
                                                            const data = await res.json();
                                                            setCourseData({ ...courseData, image: data.url });
                                                            toast({ title: "تم رفع الصورة" });
                                                        } catch (err) {
                                                            toast({ title: "فشل الرفع", variant: "destructive" });
                                                        }
                                                    }}
                                                />
                                                <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-dashed">
                                    <Switch
                                        id="publish-course"
                                        checked={courseData.isPublished}
                                        onCheckedChange={(checked) => setCourseData({ ...courseData, isPublished: checked })}
                                    />
                                    <Label htmlFor="publish-course" className="cursor-pointer">نشر الكورس مباشرة للطلاب</Label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-emerald-500/10 shadow-xl shadow-emerald-500/5">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Video className="w-5 h-5 text-emerald-500" />
                                        محتوى الكورس (الوحدات والدروس)
                                    </CardTitle>
                                    <CardDescription>قم بتقسيم الكورس إلى وحدات منطقية وكل وحدة تحتوي على دروس</CardDescription>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="button" onClick={handleAddModule} variant="outline" className="gap-2 border-emerald-500/20 hover:bg-emerald-500/10">
                                        <Plus className="h-4 w-4" />
                                        وحدة تعليمية جديدة
                                    </Button>
                                    <Button type="button" onClick={() => setShowYoutubeDialog(true)} variant="outline" className="gap-2 border-red-500/20 hover:bg-red-500/10 text-red-600">
                                        <Youtube className="h-4 w-4" />
                                        استيراد من يوتيوب
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                {modules.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BookOpen className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">ابدأ بإضافة أول وحدة تعليمية لكورسك</p>
                                    </div>
                                ) : (
                                    modules.map((module, moduleIndex) => (
                                        <div key={moduleIndex} className="border rounded-2xl overflow-hidden bg-card transition-shadow hover:shadow-md">
                                            <div className="bg-muted/30 p-4 flex items-center gap-4">
                                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                                <Input
                                                    placeholder="اسم الوحدة"
                                                    value={module.title}
                                                    onChange={(e) => handleUpdateModule(moduleIndex, "title", e.target.value)}
                                                    className="font-bold border-none shadow-none bg-transparent focus-visible:ring-0 text-lg flex-1"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)}
                                                    >
                                                        {expandedModule === moduleIndex ? "إغلاق" : "تعديل الدروس"}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => setModules(modules.filter((_, i) => i !== moduleIndex))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {expandedModule === moduleIndex && (
                                                <div className="p-6 space-y-4 bg-background">
                                                    <div className="space-y-4 mb-6 pb-6 border-b border-dashed">
                                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">الدروس في هذه الوحدة</Label>
                                                        <div className="space-y-3">
                                                            {module.lessons.map((lesson, lessonIndex) => (
                                                                <div key={lessonIndex} className="p-4 border rounded-xl bg-muted/20 space-y-3 group">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                            {lessonIndex + 1}
                                                                        </div>
                                                                        <Input
                                                                            placeholder="عنوان الدرس"
                                                                            value={lesson.title}
                                                                            onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                                                                            className="font-medium bg-transparent border-none focus-visible:ring-0 shadow-none flex-1"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                            onClick={() => {
                                                                                const updated = [...modules];
                                                                                updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
                                                                                setModules(updated);
                                                                            }}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-bold text-muted-foreground">رابط الفيديو</Label>
                                                                            <Input
                                                                                placeholder="رابط Bunny.net أو Video ID"
                                                                                value={lesson.videoUrl}
                                                                                onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "videoUrl", e.target.value)}
                                                                                className="h-9 bg-background"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-xs font-bold text-muted-foreground">رابط صاحب الفيديو</Label>
                                                                            <Input
                                                                                placeholder="رابط صاحب المحتوى..."
                                                                                value={lesson.videoOwnerUrl}
                                                                                onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "videoOwnerUrl", e.target.value)}
                                                                                className="h-9 bg-background"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-bold text-muted-foreground">مدة الفيديو (بالدقائق)</Label>
                                                                        <Input
                                                                            placeholder="مثال: 12"
                                                                            value={lesson.duration}
                                                                            onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "duration", e.target.value)}
                                                                            className="h-9 bg-background"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAddLesson(moduleIndex)}
                                                        className="w-full border-2 border-dashed hover:bg-primary/5 hover:border-primary/20 text-primary font-bold"
                                                    >
                                                        <Plus className="h-4 w-4 ml-2" />
                                                        إضافة درس لهذه الوحدة
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex gap-4 justify-end sticky bottom-8 bg-background/80 backdrop-blur-md p-4 rounded-2xl border shadow-2xl z-40">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setLocation("/admin/dashboard")}
                                className="px-8"
                            >
                                إلغاء التغييرات
                            </Button>
                            <Button
                                type="submit"
                                disabled={createCourseMutation.isPending}
                                className="px-12 font-bold h-12 shadow-xl shadow-primary/20"
                            >
                                {createCourseMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    "إنشاء الكورس ونشره الآن"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </AdminLayout>

            {/* YouTube Import Dialog */}
            {
                showYoutubeDialog && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !youtubeLoading && setShowYoutubeDialog(false)}>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-lg w-full p-8" dir="rtl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <Youtube className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">استيراد بلاي ليست يوتيوب</h3>
                                    <p className="text-sm text-muted-foreground">الصق رابط البلاي ليست وراح نسحب كل الفيديوهات تلقائياً</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-bold">رابط البلاي ليست</Label>
                                    <Input
                                        placeholder="https://www.youtube.com/playlist?list=PLxxxxxxx"
                                        value={youtubeUrl}
                                        onChange={(e) => { setYoutubeUrl(e.target.value); setYoutubeError(""); }}
                                        className="h-12 text-left" dir="ltr"
                                        disabled={youtubeLoading}
                                    />
                                </div>

                                {youtubeError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm font-medium">
                                        ⚠️ {youtubeError}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        onClick={handleYoutubeImport}
                                        disabled={!youtubeUrl.trim() || youtubeLoading}
                                        className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-bold gap-2"
                                    >
                                        {youtubeLoading ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> جاري السحب...</>
                                        ) : (
                                            <><Youtube className="h-4 w-4" /> سحب الفيديوهات</>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowYoutubeDialog(false)}
                                        disabled={youtubeLoading}
                                        className="px-6 h-12"
                                    >
                                        إلغاء
                                    </Button>
                                </div>

                                <p className="text-[11px] text-muted-foreground text-center pt-2">
                                    💡 تأكد أن البلاي ليست عامة (Public) وليست خاصة
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
