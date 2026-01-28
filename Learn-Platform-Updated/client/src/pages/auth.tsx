import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getSessionHeaders } from "@/lib/queryClient";

export default function Auth() {
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Parse 'next' parameter from URL
  const searchParams = new URLSearchParams(window.location.search);
  const next = searchParams.get("next") || "/dashboard";

  const verifySession = async () => {
    try {
      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        headers: getSessionHeaders(),
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
        headers: { "Content-Type": "application/json" },
        credentials: "include", // إرسال الكوكيز مع الطلب
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // جلب بيانات المستخدم وتحديث cache
        const userData = await response.json();
        console.log("Login successful, user data:", userData);

        if (userData?.sessionId) {
          localStorage.setItem("sessionId", userData.sessionId);
        }

        const verifiedUser = await verifySession();
        if (!verifiedUser) {
          toast({
            title: "لم يتم حفظ الجلسة",
            description: "تأكد أنك تفتح الموقع عبر http://localhost:3001 أو امسح الكوكيز ثم أعد المحاولة.",
            variant: "destructive",
          });
          return;
        }

        queryClient.setQueryData(["auth-me"], verifiedUser);
        toast({ title: "تم تسجيل الدخول", description: "مرحباً بك مجدداً!" });
        setTimeout(() => setLocation(next), 200);
      } else {
        const data = await response.json();
        toast({
          title: "فشل الدخول (الإصدار الجديد)",
          description: data.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          variant: "destructive"
        });
      }
    } catch (error) {
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
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // إرسال الكوكيز مع الطلب
        body: JSON.stringify({ fullName, email, password }),
      });

      if (response.ok) {
        // جلب بيانات المستخدم وتحديث cache
        const userData = await response.json();
        console.log("Register successful, user data:", userData);

        if (userData?.sessionId) {
          localStorage.setItem("sessionId", userData.sessionId);
        }

        const verifiedUser = await verifySession();
        if (!verifiedUser) {
          toast({
            title: "لم يتم حفظ الجلسة",
            description: "تأكد أنك تفتح الموقع عبر http://localhost:3001 أو امسح الكوكيز ثم أعد المحاولة.",
            variant: "destructive",
          });
          return;
        }

        queryClient.setQueryData(["auth-me"], verifiedUser);
        toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في منصة تعلّم!" });
        setTimeout(() => setLocation(next), 200);
      } else {
        const data = await response.json();
        toast({
          title: "فشل التسجيل",
          description: data.message || "تأكد من البيانات المدخلة",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ في الاتصال بالسيرفر", variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 bg-muted/20" dir="rtl">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-heading font-bold text-primary">تعلّم</CardTitle>
            <CardDescription>مرحباً بك في بوابتك نحو المستقبل</CardDescription>
          </CardHeader>
          <CardContent>
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
