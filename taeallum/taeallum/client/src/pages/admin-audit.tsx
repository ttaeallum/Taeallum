import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, ShieldCheck, Info } from "lucide-react";
import { format } from "date-fns";

export default function AdminAudit() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/stats");
            if (!res.ok) throw new Error("Failed to fetch stats");
            return res.json();
        }
    });

    const logs = (stats as any)?.recentActivity || [];

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
                        <h1 className="text-3xl font-bold">سجل العمليات (Audit Logs)</h1>
                        <p className="text-muted-foreground">مراقبة جميع التغييرات التي تتم عبر لوحة التحكم</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                </div>

                <Card className="border-border/40 bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden border-2">
                    <CardHeader className="bg-muted/30 border-b border-border/40 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">النشاط الأخير</CardTitle>
                        <Badge variant="outline" className="gap-1"><History className="w-3 h-3" /> تم التحديث الآن</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="text-right">الوقت</TableHead>
                                    <TableHead className="text-right">المسؤول</TableHead>
                                    <TableHead className="text-right">العملية</TableHead>
                                    <TableHead className="text-right">النوع</TableHead>
                                    <TableHead className="text-right">المعرف (ID)</TableHead>
                                    <TableHead className="text-right">التفاصيل</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs?.map((log: any) => (
                                    <TableRow key={log.id} className="hover:bg-primary/5 transition-colors border-border/40">
                                        <TableCell className="text-xs font-mono opacity-80">
                                            {format(new Date(log.createdAt), "yyyy/MM/dd HH:mm:ss")}
                                        </TableCell>
                                        <TableCell className="font-bold text-primary">
                                            {log.adminId}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                log.action === "CREATE" ? "default" :
                                                    log.action === "UPDATE" ? "outline" : "destructive"
                                            } className="rounded-md font-black">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold opacity-70">
                                            {log.entityType}
                                        </TableCell>
                                        <TableCell className="text-[10px] font-mono opacity-50">
                                            {log.entityId}
                                        </TableCell>
                                        <TableCell>
                                            <button className="p-2 hover:bg-muted rounded-full transition-colors" title="عرض البيانات التقنية">
                                                <Info className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                            لا توجد سجلات عمليات متاحة.
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
