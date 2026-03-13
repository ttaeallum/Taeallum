import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionHeaders } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Video,
    Sparkles
} from "lucide-react";
import { Link } from "wouter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function AdminCourses() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [formLevel, setFormLevel] = useState("beginner");
    const [formCategoryId, setFormCategoryId] = useState("");
    const [formIsPublished, setFormIsPublished] = useState(false);
    const [editKey, setEditKey] = useState(0); // Stable key counter for form re-renders

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch Courses
    const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
        queryKey: ["admin-courses", query, page],
        queryFn: async () => {
            const res = await fetch(`/api/admin-panel/courses?q=${query}&page=${page}`, {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to fetch courses");
            return res.json();
        },
    });

    // Fetch Categories for the dropdown
    const { data: categories = [] } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/categories", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to fetch categories");
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin-panel/courses/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to delete course");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
            toast({ title: "تم الحذف", description: "تم حذف الكورس بنجاح" });
        },
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (formData: any) => {
            const url = selectedCourse
                ? `/api/admin-panel/courses/${selectedCourse.id}`
                : "/api/admin-panel/courses";
            const method = selectedCourse ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("فشل حفظ الكورس");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
            queryClient.invalidateQueries({ queryKey: ["admin-stats"] }); // Update stats if needed
            toast({
                title: selectedCourse ? "تم التعديل" : "تمت الإضافة",
                description: selectedCourse ? "تم تحديث بيانات الكورس" : "تم إضافة كورس جديد بنجاح"
            });
            setIsDialogOpen(false);
            setSelectedCourse(null);
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const handleEdit = (course: any) => {
        setSelectedCourse(course);
        setFormLevel(course?.level || "beginner");
        setFormCategoryId(course?.categoryId || "none");
        setFormIsPublished(Boolean(course?.isPublished));
        setEditKey(prev => prev + 1);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCourse(null);
        setFormLevel("beginner");
        setFormCategoryId("none");
        setFormIsPublished(false);
        setEditKey(prev => prev + 1);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا الكورس؟ سيتم حذف جميع الأقسام والدروس التابعة له.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = (formData.get("title") as string) || "";

        // Better slug generator for Arabic/Special chars
        const slugBase = title
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");

        // Keep existing slug if editing, otherwise generate one
        const slug = selectedCourse?.slug || (
            slugBase
                ? `${slugBase.slice(0, 50)}-${Date.now().toString(36).slice(-4)}`
                : `course-${Date.now().toString(36)}`
        );

        const data = {
            title: title.trim(),
            slug,
            description: (formData.get("description") as string)?.trim() || "وصف الكورس",
            instructor: (formData.get("instructor") as string)?.trim() || "منصة تعلم",
            price: String(formData.get("price") || "0"),
            level: formLevel,
            categoryId: (formCategoryId && formCategoryId !== "none") ? formCategoryId : null,
            isPublished: formIsPublished,
            thumbnail: (formData.get("thumbnail") as string)?.trim() || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
            aiDescription: (formData.get("aiDescription") as string)?.trim() || "",
        };
        saveMutation.mutate(data);
    };

    return (
        <AdminLayout>
            <div className="space-y-6" dir="rtl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">إدارة الكورسات</h1>
                        <p className="text-muted-foreground">عرض وتعديل محتوى الكورسات التعليمية.</p>
                    </div>
                    <Link href="/admin/courses/add">
                        <Button className="gap-2 h-11 px-6 font-bold shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5" />
                            إضافة كورس جديد
                        </Button>
                    </Link>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="البحث في الكورسات..."
                            className="pr-10 h-11 bg-card shadow-sm"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-right">الكورس</TableHead>
                                <TableHead className="text-right">التخصص</TableHead>
                                <TableHead className="text-right">المدرس</TableHead>
                                <TableHead className="text-right">السعر</TableHead>
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-left">العمليات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingCourses ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : coursesData?.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        لا توجد كورسات مطابقة لبحثك.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                coursesData?.data.map((course: any) => (
                                    <TableRow key={course.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold">{course.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{course.category?.name || "غير مصنف"}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{course.instructor}</TableCell>
                                        <TableCell>{course.price} ر.س</TableCell>
                                        <TableCell>
                                            <Badge className={course.isPublished ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-muted text-muted-foreground"}>
                                                {course.isPublished ? "منشور" : "مسودة"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-left flex items-center justify-end gap-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600"
                                                onClick={() => handleEdit(course)}
                                                title="تعديل البيانات الأساسية"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <Link href={`/admin/courses/${course.id}/curriculum`}>
                                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                                            <Video className="w-4 h-4 text-primary" /> إدارة المنهج والفيديوهات
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(course.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> حذف الكورس بالكامل
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {coursesData?.total > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">إجمالي {coursesData.total} كورس</p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={coursesData.data.length < 10}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Course Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{selectedCourse ? "تعديل الكورس" : "إضافة كورس جديد"}</DialogTitle>
                        <DialogDescription>
                            قم بتعديل البيانات الأساسية للكورس أدناه. اضغط حفظ عند الانتهاء.
                        </DialogDescription>
                    </DialogHeader>
                    <form key={`course-form-${editKey}`} onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">اسم الكورس</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={selectedCourse?.title}
                                    required
                                    placeholder="مثال: دورة React المتقدمة"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instructor">اسم المدرب</Label>
                                <Input
                                    id="instructor"
                                    name="instructor"
                                    defaultValue={selectedCourse?.instructor}
                                    required
                                    placeholder="أحمد علي"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">السعر الحالي</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    defaultValue={selectedCourse?.price || "0"}
                                    required
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">وصف الكورس (عام)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedCourse?.description}
                                required
                                className="min-h-[100px]"
                                placeholder="اشرح محتوى الكورس وماذا سيتعلم الطالب..."
                            />
                        </div>

                        <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <Label htmlFor="aiDescription" className="font-bold flex items-center gap-2 text-primary">
                                <Sparkles className="w-4 h-4" />
                                وصف خاص للذكاء الاصطناعي (المساعد الذكي)
                            </Label>
                            <Textarea
                                id="aiDescription"
                                name="aiDescription"
                                defaultValue={selectedCourse?.aiDescription}
                                className="min-h-[80px] bg-background text-sm"
                                placeholder="اشرح للذكاء الاصطناعي متى يجب أن يقترح هذا الكورس للطالب..."
                            />
                            <p className="text-[10px] text-muted-foreground">هذا الوصف لن يراه الطلاب، سيستخدمه "المساعد الذكي" فقط كمرجع.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="level">المستوى</Label>
                                <Select value={formLevel} onValueChange={setFormLevel}>
                                    <SelectTrigger id="level">
                                        <SelectValue placeholder="اختر المستوى" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="beginner">مبتدئ</SelectItem>
                                        <SelectItem value="intermediate">متوسط</SelectItem>
                                        <SelectItem value="advanced">متقدم</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryId">تخصص الكورس</Label>
                                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                                    <SelectTrigger id="categoryId">
                                        <SelectValue placeholder="اختر التخصص" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="none">بدون تصنيف</SelectItem>
                                        {categories?.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>صورة الكورس</Label>
                            <div className="flex items-center gap-4 p-3 border rounded-lg bg-muted/30">
                                {selectedCourse?.thumbnail && (
                                    <div className="w-16 h-16 rounded border overflow-hidden">
                                        <img src={selectedCourse.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Input
                                        id="thumbnail"
                                        name="thumbnail"
                                        defaultValue={selectedCourse?.thumbnail}
                                        placeholder="رابط الصورة أو ارفع ملفاً"
                                        className="mb-2"
                                    />
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="text-xs"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append("image", file);

                                            try {
                                                toast({ title: "جاري الرفع...", description: "الرجاء الانتظار" });
                                                const res = await fetch("/api/admin-panel/upload", {
                                                    method: "POST",
                                                    body: formData,
                                                    credentials: "include",
                                                    headers: getSessionHeaders() as Record<string, string>
                                                });
                                                if (!res.ok) throw new Error("Upload failed");
                                                const data = await res.json();

                                                // Update the hidden/main thumbnail input
                                                const input = document.getElementById("thumbnail") as HTMLInputElement;
                                                if (input) input.value = data.url;

                                                toast({ title: "تم الرفع", description: "تم تحديث رابط الصورة" });
                                            } catch (err) {
                                                toast({ title: "خطأ", description: "فشل الرفع", variant: "destructive" });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse pt-2">
                            <Switch
                                id="isPublished"
                                checked={formIsPublished}
                                onCheckedChange={setFormIsPublished}
                            />
                            <Label htmlFor="isPublished">نشر الكورس مباشرة</Label>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-4">
                            <Button type="submit" disabled={saveMutation.isPending} className="font-bold flex-1">
                                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                {selectedCourse ? "حفظ التغييرات" : "إضافة الكورس"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                                إلغاء
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
