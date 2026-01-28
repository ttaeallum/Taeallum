import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Trash2, GripVertical, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface Lesson {
    id?: string;
    title: string;
    description: string;
    videoUrl: string;
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
    const [, setLocation] = useLocation();

    const [courseData, setCourseData] = useState({
        title: "",
        description: "",
        categoryId: "",
        instructor: "",
        image: "",
        price: "0",
        level: "beginner"
    });

    const [modules, setModules] = useState<Module[]>([]);
    const [expandedModule, setExpandedModule] = useState<number | null>(null);
    const [editingLesson, setEditingLesson] = useState<{ moduleIndex: number; lessonIndex: number } | null>(null);

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/categories", {
                credentials: "include",
            });
            if (!res.ok) return [];
            return res.json();
        }
    });

    const createCourseMutation = useMutation({
        mutationFn: async (payload: { course: any; modules: Module[] }) => {
            const res = await fetch("/api/admin-panel/courses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload.course)
            });
            if (!res.ok) throw new Error("Failed to create course");
            const createdCourse = await res.json();

            if (payload.modules?.length) {
                for (const [moduleIndex, module] of payload.modules.entries()) {
                    const sectionRes = await fetch("/api/admin-panel/sections", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            courseId: createdCourse.id,
                            title: module.title || `وحدة ${moduleIndex + 1}`,
                            order: moduleIndex + 1
                        })
                    });
                    if (!sectionRes.ok) throw new Error("Failed to create section");
                    const section = await sectionRes.json();

                    if (module.lessons?.length) {
                        for (const [lessonIndex, lesson] of module.lessons.entries()) {
                            const durationValue = String(lesson.duration || "").trim();
                            const minutes = durationValue.includes(":")
                                ? parseInt(durationValue.split(":")[0], 10) || 0
                                : parseInt(durationValue, 10) || 0;

                            const lessonRes = await fetch("/api/admin-panel/lessons", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({
                                    sectionId: section.id,
                                    title: lesson.title || `درس ${lessonIndex + 1}`,
                                    content: lesson.description || "",
                                    videoUrl: lesson.videoUrl || "",
                                    duration: minutes,
                                    order: lessonIndex + 1,
                                    isFree: false
                                })
                            });
                            if (!lessonRes.ok) throw new Error("Failed to create lesson");
                        }
                    }
                }
            }

            return createdCourse;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
            toast({ title: "تم إنشاء الكورس", description: "تم إنشاء الكورس بنجاح" });
            setLocation("/admin/dashboard?tab=courses");
        }
    });

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

    const handleUpdateModule = (index: number, field: string, value: any) => {
        const updated = [...modules];
        updated[index] = { ...updated[index], [field]: value };
        setModules(updated);
    };

    const handleDeleteModule = (index: number) => {
        setModules(modules.filter((_, i) => i !== index));
    };

    const handleAddLesson = (moduleIndex: number) => {
        const updated = [...modules];
        const newLesson: Lesson = {
            title: "",
            description: "",
            videoUrl: "",
            duration: "",
            order: updated[moduleIndex].lessons.length + 1
        };
        updated[moduleIndex].lessons.push(newLesson);
        setModules(updated);
        setEditingLesson({ moduleIndex, lessonIndex: updated[moduleIndex].lessons.length - 1 });
    };

    const handleUpdateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
        const updated = [...modules];
        updated[moduleIndex].lessons[lessonIndex] = {
            ...updated[moduleIndex].lessons[lessonIndex],
            [field]: value
        };
        setModules(updated);
    };

    const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
        const updated = [...modules];
        updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
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
            .replace(/[^\p{L}\p{N}\s-]/gu, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
        const slug = slugBase
            ? `${slugBase}-${Date.now().toString(36).slice(-4)}`
            : `course-${Date.now().toString(36)}`;

        const coursePayload = {
            title: courseData.title,
            slug,
            description: courseData.description,
            categoryId: courseData.categoryId || null,
            instructor: courseData.instructor,
            thumbnail: courseData.image || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
            price: courseData.price || "0",
            level: courseData.level,
            isPublished: false
        };

        createCourseMutation.mutate({ course: coursePayload, modules });
    };

    return (
        <Layout>
            {/* Header */}
            <div className="bg-muted/30 py-8 border-b border-border/40" dir="rtl">
                <div className="container px-4 md:px-8 max-w-screen-2xl">
                    <h1 className="text-3xl font-bold">إضافة كورس جديد</h1>
                    <p className="text-muted-foreground text-lg">أنشئ كورس متكامل مع وحدات ودروس</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container px-4 md:px-8 max-w-screen-2xl py-8" dir="rtl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* معلومات الكورس الأساسية */}
                    <Card>
                        <CardHeader>
                            <CardTitle>معلومات الكورس الأساسية</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold mb-2 block">عنوان الكورس</label>
                                    <Input
                                        placeholder="مثال: تعلم React من الصفر"
                                        value={courseData.title}
                                        onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-2 block">المدرب</label>
                                    <Input
                                        placeholder="اسم المدرب"
                                        value={courseData.instructor}
                                        onChange={(e) => setCourseData({ ...courseData, instructor: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold mb-2 block">الوصف</label>
                                <Textarea
                                    placeholder="وصف الكورس..."
                                    value={courseData.description}
                                    onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-bold mb-2 block">تصنيف الدورة (التخصص)</label>
                                    <select
                                        value={courseData.categoryId}
                                        onChange={(e) => setCourseData({ ...courseData, categoryId: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="">اختر التخصص</option>
                                        {categories?.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-2 block">المستوى</label>
                                    <select
                                        value={courseData.level}
                                        onChange={(e) => setCourseData({ ...courseData, level: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-md bg-background"
                                    >
                                        <option value="beginner">مبتدئ</option>
                                        <option value="intermediate">متوسط</option>
                                        <option value="advanced">متقدم</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-bold mb-2 block">رابط الصورة</label>
                                    <Input
                                        placeholder="رابط صورة الكورس"
                                        value={courseData.image}
                                        onChange={(e) => setCourseData({ ...courseData, image: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* الوحدات والدروس */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>الوحدات والدروس</CardTitle>
                                <CardDescription>أضف وحدات تعليمية مع دروس وفيديوهات</CardDescription>
                            </div>
                            <Button type="button" onClick={handleAddModule} className="gap-2">
                                <Plus className="h-4 w-4" />
                                وحدة جديدة
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {modules.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    لم تضف أي وحدات حتى الآن. أضف وحدة جديدة للبدء.
                                </div>
                            ) : (
                                modules.map((module, moduleIndex) => (
                                    <div key={moduleIndex} className="border rounded-lg p-4 space-y-4">
                                        {/* رأس الوحدة */}
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            <div className="flex-1">
                                                <Input
                                                    placeholder="اسم الوحدة"
                                                    value={module.title}
                                                    onChange={(e) => handleUpdateModule(moduleIndex, "title", e.target.value)}
                                                    className="font-bold"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)}
                                            >
                                                {expandedModule === moduleIndex ? "إخفاء" : "عرض"}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDeleteModule(moduleIndex)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* محتوى الوحدة */}
                                        {expandedModule === moduleIndex && (
                                            <div className="space-y-4 pl-8 border-l-2 border-muted">
                                                <div>
                                                    <label className="text-sm font-bold mb-2 block">وصف الوحدة</label>
                                                    <Textarea
                                                        placeholder="وصف الوحدة..."
                                                        value={module.description}
                                                        onChange={(e) => handleUpdateModule(moduleIndex, "description", e.target.value)}
                                                        className="min-h-[80px]"
                                                    />
                                                </div>

                                                {/* الدروس */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold">الدروس ({module.lessons.length})</h4>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() => handleAddLesson(moduleIndex)}
                                                            className="gap-1"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            درس جديد
                                                        </Button>
                                                    </div>

                                                    {module.lessons.map((lesson, lessonIndex) => (
                                                        <div key={lessonIndex} className="bg-muted/50 p-3 rounded-lg space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="عنوان الدرس"
                                                                    value={lesson.title}
                                                                    onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "title", e.target.value)}
                                                                    className="font-bold"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteLesson(moduleIndex, lessonIndex)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>

                                                            <Input
                                                                placeholder="رابط الفيديو (YouTube, Vimeo, إلخ)"
                                                                value={lesson.videoUrl}
                                                                onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "videoUrl", e.target.value)}
                                                            />

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Input
                                                                    placeholder="مدة الفيديو (مثال: 15:30)"
                                                                    value={lesson.duration}
                                                                    onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "duration", e.target.value)}
                                                                />
                                                                <Textarea
                                                                    placeholder="وصف الدرس"
                                                                    value={lesson.description}
                                                                    onChange={(e) => handleUpdateLesson(moduleIndex, lessonIndex, "description", e.target.value)}
                                                                    className="min-h-[60px]"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* أزرار الإجراء */}
                    <div className="flex gap-2 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setLocation("/admin/dashboard")}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            disabled={createCourseMutation.isPending}
                            className="gap-2"
                        >
                            {createCourseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            إنشاء الكورس
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
