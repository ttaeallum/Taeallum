import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Users, Tag, Eye, Loader2, Percent } from "lucide-react";
import { getSessionHeaders } from "@/lib/queryClient";

export default function AdminPromoCodes() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [showUsages, setShowUsages] = useState<string | null>(null);
    const [form, setForm] = useState({ code: "", discountPercent: "72", usageLimit: "", description: "" });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const { data: promoCodes, isLoading } = useQuery({
        queryKey: ["admin-promo-codes"],
        queryFn: async () => {
            const res = await fetch("/api/promo-codes/admin", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return [];
            return res.json();
        }
    });

    const { data: usages, isLoading: usagesLoading } = useQuery({
        queryKey: ["admin-promo-usages", showUsages],
        enabled: !!showUsages,
        queryFn: async () => {
            const res = await fetch(`/api/promo-codes/admin/${showUsages}/usages`, {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return [];
            return res.json();
        }
    });

    const handleCreate = async () => {
        setError("");
        if (!form.code || !form.discountPercent) { setError("الكود ونسبة الخصم مطلوبان"); return; }
        setCreating(true);
        try {
            const res = await fetch("/api/promo-codes/admin", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...(getSessionHeaders() as Record<string, string>) },
                body: JSON.stringify({
                    code: form.code,
                    discountPercent: Number(form.discountPercent),
                    usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
                    description: form.description || null,
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "خطأ في الإنشاء");
            }
            queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
            setShowCreate(false);
            setForm({ code: "", discountPercent: "72", usageLimit: "", description: "" });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        await fetch(`/api/promo-codes/admin/${id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...(getSessionHeaders() as Record<string, string>) },
            body: JSON.stringify({ isActive: !currentActive })
        });
        queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    };

    const handleDelete = async (id: string, code: string) => {
        if (!confirm(`هل أنت متأكد من حذف كود "${code}"؟`)) return;
        await fetch(`/api/promo-codes/admin/${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: getSessionHeaders() as Record<string, string>
        });
        queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
    };

    const selectedCode = (promoCodes || []).find((p: any) => p.id === showUsages);

    return (
        <AdminLayout>
            <div className="space-y-8" dir="rtl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">أكواد الخصم</h1>
                        <p className="text-muted-foreground">إدارة أكواد الخصم للخطة الدراسية</p>
                    </div>
                    <Button className="gap-2" onClick={() => setShowCreate(true)}>
                        <Plus className="h-4 w-4" />
                        إنشاء كود جديد
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            جميع أكواد الخصم
                        </CardTitle>
                        <CardDescription>يمكنك تفعيل أو إيقاف أي كود في أي وقت</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : !promoCodes?.length ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Tag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-medium">لا توجد أكواد خصم بعد</p>
                                <p className="text-sm mt-1">أنشئ كوداً جديداً لتبدأ</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-right py-3 px-4 font-bold text-primary">الكود</th>
                                            <th className="text-right py-3 px-4 font-bold text-primary">نسبة الخصم</th>
                                            <th className="text-right py-3 px-4 font-bold text-primary">الاستخدامات</th>
                                            <th className="text-right py-3 px-4 font-bold text-primary">الحد الأقصى</th>
                                            <th className="text-right py-3 px-4 font-bold text-primary">الوصف</th>
                                            <th className="text-right py-3 px-4 font-bold text-primary">الحالة</th>
                                            <th className="text-right py-3 px-4 font-bold text-primary">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {promoCodes.map((promo: any) => (
                                            <tr key={promo.id} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <code className="bg-primary/10 text-primary px-2 py-1 rounded font-bold tracking-wider text-xs">
                                                        {promo.code}
                                                    </code>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="flex items-center gap-1 font-bold text-green-600">
                                                        <Percent className="w-3 h-3" />
                                                        {promo.discountPercent}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className="gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {promo.usageCount}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground text-xs">
                                                    {promo.usageLimit ?? "غير محدود"}
                                                </td>
                                                <td className="py-3 px-4 text-xs text-muted-foreground max-w-[150px] truncate">
                                                    {promo.description || "—"}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={promo.isActive}
                                                            onCheckedChange={() => handleToggle(promo.id, promo.isActive)}
                                                        />
                                                        <span className={`text-xs font-bold ${promo.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                                                            {promo.isActive ? "فعّال" : "معطّل"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1 border-primary/20 hover:bg-primary/10"
                                                            onClick={() => setShowUsages(promo.id)}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            من استخدمه
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 gap-1 opacity-80 hover:opacity-100"
                                                            onClick={() => handleDelete(promo.id, promo.code)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إنشاء كود خصم جديد</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>كود الخصم *</Label>
                                <Input
                                    placeholder="مثال: TAALLUM70"
                                    value={form.code}
                                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    className="font-bold tracking-widest"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>نسبة الخصم % *</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="100"
                                    placeholder="72"
                                    value={form.discountPercent}
                                    onChange={(e) => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {form.discountPercent}% خصم → السعر بعد الخصم: ${Math.round(250 * (1 - Number(form.discountPercent) / 100))}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>الحد الأقصى للاستخدام (اختياري)</Label>
                                <Input
                                    type="number"
                                    placeholder="اتركه فارغاً لعدد غير محدود"
                                    value={form.usageLimit}
                                    onChange={(e) => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ملاحظة / وصف (اختياري)</Label>
                                <Input
                                    placeholder="مثال: كود حملة رمضان 2025"
                                    value={form.description}
                                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            {error && <p className="text-sm text-red-500 font-bold">{error}</p>}
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
                            <Button onClick={handleCreate} disabled={creating} className="gap-2">
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                إنشاء الكود
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Usages Dialog */}
                <Dialog open={!!showUsages} onOpenChange={() => setShowUsages(null)}>
                    <DialogContent className="max-w-2xl" dir="rtl">
                        <DialogHeader>
                            <DialogTitle>من استخدم كود: <code className="text-primary">{selectedCode?.code}</code></DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[400px] overflow-y-auto">
                            {usagesLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : !usages?.length ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p>لا أحد استخدم هذا الكود بعد</p>
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-right py-2 px-3 font-bold">الاسم</th>
                                            <th className="text-right py-2 px-3 font-bold">البريد</th>
                                            <th className="text-right py-2 px-3 font-bold">دفع</th>
                                            <th className="text-right py-2 px-3 font-bold">التاريخ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usages.map((u: any) => (
                                            <tr key={u.id} className="border-b hover:bg-muted/30">
                                                <td className="py-2 px-3 font-medium">{u.userName || "—"}</td>
                                                <td className="py-2 px-3 text-muted-foreground text-xs">{u.userEmail || "—"}</td>
                                                <td className="py-2 px-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-green-600">${u.pricePaid}</span>
                                                        <span className="text-xs text-muted-foreground line-through">${u.originalPrice}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-3 text-xs text-muted-foreground">
                                                    {new Date(u.usedAt).toLocaleDateString("ar-SA")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
