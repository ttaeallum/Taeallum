import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { cn } from "@/lib/utils";
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
  Target,
  Activity,
  Brain,
  CheckCircle2,
  RotateCcw,
  LayoutDashboard,
  Compass,
  Zap,
  ShieldCheck,
  Cpu,
  Fingerprint,
  Layers,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

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
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["chatbot-session"],
    queryFn: async () => {
      const res = await fetch("/api/chatbot/session", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id,
  });

  const scrollToBottom = (instant = false) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: instant ? "auto" : "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (authLoading || sessionLoading || !user || sessionLoaded) return;

    if (sessionData?.messages && sessionData.messages.length > 0) {
      setMessages(sessionData.messages.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
        logs: m.logs
      })));

      const lastAssistantMsg = [...sessionData.messages].reverse().find(m => m.role === "assistant");
      if (lastAssistantMsg) {
        if (lastAssistantMsg.content.includes("REDIRECT:")) setCurrentStep(5);
        else if (lastAssistantMsg.content.includes("الخلفية المعرفية")) setCurrentStep(4);
        else if (lastAssistantMsg.content.includes("تحليل الوقت")) setCurrentStep(3);
        else if (lastAssistantMsg.content.includes("التحليل النفسي")) setCurrentStep(2);
      }
    } else {
      setMessages([{
        id: "init",
        role: "assistant",
        content: isRtl
          ? "مرحباً بك في عصر التعلم الذكي. بصفتي مساعدك الخاص، سأقوم بتحليل مهاراتك ورسم مسار احترافي يناسب طموحاتك. لنبدأ بالخطوة الأولى: أي تخصص تعليمي ترغب في احترافه؟ [SUGGESTIONS: صناعة البرمجيات|الذكاء الاصطناعي|التصميم الإبداعي|ريادة الأعمال الرقمية|اللغات والمهارات العامة]"
          : "Welcome to the era of intelligent learning. As your specialized assistant, I will analyze your skills and draft a professional path tailored to your ambitions. Step one: Which educational discipline do you want to master? [SUGGESTIONS: Software Engineering|AI & Data|Creative Design|Digital Entrepreneurship|Languages & Skills]",
        timestamp: new Date()
      }]);
    }
    setSessionLoaded(true);
  }, [authLoading, sessionLoading, user, sessionData, sessionLoaded, isRtl]);

  const handleSendMessage = async (overrideMessage?: string) => {
    const text = overrideMessage || inputValue;
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date()
    }]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      if (!response.ok) throw new Error("Server Error");

      const data = await response.json();
      if (data.logs) setActiveLogs(prev => [...prev.slice(-4), ...data.logs]);

      const reply = data.reply || data.message || "";
      if (reply.includes("[REDIRECT:")) {
        const path = reply.match(/\[REDIRECT:\s*(.*?)\]/)?.[1];
        if (path) setTimeout(() => setLocation(path), 1500);
      }

      if (data.step) {
        setCurrentStep(data.step);
        if (data.step === 5) setShowConfetti(true);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        logs: data.logs
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: isRtl ? "عذراً، المساعد الذكي يواجه تقلبات في الاتصال. يرجى المحاولة بعد قليل." : "Smart Assistant detected erratic connection. Please retry in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  if (!isSubscribed && !authLoading) {
    return (
      <Layout>
        <div className="h-[90vh] flex items-center justify-center bg-[#fafafa] dark:bg-[#050505]">
          <Card className="max-w-xl w-full p-16 border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] bg-white dark:bg-zinc-900 rounded-[3rem] text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-10">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-black mb-6 tracking-tight">{isRtl ? "نظام الذكاء الحصري" : "Exclusive Intelligence"}</h2>
            <p className="text-muted-foreground mb-12 leading-relaxed">
              {isRtl ? "يتطلب الوصول إلى المساعد المختص اشتراكاً فعالاً لضمان توفير أعلى قدرة حوسبية لتحليل مسارك." : "Accessing the specialized assistant requires an active subscription to ensure maximum computing power for your analysis."}
            </p>
            <Link href="/ai-pricing">
              <Button size="lg" className="h-16 px-12 rounded-2xl text-md font-bold shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all">
                {isRtl ? "تفعيل الاشتراك" : "Activate Subscription"}
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showConfetti && <ConfettiCelebration onComplete={() => setShowConfetti(false)} />}
      <div className="h-[calc(100dvh-64px)] bg-[#fcfcfc] dark:bg-[#080808] flex flex-col font-sans overflow-hidden">

        {/* Main Application Container */}
        <div className="flex-1 container max-w-[1600px] w-full mx-auto px-6 py-4 flex gap-6 min-h-0">

          {/* Tactical Left Panel : Progress & Core */}
          <aside className="hidden xl:flex flex-col w-[350px] gap-6 h-full">
            <Card className="flex-1 bg-white dark:bg-zinc-900/50 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[2.5rem] p-8 flex flex-col overflow-hidden backdrop-blur-xl border border-white/40 dark:border-white/5">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{isRtl ? "معدل الإنجاز" : "Core Progress"}</h3>
              </div>

              <div className="space-y-12 relative flex-1">
                <div className="absolute top-2 bottom-2 left-[19px] w-[1px] bg-muted/30" />
                {[
                  { label: isRtl ? "تحديد الشغف" : "Passion Analysis", step: 1 },
                  { label: isRtl ? "بروفايل التعلم" : "Learning Profile", step: 2 },
                  { label: isRtl ? "المخطط الزمني" : "Time Mapping", step: 3 },
                  { label: isRtl ? "تقييم المستوى" : "Skill Assessment", step: 4 },
                  { label: isRtl ? "إطلاق المسار" : "Path Execution", step: 5 },
                ].map((s, idx) => {
                  const isActive = currentStep === s.step;
                  const isDone = currentStep > s.step;
                  return (
                    <div key={idx} className="flex items-center gap-6 relative z-10 group cursor-default">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-700",
                        isDone ? "bg-primary text-white shadow-lg shadow-primary/20 rotate-12" :
                          isActive ? "bg-white dark:bg-zinc-800 border-2 border-primary text-primary scale-110" : "bg-muted/40 text-muted-foreground/40"
                      )}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : s.step}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-[13px] font-bold transition-all duration-500",
                          isActive ? "text-foreground" : isDone ? "text-foreground/60" : "text-muted-foreground/30"
                        )}>{s.label}</span>
                        {isActive && <span className="text-[9px] text-primary/60 font-black uppercase">{isRtl ? "جاري المعالجة" : "In Progress"}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto pt-8 border-t border-border/10 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{isRtl ? "الهدف النشط" : "Live Mission"}</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <p className="text-sm font-bold text-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                  {user?.preferences?.main_goal || (isRtl ? "لم يتم تحديد الهدف بعد" : "No active mission set")}
                </p>
              </div>
            </Card>
          </aside>

          {/* Central Neural Interface (Chat Container) */}
          <main className="flex-1 flex flex-col min-w-0 h-full">
            <Card className="flex-1 bg-white/60 dark:bg-zinc-950/40 border-none shadow-[0_30px_90px_-20px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.5)] rounded-[3.5rem] flex flex-col overflow-hidden backdrop-blur-[40px] border border-white/20 dark:border-white/5 relative h-full">

              {/* Intelligent Title Bar */}
              <header className="px-10 py-6 flex items-center justify-between border-b border-white/10 dark:border-zinc-800/20 bg-white/40 dark:bg-black/10">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-14 h-14 bg-zinc-900 dark:bg-white rounded-[1.2rem] flex items-center justify-center shadow-2xl group transition-transform hover:rotate-6">
                      <Bot className="w-7 h-7 text-white dark:text-black" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white dark:border-[#111]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{isRtl ? "المساعد المختص" : "Specialized Assistant"}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-60 tracking-tighter">Core Build 0.9.1 / Neural 4o</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={handleNewChat} className="rounded-2xl hover:bg-primary/5 text-muted-foreground w-12 h-12">
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>
              </header>

              {/* Secure Chat Stream */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 lg:px-14 py-10 space-y-12 scroll-smooth scrollbar-thin scrollbar-thumb-muted"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const content = msg.content || "";
                    const suggestionMatch = content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                    const cleanContent = content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex flex-col gap-3",
                          msg.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "relative px-8 py-6 shadow-sm border border-border/5 transition-all duration-500 group",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground font-extrabold rounded-[2.8rem] rounded-tr-md shadow-xl shadow-primary/10"
                            : "bg-white dark:bg-zinc-900 border border-border/40 text-foreground font-semibold rounded-[2.8rem] rounded-tl-md shadow-2xl shadow-black/5 dark:shadow-none"
                        )}>
                          <div className={cn(
                            "text-[16px] leading-[1.7]",
                            isRtl ? "text-right" : "text-left"
                          )}>
                            {cleanContent}
                          </div>

                          {msg.role === "assistant" && suggestionMatch && (
                            <div className="mt-10 flex flex-wrap gap-3 justify-end">
                              {suggestionMatch[1].split("|").map((suggestion, idx) => (
                                <motion.button
                                  key={idx}
                                  whileHover={{ y: -4, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleSendMessage(suggestion.trim())}
                                  disabled={isLoading || i < messages.length - 1}
                                  className="px-6 py-4 rounded-[1.2rem] bg-primary/5 dark:bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-xs font-black shadow-lg shadow-black/5"
                                >
                                  {suggestion.trim()}
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 px-6">
                          <span className="text-[9px] font-black uppercase text-muted-foreground/20 italic tracking-[0.1em]">
                            {msg.role === "assistant" ? "Neural Reply" : "Authenticated Voice"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isLoading && (
                  <div className="flex justify-start pl-4">
                    <div className="px-8 py-5 bg-muted/20 rounded-[2.5rem] flex items-center gap-4 transition-all animate-pulse">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map(d => (
                          <div key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Analyzing Stream...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Neural Input Console */}
              <div className="px-10 pb-12 pt-4">
                <div className="relative group max-w-4xl mx-auto">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-[3rem] blur opacity-40 group-focus-within:opacity-100 transition duration-1000" />
                  <div className="relative flex items-center bg-white/95 dark:bg-zinc-900 border border-border/60 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl px-8 py-4 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <Textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={isRtl ? "اهمس بأهدافك للمساعد..." : "Dictate your goals to the neural network..."}
                      className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 resize-none min-h-[50px] max-h-[160px] text-lg py-3 px-0 font-medium placeholder:text-muted-foreground/20"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="h-16 w-16 rounded-full shadow-[0_15px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-110 active:scale-95 transition-all duration-300 flex-shrink-0"
                    >
                      <Send className={cn("w-7 h-7", isRtl && "rotate-180")} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </main>

          {/* Tactical Right Panel : Status & Security */}
          <aside className="hidden 2xl:flex flex-col w-[350px] gap-6 h-full">
            <Card className="flex-1 bg-white dark:bg-zinc-900/50 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-[2.5rem] p-8 flex flex-col gap-10 overflow-hidden backdrop-blur-xl border border-white/40 dark:border-white/5">

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{isRtl ? "سجل التفكير" : "Brain Cycles"}</h3>
                  <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                </div>

                <div className="space-y-6">
                  {activeLogs.slice(-6).map((log, i) => (
                    <div key={i} className="flex gap-4 group animate-in fade-in slide-in-from-right-2 duration-500">
                      <div className="w-[1px] h-10 bg-primary/20 group-hover:bg-primary transition-colors" />
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-mono text-muted-foreground/30 opacity-60 uppercase mb-1">NODE_SEC_0{i}</span>
                        <span className="text-[12px] font-black text-foreground/70 uppercase tracking-tighter leading-none">{log}</span>
                      </div>
                    </div>
                  ))}
                  {activeLogs.length === 0 && (
                    <div className="text-center py-20 opacity-10">
                      <Fingerprint className="w-14 h-14 mx-auto mb-6" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">{isRtl ? "بانتظار المدخلات" : "Awaiting Input"}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 shadow-inner">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "نطاق الحماية" : "Secure Node"}</span>
                  </div>
                  <p className="text-[11px] font-bold text-muted-foreground/80 leading-relaxed italic">
                    {isRtl ? "تم تأمين الجلسة وتشفير البيانات بمعايير AES-256 لضمان خصوصيتك الكاملة." : "Session secured with AES-256 standards ensuring your ultimate learning privacy."}
                  </p>
                </div>

                <Link href="/dashboard" className="block">
                  <Button variant="ghost" className="w-full h-16 rounded-[1.5rem] hover:bg-primary/5 text-xs font-black uppercase tracking-widest transition-all">
                    <LayoutDashboard className="w-5 h-5 mr-3" />
                    {isRtl ? "لوحة القيادة" : "Dashboard"}
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .scrollbar-thin::-webkit-scrollbar { width: 5px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 20px; }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}} />
    </Layout>
  );
}

function ConfettiCelebration({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      // @ts-ignore
      if (window.confetti) {
        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 9999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) { clearInterval(interval); onComplete(); return; }
          const particleCount = 60 * (timeLeft / duration);
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 200);
        return () => clearInterval(interval);
      }
    };
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [onComplete]);
  return null;
}
