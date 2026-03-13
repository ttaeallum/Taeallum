import { useState, useRef, useEffect } from "react";
import {
    MessageSquare,
    X,
    Send,
    Loader2,
    Bot,
    User,
    ChevronDown,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    source?: string;
    timestamp?: number;
}

interface CourseQAWidgetProps {
    courseId: string;
    lessonId?: string;
    courseTitle?: string;
}

export function CourseQAWidget({ courseId, lessonId, courseTitle }: CourseQAWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/ai/course-qa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: userMsg.content,
                    courseId,
                    lessonId
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to get answer");

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.answer,
                source: data.source_lesson,
                timestamp: data.timestamp
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "عذراً، حدث خطأ أثناء محاولة الحصول على الجواب. يرجى المحاولة مرة أخرى."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans" dir="rtl">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[350px] md:w-[400px] h-[500px] flex flex-col shadow-2xl rounded-[2rem] overflow-hidden border border-white/10 bg-zinc-950/95 backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-5 bg-primary/10 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-sm">اسأل عن الكورس</h3>
                                    <p className="text-[10px] text-zinc-500 font-bold truncate max-w-[180px]">
                                        {courseTitle || "المساعد الذكي"}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                                className="text-zinc-500 hover:text-white hover:bg-white/5 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
                        >
                            {messages.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6 opacity-40">
                                    <MessageSquare className="w-12 h-12" />
                                    <p className="text-xs font-bold leading-relaxed">
                                        أهلاً بك! يمكنك سؤالي عن أي شيء يخص محتوى هذا الكورس وسأجيبك من واقع المحاضرات.
                                    </p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? -10 : 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={cn(
                                        "flex flex-col gap-2 max-w-[85%]",
                                        msg.role === 'user' ? "self-start items-start" : "self-end items-end"
                                    )}
                                >
                                    <div className={cn(
                                        "p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm",
                                        msg.role === 'user'
                                            ? "bg-zinc-800 text-white rounded-tr-none"
                                            : "bg-primary text-white font-bold rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>

                                    {msg.source && (
                                        <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                                            <span className="text-[9px] font-black text-primary uppercase">المصدر:</span>
                                            <span className="text-[9px] text-zinc-400 font-bold">
                                                {msg.source} - الدقيقة {Math.floor((msg.timestamp || 0) / 60)}:{((msg.timestamp || 0) % 60).toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-end pr-4">
                                    <div className="bg-primary/10 px-4 py-3 rounded-2xl flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span className="text-[11px] font-black text-primary/60 uppercase tracking-widest">جاري البحث في المحاضرات...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-zinc-900/50 border-t border-white/5">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="relative"
                            >
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="اكتب سؤالك هنا..."
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl py-3.5 pr-5 pl-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim() || isLoading}
                                    className="absolute left-2 top-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                                >
                                    <Send className="w-5 h-5 rotate-180" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/40 transition-all",
                    isOpen ? "bg-zinc-800 text-white" : "bg-primary text-white"
                )}
            >
                {isOpen ? <ChevronDown className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
                {!isOpen && (
                    <span className="absolute -top-1 -left-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                    </span>
                )}
            </motion.button>
        </div>
    );
}
