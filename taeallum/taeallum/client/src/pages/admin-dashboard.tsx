import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, GraduationCap, DollarSign, Plus, Edit2, Trash2, Search, Filter, Loader2, Video } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getSessionHeaders } from "@/lib/queryClient";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const [location, setLocation] = useLocation();
    const [searchQuery, setSearchQuery] = useState("");

    // Sync tab with URL
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab") || "overview";
    const [activeTab, setActiveTab] = useState(tabParam);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const currentTab = params.get("tab") || "overview";
        if (currentTab !== activeTab) {
            setActiveTab(currentTab);
        }
    }, [window.location.search]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(window.location.search);
        params.set("tab", value);
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
    };

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

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/stats", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return null;
            return res.json();
        }
    });

    const { data: courses, isLoading: coursesLoading } = useQuery({
        queryKey: ["admin-courses"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/courses", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return [];
            return res.json();
        }
    });

    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/users", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) return [];
            return res.json();
        }
    });

    // التحقق من أن المستخدم مسؤول
    if (!userLoading && user?.role !== "admin") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h1 className="text-2xl font-bold">غير مصرح لك بالوصول</h1>
                <p className="text-muted-foreground">هذه الصفحة متاحة فقط للمسؤولين</p>
                <Button onClick={() => setLocation("/dashboard")}>العودة إلى لوحة التحكم</Button>
            </div>
        );
    }

    const coursesList = Array.isArray(courses) ? courses : (courses as any)?.data || [];
    const statsTotals = (stats as any)?.stats || {};

    const chartData = (stats as any)?.chartData || [];
    const categoryData = (stats as any)?.categoryData || [];

    if (userLoading || statsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8" dir="rtl">
                <div>
                    <h1 className="text-3xl font-bold">لوحة التحكم</h1>
                    <p className="text-muted-foreground text-lg">مرحباً بك يا {user?.fullName}</p>
                </div>
                {/* الإحصائيات الرئيسية */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="إجمالي الكورسات"
                        value={statsTotals.courses ?? 0}
                        icon={BookOpen}
                        color="bg-blue-100 text-blue-600"
                    />
                    <StatCard
                        title="عدد المستخدمين"
                        value={statsTotals.users ?? 0}
                        icon={Users}
                        color="bg-emerald-100 text-emerald-600"
                    />
                    <StatCard
                        title="الالتحاقات"
                        value={statsTotals.enrollments ?? 0}
                        icon={GraduationCap}
                        color="bg-amber-100 text-amber-600"
                    />
                    <StatCard
                        title="الإيرادات"
                        value={`$${statsTotals.revenue ?? 0}`}
                        icon={DollarSign}
                        color="bg-purple-100 text-purple-600"
                    />
                </div>

                {/* التبويبات */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                        <TabsTrigger value="courses">الكورسات</TabsTrigger>
                        <TabsTrigger value="users">المستخدمين</TabsTrigger>
                        <TabsTrigger value="analytics">التحليلات</TabsTrigger>
                    </TabsList>

                    {/* نظرة عامة */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* الرسم البياني الخطي */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>النمو الشهري</CardTitle>
                                    <CardDescription>عدد الكورسات والمستخدمين الجدد</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="التحاقات" fill="#3b82f6" />
                                            <Bar dataKey="مستخدمين" fill="#10b981" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* الرسم البياني الدائري */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>توزيع الفئات</CardTitle>
                                    <CardDescription>نسبة الكورسات حسب الفئة</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* إدارة الكورسات */}
                    <TabsContent value="courses" className="space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>إدارة الكورسات</CardTitle>
                                    <CardDescription>أضف، عدّل، أو احذف الكورسات</CardDescription>
                                </div>
                                <Button className="gap-2" onClick={() => setLocation("/admin/courses/add")}>
                                    <Plus className="h-4 w-4" />
                                    إضافة كورس جديد
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* شريط البحث */}
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="ابحث عن كورس..."
                                            className="pr-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="outline" className="gap-2">
                                        <Filter className="h-4 w-4" />
                                        تصفية
                                    </Button>
                                </div>

                                {/* جدول الكورسات */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-right py-3 px-4 font-bold text-primary">اسم الكورس</th>
                                                <th className="text-right py-3 px-4 font-bold text-primary">التخصص</th>
                                                <th className="text-right py-3 px-4 font-bold text-primary">المدرب</th>
                                                <th className="text-right py-3 px-4 font-bold text-primary">الحالة</th>
                                                <th className="text-right py-3 px-4 font-bold text-primary">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coursesLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                                    </td>
                                                </tr>
                                            ) : coursesList.length > 0 ? (
                                                coursesList.map((course: any) => (
                                                    <tr key={course.id} className="border-b hover:bg-muted/50 transition-colors">
                                                        <td className="py-3 px-4 font-medium">{course.title}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                                                                {course.category?.name || "عام"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-muted-foreground">{course.instructor}</td>
                                                        <td className="py-3 px-4">
                                                            {course.isPublished ? (
                                                                <span className="text-emerald-500 flex items-center gap-1 text-xs">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    منشور
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">مسودة</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="flex gap-2">
                                                                <Link href={`/admin/courses/${course.id}/curriculum`}>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 gap-1 border-primary/20 hover:bg-primary/10"
                                                                    >
                                                                        <Video className="h-3 w-3" />
                                                                        إدارة المنهج
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="h-8 gap-1 opacity-80 hover:opacity-100"
                                                                    onClick={async () => {
                                                                        if (confirm("هل أنت متأكد من حذف هذا الكورس؟")) {
                                                                            try {
                                                                                const res = await fetch(`/api/admin-panel/courses/${course.id}`, {
                                                                                    method: "DELETE",
                                                                                    credentials: "include",
                                                                                    headers: getSessionHeaders() as Record<string, string>
                                                                                });
                                                                                if (!res.ok) throw new Error();
                                                                                queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
                                                                            } catch (e) {
                                                                                alert("فشل الحذف");
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                    حذف
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
                                                        لا توجد كورسات حالياً
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex justify-center pt-4">
                                    <Button variant="link" onClick={() => setLocation("/admin/courses")}>
                                        مشاهدة جميع الكورسات وإدارة المناهج
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* إدارة المستخدمين */}
                    <TabsContent value="users" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>إدارة المستخدمين</CardTitle>
                                <CardDescription>عرض وإدارة جميع المستخدمين المسجلين</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* شريط البحث */}
                                <div className="flex gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="ابحث عن مستخدم..."
                                            className="pr-10"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* جدول المستخدمين */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-right py-3 px-4 font-bold">الاسم</th>
                                                <th className="text-right py-3 px-4 font-bold">البريد الإلكتروني</th>
                                                <th className="text-right py-3 px-4 font-bold">الدور</th>
                                                <th className="text-right py-3 px-4 font-bold">تاريخ الانضمام</th>
                                                <th className="text-right py-3 px-4 font-bold">الإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                                    </td>
                                                </tr>
                                            ) : users && users.length > 0 ? (
                                                users.map((u: any) => (
                                                    <tr key={u.id} className="border-b hover:bg-muted/50">
                                                        <td className="py-3 px-4">{u.fullName}</td>
                                                        <td className="py-3 px-4">{u.email}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                                }`}>
                                                                {u.role === "admin" ? "مسؤول" : "مستخدم"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">{new Date(u.createdAt).toLocaleDateString("ar-SA")}</td>
                                                        <td className="py-3 px-4">
                                                            <Button size="sm" variant="outline" className="gap-1">
                                                                <Edit2 className="h-3 w-3" />
                                                                تعديل
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                                                        لا توجد مستخدمين حالياً
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* التحليلات */}
                    <TabsContent value="analytics" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>التحليلات المتقدمة</CardTitle>
                                <CardDescription>بيانات تفصيلية عن أداء المنصة</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-2">متوسط وقت الجلسة</p>
                                        <p className="text-3xl font-bold">45 دقيقة</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-2">معدل الإكمال</p>
                                        <p className="text-3xl font-bold">78%</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-2">الزيارات الشهرية</p>
                                        <p className="text-3xl font-bold">12.5K</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground mb-2">معدل الرضا</p>
                                        <p className="text-3xl font-bold">4.8/5</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold mt-2">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
