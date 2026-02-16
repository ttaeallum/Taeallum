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
  Globe,
  Lock,
  RotateCcw
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

  const { data: user, isLoading: authLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Load existing session from database
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
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeLogs, isLoading]);

  // Load messages from DB session or show welcome
  useEffect(() => {
    if (authLoading || sessionLoading || !user || sessionLoaded) return;

    if (sessionData?.messages && sessionData.messages.length > 0) {
      // Restore messages from database
      setMessages(sessionData.messages.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.timestamp),
        logs: m.logs
      })));

      // Attempt to derive current step from last assistant message
      const lastAssistantMsg = [...sessionData.messages].reverse().find(m => m.role === "assistant");
      if (lastAssistantMsg) {
        if (lastAssistantMsg.content.includes("REDIRECT:")) setCurrentStep(5);
        else if (lastAssistantMsg.content.includes("الخلفية المعرفية")) setCurrentStep(4);
        else if (lastAssistantMsg.content.includes("تحليل الوقت")) setCurrentStep(3);
        else if (lastAssistantMsg.content.includes("التحليل النفسي")) setCurrentStep(2);
      }
    } else {
      // No existing session — show welcome message
      setMessages([{
        id: "init",
        role: "assistant",
        content: isRtl
          ? "أهلاً بك في منصة تعلّم. أنا مساعدك الذكي. لنبدأ معاً، أي من هذه المجالات يثير اهتمامك؟ [SUGGESTIONS: البرمجة والأنظمة|البيانات والذكاء الاصطناعي|الإبداع والتصميم|الأعمال والتجارة الرقمية|اللغات والمهارات العامة]"
          : "Welcome to Taeallum. I'm your Smart Assistant. Let's start together, which of these fields interests you? [SUGGESTIONS: Programming & Systems|Data & AI|Design & Creativity|Business & Digital Commerce|Languages & General Skills]",
        timestamp: new Date()
      }]);
    }
    setSessionLoaded(true);
  }, [authLoading, sessionLoading, user, sessionData, sessionLoaded, isRtl]);

  const handleNewChat = async () => {
    try {
      await fetch("/api/chatbot/reset-session", {
        method: "POST",
        credentials: "include"
      });
      setMessages([{
        id: "init",
        role: "assistant",
        content: isRtl
          ? "أهلاً بك في منصة تعلّم. أنا مساعدك الذكي. لنبدأ معاً، أي من هذه المجالات يثير اهتمامك؟ [SUGGESTIONS: البرمجة والأنظمة|البيانات والذكاء الاصطناعي|الإبداع والتصميم|الأعمال والتجارة الرقمية|اللغات والمهارات العامة]"
          : "Welcome to Taeallum. I'm your Smart Assistant. Let's start together, which of these fields interests you? [SUGGESTIONS: Programming & Systems|Data & AI|Design & Creativity|Business & Digital Commerce|Languages & General Skills]",
        timestamp: new Date()
      }]);
      setActiveLogs([]);
      setCurrentStep(1);
      queryClient.invalidateQueries({ queryKey: ["chatbot-session"] });
    } catch (err) {
      console.error("Failed to reset session", err);
    }
  };

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

      const botReply = data.reply || data.message || "";

      if (botReply.includes("[REDIRECT:")) {
        const match = botReply.match(/\[REDIRECT:\s*(.*?)\]/);
        if (match) {
          const path = match[1];
          setTimeout(() => setLocation(path), 1500); // Redirect via SPA router after 1.5s
        }
      }

      if (data.step) {
        setCurrentStep(data.step);
        if (data.step === 5) setShowConfetti(true);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botReply,
        timestamp: new Date(),
        logs: data.logs
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: isRtl ? "عذراً، حدث خطأ في معالجة طلبك." : "Sorry, an error occurred while processing your request.",
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-xl w-full p-12 text-center border-none shadow-2xl bg-card/50 backdrop-blur-2xl rounded-[3rem]">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-bold mb-6 tracking-tight">{isRtl ? "المساعد الذكي" : "Smart Assistant"}</h2>
            <p className="text-muted-foreground text-lg mb-12 leading-relaxed">
              {isRtl ? "ابدأ رحلتك التعليمية المخصصة اليوم مع المساعد الذكي المدعوم بالذكاء الاصطناعي." : "Start your personalized learning journey today with our AI-powered Smart Assistant."}
            </p>
            <Link href="/ai-pricing">
              <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                {isRtl ? "اشترك الآن للمتابعة" : "Subscribe to Continue"}
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
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col pt-20">
        <div className="container max-w-6xl mx-auto px-4 flex-1 flex flex-col pb-8">

          {/* Main Interface */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full max-h-[85vh]">

            {/* Sidebar: Mission & Progress */}
            <aside className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto hidden lg:flex py-4">
              <Card className="p-6 bg-card/40 border-none shadow-sm rounded-[2rem] backdrop-blur-md">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm">{isRtl ? "هدفك الحالي" : "Current Goal"}</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium mb-3 text-foreground/80">
                      {user?.preferences?.main_goal || (isRtl ? "بانتظار تحديد هدفك..." : "Waiting for your goal...")}
                    </p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / 5) * 100}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 text-right">
                      {isRtl ? `المرحلة ${currentStep} من 5` : `Step ${currentStep} of 5`}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3">{isRtl ? "الاهتمامات" : "Interests"}</p>
                    <div className="flex flex-wrap gap-2">
                      {user?.preferences?.interests?.map((interest: string) => (
                        <Badge key={interest} variant="secondary" className="rounded-lg bg-primary/5 text-primary border-none px-3 py-1 text-[10px]">{interest}</Badge>
                      )) || <span className="text-[10px] text-muted-foreground italic">...</span>}
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mt-auto">
                <Button
                  variant="ghost"
                  onClick={() => setShowLogs(!showLogs)}
                  className="w-full justify-between text-muted-foreground hover:text-primary rounded-xl"
                >
                  <span className="text-xs font-bold">{isRtl ? "عرض حالة النظام" : "System Status"}</span>
                  {showLogs ? <Lock className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                </Button>

                <AnimatePresence>
                  {showLogs && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 p-4 bg-muted/30 rounded-2xl overflow-hidden"
                    >
                      <div className="space-y-2">
                        {activeLogs.slice(-3).map((log, i) => (
                          <div key={i} className="flex gap-2 text-[9px] font-mono text-muted-foreground">
                            <span className="text-primary">•</span>
                            <span className="truncate">{log}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </aside>

            {/* Main Chat Center */}
            <main className="lg:col-span-9 flex flex-col h-full overflow-hidden">
              <Card className="flex-1 bg-card/30 border-none shadow-2xl rounded-[3rem] flex flex-col overflow-hidden backdrop-blur-xl relative">

                {/* Clean Stepper Integrated */}
                <div className="pt-8 pb-4 border-b border-border/10 bg-gradient-to-b from-card/50 to-transparent">
                  <ProgressStepper currentStep={currentStep} isRtl={isRtl} />
                </div>

                {/* Chat Flow */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth"
                >
                  <AnimatePresence>
                    {messages.map((msg, i) => {
                      const content = msg.content || "";
                      const suggestionMatch = content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                      const rawContent = content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();
                      const cleanContent = rawContent.replace(/[\u1F600-\u1F64F\u1F300-\u1F5FF\u1F680-\u1F6FF\u2600-\u26FF\u2700-\u27BF]/g, '').trim();

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[85%] md:max-w-[75%] px-6 py-4 rounded-[2rem] shadow-sm ${msg.role === "user"
                            ? "bg-primary text-primary-foreground font-semibold rounded-tr-sm"
                            : "bg-background/80 border border-border/30 rounded-tl-sm backdrop-blur-md"
                            }`}>
                            <div className={`text-sm md:text-base leading-relaxed ${isRtl ? "text-right" : "text-left"}`}>
                              {cleanContent}
                            </div>

                            {msg.role === "assistant" && suggestionMatch && (
                              <div className="mt-8 flex flex-wrap gap-2 justify-end">
                                {suggestionMatch[1].split("|").map((suggestion, idx) => (
                                  <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSendMessage(suggestion.trim())}
                                    disabled={isLoading || i < messages.length - 1}
                                    className="px-5 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-xs font-bold"
                                  >
                                    {suggestion.trim()}
                                  </motion.button>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="px-6 py-4 rounded-[2rem] rounded-tl-sm bg-background/50 border border-border/20 backdrop-blur-sm">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Minimal Input Bar */}
                <div className="p-6 md:p-8 bg-gradient-to-t from-card/80 via-card/50 to-transparent">
                  <div className="relative group max-w-4xl mx-auto">
                    <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-focus-within:bg-primary/10 transition-colors" />
                    <div className="relative flex items-center bg-background/80 border border-border/50 rounded-3xl overflow-hidden shadow-lg focus-within:border-primary/50 transition-all px-4 py-2">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={isRtl ? "تحدث مع مساعدك الذكي..." : "Talk to your smart assistant..."}
                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 resize-none min-h-[44px] max-h-[120px] text-sm py-3"
                        disabled={isLoading}
                      />
                      <div className="flex items-center gap-2 pl-2 border-l border-border/30 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNewChat}
                          className="text-muted-foreground hover:text-primary"
                          title={isRtl ? "محادثة جديدة" : "New Chat"}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleSendMessage()}
                          disabled={!inputValue.trim() || isLoading}
                          size="icon"
                          className="h-10 w-10 rounded-2xl shadow-lg"
                        >
                          <Send className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// --- Simplified UI Components ---

function ProgressStepper({ currentStep, isRtl }: { currentStep: number, isRtl: boolean }) {
  const stepsAr = ["اكتشاف الشغف", "النمط النفسي", "إدارة الوقت", "تحديد المستوى", "إطلاق المسار"];
  const stepsEn = ["Discovery", "Psychology", "Routine", "Level", "Launch"];
  const steps = isRtl ? stepsAr : stepsEn;

  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto px-4" dir={isRtl ? "rtl" : "ltr"}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} className="flex flex-col items-center flex-1 relative">
            {/* Connector */}
            {i < steps.length - 1 && (
              <div className={`absolute top-4 ${isRtl ? '-left-1/2' : '-right-1/2'} w-full h-0.5 ${isCompleted ? "bg-primary" : "bg-muted"
                } -z-0 translate-y-[-50%]`} />
            )}

            <motion.div
              animate={{
                scale: isActive ? 1.1 : 1,
                backgroundColor: isActive || isCompleted ? "var(--primary)" : "var(--card)",
                borderColor: isActive || isCompleted ? "var(--primary)" : "var(--border)"
              }}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 transition-all",
                isActive || isCompleted ? "text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground"
              )}
            >
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
            </motion.div>

            <span className={cn(
              "text-[10px] whitespace-nowrap mt-3 font-semibold tracking-tight transition-colors",
              isActive ? "text-primary" : "text-muted-foreground opacity-50"
            )}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
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

          if (timeLeft <= 0) {
            clearInterval(interval);
            onComplete();
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);

        return () => clearInterval(interval);
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onComplete]);

  return null;
}


