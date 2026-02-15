import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, ShieldCheck, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
    const { courseId } = useParams();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ["auth-me"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me", {
                credentials: "include"
            });
            if (!res.ok) {
                setLocation(`/auth?next=/checkout/${courseId}`);
                return null;
            }
            return res.json();
        }
    });

    // Auto-redirect since all courses are free
    useEffect(() => {
        if (user && courseId && courseId !== "subscription") {
            setLocation(`/learn/${courseId}`);
        }
    }, [user, courseId, setLocation]);

    const { data: course, isLoading: courseLoading } = useQuery({
        queryKey: ["course-id", courseId],
        queryFn: async () => {
            if (courseId === "subscription") {
                return {
                    id: "subscription",
                    title: "الاشتراك الكامل في المنصة",
                    instructor: "وصول غير محدود لجميع الكورسات",
                    price: 45,
                    thumbnail: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80"
                };
            }
            const res = await fetch("/api/courses");
            if (!res.ok) throw new Error("Failed to fetch courses");
            const courses = await res.json();
            return courses.find((c: any) => c.id === courseId);
        }
    });

    // Simplified to only support Stripe official gateway
    const [isUploading, setIsUploading] = useState(false);


    const checkoutMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/payments/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "فشل إنشاء جلسة الدفع");
            }

            const { url } = await res.json();
            window.location.href = url;
            return { ok: true };
        },
        onError: (error: any) => {
            toast({
                title: "خطأ في عملية الدفع",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    if (courseLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!course) {
        return (
            <Layout>
                <div className="container py-24 text-center">
                    <h1 className="text-2xl font-bold">الكورس غير موجود</h1>
                    <Link href="/courses">
                        <Button className="mt-4">العودة للمكتبة</Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container py-12 px-4 md:px-8 max-w-4xl" dir="rtl">
                <h1 className="text-3xl font-heading font-black mb-8 text-right">إتمام شراء الكورس</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
                    {/* Order Summary */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle className="text-xl">مراجعة الطلب</CardTitle>
                                <CardDescription>راجع تفاصيل الدورة قبل الدفع.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50 flex-row">
                                    <img src={course.thumbnail} className="w-24 h-16 object-cover rounded-lg" />
                                    <div className="flex-1">
                                        <p className="font-bold">{course.title}</p>
                                        <p className="text-xs text-muted-foreground">{course.instructor}</p>
                                    </div>
                                    <div className="font-bold text-primary">{course.price} د.أ</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">طريقة الدفع</CardTitle>
                                <CardDescription>يتم الدفع عبر بوابة الدفع الآمنة (Stripe).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 p-5 border-2 border-primary bg-primary/5 rounded-2xl flex-row">
                                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    </div>
                                    <CreditCard className="w-6 h-6 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-bold">البطاقة البنكية (Visa / MasterCard)</p>
                                        <p className="text-xs text-muted-foreground">دفع مشفر وآمن 100%</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-8 h-5 bg-muted rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
                                        <div className="w-8 h-5 bg-muted rounded flex items-center justify-center text-[8px] font-bold">MC</div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 text-xs text-blue-600 flex items-start gap-3">
                                    <ShieldCheck className="w-4 h-4 shrink-0" />
                                    سيتم توجيهك إلى صفحة الدفع الرسمية لإكمال العملية بأمان. لا نقوم بتخزين بيانات بطاقتك أبداً.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Checkout Info */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="bg-primary/5 border-primary/20 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-lg">ملخص السعر</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm mb-4">
                                    <span className="text-muted-foreground">السعر:</span>
                                    <span className="font-bold">{course.price} د.أ</span>
                                </div>
                                <div className="pt-4 border-t flex justify-between font-bold text-lg">
                                    <span>الإجمالي:</span>
                                    <span className="text-primary">{course.price} د.أ</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-4">
                                <Button
                                    className="w-full h-14 font-bold text-lg shadow-xl shadow-primary/20"
                                    onClick={() => checkoutMutation.mutate()}
                                    disabled={checkoutMutation.isPending || isUploading}
                                >
                                    {checkoutMutation.isPending ? (
                                        <>
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            جاري المعالجة...
                                        </>
                                    ) : "الدفع بالبطاقة الآن"}
                                </Button>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center">
                                    <ShieldCheck className="w-3 h-3" />
                                    تشفير آمن وحماية كاملة للبيانات
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
