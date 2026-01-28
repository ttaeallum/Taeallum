import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Edit2,
    Trash2,
    Video,
    List,
    ChevronRight,
    Loader2,
    GripVertical,
    Save
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCurriculum() {
    const { courseId } = useParams();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<any>(null);
    const [selectedLesson, setSelectedLesson] = useState<any>(null);
    const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

    // Fetch Curriculum
    const { data: curriculum, isLoading } = useQuery({
        queryKey: ["admin-curriculum", courseId],
        queryFn: async () => {
            const res = await fetch(`/api/admin-panel/courses/${courseId}/curriculum`);
            if (!res.ok) throw new Error("Failed to fetch curriculum");
            return res.json();
        },
    });

    // Section Mutations
    const saveSectionMutation = useMutation({
        mutationFn: async (data: any) => {
            const url = selectedSection ? `/api/admin-panel/sections/${selectedSection.id}` : "/api/admin-panel/sections";
            const method = selectedSection ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, courseId }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum"] });
            setIsSectionDialogOpen(false);
            toast({ title: "تم الحفظ", description: "تم حفظ القسم بنجاح" });
        }
    });

    const deleteSectionMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/admin-panel/sections/${id}`, { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum"] });
            toast({ title: "تم الحذف", description: "تم حذف القسم بنجاح" });
        }
    });

    // Lesson Mutations
    const saveLessonMutation = useMutation({
        mutationFn: async (data: any) => {
            const url = selectedLesson ? `/api/admin-panel/lessons/${selectedLesson.id}` : "/api/admin-panel/lessons";
            const method = selectedLesson ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, sectionId: targetSectionId || selectedLesson?.sectionId }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum"] });
            setIsLessonDialogOpen(false);
            toast({ title: "تم الحفظ", description: "تم حفظ الدرس بنجاح" });
        }
    });

    const deleteLessonMutation = useMutation({
        mutationFn: async (id: string) => {
            await fetch(`/api/admin-panel/lessons/${id}`, { method: "DELETE" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-curriculum"] });
            toast({ title: "تم الحذف", description: "تم حذف الدرس بنجاح" });
        }
    });

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6" dir="rtl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/courses">
                            <Button variant="ghost" size="icon"><ChevronRight /></Button>
                        </Link>
                        <h1 className="text-3xl font-bold">باني المنهج</h1>
                    </div>
                    <Button onClick={() => { setSelectedSection(null); setIsSectionDialogOpen(true); }} className="gap-2">
                        <Plus className="w-4 h-4" /> إضافة قسم جديد
                    </Button>
                </div>

                <div className="space-y-4">
                    {curriculum?.map((section: any) => (
                        <div key={section.id} className="border rounded-xl bg-card overflow-hidden">
                            <div className="p-4 bg-muted/30 flex items-center justify-between border-b">
                                <div className="flex items-center gap-3">
                                    <List className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="font-bold text-lg">{section.title}</h2>
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">رقم {section.order}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => { setSelectedSection(section); setIsSectionDialogOpen(true); }}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSectionMutation.mutate(section.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" onClick={() => { setTargetSectionId(section.id); setSelectedLesson(null); setIsLessonDialogOpen(true); }}>
                                        <Plus className="w-4 h-4 ml-1" /> إضافة درس
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y">
                                {section.lessons?.map((lesson: any) => (
                                    <div key={lesson.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Video className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{lesson.title}</p>
                                                <p className="text-xs text-muted-foreground">{lesson.duration} دقيقة {lesson.isFree && "- مجاني"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="ghost" onClick={() => { setSelectedLesson(lesson); setTargetSectionId(section.id); setIsLessonDialogOpen(true); }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteLessonMutation.mutate(lesson.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {section.lessons?.length === 0 && (
                                    <p className="p-8 text-center text-muted-foreground text-sm">لا توجد دروس في هذا القسم بعد.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section Dialog */}
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader><DialogTitle>{selectedSection ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle></DialogHeader>
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        saveSectionMutation.mutate({ title: formData.get("title"), order: Number(formData.get("order")) });
                    }} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>عنوان القسم</Label>
                            <Input name="title" defaultValue={selectedSection?.title} required placeholder="مثال: مقدمة في المسار" />
                        </div>
                        <div className="space-y-2">
                            <Label>الترتيب</Label>
                            <Input name="order" type="number" defaultValue={selectedSection?.order || 1} required />
                        </div>
                        <DialogFooter><Button className="w-full font-bold">{saveSectionMutation.isPending && <Loader2 className="animate-spin ml-2" />} حفظ القسم</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent dir="rtl" className="max-w-2xl">
                    <DialogHeader><DialogTitle>{selectedLesson ? "تعديل الدرس" : "إضافة درس جديد"}</DialogTitle></DialogHeader>
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        saveLessonMutation.mutate({
                            title: formData.get("title"),
                            content: formData.get("content"),
                            videoUrl: formData.get("videoUrl"),
                            duration: Number(formData.get("duration")),
                            order: Number(formData.get("order")),
                            isFree: formData.get("isFree") === "on",
                        });
                    }} className="space-y-4 py-4">
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
                            <Label>رابط الفيديو (Bunny.net/Vimeo Embed)</Label>
                            <Input name="videoUrl" defaultValue={selectedLesson?.videoUrl} placeholder="ضع كود الـ iframe هنا" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>المدة (بالدقائق)</Label>
                                <Input name="duration" type="number" defaultValue={selectedLesson?.duration || 0} />
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                                <input type="checkbox" name="isFree" id="isFree" defaultChecked={selectedLesson?.isFree} />
                                <Label htmlFor="isFree">درس مجاني (تجربة)</Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>وصف الدرس (اختياري)</Label>
                            <Textarea name="content" defaultValue={selectedLesson?.content} className="min-h-[100px]" />
                        </div>
                        <DialogFooter><Button className="w-full font-bold">{saveLessonMutation.isPending && <Loader2 className="animate-spin ml-2" />} حفظ الدرس</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
