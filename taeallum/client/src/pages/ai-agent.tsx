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
  History,
  RotateCcw,
  LayoutDashboard,
  Compass,
  Zap,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Globe,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
          ? "مرحباً بك في مستقبل التعليم. أنا مساعدك الذكي، مصمم خصيصاً لتحويل طموحاتك إلى مسار تعليمي ملموس. لنبدأ رحلتنا الاستكشافية: ما هو المجال الذي يثير فضولك وترغب في احترافه؟ [SUGGESTIONS: تطوير البرمجيات والأنظمة|الذكاء الاصطناعي وعلوم البيانات|التصميم وتجربة المستخدم|إدارة الأعمال الرقمية|اللغات والمهارات العالمية]"
          : "Welcome to the future of learning. I'm your Smart Assistant, dedicated to turning your ambitions into a tangible learning path. Let's begin: which field sparks your curiosity and makes you want to go pro? [SUGGESTIONS: Software & Systems Development|AI & Data Science|Design & UX|Digital Business Management|Languages & Global Skills]",
        timestamp: new Date()
      }]);
    }
    setSessionLoaded(true);
  }, [authLoading, sessionLoading, user, sessionData, sessionLoaded, isRtl]);

  const handleNewChat = async () => {
    try {
      await fetch("/api/chatbot/reset-session", { method: "POST", credentials: "include" });
      setMessages([{
        id: "init",
        role: "assistant",
        content: isRtl
          ? "أهلاً بك مجدداً. لنبدأ من جديد بتحديد شغفك. أي مجال تفضل؟ [SUGGESTIONS: البرمجة وتطوير الأنظمة|علم البيانات والذكاء الاصطناعي|التصميم الإبداعي|الأعمال والتجارة الرقمية|اللغات والمهارات الشخصية]"
          : "Welcome back. Let's start fresh by identifying your passion. Which field do you prefer? [SUGGESTIONS: Programming & Systems|Data Science & AI|Creative Design|Business & Digital Commerce|Languages & Soft Skills]",
        timestamp: new Date()
      }]);
      setActiveLogs([]);
      setCurrentStep(1);
      queryClient.invalidateQueries({ queryKey: ["chatbot-session"] });
    } catch (err) {
      console.error("Reset failed", err);
    }
  };

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

      const data = await response.json();
      if (data.logs) setActiveLogs(prev => [...prev, ...data.logs]);

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
        content: isRtl ? "عذراً، المساعد الذكي يواجه تقلبات في الاتصال حالياً. يرجى المحاولة بعد لحظات." : "Connection fluctuations detected. Please try again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!isSubscribed) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_70%)]" />
          <Card className="max-w-xl w-full p-12 text-center border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-card/40 backdrop-blur-3xl rounded-[3rem] relative z-10">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Cpu className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-black mb-6 tracking-tight">{isRtl ? "ذكاء اصطناعي حصري" : "Exclusive Intelligence"}</h2>
            <p className="text-muted-foreground text-lg mb-12 leading-relaxed px-4">
              {isRtl ? "هذه التجربة المتقدمة مصممة حصرياً للمشتركين لضمان أعلى جودة في تحليل المسارات الأكاديمية." : "This advanced experience is exclusively designed for subscribers to ensure the highest quality academic analysis."}
            </p>
            <Link href="/ai-pricing">
              <Button size="lg" className="w-full h-16 rounded-[1.2rem] text-lg font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {isRtl ? "ترقية الحساب الآن" : "Upgrade Account Now"}
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
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex flex-col pt-24 pb-8 overflow-hidden font-sans">

        <div className="container max-w-[1500px] w-full px-6 flex-1 flex flex-col gap-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full flex-1 min-h-0">

            {/* Sidebar : Navigation & Progress */}
            <aside className="lg:col-span-3 flex flex-col gap-6 hidden lg:flex h-full">
              <Card className="p-8 bg-white/80 dark:bg-zinc-900/50 border-none shadow-xl rounded-[2.5rem] backdrop-blur-3xl flex flex-col gap-10 flex-1 overflow-hidden">

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{isRtl ? "مراحل الهندسة" : "Engineering Steps"}</h3>
                  </div>

                  <div className="relative space-y-10">
                    <div className="absolute top-2 bottom-2 left-[15px] w-[2px] bg-muted/30" />
                    {[
                      { label: isRtl ? "اكتشاف الشغف" : "Passion Discovery", step: 1 },
                      { label: isRtl ? "تحليل النمط" : "Pattern Analysis", step: 2 },
                      { label: isRtl ? "جدولة الوقت" : "Time Scheduling", step: 3 },
                      { label: isRtl ? "مستوى الخبرة" : "Expertise Level", step: 4 },
                      { label: isRtl ? "توليد المسار" : "Path Generation", step: 5 },
                    ].map((s, idx) => {
                      const isActive = currentStep === s.step;
                      const isDone = currentStep > s.step;
                      return (
                        <div key={idx} className="flex items-center gap-6 relative z-10">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-700",
                            isDone ? "bg-primary text-white shadow-lg shadow-primary/20" :
                              isActive ? "bg-white dark:bg-zinc-800 border-2 border-primary text-primary" : "bg-muted/40 text-muted-foreground"
                          )}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                          </div>
                          <span className={cn(
                            "text-sm font-bold transition-all duration-500",
                            isActive ? "text-foreground scale-105" : "text-muted-foreground/40"
                          )}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-auto space-y-6 pt-10 border-t border-border/10">
                  <div className="bg-primary/5 p-6 rounded-[2rem]">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "المستهدف" : "Active Target"}</span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-foreground/90 italic">
                      "{user?.preferences?.main_goal || (isRtl ? "بانتظار تحديد هدفك..." : "Awaiting mission parameters...")}"
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user?.preferences?.interests?.map((interest: string) => (
                      <Badge key={interest} className="rounded-full bg-muted/60 text-muted-foreground hover:text-primary hover:bg-primary/5 border-none px-4 py-1.5 text-[9px] font-black transition-all">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </aside>

            {/* Main Intelligence Core */}
            <main className="lg:col-span-6 flex flex-col h-full min-h-0">
              <Card className="flex-1 bg-white/90 dark:bg-zinc-950/80 border-none shadow-2xl rounded-[3rem] flex flex-col overflow-hidden backdrop-blur-3xl relative h-full">

                {/* Glass Header */}
                <header className="px-8 py-6 flex items-center justify-between border-b border-border/5 bg-white/50 dark:bg-black/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-2xl flex items-center justify-center shadow-2xl rotate-3">
                      <Sparkles className="w-6 h-6 text-white dark:text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tighter">{isRtl ? "المساعد الذكي" : "Smart Assistant"}</h2>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-60">Neural Network Active</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleNewChat} className="rounded-2xl hover:bg-primary/5">
                    <RotateCcw className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </header>

                {/* Message Stream */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto px-6 md:px-12 py-10 space-y-10 scrollbar-none"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((msg, i) => {
                      const content = msg.content || "";
                      const suggestionMatch = content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                      const cleanContent = content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", duration: 0.8 }}
                          className={cn(
                            "flex flex-col gap-4",
                            msg.role === "user" ? "items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[85%] px-8 py-6 shadow-sm border border-border/5 transition-all duration-500 group",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground font-bold rounded-[2.5rem] rounded-tr-md shadow-xl shadow-primary/10"
                              : "bg-white dark:bg-zinc-900 text-foreground font-medium rounded-[2.5rem] rounded-tl-md shadow-xl shadow-black/5 dark:shadow-none"
                          )}>
                            <div className={cn(
                              "text-[15px] leading-relaxed",
                              isRtl ? "text-right" : "text-left"
                            )}>
                              {cleanContent}
                            </div>

                            {msg.role === "assistant" && suggestionMatch && (
                              <div className="mt-8 flex flex-wrap gap-3 justify-end">
                                {suggestionMatch[1].split("|").map((suggestion, idx) => (
                                  <motion.button
                                    key={idx}
                                    whileHover={{ y: -3, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSendMessage(suggestion.trim())}
                                    disabled={isLoading || i < messages.length - 1}
                                    className="px-6 py-3.5 rounded-2xl bg-primary/5 dark:bg-primary/20 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-xs font-black"
                                  >
                                    {suggestion.trim()}
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground/30 px-4">
                            {msg.role === "assistant" ? "Taeallum Engine" : "User Input"}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="px-6 py-4 bg-muted/20 rounded-3xl flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Console */}
                <div className="px-8 pb-10 pt-4 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent">
                  <div className="relative group max-w-2xl mx-auto">
                    <div className="absolute -inset-1 bg-primary/20 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-border/60 dark:border-white/10 rounded-[2.2rem] overflow-hidden shadow-2xl px-6 py-3 transition-all">
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
                        placeholder={isRtl ? "أخبرنا عن طموحاتك..." : "Tell us about your ambitions..."}
                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 resize-none min-h-[50px] max-h-[150px] text-base py-3 px-0 font-medium placeholder:text-muted-foreground/20"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                      >
                        <Send className={cn("w-6 h-6", isRtl && "rotate-180")} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </main>

            {/* Right Panel : Live Intelligence */}
            <aside className="lg:col-span-3 flex flex-col gap-6 hidden lg:flex h-full">
              <Card className="p-8 bg-white/80 dark:bg-zinc-900/50 border-none shadow-xl rounded-[2.5rem] backdrop-blur-3xl flex flex-col gap-10 flex-1 overflow-hidden">

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{isRtl ? "سجل التفكير" : "Live Brain Cycles"}</h3>
                    <Activity className="w-4 h-4 text-emerald-500 animate-[pulse_2s_infinite]" />
                  </div>

                  <div className="space-y-4">
                    {activeLogs.slice(-6).map((log, i) => (
                      <div key={i} className="flex gap-4 group animate-in fade-in slide-in-from-right-2 duration-500">
                        <div className="w-1 h-6 bg-primary/40 rounded-full group-hover:scale-y-125 transition-transform" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black font-mono text-muted-foreground/30">CORE_LOG_${i}</span>
                          <span className="text-[11px] font-bold text-foreground/70 leading-tight uppercase tracking-tight">{log}</span>
                        </div>
                      </div>
                    ))}
                    {activeLogs.length === 0 && (
                      <div className="text-center py-20 opacity-20">
                        <Globe className="w-10 h-10 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{isRtl ? "في انتظار البيانات" : "Awaiting Stream"}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto space-y-6">
                  <div className="p-6 bg-white dark:bg-zinc-800 rounded-[2rem] border border-border/40 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 group-hover:scale-[2] transition-transform duration-1000">
                      <ShieldCheck className="w-12 h-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <Settings className="w-3 h-3 text-primary animate-spin-slow" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "نظام آمن" : "Secure Node"}</span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">
                      {isRtl ? "تحليلك يتم بأعلى معايير الخصوصية والأمان باستخدام نماذج GPT-4o المتقدمة." : "Analysis processed under top privacy standards using GPT-4o global nodes."}
                    </p>
                  </div>

                  <Link href="/dashboard" className="block">
                    <Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-border/40 hover:bg-primary/5 hover:border-primary/20 text-xs font-black uppercase transition-all shadow-sm">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      {isRtl ? "لوحة القيادة" : "Dashboard"}
                    </Button>
                  </Link>
                </div>
              </Card>
            </aside>

          </div>
        </div>
      </div>
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-spin-slow { animation: spin 8s linear infinite; }
      `}</style>
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
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(function () {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) { clearInterval(interval); onComplete(); return; }
          const particleCount = 50 * (timeLeft / duration);
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
        return () => clearInterval(interval);
      }
    };
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, [onComplete]);
  return null;
}
