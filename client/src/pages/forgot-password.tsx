import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { getSessionHeaders } from "@/lib/queryClient";

export default function ForgotPassword() {
    const [step, setStep] = useState<"email" | "code" | "new-password">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getSessionHeaders() } as Record<string, string>,
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من بريدك الإلكتروني." });
                setStep("code");
            } else {
                const data = await response.json();
                toast({ title: "خطأ", description: data.message || "فشل إرسال الرمز", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "خطأ", description: "فشل الاتصال بالسيرفر", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length === 6) {
            setStep("new-password");
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getSessionHeaders() } as Record<string, string>,
                body: JSON.stringify({ email, code, newPassword }),
            });

            if (response.ok) {
                toast({ title: "نجاح", description: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول." });
                setTimeout(() => setLocation("/auth"), 2000);
            } else {
                const data = await response.json();
                toast({ title: "خطأ", description: data.message || "فشل تغيير كلمة المرور", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "خطأ", description: "فشل الاتصال بالسيرفر", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4" dir="rtl">
                <Card className="w-full max-w-md shadow-xl border-border/30 rounded-3xl overflow-hidden">
                    <CardHeader className="text-center space-y-2 pb-6 bg-muted/30">
                        <CardTitle className="text-2xl font-black text-primary">إعادة تعيين كلمة المرور</CardTitle>
                        <CardDescription>
                            {step === "email" && "أدخل بريدك الإلكتروني لاستعادة الوصول لحسابك"}
                            {step === "code" && "أدخل الرمز المرسل إلى بريدك الإلكتروني"}
                            {step === "new-password" && "أدخل كلمة المرور الجديدة"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        {step === "email" && (
                            <form onSubmit={handleRequestReset} className="space-y-4">
                                <div className="space-y-2 text-right">
                                    <Label htmlFor="email">البريد الإلكتروني</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                                <Button className="w-full h-12 font-bold rounded-xl" disabled={loading}>
                                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                    إرسال الرمز
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                    onClick={() => setLocation("/auth")}
                                >
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                    العودة لتسجيل الدخول
                                </Button>
                            </form>
                        )}

                        {step === "code" && (
                            <form onSubmit={handleVerifyCode} className="space-y-6 text-center">
                                <div className="flex justify-center" dir="ltr">
                                    <InputOTP
                                        maxLength={6}
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                <Button className="w-full h-12 font-bold rounded-xl" disabled={code.length !== 6}>
                                    تابــــع
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                    onClick={() => setStep("email")}
                                >
                                    إعادة إرسال الرمز
                                </Button>
                            </form>
                        )}

                        {step === "new-password" && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2 text-right">
                                    <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="pl-10 text-right h-12 rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <Button className="w-full h-12 font-bold rounded-xl" disabled={loading}>
                                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                    تغيير كلمة المرور
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
