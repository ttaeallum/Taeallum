import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AIChatbot() {
    const [location] = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "أهلاً بك في منصة تعلم. 🦾 أنا العميل التنفيذي الخاص بك. قبل أن أرسم لك المسار التعليمي، أخبرني: ما هو مستواك الحالي؟ وكم ساعة تستطيع تخصيصها يومياً للتعلم؟" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (instant = false) => {
        // 1. Instant surgical scroll for the container
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }

        // 2. Smooth scroll to the end element
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: instant ? "auto" : "smooth",
                block: "end"
            });
        }

        // 3. Robust fallback for dynamic content
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
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (overrideMessage?: string) => {
        const messageToSend = overrideMessage || input;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage = messageToSend.trim();
        const newMessages = [...messages, { role: "user" as const, content: userMessage }];

        // Optimistic update
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            // Handle non-JSON responses (e.g. 500 HTML error page)
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await response.json();
            } else {
                // If response is not JSON, it's likely a server crashe or network issue
                throw new Error("Server error");
            }

            if (response.status === 401) {
                setMessages(prev => [...prev, { role: "assistant", content: "عذراً، يجب عليك تسجيل الدخول لتتمكن من التحدث مع المساعد الذكي." }]);
                return;
            }

            if (response.status === 403) {
                // Limit reached or not subscribed
                setMessages(prev => [...prev, { role: "assistant", content: data.message || "عذراً، هذه الخدمة متاحة للمشتركين فقط." }]);
                return;
            }

            if (!response.ok) {
                const err = new Error(data.message || "Failed to get response") as any;
                err.detail = data.detail;
                err.code = data.code;
                err.debug = data.debug;
                throw err;
            }

            if (data?.reply?.includes("[REDIRECT:")) {
                const match = data.reply.match(/\[REDIRECT:\s*(.*?)\]/);
                if (match) {
                    const path = match[1];
                    setTimeout(() => window.location.href = path, 2000); // Redirect after 2s
                }
            }

            setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error: any) {
            console.error("Chatbot Error:", error);
            const errorMessage = error?.message || "حدث خطأ في الاتصال";
            const detail = error?.detail ? ` \n- Detail: ${error.detail}` : "";
            const code = error?.code ? ` \n- Code: ${error.code}` : "";
            const debugInfo = error?.debug ? ` \n- Debug: ${JSON.stringify(error.debug)}` : "";

            setMessages(prev => [...prev, {
                role: "assistant",
                content: `عذراً، حدث خطأ في الاتصال (${errorMessage})${detail}${code}${debugInfo}. يرجى المحاولة مرة أخرى لاحقاً.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (location === "/ai-agent") return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4"
                    >
                        <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl overflow-hidden rounded-2xl">
                            {/* Header */}
                            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-white/20">
                                        <AvatarFallback className="bg-white/10">
                                            <Bot className="w-5 h-5 text-white" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-sm">المساعد الذكي</h3>
                                        <p className="text-[10px] opacity-80">متصل الآن</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div
                                ref={scrollContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-dot-pattern"
                            >
                                {messages.map((msg, i) => {
                                    const suggestionMatch = msg.content.match(/\[SUGGESTIONS:\s*(.*?)\]/);
                                    const cleanContent = msg.content.replace(/\[SUGGESTIONS:.*?\]/, "").trim();
                                    const suggestions = suggestionMatch ? suggestionMatch[1].split("|").map(s => s.trim()) : [];

                                    return (
                                        <div key={i} className="space-y-2">
                                            <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none border border-border"
                                                        }`}
                                                >
                                                    {cleanContent}
                                                </div>
                                            </div>
                                            {msg.role === "assistant" && suggestions.length > 0 && i === messages.length - 1 && (
                                                <div className="flex flex-col gap-3 justify-start pl-2 pt-2 border-t border-border/20 mt-2">
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                        <Sparkles className="w-2.5 h-2.5" />
                                                        {isRtl ? "اختر من الخيارات التالية:" : "Select an option:"}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestions.map((option, idx) => (
                                                            <Button
                                                                key={idx}
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setInput(option);
                                                                    setTimeout(() => handleSend(option), 0);
                                                                }}
                                                                className="rounded-xl text-[10px] h-8 bg-background/50 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all px-4 shadow-sm"
                                                            >
                                                                {option}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                            <span className="text-[10px] text-muted-foreground">المساعد الذكي يفكر...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-1 w-full" />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-border bg-background/50">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="اكتب رسالتك هنا..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                        className="rounded-full bg-muted/50 border-primary/10 focus:ring-primary/20"
                                    />
                                    <Button size="icon" onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="rounded-full shrink-0">
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="icon"
                className="h-14 w-14 rounded-full shadow-2xl shadow-primary/40 hover:scale-110 transition-transform duration-300"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </Button>
        </div>
    );
}
