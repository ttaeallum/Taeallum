import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
    Target,
    Rocket,
    Users,
    BookOpen,
    Sparkles,
    Globe,
    Shield,
    Heart,
    GraduationCap,
    Mail,
    Instagram,
    MessageCircle
} from "lucide-react";

const values = [
    {
        icon: Target,
        title: "رؤيتنا",
        description: "تمكين كل فرد عربي من الوصول لمحتوى تعليمي عالي الجودة يساعده على بناء مستقبل مهني ناجح في عالم التقنية."
    },
    {
        icon: Rocket,
        title: "مهمتنا",
        description: "توفير منصة تعليمية ذكية تجمع بين أفضل الكورسات المجانية والذكاء الاصطناعي لرسم مسارات تعلّم مخصصة لكل طالب."
    },
    {
        icon: Heart,
        title: "قيمنا",
        description: "الجودة، الإتاحة للجميع، الابتكار المستمر، ودعم المتعلم في كل خطوة من رحلته التعليمية."
    }
];

const features = [
    {
        icon: BookOpen,
        title: "كورسات مجانية",
        description: "مئات الكورسات المجانية في مجالات البرمجة، التصميم، الأعمال، واللغات."
    },
    {
        icon: Sparkles,
        title: "مساعد ذكي بالـ AI",
        description: "ذكاء اصطناعي يصمم لك مسار تعليمي مخصص من الصفر حتى الاحتراف بناءً على أهدافك."
    },
    {
        icon: Globe,
        title: "محتوى عربي",
        description: "محتوى تعليمي باللغة العربية مصمم خصيصاً للمتعلم العربي مع دعم للغات متعددة."
    },
    {
        icon: GraduationCap,
        title: "تعلّم ذاتي منظم",
        description: "المنصة ترتب لك المحتوى بخطة أسبوعية واضحة مع معالم ونقاط تفتيش لقياس تقدمك."
    }
];

const stats = [
    { number: "500+", label: "كورس مجاني" },
    { number: "10K+", label: "متعلم نشط" },
    { number: "50+", label: "تخصص متاح" },
    { number: "24/7", label: "مساعد ذكي" }
];

export default function AboutUs() {
    return (
        <Layout>
            <div className="min-h-screen bg-background relative overflow-hidden font-sans">
                {/* Modern Premium Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                    <div className="absolute top-[30%] left-[20%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
                </div>

                <div className="container relative z-10 px-4 md:px-8 max-w-5xl mx-auto py-24 md:py-32 flex flex-col items-center">
                    {/* Hero Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center mb-24"
                    >
                        <Badge variant="outline" className="mb-6 px-6 py-2 text-xs font-black uppercase tracking-[0.3em] border-primary/40 text-primary bg-primary/5 backdrop-blur-sm rounded-full">
                            {/* Mission Icon */}
                            <Sparkles className="w-3 h-3 mr-2" />
                            قصتنا ورؤيتنا
                        </Badge>
                        <h1 className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
                            منصة <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">تعلّم</span>
                        </h1>
                        <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed px-4">
                            مستقبل التعليم الذكي باللغة العربية
                        </p>
                    </motion.div>

                    {/* About Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full mb-32"
                    >
                        <Card className="p-6 md:p-16 bg-card/60 border-border/40 rounded-[2.5rem] md:rounded-[3rem] backdrop-blur-xl shadow-2xl relative overflow-hidden group border-2 border-primary/10">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Target className="w-48 h-48" />
                            </div>

                            <div className="relative z-10 max-w-3xl mx-auto text-center">
                                <h2 className="text-2xl md:text-3xl font-black mb-6 flex items-center justify-center gap-4">
                                    <Rocket className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                    لماذا بنينا "تعلّم"؟
                                </h2>
                                <p className="text-base md:text-xl text-muted-foreground leading-relaxed md:leading-[2] text-center font-medium">
                                    تعلّم هي مبادرة تعليمية عربية تسعى لإعادة صياغة تجربة التعلّم الذاتي. نحن نؤمن بأن المحتوى التعليمي عالي الجودة يجب أن يكون متاحاً للجميع ومنظماً بشكل يسهل على الطالب البدء من الصفر حتى الوصول للاحتراف المهني.
                                </p>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Values Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32 w-full">
                        {values.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Card className="p-10 h-full bg-card/40 border-border/40 rounded-[2.5rem] hover:border-primary/50 transition-all duration-500 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 border border-primary/20">
                                        <item.icon className="w-10 h-10 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed font-medium">{item.description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Founder Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="w-full mb-32"
                    >
                        <Card className="p-6 md:p-20 bg-gradient-to-br from-card to-background border-border/60 rounded-[2.5rem] md:rounded-[3.5rem] text-center relative overflow-hidden border-2">
                            <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/20">
                                <span className="text-5xl font-black text-primary">ح</span>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black mb-3 italic">حمزة علي أمين السرخي</h3>
                            <p className="text-primary font-black text-xs md:text-sm uppercase tracking-widest mb-10">المؤسس والشؤون التقنية</p>

                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed md:leading-[1.8] max-w-2xl mx-auto mb-16 font-medium">
                                "هدفنا هو سد الفجوة في التعليم الرقمي العربي من خلال دمج المحتوى الأكاديمي مع تقنيات الذكاء الاصطناعي لخلق تجربة تعليمية مخصصة لكل طالب حسب احتياجاته وظروفه."
                            </p>

                            {/* Contact Links */}
                            <div className="flex flex-wrap items-center justify-center gap-6">
                                <a
                                    href="mailto:info@taallm.com"
                                    className="px-8 py-4 rounded-2xl bg-muted border border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3 font-bold group"
                                >
                                    <Mail className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                    <span>info@taallm.com</span>
                                </a>
                                <a
                                    href="https://www.instagram.com/taallm.jo/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 rounded-2xl bg-muted border border-border hover:border-pink-500/50 hover:bg-pink-500/5 transition-all flex items-center gap-3 font-bold group"
                                >
                                    <Instagram className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
                                    <span>Instagram</span>
                                </a>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Join CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-black mb-8">ابدأ رحلتك معنا اليوم</h2>
                        <Link href="/courses">
                            <Button size="lg" className="h-14 md:h-16 px-8 md:px-12 rounded-2xl text-base md:text-lg font-black shadow-2xl shadow-primary/40 hover:scale-105 transition-transform">
                                انضم إلى تعلّم الآن
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
