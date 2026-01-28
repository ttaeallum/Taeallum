import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Sparkles, 
  BookOpen, 
  Target, 
  Zap, 
  ChevronDown, 
  Bot, 
  User, 
  Loader2,
  CheckCircle2,
  Trophy,
  ArrowRight,
  RefreshCcw,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { aiQuestions, exampleStudyPlan, type UserProfile, type StudyPlan } from "@/lib/ai-questions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  isQuestion?: boolean;
  options?: string[];
}

export default function AIAgent() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [showPlan, setShowPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with first message
  useEffect(() => {
    const initialMessage: Message = {
      id: "0",
      type: "agent",
      content: isRtl 
        ? "مرحباً! 👋 أنا أنيس، مساعدك الذكي. سأقوم بتحليل أهدافك ومهاراتك لأصمم لك خارطة طريق تعليمية مخصصة بالكامل."
        : "Hello! 👋 I'm Anis, your AI Assistant. I'll analyze your goals and skills to design a completely personalized learning roadmap for you.",
      timestamp: new Date(),
    };
    setMessages([initialMessage]);

    // Add first question after a delay
    setTimeout(() => {
      addQuestion(0);
    }, 1500);
  }, []);

  const addQuestion = (index: number) => {
    if (index < aiQuestions.length) {
      const question = aiQuestions[index];
      const questionMessage: Message = {
        id: `q-${index}`,
        type: "agent",
        content: question.text,
        timestamp: new Date(),
        isQuestion: true,
        options: question.options,
      };
      setMessages((prev) => [...prev, questionMessage]);
      setCurrentQuestionIndex(index);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate processing
    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;

      if (nextIndex < aiQuestions.length) {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "agent",
          content: isRtl ? "جميل جداً، لننتقل للخطوة التالية..." : "Great, let's move to the next step...",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentResponse]);

        setTimeout(() => {
          addQuestion(nextIndex);
        }, 800);
      } else {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "agent",
          content: isRtl 
            ? "رائع! 🎉 لقد اكتملت ملامح رحلتك التعليمية. دعني أقوم بمعالجة البيانات وإنشاء خطتك الدراسية الآن..."
            : "Awesome! 🎉 Your learning journey profile is complete. Let me process the data and generate your study plan now...",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentResponse]);

        setTimeout(() => {
          setStudyPlan(exampleStudyPlan);
          setShowPlan(true);

          const finalMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: "agent",
            content: isRtl
              ? "✨ تم إنشاء خطتك الدراسية بنجاح! هذه الخطة مصممة لتناسب جدولك وأهدافك. يمكنك مراجعتها بالكامل أدناه."
              : "✨ Your study plan has been successfully generated! This plan is tailored to your schedule and goals. You can review it in full below.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, finalMessage]);
        }, 2000);
      }

      setIsLoading(false);
    }, 1200);
  };

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const currentQuestion = aiQuestions[currentQuestionIndex];
  const progressValue = ((Math.min(currentQuestionIndex + 1, aiQuestions.length)) / aiQuestions.length) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background/50 py-12 backdrop-blur-[2px]">
          <div className="container max-w-7xl px-4 md:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16 relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] -z-10" />
              
              <div className="inline-flex items-center justify-center p-2 mb-6 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md shadow-inner">
                <Badge variant="ghost" className="px-4 py-1 text-primary gap-2 hover:bg-transparent">
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">{isRtl ? "مساعد ذكاء اصطناعي فائق" : "Advanced AI Assistant"}</span>
                </Badge>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">
                  {isRtl ? "أنيس:" : "Anis:"}
                </span><br />
                {isRtl ? "مستشارك الأكاديمي الذكي" : "Your Smart Academic Mentor"}
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                {isRtl 
                  ? "حلل أهدافك، اكتشف مهاراتك، وابدأ رحلة تعليمية مصممة خصيصاً لك بأحدث تقنيات الذكاء الاصطناعي." 
                  : "Analyze your goals, discover your skills, and start a learning journey custom-designed for you with the latest AI technology."}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar Info - Hidden on mobile, shown on large screens */}
              <div className="hidden lg:flex flex-col gap-6 lg:col-span-1">
                <Card className="p-6 border-primary/20 bg-background/60 backdrop-blur-xl shadow-xl hover:shadow-primary/5 transition-all">
                  <h3 className="font-bold mb-6 flex items-center gap-3 text-primary">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    {isRtl ? "نظرة عامة" : "Overview"}
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-semibold">
                        <span className="text-muted-foreground">{isRtl ? "تقدم التحليل" : "Analysis Progress"}</span>
                        <span className="text-primary">{Math.round(progressValue)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2 bg-primary/10" />
                      <p className="text-[10px] text-muted-foreground text-center italic">
                        {isRtl ? "نقوم بجمع بياناتك لتخصيص الخطة" : "Gathering data to personalize your plan"}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase">{isRtl ? "الأسئلة" : "Questions"}</p>
                          <p className="text-xl font-bold text-primary">{aiQuestions.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase">{isRtl ? "الذكاء" : "Intelligence"}</p>
                          <p className="text-xl font-bold text-primary">GPT-4</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-primary/20 bg-background/60 backdrop-blur-xl shadow-xl hover:shadow-primary/5 transition-all">
                  <h3 className="font-bold mb-6 flex items-center gap-3 text-primary">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="w-5 h-5" />
                    </div>
                    {isRtl ? "ماذا ستجني؟" : "Benefits"}
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: BookOpen, title: isRtl ? "خطة مرنة" : "Flexible Plan", desc: isRtl ? "تتكيف مع وقتك" : "Adapts to your time" },
                      { icon: Target, title: isRtl ? "تركيز عالٍ" : "High Focus", desc: isRtl ? "محتوى منتقى بعناية" : "Curated content" },
                      { icon: Zap, title: isRtl ? "نتائج أسرع" : "Faster Results", desc: isRtl ? "تجنب التشتت" : "Avoid distraction" }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                        <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 group-hover:bg-primary/10 transition-colors h-fit">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Chat Section */}
              <div className="lg:col-span-3">
                <Card className="h-[650px] md:h-[750px] flex flex-col border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-background/60 backdrop-blur-3xl relative overflow-hidden rounded-[2.5rem]">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  
                  {/* Chat Header */}
                  <div className="px-8 py-6 border-b border-primary/10 flex items-center justify-between bg-background/40 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:bg-primary/30 transition-colors" />
                        <Avatar className="h-14 w-14 border-2 border-primary/30 relative z-10 shadow-lg">
                          <AvatarImage src="/anis-avatar.png" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                            <Bot className="w-8 h-8" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full z-20 shadow-sm" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl tracking-tight leading-none mb-1.5">{isRtl ? "أنيس الذكي" : "Anis AI"}</h3>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                            {isRtl ? "نشط الآن" : "Active Now"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="bg-primary/10 text-[10px] font-black text-primary border-primary/30 px-3 py-1 rounded-lg">
                        CORE MODEL V4.0
                      </Badge>
                      <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">Latency: 24ms</p>
                    </div>
                  </div>

                  {/* Messages Container */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-primary/10 scroll-smooth bg-[radial-gradient(circle_at_top_right,rgba(var(--primary),0.02),transparent)]">
                    <AnimatePresence mode="popLayout">
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, x: message.type === "user" ? 30 : -30, y: 20 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ type: "spring", damping: 20, stiffness: 150 }}
                          className={`flex gap-4 ${
                            message.type === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Avatar className={`h-10 w-10 border-2 shadow-md ${message.type === 'user' ? 'border-primary/40 bg-primary/10' : 'border-primary/20 bg-background'}`}>
                              {message.type === "agent" ? (
                                <AvatarFallback className="bg-primary/5 text-primary"><Bot className="w-5 h-5" /></AvatarFallback>
                              ) : (
                                <AvatarFallback className="bg-secondary text-secondary-foreground"><User className="w-5 h-5" /></AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                          
                          <div
                            className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${
                              message.type === "user" ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`px-6 py-4 rounded-[1.5rem] text-base leading-relaxed shadow-md border transition-all ${
                                message.type === "user"
                                  ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20 shadow-primary/10"
                                  : "bg-background/90 border-primary/10 text-foreground rounded-tl-none backdrop-blur-md shadow-black/5"
                              }`}
                            >
                              {message.content}
                            </div>
                            <div className="flex items-center gap-2 mt-2 px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                              <span>{message.type === 'agent' ? (isRtl ? 'أنيس' : 'ANIS') : (isRtl ? 'أنت' : 'YOU')}</span>
                              <span>•</span>
                              <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <Avatar className="h-8 w-8 mt-1 border border-primary/10">
                          <AvatarFallback className="bg-primary/5 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="bg-background/80 border border-primary/10 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {isRtl ? "أنيس يكتب..." : "Anis is typing..."}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Options Display */}
                    {currentQuestion && !showPlan && messages.length > 1 && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-wrap gap-2 mt-2 ${isRtl ? 'mr-11' : 'ml-11'}`}
                      >
                        {currentQuestion.type === "select" && currentQuestion.options && (
                          <>
                            {currentQuestion.options.map((option, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleOptionClick(option)}
                                disabled={isLoading}
                                className="rounded-full bg-primary/5 hover:bg-primary hover:text-white border-primary/20 transition-all duration-300 text-xs px-4"
                              >
                                {option}
                              </Button>
                            ))}
                          </>
                        )}
                        {currentQuestion.type === "multiselect" && (
                          <div className="w-full text-[10px] text-primary/60 italic">
                            {isRtl ? "* يمكنك كتابة عدة خيارات في صندوق الدردشة" : "* You can type multiple options in the chat box"}
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Section */}
                  {!showPlan && (
                    <div className="p-6 bg-background/60 border-t border-primary/10 backdrop-blur-xl">
                      <div className="flex gap-3 items-end max-w-4xl mx-auto w-full">
                        <div className="relative flex-1 group">
                          <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] group-focus-within:bg-primary/10 transition-colors" />
                          <Textarea
                            placeholder={isRtl ? "تحدث مع أنيس، اطرح أسئلتك أو أجب..." : "Talk to Anis, ask or answer..."}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="min-h-[60px] max-h-32 resize-none bg-transparent border-2 border-primary/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-[1.5rem] px-6 py-4 text-base transition-all pr-14 shadow-inner"
                            disabled={isLoading}
                          />
                          <div className={`absolute bottom-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} flex items-center gap-3`}>
                            <Button
                              onClick={handleSendMessage}
                              disabled={!inputValue.trim() || isLoading}
                              size="icon"
                              className="h-10 w-10 rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-90 hover:scale-105 bg-primary hover:bg-primary/90"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center items-center gap-4 mt-4 opacity-60">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                          Neural Network processing enabled
                        </p>
                      </div>
                    </div>
                  )}

                  {showPlan && (
                    <div className="p-6 bg-primary/5 border-t border-primary/10 backdrop-blur-md flex flex-col items-center gap-4">
                      <p className="text-xs font-bold text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {isRtl ? "خارطة الطريق جاهزة الآن" : "Roadmap is now ready"}
                      </p>
                      <Button className="w-full max-w-md rounded-2xl h-12 text-lg font-bold group shadow-xl shadow-primary/20" size="lg">
                        {isRtl ? "استكشف خطتك الدراسية" : "Explore your study plan"}
                        <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Full Study Plan Visualization */}
            {showPlan && studyPlan && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 relative"
              >
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full opacity-20" />
                
                <div className="relative space-y-12">
                  <div className="text-center">
                    <h2 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
                      <Sparkles className="w-8 h-8 text-primary" />
                      {studyPlan.title}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                      {studyPlan.description}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                      <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-semibold border-primary/10">
                        ⏱️ {studyPlan.duration}
                      </Badge>
                      <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-semibold border-primary/10">
                        📊 {isRtl ? "مستوى" : "Level"}: {studyPlan.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-sm font-semibold border-primary/10">
                        📚 {studyPlan.courses.length} {isRtl ? "دورات" : "Courses"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {studyPlan.courses.map((course, idx) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="h-full group hover:border-primary/40 transition-all duration-500 overflow-hidden bg-background/60 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-primary/5">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-primary/40 group-hover:text-primary transition-colors">0{idx + 1}</span>
                              <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px]">{course.level}</Badge>
                            </div>
                            <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{course.title}</h4>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                            
                            <div className="space-y-3 pt-4 border-t border-primary/5">
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <Zap className="w-3 h-3 text-primary" />
                                <span>{course.duration}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {course.topics.slice(0, 3).map((topic, i) => (
                                  <span key={i} className="text-[9px] px-2 py-0.5 bg-primary/5 text-primary rounded-full">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Milestones Timeline */}
                  <Card className="p-8 border-primary/20 bg-background/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Trophy className="w-40 h-40" />
                    </div>
                    
                    <h3 className="text-2xl font-black mb-10 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      {isRtl ? "محطات الإنجاز الكبرى" : "Major Milestones"}
                    </h3>

                    <div className="relative space-y-8 before:absolute before:inset-y-0 before:left-4 lg:before:left-1/2 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                      {studyPlan.milestones.map((milestone, idx) => (
                        <div key={idx} className={`relative flex flex-col lg:flex-row gap-8 ${idx % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}>
                          <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/50 z-10" />
                          <div className="lg:w-1/2 lg:px-8 pl-12">
                            <div className={`p-6 rounded-2xl border border-primary/10 bg-background/40 hover:bg-background/80 transition-all duration-300 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                              <span className="text-primary font-black text-sm uppercase tracking-tighter">
                                {isRtl ? "الأسبوع" : "Week"} {milestone.week}
                              </span>
                              <h4 className="text-xl font-bold mt-1 mb-2">{milestone.title}</h4>
                              <p className="text-sm text-muted-foreground mb-4">{milestone.description}</p>
                              <div className={`flex flex-wrap gap-2 ${idx % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                {milestone.deliverables.map((d, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] border-primary/10 bg-primary/5">
                                    ✓ {d}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="lg:w-1/2" />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Call to Action */}
                  <div className="bg-primary rounded-3xl p-12 text-primary-foreground text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black mb-4">
                        {isRtl ? "هل أنت جاهز للتحول الحقيقي؟" : "Ready for a real transformation?"}
                      </h3>
                      <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 text-lg">
                        {isRtl 
                          ? "لقد وضعنا لك الخارطة، والآن حان وقت العمل. انضم لآلاف المتعلمين الذين حققوا أهدافهم معنا."
                          : "We've laid out the map, now it's time to act. Join thousands of learners who achieved their goals with us."}
                      </p>
                      <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="secondary" size="lg" className="rounded-2xl px-8 h-14 font-black shadow-xl">
                          {isRtl ? "ابدأ رحلتك الآن" : "Start Your Journey Now"}
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 font-bold border-white/20 hover:bg-white/10 text-white">
                          <RefreshCcw className="w-4 h-4 mr-2" />
                          {isRtl ? "إعادة تخصيص الخطة" : "Re-customize Plan"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
