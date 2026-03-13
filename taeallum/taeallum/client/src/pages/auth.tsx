import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getSessionHeaders } from "@/lib/queryClient";

export default function Auth() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [step, setStep] = useState<"auth" | "verify">("auth");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse 'next' parameter from URL
  const searchParams = new URLSearchParams(window.location.search);
  const next = searchParams.get("next") || "/courses";

  const verifySession = async () => {
    try {
      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        headers: getSessionHeaders() as Record<string, string>,
      });
      if (!meRes.ok) return null;
      return await meRes.json();
    } catch {
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders()
        } as Record<string, string>,
        credentials: "include", // إرسال الكوكيز مع الطلب
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // جلب بيانات المستخدم وتحديث cache
        const userData = await response.json();
        console.log("Login successful, user data:", userData);

        queryClient.setQueryData(["auth-me"], userData);
        toast({ title: "تم تسجيل الدخول", description: "مرحباً بك مجدداً!" });
        setTimeout(() => setLocation(next), 200);
      } else if (response.status === 403) {
        const data = await response.json();
        if (data.unverified) {
          setUnverifiedEmail(data.email);
          setStep("verify");
          toast({
            title: "الحساب غير مفعل",
            description: "يرجى إكمال عملية التحقق من البريد الإلكتروني",
          });
        }
      } else {
        const data = await response.json();
        toast({
          title: "فشل الدخول (الإصدار الجديد)",
          description: data.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال بالسيرفر", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Password validation logic
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتضم حرفاً كبيراً، وحرفاً صغيراً، ورقماً، ورمزاً.",
        variant: "destructive"
      });
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders()
        } as Record<string, string>,
        credentials: "include", // إرسال الكوكيز مع الطلب
        body: JSON.stringify({ fullName, email, password }),
      });

      if (response.ok) {
        // جلب بيانات المستخدم وتحديث cache
        const userData = await response.json();
        console.log("Register successful, user data:", userData);

        // الانتقال لخطوة التحقق
        setUnverifiedEmail(email);
        setStep("verify");
        toast({ title: "تم إرسال رمز التحقق", description: "يرجى التحقق من بريدك الإلكتروني." });
      } else {
        const data = await response.json();
        toast({
          title: "فشل التسجيل",
          description: data.message || "تأكد من البيانات المدخلة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Register error:", error);
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال بالسيرفر", variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setVerifyLoading(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() } as Record<string, string>,
        body: JSON.stringify({ email: unverifiedEmail, code: otp }),
      });

      if (response.ok) {
        const userData = await response.json();
        queryClient.setQueryData(["auth-me"], userData);
        toast({ title: "تم تفعيل الحساب", description: "مرحباً بك في منصة تعلّم!" });
        setTimeout(() => setLocation(next), 200);
      } else {
        const data = await response.json();
        toast({
          title: "فشل التحقق",
          description: data.message || "رمز التحقق غير صحيح",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء التحقق", variant: "destructive" });
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!unverifiedEmail) return;
    setVerifyLoading(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() } as Record<string, string>,
        body: JSON.stringify({ email: unverifiedEmail }),
      });

      if (response.ok) {
        toast({ title: "تم إعادة إرسال الرمز", description: "يرجى تفقد بريدك الإلكتروني" });
      } else {
        const data = await response.json();
        toast({ title: "خطأ", description: data.message || "فشل إرسال الرمز", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال بالسيرفر", variant: "destructive" });
    } finally {
      setVerifyLoading(false);
    }
  };


  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4" dir="rtl">
        <Card className="w-full max-w-md shadow-xl border-border/30 rounded-2xl">
          <CardHeader className="text-center space-y-2 pb-4">
            <CardTitle className="text-2xl font-heading font-bold text-primary">تعلّم</CardTitle>
            <CardDescription className="text-sm">مرحباً بك في بوابتك نحو المستقبل</CardDescription>
          </CardHeader>
          <CardContent>
            {step === "auth" ? (
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2 text-right">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input id="email" name="email" type="email" placeholder="name@example.com" autoComplete="email" required />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          className="pl-10 text-right"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex justify-end text-xs">
                        <Link href="/forgot-password" className="text-primary hover:underline">نسيت كلمة المرور؟</Link>
                      </div>
                    </div>
                    <Button className="w-full mt-4 font-bold" size="lg" disabled={loginLoading}>
                      {loginLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      دخول
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2 text-right">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input id="fullName" name="fullName" placeholder="الاسم" autoComplete="name" required />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                      <Input id="reg-email" name="email" type="email" placeholder="name@example.com" autoComplete="email" required />
                    </div>
                    <div className="space-y-2 text-right">
                      <Label htmlFor="reg-password">كلمة المرور</Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          name="password"
                          type={showRegPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          className="pl-10 text-right"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button className="w-full mt-4 font-bold" size="lg" disabled={registerLoading}>
                      {registerLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                      إنشاء حساب جديد
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6 text-center">
                <div className="space-y-2">
                  <Label className="text-lg">أدخل رمز التحقق</Label>
                  <p className="text-sm text-muted-foreground">أرسلنا رمزاً مكوناً من 6 أرقام إلى {unverifiedEmail}</p>
                </div>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
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
                <Button className="w-full font-bold" size="lg" disabled={verifyLoading || otp.length !== 6}>
                  {verifyLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  تأكيد الحساب
                </Button>

                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={verifyLoading}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    ألم يصلك الرمز؟ إعادة إرسال
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("auth")}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    العودة لتعديل البيانات
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              بالتسجيل، أنت توافق على{" "}
              <Link href="/terms" className="underline hover:text-primary">الشروط والأحكام</Link>{" "}
              و{" "}
              <Link href="/privacy" className="underline hover:text-primary">سياسة الخصوصية</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
