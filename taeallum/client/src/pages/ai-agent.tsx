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
  ArrowDownCircle
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
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Dynamic Scroll Handling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (isAtBottom) scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
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
          ? "مرحباً بك في منصة تعلّم. أنا مساعدك البرمجي الذكي، سأقودك لاختيار مسارك في عالم البرمجة في 4 خطوات. لنبدأ بمجال البرمجة الذي يستهويك: [SUGGESTIONS: تطوير المواقع (Web) 🌐|تطوير التطبيقات (Mobile) 📱|البيانات والذكاء الاصطناعي 🤖|تطوير الألعاب (Games) 🎮|الأمن السيبراني (Cyber) 🔒]"
          : "Welcome to Taallm. I am your Programming Assistant, I will lead you to choose your path in the world of code in 4 steps. Let's start with the field you're interested in: [SUGGESTIONS: Web Development 🌐|Mobile Apps 📱|Data & AI 🤖|Game Development 🎮|Cyber Security 🔒]",
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
          ? "أهلاً بك مجدداً. لنبدأ من جديد بتحديد مسارك البرمجي. أي مجال تفضل؟ [SUGGESTIONS: تطوير المواقع (Web) 🌐|تطوير التطبيقات (Mobile) 📱|البيانات والذكاء الاصطناعي 🤖|تطوير الألعاب (Games) 🎮|الأمن السيبراني (Cyber) 🔒]"
          : "Welcome back. Let's start fresh by identifying your programming path. Which field do you prefer? [SUGGESTIONS: Web Development 🌐|Mobile Apps 📱|Data & AI 🤖|Game Development 🎮|Cyber Security 🔒]",
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
    setIsAtBottom(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Connection Error");
      }

      if (data.logs) setActiveLogs(prev => [...prev.slice(-5), ...data.logs]);

      const reply = data.reply || data.message || "";

      // Look for [REDIRECT: ...] in both current and final response
      const redirectMatch = reply.match(/\[REDIRECT:\s*(.*?)\]/);
      const isFinalRedirect = reply.includes("/tracks") || text.trim() === "ابدأ الآن";

      if (data.step) setCurrentStep(data.step);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        logs: data.logs
      }]);

      if (redirectMatch?.[1]) {
        setTimeout(() => setLocation(redirectMatch[1]), 2000);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: isRtl
          ? `⚠️ انقطاع تقني: ${error.message}. يرجى محاولة الإرسال مجدداً.`
          : `⚠️ Technical Interruption: ${error.message}. Please try sending again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  if (!isSubscribed) {
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

      {/* APP-LIKE FIXED VIEWPORT (No Page Scroll) */}
      <div className="fixed inset-x-0 top-16 bottom-0 bg-[#fafafa] dark:bg-[#050505] flex flex-col font-sans overflow-hidden z-[5]">

        <div className="flex-1 container max-w-6xl w-full mx-auto px-4 lg:px-6 py-4 flex gap-6 h-full min-h-0 overflow-hidden relative">



          {/* CHAT INTERFACE (INTERNAL SCROLL ONLY) */}
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
            <Card className="flex-1 bg-white dark:bg-[#0c0c0c] border border-white/20 dark:border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-3xl lg:rounded-[2.5rem] flex flex-col overflow-hidden relative backdrop-blur-3xl h-full">

              {/* Predictive Progress Header */}
              <div className="px-4 lg:px-8 pt-4 pb-2 border-b border-border/5 bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">{isRtl ? "مراحل بناء الخطة" : "Progress Pathway"}</span>
                  </div>
                  <span className="text-[11px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{isRtl ? `المرحلة ${currentStep} من 5` : `Step ${currentStep} of 5`}</span>
                </div>
                <div className="flex gap-2 h-1.5 w-full bg-muted/20 rounded-full overflow-hidden mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        "flex-1 transition-all duration-700 rounded-full",
                        currentStep >= s ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted/40"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between px-1">
                  {[
                    isRtl ? "قطاع" : "Sector",
                    isRtl ? "تخصص" : "Special",
                    isRtl ? "مستوى" : "Level",
                    isRtl ? "وقت" : "Time",
                    isRtl ? "خارطة" : "Plan"
                  ].map((label, idx) => (
                    <span key={idx} className={cn(
                      "text-[8px] font-black uppercase tracking-tighter transition-colors hidden sm:inline-block",
                      currentStep === idx + 1 ? "text-primary" : "text-muted-foreground/20"
                    )}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Intelligent Header */}
              <header className="px-6 lg:px-10 py-4 flex items-center justify-between border-b border-border/5 bg-white/50 dark:bg-black/20 shrink-0 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center rotate-3 shadow-xl overflow-hidden group">
                    <Bot className="w-5 h-5 text-white dark:text-black group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tighter">{isRtl ? "المساعد الذكي" : "Neural Assistant"}</h2>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[9px] font-mono text-muted-foreground uppercase opacity-40">Active_Node_4o_Mini</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-10 w-10 rounded-xl hover:bg-primary/5 text-muted-foreground">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </header>

              {/* MESSAGE STREAM (FIXED INTERNAL SCROLL) */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 lg:px-10 py-4 space-y-4 scrollbar-none relative"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const flexibleRegex = /\[(?:SUGGESTIONS:\s*)?([^\]]+)\]/i;
                    const suggestionMatch = msg.content.match(flexibleRegex);

                    // Filter out non-suggestion tags from content
                    let cleanContent = msg.content
                      .replace(/\[(?:SUGGESTIONS:\s*)?[^\]]+\]/gi, "")
                      .replace(/\[REDIRECT:[^\]]+\]/gi, "")
                      .replace(/\[SYSTEM_ACT:[^\]]+\]/gi, "")
                      .trim();

                    // If it's a redirection button, we handle it specifically
                    const suggestionsList = suggestionMatch?.[1]?.includes("|")
                      ? suggestionMatch[1].split("|")
                      : suggestionMatch?.[1] ? [suggestionMatch[1]] : [];

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn("flex flex-col gap-3 max-w-[92%] sm:max-w-[85%]", msg.role === "user" ? "self-start" : "self-end items-end")}
                      >
                        <div className={cn(
                          "p-4 md:p-5 lg:px-6 lg:py-4 rounded-2xl relative shadow-md group",
                          msg.role === "user"
                            ? "bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-tr-none"
                            : "bg-primary text-primary-foreground rounded-tl-none font-bold"
                        )}>
                          <div className="text-[13px] md:text-[15px] leading-snug break-words">
                            {cleanContent}
                          </div>

                          {msg.role === "assistant" && suggestionsList.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 justify-end">
                              {suggestionsList.map((suggestion, idx) => (
                                <motion.button
                                  key={idx}
                                  whileHover={{ y: -2, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => {
                                    if (suggestion.trim().includes("ابدأ الآن")) {
                                      setLocation("/tracks");
                                    } else {
                                      handleSendMessage(suggestion.trim());
                                    }
                                  }}
                                  disabled={isLoading || i < messages.length - 1}
                                  className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 transition-all text-[12px] font-bold shadow-sm hover:shadow-md border border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
                                >
                                  {suggestion.trim()}
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="px-5 flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary/30" />
                          <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.15em]">
                            {msg.role === "assistant" ? (isRtl ? "استجابة عصبية" : "Neural Response") : (isRtl ? "مدخلات الطالب" : "Student Input")}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="px-10 py-6 bg-muted/10 rounded-[3rem] flex items-center gap-6 animate-pulse">
                      <div className="flex gap-2">
                        {[1, 2, 3].map(d => <div key={d} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d * 0.1}s` }} />)}
                      </div>
                      <span className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Analyzing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Scroll Indicator */}
              <AnimatePresence>
                {!isAtBottom && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-40 left-1/2 -translate-x-1/2 z-50">
                    <Button onClick={() => scrollToBottom()} className="rounded-full shadow-2xl h-12 w-12 p-0 bg-white/80 dark:bg-zinc-800 text-foreground hover:bg-primary hover:text-white border-none backdrop-blur-md">
                      <ArrowDownCircle className="w-6 h-6" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INPUT AREA (FIXED AT BOTTOM) */}
              <footer className="px-4 md:px-10 py-4 border-t border-border/5 bg-white/80 dark:bg-black/40 backdrop-blur-xl shrink-0 z-20">
                <div className="max-w-4xl mx-auto w-full relative">
                  {currentStep === 5 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full"
                    >
                      <Button
                        onClick={() => setLocation("/tracks")}
                        className="w-full h-16 rounded-2xl text-lg font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.01]"
                      >
                        <Target className="w-6 h-6" />
                        {isRtl ? "ابدأ دراستك الآن" : "Start Your Journey Now"}
                      </Button>
                    </motion.div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(inputValue);
                      }}
                      className="relative group"
                    >
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isRtl ? "اختر من الخيارات أعلاه..." : "Pick from the options above..."}
                        disabled={isLoading}
                        className="w-full h-16 pl-6 pr-16 rounded-2xl bg-zinc-100/50 dark:bg-zinc-800/50 border border-border/10 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all font-bold text-base outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="absolute right-3 top-2.5 w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-0"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </form>
                  )}
                </div>
              </footer>
            </Card>
          </main>



        </div>
      </div>
      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
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
        const duration = 2 * 1000;
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
