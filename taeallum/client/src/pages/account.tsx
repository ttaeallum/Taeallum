import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Shield, LogOut, Phone, MapPin, Calendar, BookOpen, Clock, Award, Edit2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getSessionHeaders } from "@/lib/queryClient";

export default function AccountPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
        queryKey: ["auth-me"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me", {
                credentials: "include",
                headers: getSessionHeaders(),
            });
            if (!res.ok) {
                setLocation("/auth");
                return null;
            }
            return res.json();
        }
    });

    const logoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
                headers: getSessionHeaders(),
            });
            if (!res.ok) throw new Error("Logout failed");
        },
        onSuccess: () => {
            queryClient.setQueryData(["auth-me"], null);
            localStorage.removeItem("sessionId");
            toast({ title: "تم تسجيل الخروج", description: "نتمنى عودتك قريباً!" });
            setLocation("/");
        }
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!user) return null;

    const joinDate = new Date(user.createdAt || new Date());
    const formattedDate = joinDate.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return (
        <Layout>
            {/* Header Section */}
            <div className="bg-muted/30 py-8 border-b border-border/40" dir="rtl">
                <div className="container px-4 md:px-8 max-w-screen-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl border-2 border-primary/30">
                            {user.fullName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">{user.fullName}</h1>
                            <p className="text-muted-foreground text-lg">ملفك الشخصي</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container py-12 px-4 md:px-8 max-w-screen-2xl" dir="rtl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* معلومات الحساب الرئيسية */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>معلومات الحساب</CardTitle>
                            <CardDescription>تفاصيل حسابك الشخصي والمعلومات الأساسية</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* البريد الإلكتروني */}
                            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                                    <p className="text-lg font-semibold">{user.email}</p>
                                </div>
                            </div>

                            {/* نوع الحساب */}
                            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                <Shield className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">نوع الحساب</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-lg font-semibold">
                                            {user.role === "admin" ? "مسؤول النظام" : "مستخدم عادي"}
                                        </p>
                                        {user.role === "admin" && (
                                            <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-bold">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* تاريخ الانضمام */}
                            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                <Calendar className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-muted-foreground">تاريخ الانضمام</p>
                                    <p className="text-lg font-semibold">{formattedDate}</p>
                                </div>
                            </div>

                            {/* الإجراءات */}
                            <div className="flex gap-3 pt-4 border-t">
                                <Button variant="outline" className="gap-2">
                                    <Edit2 className="h-4 w-4" />
                                    تعديل البيانات
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => logoutMutation.mutate()}
                                    disabled={logoutMutation.isPending}
                                >
                                    <LogOut className="h-4 w-4" />
                                    تسجيل الخروج
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* الإحصائيات والاشتراكات */}
                    <div className="space-y-4">
                        {/* الإحصائيات */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">الإحصائيات</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">الكورسات</p>
                                        <p className="text-2xl font-bold">0</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">ساعات التعلم</p>
                                        <p className="text-2xl font-bold">0</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">الشهادات</p>
                                        <p className="text-2xl font-bold">0</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* الخطط المدفوعة */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">الاشتراكات</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">لا توجد اشتراكات نشطة حالياً</p>
                                <a href="/ai-pricing">
                                    <Button className="w-full">الاشتراك الآن</Button>
                                </a>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* تعديل البيانات الشخصية */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>تعديل البيانات الشخصية</CardTitle>
                        <CardDescription>قم بتحديث معلوماتك الشخصية</CardDescription>
                    </CardHeader>
                    <form onSubmit={(e: any) => {
                        e.preventDefault();
                        toast({ title: "تم الحفظ", description: "تم تحديث بيانات ملفك الشخصي بنجاح" });
                    }}>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">الاسم الكامل</Label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="fullName" name="fullName" defaultValue={user.fullName} autoComplete="name" className="pr-10" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <div className="relative">
                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="phone" name="phone" placeholder="+966 50 000 0000" autoComplete="tel" className="pr-10" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">الموقع / المدينة</Label>
                                <div className="relative">
                                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input id="location" name="location" placeholder="الرياض، المملكة العربية السعودية" autoComplete="address-level2" className="pr-10" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">نبذة تعريفية</Label>
                                <Textarea id="bio" name="bio" placeholder="أخبرنا قليلاً عن نفسك واهتماماتك التعليمية..." className="min-h-[100px]" />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-6 bg-muted/10">
                            <Button type="submit" className="mr-auto font-bold px-8">حفظ التغييرات</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </Layout>
    );
}
