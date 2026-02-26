import { Layout } from "@/components/layout";
import { BookOpen, Clock, ArrowLeft, Target, Map, Trophy, Sparkles, LayoutDashboard, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function Tracks() {
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [, setLocation] = useLocation();

  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: userPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["user-plans"],
    queryFn: async () => {
      const res = await fetch("/api/ai-engine/user-plans", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json();
    },
    enabled: !!user?.id && (user.isSubscribed || user.role === "admin")
  });

  if (authLoading || (plansLoading && user?.isSubscribed)) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  if (!isSubscribed) {
    setLocation("/ai-pricing");
    return null;
  }

  return (
    <Layout>
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-background py-20 border-b border-border/40">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

        <div className="container px-4 md:px-8 max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6"
          >
            <Map className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Your Personal Paths</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-heading font-black mb-6"
          >
            مساراتك التعليمية <span className="text-primary">الذكية</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed"
          >
            هذه المسارات مصممة خصيصاً لك بواسطة المساعد الذكي بناءً على أهدافك وطموحاتك.
          </motion.p>
        </div>
      </div>

      <div className="container px-4 md:px-8 max-w-5xl mx-auto py-20">
        {!userPlans || userPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center py-12 px-6 rounded-[2.5rem] bg-muted/30 border border-border/50"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-4">لا توجد مسارات بعد!</h2>
            <p className="text-muted-foreground mb-8">
              لم تقم بإنشاء أي مسار تعليمي حتى الآن. تحدث مع المساعد الذكي الآن ليصمم لك خطتك الدراسية الأولى.
            </p>
            <Link href="/ai-agent">
              <Button size="lg" className="font-bold gap-2">
                تحدث مع المساعد الذكي الآن <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {userPlans.map((plan: any, idx: number) => {
              const data = plan.planData;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <div
                        className="group bg-card rounded-[2rem] overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col h-full cursor-pointer"
                        onClick={() => setSelectedTrack(plan)}
                      >
                        <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex items-center justify-center overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <LayoutDashboard className="w-32 h-32" />
                          </div>
                          <Trophy className="w-16 h-16 text-primary relative z-10" />
                        </div>

                        <div className="p-8 flex flex-col flex-1 relative">
                          <h3 className="font-heading font-black text-2xl mb-4 group-hover:text-primary transition-colors leading-tight">
                            {plan.title}
                          </h3>
                          <p className="text-muted-foreground mb-8 line-clamp-2 text-sm leading-relaxed">
                            {data.description}
                          </p>

                          <div className="mt-auto border-t border-border/50 pt-6 flex items-center justify-between text-sm font-medium text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 text-foreground">
                                <Clock className="w-4 h-4 text-primary" /> {plan.duration}
                              </span>
                              <span className="flex items-center gap-1.5 text-foreground">
                                <BookOpen className="w-4 h-4 text-primary" /> {data.courses?.length || 0} دورات
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>

                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50 !rounded-[2.5rem]" dir="rtl">
                      <div className="relative h-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="relative h-48 bg-primary/10 p-12 flex items-center justify-center">
                          <div className="text-center">
                            <h2 className="text-3xl md:text-5xl font-black mb-4 text-primary">{plan.title}</h2>
                            <p className="text-muted-foreground max-w-2xl text-lg mx-auto">{data.description}</p>
                          </div>
                        </div>

                        <div className="p-8 md:p-12 relative">
                          <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <Target className="w-6 h-6 text-primary" />
                            رحلة التعلم (AI Managed Roadmap)
                          </h3>

                          <div className="relative space-y-8 before:absolute before:inset-y-0 before:right-[19px] before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-transparent">
                            {data.milestones?.slice(0, 3).map((milestone: any, i: number) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative flex gap-8 mr-1"
                              >
                                <div className="absolute right-0 w-10 h-10 rounded-full bg-background border-4 border-primary flex items-center justify-center z-10 shadow-lg shadow-primary/20 text-xs font-black">
                                  {i + 1}
                                </div>
                                <div className="mr-16 flex-1 bg-muted/30 border border-border/50 rounded-2xl p-6 hover:bg-muted/50 transition-colors">
                                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                                    {i === 0 ? 'المستوى الأول - مبتدئ' : i === 1 ? 'المستوى الثاني - متوسط' : i === 2 ? 'المستوى الثالث - متقدم' : milestone.title}
                                    {i === 0 && <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20">نقطة البداية</Badge>}
                                  </h4>
                                  <p className="text-muted-foreground text-sm mb-4">{milestone.description}</p>

                                  {milestone.courses && milestone.courses.length > 0 ? (
                                    <div className="mt-4 pt-4 border-t border-border/20">
                                      {/* Weekly schedule header */}
                                      <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-primary uppercase tracking-widest">الدورات المرشحة من المنصة:</p>
                                        {milestone.weeklyHours && (
                                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary gap-1">
                                            <Clock className="w-3 h-3" />
                                            {milestone.weeklyHours} ساعة/أسبوع
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Exam hint banner */}
                                      <div className="mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                          <Trophy className="w-3 h-3 text-primary" />
                                        </div>
                                        <p className="text-[11px] text-primary/80 leading-relaxed">
                                          عند إتمام كل دورة، يمكنك اختبار مهاراتك من خلال امتحان إلكتروني للحصول على شهادة إنجاز.
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {milestone.courses.map((course: any) => {
                                          const isYouTube = !!course.youtubeUrl;
                                          const courseLink = isYouTube ? `/lesson/youtube?url=${encodeURIComponent(course.youtubeUrl)}` : `/courses/${course.slug}`;

                                          return (
                                            <Link key={course.id || course.youtubeUrl} href={courseLink}>
                                              <div className="flex items-center gap-3 p-3 bg-background border border-border/50 rounded-xl hover:border-primary/40 transition-all group/course cursor-pointer">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border/50 bg-muted/20 flex items-center justify-center">
                                                  {isYouTube ? (
                                                    <div className="w-full h-full bg-red-500/10 flex items-center justify-center">
                                                      <PlayCircle className="w-6 h-6 text-red-600" />
                                                    </div>
                                                  ) : (
                                                    <img src={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&q=80"} alt={course.title} className="w-full h-full object-cover group-hover/course:scale-110 transition-transform" />
                                                  )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <h5 className="text-xs font-bold truncate group-hover/course:text-primary transition-colors">{course.title}</h5>
                                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <Badge variant="outline" className={cn("text-[9px] py-0 h-4 border-primary/20 text-muted-foreground uppercase", isYouTube && "bg-red-500/5 text-red-600 border-red-500/20")}>
                                                      {isYouTube ? "YouTube" : course.level}
                                                    </Badge>
                                                    {course.totalHours > 0 && (
                                                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {course.totalHours}h
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <ArrowLeft className="w-3 h-3 text-muted-foreground mr-auto group-hover/course:text-primary transition-all -translate-x-1 group-hover/course:translate-x-0" />
                                              </div>
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-4 pt-4 border-t border-border/20">
                                      <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center">
                                        <p className="text-xs text-muted-foreground">سيتم إضافة الدورات لهذا المستوى قريباً</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}

                            <div className="relative flex gap-8 mr-1 mt-8">
                              <div className="absolute right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10 shadow-lg shadow-primary/40">
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div className="mr-16 pt-2">
                                <h4 className="text-xl font-black text-primary">الاحتراف والوظيفة!</h4>
                                <p className="text-sm text-muted-foreground">بنهاية هذا المسار ستكون جاهزاً لسوق العمل.</p>
                                <Link href="/ai-agent">
                                  <Button className="mt-4 w-full md:w-auto font-bold shadow-lg shadow-primary/20" variant="outline">
                                    المتابعة مع المساعد الذكي
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
