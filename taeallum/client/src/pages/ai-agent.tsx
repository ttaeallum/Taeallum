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
          ? "مرحباً بك في عصر التعلم الذكي. بصفتي مساعدك الخاص، سأقوم بتحليل مهاراتك ورسم مسار احترافي يناسب طموحاتك. لنبدأ بالخطوة الأولى: أي تخصص تعليمي ترغب في احترافه؟ [SUGGESTIONS: صناعة البرمجيات|الذكاء الاصطناعي|التصميم الإبداعي|ريادة الأعمال الرقمية|اللغات والمهارات العامة]"
          : "Welcome to the era of intelligent learning. As your specialized assistant, I will analyze your skills and draft a professional path tailored to your ambitions. Step one: Which educational discipline do you want to master? [SUGGESTIONS: Software Engineering|AI & Data|Creative Design|Digital Entrepreneurship|Languages & Skills]",
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
      if (reply.includes("[REDIRECT:")) {
        const path = reply.match(/\[REDIRECT:\s*(.*?)\]/)?.[1];
        if (path) setTimeout(() => setLocation(path), 1500);
      }

      if (data.step) setCurrentStep(data.step);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
        logs: data.logs
      }]);
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

        <div className="flex-1 container max-w-[1700px] w-full mx-auto px-4 lg:px-10 py-4 flex gap-6 h-full min-h-0 overflow-hidden relative">



          {/* CHAT INTERFACE (INTERNAL SCROLL ONLY) */}
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
            <Card className="flex-1 bg-white dark:bg-[#0c0c0c] border border-white/20 dark:border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3.5rem] flex flex-col overflow-hidden relative backdrop-blur-3xl h-full">

              {/* Intelligent Header */}
              <header className="px-12 py-8 flex items-center justify-between border-b border-border/5 bg-white/20 dark:bg-black/20 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-zinc-900 dark:bg-white rounded-[1.5rem] flex items-center justify-center rotate-3 shadow-2xl overflow-hidden group">
                    <Bot className="w-8 h-8 text-white dark:text-black group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter">{isRtl ? "المساعد الذكي" : "Neural Assistant"}</h2>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-40">System Node: Secure_4o_Mini</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleNewChat} className="h-14 w-14 rounded-3xl hover:bg-primary/5 text-muted-foreground">
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </header>

              {/* MESSAGE STREAM (FIXED INTERNAL SCROLL) */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-6 lg:px-20 py-12 space-y-12 scrollbar-none relative"
              >
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => {
                    const isRaw = msg.content.includes("[SUGGESTIONS:");
                    const suggestionMatch = msg.content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                    const cleanContent = msg.content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn("flex flex-col gap-4", msg.role === "user" ? "items-end" : "items-start")}
                      >
                        <div className={cn(
                          "relative px-10 py-7 shadow-sm transition-all duration-500",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground font-black rounded-[3rem] rounded-tr-md shadow-2xl shadow-primary/10"
                            : "bg-white dark:bg-zinc-900/80 border border-border/40 text-foreground font-bold rounded-[3.5rem] rounded-tl-md shadow-3xl shadow-black/5 dark:shadow-none"
                        )}>
                          <div className={cn("text-[17px] leading-[1.7]", isRtl ? "text-right" : "text-left")}>
                            {cleanContent}
                          </div>

                          {msg.role === "assistant" && suggestionMatch && (
                            <div className="mt-12 flex flex-wrap gap-4 justify-end">
                              {suggestionMatch[1].split("|").map((suggestion, idx) => (
                                <motion.button
                                  key={idx}
                                  whileHover={{ y: -5, scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSendMessage(suggestion.trim())}
                                  disabled={isLoading || i < messages.length - 1}
                                  className="px-8 py-4 rounded-[1.5rem] bg-primary/10 dark:bg-primary/20 border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all text-[13px] font-black shadow-xl"
                                >
                                  {suggestion.trim()}
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="px-8">
                          <span className="text-[10px] font-black uppercase text-muted-foreground/30 tracking-[0.2em] italic">
                            {msg.role === "assistant" ? "Neural Reply" : "Authenticated Input"}
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

              {/* PROMPT CONSOLE (FIXED AT BOTTOM) */}
              <div className="p-10 lg:p-14 bg-gradient-to-t from-white dark:from-black to-transparent shrink-0">
                <div className="relative group max-w-4xl mx-auto">
                  <div className="absolute -inset-2 bg-primary/20 rounded-[3rem] blur-xl opacity-20 group-focus-within:opacity-100 transition duration-700" />
                  <div className="relative flex items-center bg-white/95 dark:bg-zinc-900 border border-border/80 dark:border-white/10 rounded-[2.5rem] lg:rounded-[3.2rem] overflow-hidden shadow-2xl px-8 lg:px-12 py-4 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
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
                      placeholder={isRtl ? "اهمس بأهدافك للمساعد..." : "Dictate your goals to the assistant..."}
                      className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 resize-none min-h-[50px] max-h-[160px] text-xl py-4 px-0 font-medium placeholder:text-muted-foreground/10"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      size="icon"
                      className="h-16 w-16 lg:h-20 lg:w-20 rounded-full shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                    >
                      <Send className={cn("w-7 h-7 lg:w-10 lg:h-10", isRtl && "rotate-180")} />
                    </Button>
                  </div>
                </div>
              </div>
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
