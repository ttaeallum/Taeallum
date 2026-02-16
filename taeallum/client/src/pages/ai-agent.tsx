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

  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: instant ? "auto" : "smooth",
        block: "end"
      });
    }
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeLogs]);

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

  // Handle starting a new chat
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
      // Backend loads history from DB — just send the new message
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
          setTimeout(() => window.location.href = path, 2000); // Redirect after 2s
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
            <h2 className="text-4xl font-black mb-6">{isRtl ? "المساعد الذكي" : "Smart Assistant"}</h2>
            <p className="text-muted-foreground text-lg mb-10">
              {isRtl ? "هذه الميزة متاحة فقط للمشتركين في خطة المساعد الذكي." : "This feature is only available for Smart Assistant subscribers."}
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/ai-pricing">
                <Button size="lg" className="w-full text-xl font-black h-16 rounded-2xl">
                  {isRtl ? "اشترك الآن" : "Subscribe Now"}
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
      {showConfetti && <ConfettiCelebration onComplete={() => setShowConfetti(false)} />}
      <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
        <div className="container max-w-7xl mx-auto px-4 md:px-6 py-6 h-[100dvh] flex flex-col gap-4">

          {/* Top Integrated Bar */}
          <header className="flex items-center justify-between p-4 bg-card border border-border rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter whitespace-nowrap">{isRtl ? "المساعد الذكي" : "Smart Assistant"}</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground">{isRtl ? "جاهز لمساعدتك" : "Ready to help"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="rounded-xl gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground font-bold text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isRtl ? "محادثة جديدة" : "New Chat"}
              </Button>
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

          {/* Progress Stepper */}
          <div className="px-2">
            <ProgressStepper currentStep={currentStep} isRtl={isRtl} />
          </div>

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
                {/* Subtle Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse" />

                {/* Tactical Chat Flow Container */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-10 scrollbar-hide"
                >
                  <AnimatePresence>
                    {messages.map((msg, i) => {
                      const content = msg.content || "";
                      const suggestionMatch = content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                      const rawContent = content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();

                      // Remove emojis from the content for a cleaner look as requested
                      const cleanContent = rawContent.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                        >
                          <div className={`group relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] max-w-[95%] md:max-w-[80%] shadow-xl transition-all ${msg.role === "user"
                            ? "bg-primary text-primary-foreground font-bold rounded-tr-none"
                            : "bg-muted/80 border border-border/40 rounded-tl-none backdrop-blur-sm"
                            }`}>
                            <div className="text-sm md:text-base leading-relaxed">
                              <div className={msg.role === "assistant" ? "text-right font-medium" : "text-right"}>
                                {cleanContent}
                              </div>

                              {/* Render Suggestions with Tactical Design */}
                              {msg.role === "assistant" && suggestionMatch && (
                                <div className="mt-6 flex flex-wrap justify-end gap-2 md:gap-3">
                                  {suggestionMatch[1].split("|").map((suggestion, idx) => {
                                    const text = suggestion.trim().replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
                                    return (
                                      <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleSendMessage(suggestion.trim())}
                                        disabled={isLoading || i < messages.length - 1}
                                        className="px-4 py-2 md:px-6 md:py-3 rounded-xl bg-card border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-bold text-foreground/90 hover:text-primary shadow-sm active:scale-95"
                                      >
                                        {text}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Tool Feedback Loop */}
                            {msg.logs && msg.logs.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/20 flex flex-wrap gap-2 justify-end">
                                {msg.logs.map((log, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-background/40 rounded-lg border border-primary/10">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-tighter">{log}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-start"
                      >
                        <div className="p-4 rounded-[2rem] rounded-tl-none bg-muted border border-border/50 backdrop-blur-md shadow-lg">
                          <div className="flex items-center gap-1.5">
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                            {isRtl ? "المساعد الذكي يفكر..." : "Smart Assistant is thinking..."}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} className="h-2 w-full" />
                </div>

                {/* Command Input Area */}
                <div className="p-6 bg-card border-t border-border m-6 rounded-3xl shadow-2xl relative">
                  {(() => {
                    const lastMessage = messages[messages.length - 1];
                    const hasSuggestions = lastMessage?.role === "assistant" && lastMessage?.content?.includes("[SUGGESTIONS:");
                    const isInputLocked = hasSuggestions || isLoading;

                    return (
                      <>
                        <div className="relative flex items-end gap-3">
                          <div className="flex-1 relative">
                            <Textarea
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isInputLocked) { e.preventDefault(); handleSendMessage(); } }}
                              placeholder={
                                hasSuggestions
                                  ? (isRtl ? "اختر أحد الخيارات أعلاه للمتابعة..." : "Select an option above to continue...")
                                  : (isRtl ? "اكتب رسالتك هنا..." : "Type your message here...")
                              }
                              className={cn(
                                "min-h-[60px] max-h-[160px] bg-background border-border rounded-2xl resize-none pr-14 pl-6 py-4 text-sm font-medium placeholder:text-muted-foreground focus:border-primary/50 transition-all",
                                hasSuggestions && "opacity-50 cursor-not-allowed bg-muted"
                              )}
                              disabled={isInputLocked}
                            />
                            <div className="absolute left-3 bottom-4 text-primary opacity-30 animate-pulse">
                              {hasSuggestions ? <Lock className="w-4 h-4 text-amber-500" /> : <Activity className="w-4 h-4" />}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleSendMessage()}
                            disabled={!inputValue.trim() || isInputLocked}
                            size="icon"
                            className={cn(
                              "h-14 w-14 rounded-2xl shadow-2xl shadow-primary/30 transition-all",
                              !isInputLocked && "hover:scale-105"
                            )}
                          >
                            <Send className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
                          </Button>
                        </div>
                        <p className="text-center mt-3 text-[9px] text-muted-foreground">
                          {hasSuggestions
                            ? (isRtl ? "اختر أحد الخيارات للمتابعة" : "Select an option to continue")
                            : (isRtl ? "المساعد الذكي جاهز لمساعدتك" : "Smart Assistant ready to help")}
                        </p>
                      </>
                    );
                  })()}
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
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">{isRtl ? "نظام ذكي" : "Smart System"}</span>
                </div>
                <p className="text-[11px] text-foreground leading-relaxed font-bold">
                  {isRtl
                    ? "المساعد الذكي يصمم لك مساراً تعليمياً مخصصاً بناءً على اختياراتك."
                    : "The Smart Assistant designs a personalized learning path based on your choices."}
                </p>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

// --- Components for UX Improvements ---

function ProgressStepper({ currentStep, isRtl }: { currentStep: number, isRtl: boolean }) {
  const stepsAr = ["الاكتشاف", "النفسية", "الوقت", "المستوى", "المسار"];
  const stepsEn = ["Discovery", "Psychology", "Routine", "Level", "Path"];
  const steps = isRtl ? stepsAr : stepsEn;

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-2 relative px-4" dir={isRtl ? "rtl" : "ltr"}>
      {/* Connector Line */}
      <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-border -translate-y-1/2 z-0">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <motion.div
              animate={{
                scale: isActive ? 1.2 : 1,
                backgroundColor: isActive || isCompleted ? "var(--primary)" : "var(--card)",
                borderColor: isActive || isCompleted ? "var(--primary)" : "var(--border)"
              }}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-colors",
                isActive || isCompleted ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
              {isActive && (
                <motion.div
                  layoutId="step-glow"
                  className="absolute inset-0 rounded-full bg-primary/30 blur-md -z-10"
                />
              )}
            </motion.div>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest",
              isActive ? "text-primary" : "text-muted-foreground opacity-60"
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
    // Dynamically load canvas-confetti from CDN since npm install failed
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
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
        if (window.confetti) {
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
          // @ts-ignore
          window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }
      }, 250);

      return () => clearInterval(interval);
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onComplete]);

  return null;
}


