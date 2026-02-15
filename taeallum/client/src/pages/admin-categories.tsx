import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { getSessionHeaders } from "@/lib/queryClient";
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
    Edit2,
    Trash2,
    MoreVertical,
    Loader2
} from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminCategories() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch Categories
    const { data: categories, isLoading } = useQuery({
        queryKey: ["admin-categories"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/categories", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to fetch categories");
            return res.json();
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin-panel/categories/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to delete category");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            toast({ title: "تم الحذف", description: "تم حذف التخصص بنجاح" });
        },
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (formData: any) => {
            const url = selectedCategory
                ? `/api/admin-panel/categories/${selectedCategory.id}`
                : "/api/admin-panel/categories";
            const method = selectedCategory ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...getSessionHeaders()
                } as Record<string, string>,
                credentials: "include",
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || "فشل حفظ التخصص");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            toast({
                title: selectedCategory ? "تم التعديل" : "تمت الإضافة",
                description: selectedCategory ? "تم تحديث بيانات التخصص" : "تم إضافة تخصص جديد بنجاح"
            });
            setIsDialogOpen(false);
            setSelectedCategory(null);
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const seedSpecializationsMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin-panel/categories/seed-specializations", {
                method: "POST",
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to seed specializations");
            return res.json();
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
            const count = data?.createdCount ?? 0;
            toast({
                title: count > 0 ? "تم التحديث" : "مكتمل",
                description: count > 0
                    ? `تم إضافة ${count} تخصصات جديدة بنجاح`
                    : "جميع التخصصات موجودة بالفعل في القاعدة",
            });
        },
        onError: (error: any) => {
            toast({ title: "خطأ", description: error.message, variant: "destructive" });
        }
    });

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setSelectedCategory(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("هل أنت متأكد من حذف هذا التخصص؟ الكورسات المرتبطة به ستصبح بدون تخصص.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            description: formData.get("description"),
            // Let the backend handle slug generation for better Arabic support
        };
        saveMutation.mutate(data);
    };

    return (
        <AdminLayout>
            <div className="space-y-6" dir="rtl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">إدارة التخصصات</h1>
                        <p className="text-muted-foreground">التخصصات تساعدك على تنظيم الكورسات.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={() => seedSpecializationsMutation.mutate()}
                            disabled={seedSpecializationsMutation.isPending}
                            className="gap-2 h-11 px-6 font-bold"
                        >
                            {seedSpecializationsMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            إضافة التخصصات
                        </Button>
                        <Button onClick={handleAddNew} className="gap-2 h-11 px-6 font-bold shadow-lg shadow-primary/20">
                            <Plus className="w-5 h-5" />
                            إضافة تخصص جديد
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-right">التخصص</TableHead>
                                <TableHead className="text-right">الـ Slug</TableHead>
                                <TableHead className="text-right">الوصف</TableHead>
                                <TableHead className="text-left">العمليات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [1, 2, 3].map((i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : categories?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        لا توجد تخصصات حالياً.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories?.map((cat: any) => (
                                    <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold">{cat.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                                        <TableCell className="max-w-md truncate">{cat.description || "---"}</TableCell>
                                        <TableCell className="text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(cat)}>
                                                        <Edit2 className="w-4 h-4 text-blue-500" /> تعديل
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(cat.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" /> حذف
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
            </div>

            {/* Category Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>{selectedCategory ? "تعديل التخصص" : "إضافة تخصص جديد"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">اسم التخصص</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={selectedCategory?.name}
                                required
                                placeholder="مثال: التصميم الجرافيكي"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">وصف التخصص</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedCategory?.description}
                                className="min-h-[100px]"
                                placeholder="اشرح ما يتضمنه هذا التخصص..."
                            />
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0 pt-4">
                            <Button type="submit" disabled={saveMutation.isPending} className="font-bold flex-1">
                                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                                {selectedCategory ? "حفظ التغييرات" : "إضافة التخصص"}
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
