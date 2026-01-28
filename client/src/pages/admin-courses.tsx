import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    Video
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
    DialogFooter
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

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch Courses
    const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
        queryKey: ["admin-courses", query, page],
        queryFn: async () => {
            const res = await fetch(`/api/admin-panel/courses?q=${query}&page=${page}`, {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch courses");
            return res.json();
        },
    });

    // Fetch Categories for the dropdown
    const { data: categories } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/categories", {
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to fetch categories");
            return res.json();
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin-panel/courses/${id}`, {
                method: "DELETE",
                credentials: "include"
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
                headers: { "Content-Type": "application/json" },
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
        setFormCategoryId(course?.categoryId || "");
        setFormIsPublished(Boolean(course?.isPublished));
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCourse(null);
        setFormLevel("beginner");
        setFormCategoryId("");
        setFormIsPublished(false);
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
        const data = {
            title: formData.get("title"),
            slug: (formData.get("title") as string).toLowerCase().replace(/ /g, "-"), // Simple slug generator
            description: formData.get("description"),
            instructor: formData.get("instructor"),
            price: formData.get("price"),
            level: formLevel,
            categoryId: formCategoryId || null,
            isPublished: formIsPublished,
            thumbnail: formData.get("thumbnail") || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
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
                    <Button onClick={handleAddNew} className="gap-2 h-11 px-6 font-bold shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5" />
                        إضافة كورس جديد
                    </Button>
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
                                        <TableCell className="text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(course)}>
                                                        <Edit2 className="w-4 h-4 text-blue-500" /> تعديل البيانات الأساسية
                                                    </DropdownMenuItem>
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
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
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
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">وصف الكورس</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedCourse?.description}
                                required
                                className="min-h-[100px]"
                                placeholder="اشرح محتوى الكورس وماذا سيتعلم الطالب..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">السعر (ر.س)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    defaultValue={selectedCourse?.price}
                                    required
                                />
                            </div>
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
                                <Label htmlFor="categoryId">تصنيف الدورة (التخصص)</Label>
                                <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                                    <SelectTrigger id="categoryId">
                                        <SelectValue placeholder="اختر التخصص" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="">بدون تصنيف</SelectItem>
                                        {categories?.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="thumbnail">رابط الصورة (URL)</Label>
                            <Input
                                id="thumbnail"
                                name="thumbnail"
                                defaultValue={selectedCourse?.thumbnail}
                                placeholder="اتركه فارغاً للاستخدام الافتراضي"
                            />
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
