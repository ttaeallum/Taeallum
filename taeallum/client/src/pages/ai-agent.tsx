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
  LayoutDashboard,
  Lock,
  ArrowLeft,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { aiQuestions, type UserProfile, type StudyPlan } from "@/lib/ai-questions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

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
  const [, setLocation] = useLocation();
  const isRtl = i18n.language === 'ar';

  // 1. Subscription Guard
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({});
  const [view, setView] = useState<"onboarding" | "path">("onboarding");
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
    const isActuallySubscribed = user?.isSubscribed || user?.role === "admin";
    if (!authLoading && isActuallySubscribed && messages.length === 0) {
      const initialMessage: Message = {
        id: "0",
        type: "agent",
        content: "مرحباً! 👋 أنا المساعد الذكي. سأقوم بتحليل أهدافك ومهاراتك لأصمم لك خارطة طريق تعليمية مخصصة بالكامل.",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);

      setTimeout(() => {
        addQuestion(0);
      }, 1500);
    }
  }, [authLoading, user, messages.length]);

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

  const profileKeys: (keyof UserProfile)[] = [
    "name", "age", "educationLevel", "field", "goal", "timeline", "priority",
    "experienceLevel", "programmingExperience", "projectExperience", "hoursPerWeek",
    "preferredTime", "commitments", "learningStyle", "learningSpeed",
    "languagePreference", "challenges", "specialRequirements", "certificateImportance", "expectations"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const currentKey = profileKeys[currentQuestionIndex];
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setUserProfile(prev => ({ ...prev, [currentKey]: inputValue }));
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < aiQuestions.length) {
      setTimeout(() => {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "agent",
          content: "جميل جداً، لننتقل للخطوة التالية...",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentResponse]);
        setIsLoading(false);

        setTimeout(() => {
          addQuestion(nextIndex);
        }, 800);
      }, 600);
    } else {
      // Final message and API call
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: "رائع! 🎉 لقد اكتملت ملامح رحلتك التعليمية. دعني أقوم بمعالجة البيانات وإنشاء خطتك الدراسية الآن باستخدام تقنيات الذكاء الاصطناعي...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);

      try {
        const response = await fetch("/api/ai-engine/generate-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: { ...userProfile, [currentKey]: inputValue } }),
        });

        if (!response.ok) throw new Error("Failed to generate plan");

        const data = await response.json();
        setStudyPlan(data.plan);

        // Final agent confirmation before switching view
        setTimeout(() => {
          setView("path");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 2000);

      } catch (error) {
        console.error("Error generating plan:", error);
        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          type: "agent",
          content: "عذراً، حدث خطأ أثناء إنشاء الخطة لمشكلة في الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.",
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // --- Render Paywall if not subscribed ---  // --- Render Paywall if not subscribed ---
  if (!authLoading && !user?.isSubscribed && user?.role !== "admin") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="max-w-xl w-full p-10 text-center border-2 border-primary/20 shadow-2xl backdrop-blur-xl bg-background/80 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative z-10">
                <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/10">
                  <Lock className="w-12 h-12 text-primary" />
                </div>

                <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">
                  Exclusive Feature
                </Badge>

                <h2 className="text-4xl font-heading font-black mb-6">دردش مع <span className="text-primary italic">المساعد الذكي</span></h2>

                <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                  احصل على وصول كامل لمساعدك الشخصي الذكي المدعوم بتقنية <span className="font-bold text-foreground">GPT-4o</span> لتصميم خريطة طريق مخصصة لك، الإجابة على استفساراتك البرمجية، ومتابعة تقدمك لحظة بلحظة.
                </p>

                <div className="flex flex-col gap-4">
                  <Link href="/ai-pricing">
                    <Button size="lg" className="w-full text-xl font-black h-16 rounded-2xl shadow-xl shadow-primary/20 group">
                      اشترك الآن بـ 10$ شهرياً فقط
                      <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" className="w-full font-bold">
                      العودة للرئيسية
                    </Button>
                  </Link>
                </div>

                <p className="mt-8 text-xs text-muted-foreground/60">
                  انضم لأكثر من 10,000 طالب وباشر رحلة احترافك الآن.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const currentQuestion = aiQuestions[currentQuestionIndex];
  const progressValue = ((Math.min(currentQuestionIndex + 1, aiQuestions.length)) / aiQuestions.length) * 100;

  if (view === "path" && studyPlan) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background py-16">
          <div className="container max-w-7xl px-4 md:px-8">
            <Button
              variant="ghost"
              onClick={() => setView("onboarding")}
              className="mb-8 gap-2 hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للدردشة
            </Button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="text-center">
                <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  تم إنشاء المسار بالذكاء الاصطناعي
                </Badge>
                <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                  {studyPlan.title}
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
                  {studyPlan.description}
                </p>

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <div className="px-6 py-3 rounded-2xl bg-background border border-border shadow-sm flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-bold">المدة: {studyPlan.duration}</span>
                  </div>
                  <div className="px-6 py-3 rounded-2xl bg-background border border-border shadow-sm flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-bold">المستوى: {studyPlan.difficulty}</span>
                  </div>
                  <div className="px-6 py-3 rounded-2xl bg-background border border-border shadow-sm flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="font-bold">{studyPlan.courses.length} دورات مقترحة</span>
                  </div>
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
              <Card className="p-10 border-primary/20 bg-background/60 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-black mb-12 flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  محطات الإنجاز الكبرى
                </h3>

                <div className="relative space-y-10 before:absolute before:inset-y-0 before:left-4 lg:before:left-1/2 before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                  {studyPlan.milestones.map((milestone, idx) => (
                    <div key={idx} className={`relative flex flex-col lg:flex-row gap-8 ${idx % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}>
                      <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/50 z-10" />
                      <div className="lg:w-1/2 lg:px-8 pl-12">
                        <div className={`p-8 rounded-3xl border border-primary/10 bg-background/40 hover:bg-background/80 transition-all duration-300 shadow-xl ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                          <span className="text-primary font-black text-sm uppercase tracking-widest bg-primary/5 px-4 py-1 rounded-full">
                            الأسبوع {milestone.week}
                          </span>
                          <h4 className="text-2xl font-bold mt-4 mb-3">{milestone.title}</h4>
                          <p className="text-muted-foreground mb-6 leading-relaxed">{milestone.description}</p>
                          <div className={`flex flex-wrap gap-2 ${idx % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                            {milestone.deliverables.map((d, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-primary/10 bg-primary/5 px-3 py-1">
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

              {/* Recommendation Footer */}
              <div className="bg-primary rounded-[3rem] p-16 text-primary-foreground text-center relative overflow-hidden shadow-2xl shadow-primary/30">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative z-10">
                  <h3 className="text-4xl font-black mb-6">هل أنت جاهز للتحول الحقيقي؟</h3>
                  <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
                    لقد وضعنا لك الخارطة، والآن حان وقت العمل. ابدأ بأول دورة في مسارك اليوم وحقق هدفك.
                  </p>
                  <div className="flex flex-wrap justify-center gap-6">
                    <Link href="/courses">
                      <Button variant="secondary" size="lg" className="h-16 px-12 text-xl font-black shadow-2xl">
                        ابدأ المسار الآن
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-16 px-12 text-xl font-bold border-white/20 hover:bg-white/10 text-white"
                      onClick={() => setView("onboarding")}
                    >
                      إعادة عمل تحليل جديد
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

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
                <Badge variant="outline" className="px-4 py-1 text-primary gap-2 hover:bg-transparent">
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">مساعد ذكاء اصطناعي فائق</span>
                </Badge>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-emerald-500">
                  المساعد الذكي:
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
                حلل أهدافك، اكتشف مهاراتك، وابدأ رحلة تعليمية مصممة خصيصاً لك بأحدث تقنيات الذكاء الاصطناعي.
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
                        <span className="text-muted-foreground">تقدم التحليل</span>
                        <span className="text-primary">{Math.round(progressValue)}%</span>
                      </div>
                      <Progress value={progressValue} className="h-2 bg-primary/10" />
                      <p className="text-[10px] text-muted-foreground text-center italic">
                        نقوم بجمع بياناتك لتخصيص الخطة
                      </p>
                    </div>

                    <div className="pt-4 border-t border-primary/10">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase">الأسئلة</p>
                          <p className="text-xl font-bold text-primary">{aiQuestions.length}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] text-muted-foreground uppercase">الذكاء</p>
                          <p className="text-xl font-bold text-primary">GPT-4o</p>
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
                    ماذا ستجني؟
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: BookOpen, title: "خطة مرنة", desc: "تتكيف مع وقتك" },
                      { icon: Target, title: "تركيز عالٍ", desc: "محتوى منتقى بعناية" },
                      { icon: Zap, title: "نتائج أسرع", desc: "تجنب التشتت" }
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
                        <h3 className="font-black text-xl tracking-tight leading-none mb-1.5">المساعد الذكي</h3>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                            نشط الآن
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
                          className={`flex gap-4 ${message.type === "user" ? "flex-row-reverse" : "flex-row"
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
                            className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${message.type === "user" ? "items-end" : "items-start"
                              }`}
                          >
                            <div
                              className={`px-6 py-4 rounded-[1.5rem] text-base leading-relaxed shadow-md border transition-all ${message.type === "user"
                                ? "bg-primary text-primary-foreground rounded-tr-none border-primary/20 shadow-primary/10"
                                : "bg-background/90 border-primary/10 text-foreground rounded-tl-none backdrop-blur-md shadow-black/5"
                                }`}
                            >
                              {message.content}
                            </div>
                            <div className="flex items-center gap-2 mt-2 px-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                              <span>{message.type === 'agent' ? 'المساعد الذكي' : 'أنت'}</span>
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
                            المساعد الذكي يكتب...
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Options Display */}
                    {currentQuestion && view === "onboarding" && messages.length > 1 && !isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-2 mt-2 mr-11"
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
                            * يمكنك كتابة عدة خيارات في صندوق الدردشة
                          </div>
                        )}
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Section */}
                  {view === "onboarding" && (
                    <div className="p-6 bg-background/60 border-t border-primary/10 backdrop-blur-xl">
                      <div className="flex gap-3 items-end max-w-4xl mx-auto w-full">
                        <div className="relative flex-1 group">
                          <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] group-focus-within:bg-primary/10 transition-colors" />
                          <Textarea
                            placeholder="تحدث مع المساعد الذكي، اطرح أسئلتك أو أجب..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="min-h-[60px] max-h-32 resize-none bg-transparent border-2 border-primary/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-[1.5rem] px-6 py-4 text-base transition-all pl-14 pr-6 shadow-inner"
                            disabled={isLoading}
                          />
                          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-3">
                            <Button
                              onClick={handleSendMessage}
                              disabled={!inputValue.trim() || isLoading}
                              size="icon"
                              className="h-10 w-10 rounded-2xl shadow-xl shadow-primary/30 transition-all active:scale-90 hover:scale-105 bg-primary hover:bg-primary/90"
                            >
                              <Send className="w-4 h-4 rotate-180" />
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
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
