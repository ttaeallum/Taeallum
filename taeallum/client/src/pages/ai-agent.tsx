import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  LayoutDashboard,
  Trophy,
  BookOpen,
  Target,
  Zap,
  Fingerprint,
  Activity,
  Box,
  Brain,
  Search,
  CheckCircle2,
  Clock,
  History,
  ShieldCheck,
  Rocket,
  Settings,
  AlertTriangle,
  Cpu,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  logs?: string[];
}

export default function AIAgent() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeLogs]);

  useEffect(() => {
    if (!authLoading && user && messages.length === 0) {
      setMessages([{
        id: "init",
        role: "assistant",
        content: isRtl
          ? "أهلاً بك في منصة تعلم. 🦾 أنا العميل التنفيذي الخاص بك. قبل أن أرسم لك المسار، أريد التعرف عليك أكثر. ما هو مستواك الحالي في المجال الذي ترغب في تعلمه؟ وكم ساعة يمكنك تخصيصها يومياً؟"
          : "Welcome to Taeallum platform. 🦾 I am your Executive Agent. Before I design your path, I want to get to know you better. What is your current level in the field you want to learn? And how many hours can you dedicate daily?",
        timestamp: new Date()
      }]);
    }
  }, [authLoading, user, messages.length, isRtl]);

  const handleSendMessage = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || inputValue;
    if (!messageToSend.trim() || isLoading) return;

    const userMsgText = messageToSend.trim();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: userMsgText,
      timestamp: new Date()
    }]);
    setInputValue("");
    setIsLoading(true);
    setActiveLogs([isRtl ? "جاري تحليل المعطيات..." : "Analyzing data points..."]);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsgText }),
      });

      const data = await response.json();

      if (data.logs) {
        setActiveLogs(prev => [...prev, ...data.logs]);
      }

      if (data.reply.includes("[REDIRECT:")) {
        const match = data.reply.match(/\[REDIRECT:\s*(.*?)\]/);
        if (match) {
          const path = match[1];
          setTimeout(() => window.location.href = path, 2000); // Redirect after 2s
        }
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        logs: data.logs
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: isRtl ? "عذراً، فشل العميل في تنفيذ المهمة." : "Agent failed to execute mission.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = user?.isSubscribed || user?.role === "admin";
  if (!authLoading && !isSubscribed) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-10 text-center border-2 border-primary/20 shadow-2xl backdrop-blur-xl bg-background/80">
            <Cpu className="w-16 h-16 mx-auto mb-6 text-primary animate-pulse" />
            <h2 className="text-4xl font-black mb-6">{isRtl ? "العميل التنفيذي" : "Executive Agent"}</h2>
            <p className="text-muted-foreground text-lg mb-10">
              {isRtl ? "هذه التكنولوجيا التنفيذية متاحة فقط للمشتركين في خطة الـ Pro." : "This executive technology is only available for Pro subscribers."}
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/ai-pricing">
                <Button size="lg" className="w-full text-xl font-black h-16 rounded-2xl">
                  {isRtl ? "ترقية الصلاحيات الآن" : "Upgrade Status Now"}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
        <div className="container max-w-full px-4 md:px-6 py-6 h-screen flex flex-col gap-4">

          {/* Top Integrated Bar */}
          <header className="flex items-center justify-between p-4 bg-card border border-border rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase whitespace-nowrap">{isRtl ? "مركز العمليات التنفيذي" : "Executive Mission Control"}</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-mono text-muted-foreground">Agent Status: Active Pursuit</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
              <div className="hidden xl:flex items-center gap-4 border-l border-border pl-4">
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{isRtl ? "معدل الذكاء الحالي" : "IQ Load"}</p>
                  <p className="text-xs font-mono text-primary">GPT-4o MINI: ACTIVE</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{isRtl ? "نطاق العمل" : "Operational Range"}</p>
                  <p className="text-xs font-mono text-primary/80">Full Access</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold">{user?.fullName}</p>
                  <p className="text-[10px] text-primary uppercase font-black tracking-tighter">Pro Status</p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-primary/30 shadow-lg shadow-primary/10">
                  <AvatarFallback className="bg-muted text-muted-foreground font-bold">UA</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden relative">

            {/* Column 1: Tactical Stats & Missions */}
            <div className="lg:col-span-3 h-full flex flex-col gap-4 overflow-y-auto hidden lg:flex">
              <Card className="p-6 bg-card border-border rounded-3xl shadow-xl backdrop-blur-md">
                <h3 className="text-xs font-black mb-6 flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                  <Target className="w-4 h-4 text-primary" />
                  {isRtl ? "المهمة النشطة" : "Active Missions"}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                      <Rocket className="w-12 h-12" />
                    </div>
                    <p className="text-[10px] uppercase font-mono text-primary mb-1">Current Goal</p>
                    <p className="text-xs font-bold mb-2">{user?.preferences?.main_goal || (isRtl ? "لم يحدد بعد" : "Not Set")}</p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-primary" />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground lowercase">
                      <span>progress: 45%</span>
                      <span>mod: exec_active</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">{isRtl ? "التخصص المبرمج" : "Programmed Sector"}</p>
                    <div className="flex flex-wrap gap-2">
                      {user?.preferences?.interests?.map((interest: string) => (
                        <Badge key={interest} variant="outline" className="bg-background border-border text-foreground text-[10px]">{interest}</Badge>
                      )) || <span className="text-[10px] text-muted-foreground italic">None</span>}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border rounded-3xl flex-1 shadow-xl">
                <h3 className="text-xs font-black mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                  <History className="w-4 h-4 text-amber-500" />
                  {isRtl ? "سجل العمليات" : "Executive History"}
                </h3>
                <div className="space-y-4 h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {[
                    { act: isRtl ? "مسح الكورسات" : "Course Scan", time: "2m ago", status: "complete" },
                    { act: isRtl ? "تعديل المسار" : "Path Optimiz.", time: "1h ago", status: "complete" },
                    { act: isRtl ? "تحديث الأهداف" : "Goal Sync", time: "3h ago", status: "complete" }
                  ].map((act, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] text-foreground">{act.act}</span>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground">{act.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Column 2: Tactical Tactical Map (Agent Core) */}
            <div className="lg:col-span-6 h-full flex flex-col gap-4 relative">
              <Card className="flex-1 bg-card border-border rounded-[2.5rem] flex flex-col overflow-hidden relative shadow-2xl">
                {/* Background Tech HUD Details */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" />

                {/* Tactical HUD Overlay Elements */}
                <div className="absolute inset-x-0 top-0 p-6 pointer-events-none z-10 flex justify-between uppercase font-mono text-[9px] text-muted-foreground tracking-tighter">
                  <div className="flex flex-col gap-1">
                    <span>LAT: 40.7128 N</span>
                    <span>LNG: 74.0060 W</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <span>VER: EXEC_OS_1.0</span>
                    <span>CYC: 2.45 GHz</span>
                  </div>
                </div>

                {/* Central Executive Animation (When Idle/Loading) */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-md z-50 p-20"
                    >
                      <div className="relative w-full max-w-sm">
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse rounded-full" />
                        <div className="relative aspect-square border border-primary/20 rounded-full p-8 flex items-center justify-center bg-background/50 overflow-hidden">
                          <motion.div
                            animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border border-primary/10 border-dashed rounded-full"
                          />
                          <motion.div
                            animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-4 border border-sky-500/10 border-dashed rounded-full"
                          />
                          <div className="flex flex-col items-center gap-4 text-center">
                            <Cpu className="w-16 h-16 text-primary animate-pulse" />
                            <div>
                              <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">{isRtl ? "جاري المعالجة التنفيذية" : "Executive Processing"}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-1 italic">accessing platform_core_v4...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tactical Chat Flow Container */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                  <AnimatePresence>
                    {messages.map((msg, i) => {
                      const suggestionMatch = msg.content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                      const cleanContent = msg.content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();
                      const suggestions = suggestionMatch ? suggestionMatch[1].split("|").map(s => s.trim()) : [];

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                          <div className={`group relative p-6 rounded-[2rem] max-w-[90%] md:max-w-[75%] shadow-2xl ${msg.role === "user"
                            ? "bg-primary text-primary-foreground font-bold rounded-tr-none"
                            : "bg-muted border border-border/50 rounded-tl-none backdrop-blur-md"
                            }`}>
                            <div className="text-sm leading-relaxed">
                              {cleanContent}
                            </div>

                            {/* Suggestions UI */}
                            {msg.role === "assistant" && suggestions.length > 0 && i === messages.length - 1 && (
                              <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-border/30">
                                {suggestions.map((option, idx) => (
                                  <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSendMessage(option)}
                                    className="rounded-xl bg-background/50 border-primary/20 hover:bg-primary hover:text-primary-foreground text-[11px] font-bold h-9 transition-all"
                                  >
                                    <Sparkles className="w-3 h-3 mr-2" />
                                    {option}
                                  </Button>
                                ))}
                              </div>
                            )}

                            {/* Act Indicators (Tools) */}
                            {msg.logs && msg.logs.length > 0 && (
                              <div className="mt-6 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.logs.map((log, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-background/50 rounded-xl border border-primary/20">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-tighter truncate">{log}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-3 px-4">
                            <span className="text-[8px] text-muted-foreground font-mono uppercase tracking-widest">
                              SRC: {msg.role === "user" ? "COMMANDER" : "EXECUTIVE_AGENT"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-primary/20" />
                            <span className="text-[8px] text-muted-foreground font-mono">
                              {msg.timestamp.toLocaleTimeString([], { hour12: false })}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Command Input Area */}
                <div className="p-6 bg-card border-t border-border m-6 rounded-3xl shadow-2xl relative">
                  <div className="relative flex items-end gap-3">
                    <div className="flex-1 relative">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder={isRtl ? "أصدر أوامر تنفيذية للعميل..." : "Issue executive command to Agent..."}
                        className="min-h-[60px] max-h-[160px] bg-background border-border rounded-2xl resize-none pr-14 pl-6 py-4 text-sm font-medium placeholder:text-muted-foreground focus:border-primary/50"
                        disabled={isLoading}
                      />
                      <div className="absolute left-3 bottom-4 text-primary opacity-30 animate-pulse">
                        <Activity className="w-4 h-4" />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSendMessage()} disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="h-14 w-14 rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-105"
                    >
                      <Send className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-center mt-3 text-[9px] text-muted-foreground font-mono uppercase tracking-[0.2em]">{isRtl ? "وضع السيادة التنفيذية: نشط" : "Executive Sovereign Mode: Active"}</p>
                </div>
              </Card>
            </div>

            {/* Column 3: Live Brain Cycles (Logs) */}
            <div className="lg:col-span-3 h-full flex flex-col gap-4 overflow-hidden hidden lg:flex">
              <Card className="flex-1 bg-card/80 border border-border rounded-3xl p-6 flex flex-col shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                  <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2">
                    <Brain className="w-3 h-3 text-primary" />
                    {isRtl ? "دوارات المعالجة" : "Brain Cycles"}
                  </h3>
                  <div className="text-[10px] font-mono text-emerald-500 animate-pulse">ON_TASK</div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide">
                  <AnimatePresence>
                    {activeLogs.map((log, i) => (
                      <motion.div
                        key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="group flex gap-3 text-[10px] font-mono"
                      >
                        <span className="text-primary font-black">[{i + 1}]</span>
                        <div className="flex flex-col gap-1">
                          <span className="text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{log}</span>
                          <span className="text-[8px] text-muted-foreground font-mono">sys_cor: secure_node_${i * 123}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-primary italic font-mono text-[10px] pl-6 border-l border-primary/20"
                    >
                      {">"} {isRtl ? "جارٍ حل العقد المنطقية..." : "Resolving logic nodes..."}
                    </motion.div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-xl border border-border">
                      <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Stability</p>
                      <p className="text-[10px] font-mono text-emerald-400">99.98%</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-xl border border-border">
                      <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mb-1">Latency</p>
                      <p className="text-[10px] font-mono text-primary/80">~240ms</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform">
                  <Globe className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-3 h-3 text-primary animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "نظام السيادة" : "Sovereign System"}</span>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed font-bold">
                  {isRtl
                    ? "المساعد مفوض الآن لاتخاذ قرارات تسجيل استباقية بناءً على خوارزمية النجاح الخاصة بك."
                    : "The Agent is now authorized to make proactive enrollment decisions based on your path success curve."}
                </p>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

