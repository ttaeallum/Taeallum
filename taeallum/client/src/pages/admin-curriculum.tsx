import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionHeaders } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    Loader2,
    Video,
    ChevronRight,
    Youtube
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
};

const parseDuration = (str: string) => {
    if (!str) return 0;
    if (!str.includes(':')) return parseInt(str) * 60 || 0;
    const [mins, secs] = str.split(':').map(s => parseInt(s) || 0);
    return (mins * 60) + (secs || 0);
};

export default function AdminCurriculum() {
    const { courseId } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<any>(null);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importPlaylistUrl, setImportPlaylistUrl] = useState("");

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

    const { data: curriculum, isLoading: curriculumLoading } = useQuery({
        queryKey: ["admin-curriculum", courseId],
        queryFn: async () => {
            const res = await fetch(`/api/course-content/${courseId}/curriculum`, {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return []; // Return empty array on error to prevent crash
            return res.json();
        },
    });

    const { data: course } = useQuery({
        queryKey: ["admin-course", courseId],
        queryFn: async () => {
            const res = await fetch(`/api/admin-panel/courses/${courseId}`, {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            return res.json();
        },
    });

    const saveSectionMutation = useMutation({
        mutationFn: async (data: any) => {
            const url = selectedSection ? `/api/admin-panel/sections/${selectedSection.id}` : "/api/admin-panel/sections";
            const method = selectedSection ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify({ ...data, courseId }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum", courseId] });
            queryClient.invalidateQueries({ queryKey: ["course-curriculum", courseId] });
            setIsSectionDialogOpen(false);
            toast({ title: "تم الحفظ", description: "تم حفظ الوحدة بنجاح" });
        }
    });

    const saveLessonMutation = useMutation({
        mutationFn: async (data: any) => {
            const url = selectedLesson ? `/api/admin-panel/lessons/${selectedLesson.id}` : "/api/admin-panel/lessons";
            const method = selectedLesson ? "PUT" : "POST";

            // Simple video URL save - no more YouTube auto-conversion
            let finalVideoUrl = data.videoUrl;

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify({
                    ...data,
                    videoUrl: finalVideoUrl,
                    videoOwnerUrl: data.videoOwnerUrl || "",
                    sectionId: targetSectionId || selectedLesson?.sectionId
                }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum", courseId] });
            queryClient.invalidateQueries({ queryKey: ["course-curriculum", courseId] });
            setIsLessonDialogOpen(false);
            toast({ title: "تم الحفظ", description: "تم حفظ الدرس بنجاح" });
        }
    });

    const importPlaylistMutation = useMutation({
        mutationFn: async (data: { playlistUrl: string, sectionId: string }) => {
            const res = await fetch("/api/admin-panel/import-playlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to import playlist");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum", courseId] });
            queryClient.invalidateQueries({ queryKey: ["course-curriculum", courseId] });
            setIsImportDialogOpen(false);
            setImportPlaylistUrl("");
            toast({ title: "تم الاستيراد ✅", description: data.message });
        },
        onError: (error: any) => {
            toast({ title: "خطأ ❌", description: error.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ type, id }: { type: 'sections' | 'lessons', id: string }) => {
            await fetch(`/api/admin-panel/${type}/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum", courseId] });
            queryClient.invalidateQueries({ queryKey: ["course-curriculum", courseId] });
            toast({ title: "تم الحذف", description: "تم الحذف بنجاح" });
        }
    });


    if (userLoading || curriculumLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    }

    if (!userLoading && user?.role !== "admin") {
        setLocation("/admin/login");
        return null;
    }

    return (
        <AdminLayout>
            <div className="space-y-6" dir="rtl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/dashboard?tab=courses")}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">إدارة محتوى الكورس</h1>
                        <p className="text-muted-foreground">{course?.title}</p>
                    </div>
                    <Button className="mr-auto gap-2" onClick={() => {
                        setSelectedSection(null);
                        setIsSectionDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        إضافة وحدة جديدة
                    </Button>
                </div>

                <div className="space-y-4">
                    {Array.isArray(curriculum) ? curriculum.map((section: any) => (
                        <Card key={section.id} className="border-primary/10">
                            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5" onClick={() => {
                                        setTargetSectionId(section.id);
                                        setIsImportDialogOpen(true);
                                    }}>
                                        <Youtube className="h-4 w-4" />
                                        استيراد من YouTube
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setTargetSectionId(section.id);
                                        setSelectedLesson(null);
                                        setIsLessonDialogOpen(true);
                                    }}>
                                        <Plus className="h-4 w-4 ml-1" />
                                        إضافة درس
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        setSelectedSection(section);
                                        setIsSectionDialogOpen(true);
                                    }}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                        if (confirm("هل أنت متأكد من حذف هذه الوحدة؟")) {
                                            deleteMutation.mutate({ type: 'sections', id: section.id });
                                        }
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {section.lessons?.map((lesson: any) => (
                                        <div key={lesson.id} className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Video className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="font-medium">{lesson.title}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {formatDuration(lesson.duration)} دقيقة:ثانية
                                                        {lesson.videoOwnerUrl && (
                                                            <span className="mr-2 text-primary/60 border-r pr-2 border-border/40">صاحب الفيديو: {lesson.videoOwnerUrl}</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setSelectedLesson(lesson);
                                                    setTargetSectionId(section.id);
                                                    setIsLessonDialogOpen(true);
                                                }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                    if (confirm("هل أنت متأكد من حذف هذا الدرس؟")) {
                                                        deleteMutation.mutate({ type: 'lessons', id: lesson.id });
                                                    }
                                                }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                            <p className="text-muted-foreground">لا يوجد محتوى في هذا الكورس بعد.</p>
                            <Button className="mt-4 gap-2" onClick={() => {
                                setSelectedSection(null);
                                setIsSectionDialogOpen(true);
                            }}>
                                <Plus className="w-4 h-4" />
                                إضافة أول وحدة
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Section Dialog */}
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{selectedSection ? "تعديل وحدة" : "إضافة وحدة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        saveSectionMutation.mutate({
                            title: formData.get("title"),
                            order: parseInt(formData.get("order") as string) || 1
                        });
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label>عنوان الوحدة</Label>
                            <Input name="title" defaultValue={selectedSection?.title} required />
                        </div>
                        <div className="space-y-2">
                            <Label>الترتيب</Label>
                            <Input name="order" type="number" defaultValue={selectedSection?.order || (curriculum?.length + 1)} required />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saveSectionMutation.isPending}>
                                {saveSectionMutation.isPending ? "جاري الحفظ..." : "حفظ الوحدة"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent dir="rtl" className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedLesson ? "تعديل درس" : "إضافة درس جديد"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        saveLessonMutation.mutate({
                            title: formData.get("title"),
                            content: formData.get("content"),
                            videoUrl: formData.get("videoUrl"),
                            videoOwnerUrl: formData.get("videoOwnerUrl"),
                            duration: parseDuration(formData.get("duration") as string),
                            order: parseInt(formData.get("order") as string) || 1,
                            isFree: formData.get("isFree") === "on"
                        });
                    }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>عنوان الدرس</Label>
                                <Input name="title" defaultValue={selectedLesson?.title} required />
                            </div>
                            <div className="space-y-2">
                                <Label>الترتيب</Label>
                                <Input name="order" type="number" defaultValue={selectedLesson?.order || 1} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>رابط الفيديو (Bunny.net Play URL أو Video ID)</Label>
                            <Input name="videoUrl" defaultValue={selectedLesson?.videoUrl} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label>رابط صاحب الفيديو (اختياري)</Label>
                            <Input name="videoOwnerUrl" defaultValue={selectedLesson?.videoOwnerUrl} placeholder="https://..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>المدة (دقيقة:ثانية)</Label>
                                <Input name="duration" placeholder="05:30" defaultValue={formatDuration(selectedLesson?.duration)} />
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                                <Switch name="isFree" defaultChecked={selectedLesson?.isFree} />
                                <Label>درس مجاني (تجريبي)</Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>محتوى الدرس (اختياري)</Label>
                            <Textarea name="content" defaultValue={selectedLesson?.content} className="min-h-[100px]" />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saveLessonMutation.isPending} className="w-full">
                                {saveLessonMutation.isPending ? "جاري الحفظ..." : "حفظ الدرس"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* YouTube Import Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Youtube className="h-5 w-5 text-red-600" />
                            استيراد قائمة تشغيل من YouTube
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>رابط قائمة التشغيل (Playlist URL)</Label>
                            <Input
                                placeholder="https://www.youtube.com/playlist?list=..."
                                value={importPlaylistUrl}
                                onChange={(e) => setImportPlaylistUrl(e.target.value)}
                                dir="ltr"
                            />
                            <p className="text-xs text-muted-foreground">تأكد من أن قائمة التشغيل عامة (Public) لكي يتمكن النظام من سحب البيانات.</p>
                        </div>
                        <DialogFooter>
                            <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white"
                                disabled={importPlaylistMutation.isPending || !importPlaylistUrl}
                                onClick={() => {
                                    if (targetSectionId) {
                                        importPlaylistMutation.mutate({
                                            playlistUrl: importPlaylistUrl,
                                            sectionId: targetSectionId
                                        });
                                    }
                                }}
                            >
                                {importPlaylistMutation.isPending ? (
                                    <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        جاري الاستيراد...
                                    </>
                                ) : "بدء الاستيراد الآن"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
