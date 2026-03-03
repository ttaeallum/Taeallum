import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Loader2, GraduationCap, User } from "lucide-react";
import { format } from "date-fns";

export default function AdminEnrollments() {
    const { data: enrollments, isLoading } = useQuery({
        queryKey: ["admin-enrollments"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/enrollments");
            if (!res.ok) throw new Error("Failed to fetch enrollments");
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
                <div>
                    <h1 className="text-3xl font-bold font-heading strike-none">التحاقات الطلاب</h1>
                    <p className="text-muted-foreground">تتبع تقدم الطلاب في جميع الكورسات</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" /> إجمالي الالتحاقات
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-black">{enrollments?.length || 0}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/40 bg-card/50 backdrop-blur-xl rounded-3xl overflow-hidden border-2">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="text-right">الطالب</TableHead>
                                    <TableHead className="text-right">الكورس</TableHead>
                                    <TableHead className="text-right">خطة التقدم</TableHead>
                                    <TableHead className="text-right">تاريخ الالتحاق</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments?.map((enrollment: any) => (
                                    <TableRow key={enrollment.id} className="hover:bg-primary/5 transition-colors border-border/40">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{enrollment.user?.fullName}</span>
                                                    <span className="text-[10px] text-muted-foreground">{enrollment.user?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">
                                            {enrollment.course?.title}
                                        </TableCell>
                                        <TableCell className="w-[300px]">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span>{enrollment.progress}% مكتمل</span>
                                                </div>
                                                <Progress value={enrollment.progress} className="h-1.5" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(enrollment.enrolledAt), "yyyy/MM/dd")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {enrollments?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
                                            لا توجد التحاقات مسجلة حالياً.
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
