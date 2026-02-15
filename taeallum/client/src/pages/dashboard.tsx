import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Trophy, PlayCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!res.ok) return null;
      return res.json();
    }
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <h1 className="text-2xl font-bold">يجب تسجيل الدخول أولاً</h1>
          <Link href="/auth">
            <Button>تسجيل الدخول</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b border-border/40" dir="rtl">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
              {user.fullName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">مرحباً، {user.fullName}</h1>
              <p className="text-muted-foreground text-right">واصل رحلة تعلمك اليوم!</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-right">كورسات مسجلة</p>
                <p className="text-2xl font-bold text-right">0</p>
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-right">ساعات تعلم</p>
                <p className="text-2xl font-bold text-right">0</p>
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-right">شهادات</p>
                <p className="text-2xl font-bold text-right">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-8 max-w-screen-2xl py-8" dir="rtl">
        <Tabs defaultValue="learning" className="space-y-8">
          <TabsList className="w-full md:w-auto h-auto flex flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger value="learning" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-6 py-2 border border-border/50">التعلم الحالي</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg px-6 py-2 border border-border/50">المكتملة</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-6">
            <h2 className="text-xl font-bold mb-4 text-right">أكمل من حيث توقفت</h2>
            <div className="text-center py-12 bg-card border border-border/50 rounded-xl text-muted-foreground">
              لا توجد كورسات قيد التعلم حالياً. ابدأ بتصفح المكتبة!
              <div className="mt-4">
                <Link href="/courses">
                  <Button variant="outline">تصفح المكتبة</Button>
                </Link>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-12 text-muted-foreground bg-card border border-border/50 rounded-xl font-bold">
              لا توجد كورسات مكتملة بعد. واصل التقدم!
            </div>
          </TabsContent>

          <TabsContent value="billing">
            <div className="bg-card border border-border/50 rounded-xl p-6 max-w-2xl text-right">
              <h3 className="font-bold text-lg mb-4">اشتراكك الحالي</h3>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-6 flex-row-reverse">
                <div className="text-right">
                  <p className="font-bold text-primary">لا يوجد اشتراك نشط</p>
                  <p className="text-sm text-muted-foreground">قم بالاشتراك للوصول لخدمات المدرب الذكي</p>
                </div>
                <div>
                  <Link href="/ai-pricing">
                    <Button size="sm">اشترك الآن</Button>
                  </Link>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
