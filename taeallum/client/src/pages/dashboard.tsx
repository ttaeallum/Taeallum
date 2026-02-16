import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Trophy, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Seo } from "@/components/seo";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <h1 className="text-2xl font-bold">يجب تسجيل الدخول أولاً</h1>
          <Link href="/auth">
            <Button className="rounded-xl">تسجيل الدخول</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="لوحة التحكم" description="لوحة تحكم حسابك الشخصي على منصة تعلّم." />
      <div className="py-8 md:py-12 border-b border-border/30" dir="rtl">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          {/* User Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {user.fullName?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">مرحباً، {user.fullName}</h1>
              <p className="text-sm text-muted-foreground">واصل رحلة تعلمك اليوم</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { icon: BookOpen, label: "كورسات مسجلة", value: "0", color: "text-blue-500 bg-blue-500/10" },
              { icon: Clock, label: "ساعات تعلم", value: "0", color: "text-amber-500 bg-amber-500/10" },
              { icon: Trophy, label: "شهادات", value: "0", color: "text-emerald-500 bg-emerald-500/10" }
            ].map((stat, i) => (
              <Card key={i} className="p-4 md:p-5 border-border/30 text-center">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 md:px-8 py-8" dir="rtl">
        <Tabs defaultValue="learning" className="space-y-6">
          <TabsList className="w-full md:w-auto h-auto flex flex-wrap gap-2 bg-transparent p-0">
            <TabsTrigger value="learning" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 py-2 border border-border/40 text-sm">التعلم الحالي</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 py-2 border border-border/40 text-sm">المكتملة</TabsTrigger>
          </TabsList>

          <TabsContent value="learning" className="space-y-4">
            <div className="text-center py-16 bg-card border border-border/30 rounded-2xl text-muted-foreground">
              <p className="mb-4">لا توجد كورسات قيد التعلم حالياً</p>
              <Link href="/courses">
                <Button variant="outline" className="rounded-xl">تصفح المكتبة</Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-16 text-muted-foreground bg-card border border-border/30 rounded-2xl">
              <p>لا توجد كورسات مكتملة بعد. واصل التقدم</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
