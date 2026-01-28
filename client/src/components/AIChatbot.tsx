import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, MessageCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "مرحباً! أنا أنيس، مساعدك الذكي في منصة تعلم. كيف يمكنني مساعدتك اليوم؟" }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { i18n } = useTranslation();
    const isRtl = i18n.language === "ar";

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage }),
            });

            if (!response.ok) throw new Error("Failed to get response");

            const data = await response.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." }]);
        } finally {
            setIsLoading(false);
        }
    };

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
                                        <h3 className="font-bold text-sm">أنيس - المساعد الذكي</h3>
                                        <p className="text-[10px] opacity-80">متصل الآن</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dot-pattern">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === "user"
                                                    ? "bg-primary text-primary-foreground rounded-tr-none"
                                                    : "bg-muted text-foreground rounded-tl-none border border-border"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted p-3 rounded-2xl rounded-tl-none border border-border flex items-center gap-2">
                                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                            <span className="text-[10px] text-muted-foreground">أنيس يفكر...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
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
                                    <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="rounded-full shrink-0">
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
