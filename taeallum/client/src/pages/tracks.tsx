import { Layout } from "@/components/layout";
import { BookOpen, Clock, ArrowRight, Trophy, Sparkles, CalendarDays, Hash, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const LEVEL_CONFIG = [
  {
    label: "المستوى الأول",
    sublabel: "أساسيات IT المشتركة",
    desc: "القاعدة الإلزامية لكل تخصص — برمجة، هياكل بيانات، شبكات، أنظمة تشغيل.",
    dot: "bg-emerald-500",
    border: "border-emerald-500/20",
    tag: "bg-emerald-500/10 text-emerald-400",
    num: "text-emerald-400 border-emerald-500/30",
  },
  {
    label: "المستوى الثاني",
    sublabel: "أساسيات التخصص",
    desc: "مواد مشتركة في القطاع المختار — تُبنى على الأساس وتمهّد للتخصص الدقيق.",
    dot: "bg-blue-500",
    border: "border-blue-500/20",
    tag: "bg-blue-500/10 text-blue-400",
    num: "text-blue-400 border-blue-500/30",
  },
  {
    label: "المستوى الثالث",
    sublabel: "التخصص العميق",
    desc: "مواد التخصص الدقيق فقط — الوصول للاحتراف في مجالك المختار.",
    dot: "bg-violet-500",
    border: "border-violet-500/20",
    tag: "bg-violet-500/10 text-violet-400",
    num: "text-violet-400 border-violet-500/30",
  },
];

export default function Tracks() {
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [, setLocation] = useLocation();

  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return null;
        return res.json();
      } catch (error) {
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5
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
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const isSubscribed = user?.isSubscribed || user?.role === "admin";
  if (!isSubscribed) { setLocation("/ai-pricing"); return null; }

  const plan = selectedPlan;
  const planData = plan?.planData;

  // Compute stats
  const allCourses = plan ? (planData?.milestones || []).flatMap((m: any) => m.courses || []).filter((c: any) => !c.youtubeUrl) : [];
  const totalCourses = allCourses.length;
  const totalHours = allCourses.reduce((s: number, c: any) => s + (c.totalHours || 0), 0);
  const weeklyHours = planData?.milestones?.[0]?.weeklyHours || planData?.weeklyHours || 10;
  const totalWeeks = totalHours > 0 ? Math.ceil(totalHours / weeklyHours) : null;
  const totalMonths = totalWeeks ? +(totalWeeks / 4).toFixed(1) : null;

  return (
    <Layout>
      <div className="min-h-screen bg-[#080808]">

        {/* ── Hero ─────────────────────────────────────── */}
        <div className="border-b border-white/5 py-20">
          <div className="container max-w-5xl mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">مساراتك التعليمية</span>
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
              مسارك نحو <span className="text-primary">الاحتراف</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/40 text-lg max-w-xl mx-auto">
              خطة دراسية مخصصة بالذكاء الاصطناعي — من الأساسيات حتى التخصص العميق.
            </motion.p>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-6 py-16 space-y-20">
          {/* ── AI Plans ─────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                  خططك الدراسية الذكية
                </h2>
                <p className="text-white/30 text-sm mt-1">مسارات شخصية تم إنشاؤها بالذكاء الاصطناعي</p>
              </div>
              <Link href="/ai-agent">
                <Button size="sm" variant="outline" className="border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs gap-1">
                  <Sparkles className="w-3 h-3" /> خطة جديدة
                </Button>
              </Link>
            </div>

            {!userPlans || userPlans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.02]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">لا توجد مسارات مخصصة بعد</h3>
                <p className="text-white/30 text-xs mb-6">ابدأ المحادثة مع "تعلّم" لبناء مسارك الاحترافي</p>
                <Link href="/ai-agent">
                  <Button size="sm" className="gap-2 text-xs">احصل على مسارك الآن <ArrowRight className="w-3 h-3" /></Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userPlans.map((p: any, i: number) => {
                  const d = p.planData;
                  const planCourses = (d?.milestones || []).flatMap((m: any) => m.courses || []).filter((c: any) => !c.youtubeUrl);
                  const planHours = planCourses.reduce((s: number, c: any) => s + (c.totalHours || 0), 0);
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      onClick={() => setSelectedPlan(p)}
                      className="group bg-[#111] border border-white/8 rounded-2xl p-6 cursor-pointer hover:border-primary/40 hover:bg-[#141414] transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-primary" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
                      </div>
                      <h3 className="text-white font-bold text-base mb-1 leading-tight">{p.title}</h3>
                      <p className="text-white/30 text-xs mb-5 line-clamp-2">{d?.description}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{planCourses.length} كورس</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{planHours > 0 ? `${planHours}h` : p.duration}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* ── Plan Detail Drawer ────────────────────────── */}
        <AnimatePresence>
          {selectedPlan && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPlan(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0d0d0d] border-l border-white/8 z-50 overflow-y-auto"
                dir="rtl"
              >
                {/* Header */}
                <div className="sticky top-0 bg-[#0d0d0d]/95 backdrop-blur border-b border-white/8 px-8 py-5 flex items-center justify-between z-10">
                  <div>
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-0.5">الخطة الدراسية</p>
                    <h2 className="text-white font-black text-lg leading-tight">{plan.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPlan(null)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-lg">✕</button>
                </div>

                <div className="px-8 py-6 space-y-8">

                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { icon: Hash, value: totalCourses, label: "كورس", color: "text-primary" },
                      { icon: Clock, value: totalHours > 0 ? `${totalHours}h` : "—", label: "ساعة", color: "text-blue-400" },
                      { icon: CalendarDays, value: totalMonths ? `${totalMonths}` : (plan.duration || "—"), label: "شهر", color: "text-emerald-400" },
                      { icon: BookOpen, value: weeklyHours, label: "ساعة/أسبوع", color: "text-amber-400" },
                    ].map(({ icon: Icon, value, label, color }, i) => (
                      <div key={i} className="bg-white/4 rounded-xl p-4 text-center border border-white/6">
                        <Icon className={cn("w-4 h-4 mx-auto mb-2 opacity-60", color)} />
                        <div className={cn("text-xl font-black", color)}>{value}</div>
                        <div className="text-white/30 text-[10px] font-medium mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 3 Level Milestones */}
                  <div className="space-y-4">
                    <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold">خارطة التعلم — 3 مستويات</h3>

                    {(planData?.milestones || []).slice(0, 3).map((milestone: any, i: number) => {
                      const lc = LEVEL_CONFIG[i] || LEVEL_CONFIG[2];
                      const levelCourses = (milestone.courses || []).filter((c: any) => !c.youtubeUrl);
                      const levelHours = levelCourses.reduce((s: number, c: any) => s + (c.totalHours || 0), 0);

                      return (
                        <div key={i} className={cn("rounded-2xl border p-6", lc.border, "bg-white/[0.02]")}>
                          {/* Level Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black shrink-0", lc.num)}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-bold text-sm">{lc.label}</span>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", lc.tag)}>{lc.sublabel}</span>
                                {levelHours > 0 && <span className="text-white/30 text-[10px]">{levelHours}h</span>}
                              </div>
                              <p className="text-white/30 text-xs mt-0.5">{lc.desc}</p>
                            </div>
                          </div>

                          {levelCourses.length === 0 ? (
                            <div className="flex items-center gap-2 text-white/20 text-xs py-3 border border-dashed border-white/8 rounded-lg px-4">
                              <Lock className="w-3 h-3" />
                              <span>لا توجد كورسات مرتبطة بهذا المستوى بعد</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {levelCourses.map((course: any, ci: number) => (
                                <Link key={course.id || ci} href={`/courses/${course.slug}`}>
                                  <div className="group flex items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/8 border border-white/6 hover:border-white/15 transition-all cursor-pointer">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                                      {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <BookOpen className="w-4 h-4 text-white/20" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-white text-xs font-semibold truncate group-hover:text-primary transition-colors">{course.title}</h5>
                                      <div className="flex items-center gap-3 mt-0.5">
                                        {course.totalHours > 0 && (
                                          <span className="text-white/30 text-[10px] flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />{course.totalHours}h
                                          </span>
                                        )}
                                        {course.startWeek && (
                                          <span className="text-primary/60 text-[10px] flex items-center gap-0.5 font-bold">
                                            <CalendarDays className="w-2.5 h-2.5" />أسبوع {course.startWeek}–{course.endWeek}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-primary/60 transition-colors" />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA */}
                  <Link href="/courses">
                    <Button className="w-full h-12 rounded-xl font-bold gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4" /> ابدأ الدراسة الآن
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
