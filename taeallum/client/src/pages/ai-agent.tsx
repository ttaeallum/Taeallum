import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea for larger input
import { Input } from "@/components/ui/input"; // Add Input if we want single line, but Textarea is fine for full page
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
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAgent() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Greeting
  useEffect(() => {
    if (!authLoading && user && messages.length === 0) {
      // Check if user has active plan, if not basic greeting
      const initialMsg: Message = {
        id: "init",
        role: "assistant",
        content: "مرحباً بك! 👋 أنا مستشارك الأكاديمي الذكي. أنا هنا لمساعدتك في بناء مسار تعليمي مخصص أو الإجابة على استفساراتك. \n\nكيف يمكنني مساعدتك اليوم؟ (مثال: أريد أن أصبح مطور ويب Full Stack)",
        timestamp: new Date()
      };
      setMessages([initialMsg]);
    }
  }, [authLoading, user, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsgText = inputValue.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsgText }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const data = await response.json();

      // Check if plan was generated (The backend returns specific text if so, or we can check logic)
      // The backend returns the reply in `data.reply`

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };


  // --- Render Paywall if not subscribed ---
  const isSubscribed = user?.isSubscribed || user?.role === "admin";
  if (!authLoading && !isSubscribed) {
    // Reuse the Paywall UI from previous version
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <Card className="max-w-xl w-full p-10 text-center border-2 border-primary/20 shadow-2xl backdrop-blur-xl bg-background/80 relative overflow-hidden">
            <h2 className="text-4xl font-heading font-black mb-6">المساعد الذكي</h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              هذه الميزة حصرية للمشتركين. اشترك الآن واحصل على مساعد شخصي ذكي يبني لك مسارك التعليمي.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/ai-pricing">
                <Button size="lg" className="w-full text-xl font-black h-16 rounded-2xl shadow-xl shadow-primary/20">
                  اشترك الآن بـ 10$ فقط
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full font-bold">العودة للرئيسية</Button>
              </Link>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background/50 py-8 backdrop-blur-[2px]">
          <div className="container max-w-7xl px-4 md:px-8 h-[calc(100vh-100px)] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">المساعد الذكي</h1>
                <p className="text-sm text-muted-foreground">مستشارك الأكاديمي الشخصي</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>GPT-4o Connected</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">

              {/* Sidebar (Optional Info) */}
              <div className="hidden lg:flex flex-col gap-4 lg:col-span-1 h-full overflow-y-auto pr-2">
                <Card className="p-5 border-primary/20 bg-background/60 backdrop-blur-xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                    <Trophy className="w-5 h-5" />
                    مميزات المساعد
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Target className="w-4 h-4 text-primary" /></div>
                      <div>
                        <p className="font-bold">تحديد المسار</p>
                        <p className="text-xs text-muted-foreground">يبني لك خطة من الصفر</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><BookOpen className="w-4 h-4 text-primary" /></div>
                      <div>
                        <p className="font-bold">اقتراح كورسات</p>
                        <p className="text-xs text-muted-foreground">من مكتبتنا الضخمة</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Zap className="w-4 h-4 text-primary" /></div>
                      <div>
                        <p className="font-bold">إجابات فورية</p>
                        <p className="text-xs text-muted-foreground">على أي سؤال تقني</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3 h-full flex flex-col">
                <Card className="flex-1 flex flex-col border-primary/20 shadow-xl bg-background/60 backdrop-blur-3xl overflow-hidden rounded-[2rem]">

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-primary/10">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <Avatar className={`h-10 w-10 border-2 ${msg.role === 'assistant' ? 'border-primary/20 bg-primary/5' : 'border-background bg-secondary'}`}>
                            <AvatarFallback>
                              {msg.role === 'assistant' ? <Bot className="w-5 h-5 text-primary" /> : <User className="w-5 h-5" />}
                            </AvatarFallback>
                          </Avatar>

                          <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                            <div className={`px-5 py-3 rounded-2xl text-base leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/20"
                              : "bg-background border border-primary/10 rounded-tl-none shadow-sm"
                              }`}>
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-2 mt-1 block opacity-60">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <div className="flex gap-4">
                        <Avatar className="h-10 w-10 border-primary/20 bg-primary/5">
                          <AvatarFallback><Bot className="w-5 h-5 text-primary" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-background border border-primary/10 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">جارٍ الكتابة...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-background/80 border-t border-primary/10 backdrop-blur-md">
                    <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="اكتب رسالتك هنا..."
                        className="min-h-[60px] max-h-[150px] resize-none rounded-2xl border-primary/20 focus:border-primary/50 focus:ring-primary/10 pr-4 pl-14 py-4 scrollbar-hide shadow-inner bg-background/50"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                        className="absolute left-2 bottom-2 h-10 w-10 rounded-xl shadow-lg shadow-primary/20"
                      >
                        <Send className="w-4 h-4 rotate-180" />
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-[10px] text-muted-foreground opacity-50 uppercase tracking-widest">
                        AI Career Advisor v1.1.11
                      </p>
                    </div>
                  </div>

                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
