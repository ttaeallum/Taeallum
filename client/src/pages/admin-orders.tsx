import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function AdminOrders() {
    const { data: orders, isLoading } = useQuery({
        queryKey: ["admin-orders"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/orders");
            if (!res.ok) throw new Error("Failed to fetch orders");
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8" dir="rtl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">سجلات المشتريات</h1>
                        <p className="text-muted-foreground">عرض وتتبع جميع العمليات المالية عبر Stripe</p>
                    </div>
                    <div className="bg-primary/10 px-4 py-2 rounded-xl text-primary font-bold flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        إجمالي المبيعات: ${orders?.reduce((sum: number, o: any) => sum + parseFloat(o.amount), 0).toFixed(2)}
                    </div>
                </div>

                <Card className="border-border/40 bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden border-2">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                        <CardTitle>كشف العمليات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="text-right">التاريخ</TableHead>
                                    <TableHead className="text-right">المستخدم</TableHead>
                                    <TableHead className="text-right">الكورس / الاشتراك</TableHead>
                                    <TableHead className="text-right">المبلغ</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right">الوسيلة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders?.map((order: any) => (
                                    <TableRow key={order.id} className="hover:bg-primary/5 transition-colors border-border/40">
                                        <TableCell className="font-medium">
                                            {format(new Date(order.createdAt), "yyyy/MM/dd HH:mm")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{order.user?.fullName}</span>
                                                <span className="text-xs text-muted-foreground">{order.user?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {order.course?.title || order.planId || "اشتراك عام"}
                                        </TableCell>
                                        <TableCell className="font-black text-primary">
                                            ${order.amount}
                                        </TableCell>
                                        <TableCell>
                                            {order.status === "completed" ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 rounded-lg">
                                                    <CheckCircle2 className="w-3 h-3" /> مكتمل
                                                </Badge>
                                            ) : order.status === "pending" ? (
                                                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 rounded-lg">
                                                    <Clock className="w-3 h-3" /> قيد المراجعة
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1 rounded-lg">
                                                    <XCircle className="w-3 h-3" /> مرفوض
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="uppercase text-[10px] font-black tracking-widest opacity-60">
                                            {order.paymentMethod}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {orders?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                            لا توجد عمليات شراء متاحة حالياً.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
