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
            {/* Hero */}
            <div className="relative overflow-hidden bg-background py-24 border-b border-border/40">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="container px-4 md:px-8 max-w-screen-xl relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-8"
                    >
                        <Users className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">من نحن</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-heading font-black mb-8 leading-tight"
                    >
                        منصة <span className="text-primary">تعلّم</span>
                        <br />
                        <span className="text-2xl md:text-3xl text-muted-foreground font-medium mt-2 block">
                            مستقبل التعليم الذكي باللغة العربية
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
                    >
                        تعلّم هي منصة تعليمية عربية تجمع بين أفضل المحتوى التعليمي المجاني وقوة الذكاء الاصطناعي لمساعدتك على تحقيق أهدافك المهنية. نحن نؤمن بأن التعليم الجيد حق للجميع.
                    </motion.p>
                </div>
            </div>

            {/* Stats */}
            <div className="border-b border-border/40 bg-muted/20">
                <div className="container px-4 md:px-8 max-w-screen-xl py-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <p className="text-4xl md:text-5xl font-black text-primary mb-2">{stat.number}</p>
                                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Vision, Mission, Values */}
            <div className="container px-4 md:px-8 max-w-screen-xl py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {values.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.15 }}
                        >
                            <Card className="p-8 h-full bg-card border-border/50 rounded-[2rem] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                                    <item.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* What We Offer */}
            <div className="bg-muted/20 border-y border-border/40">
                <div className="container px-4 md:px-8 max-w-screen-xl py-20">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-bold uppercase tracking-widest border-primary/30 text-primary">
                            ماذا نقدم
                        </Badge>
                        <h2 className="text-3xl md:text-4xl font-black mt-4">كل ما تحتاجه في مكان واحد</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="p-8 bg-card border-border/50 rounded-[2rem] hover:border-primary/30 transition-all duration-300 flex gap-6 items-start group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Founder & Contact */}
            <div className="container px-4 md:px-8 max-w-screen-xl py-20">
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4 px-4 py-1.5 text-xs font-bold uppercase tracking-widest border-primary/30 text-primary">
                        المؤسس
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-black mt-4">القصة وراء تعلّم</h2>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                >
                    <Card className="p-8 md:p-12 bg-card border-border/50 rounded-[2.5rem] max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl font-black text-primary">ح</span>
                            </div>
                            <h3 className="text-2xl font-black mb-2">حمزة علي أمين السرخي</h3>
                            <p className="text-primary font-bold text-sm mb-6">مؤسس ومطوّر منصة تعلّم</p>
                            <p className="text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
                                بدأت فكرة "تعلّم" من إيماني بأن كل شخص عربي يستحق فرصة تعليمية عادلة. لاحظت أن المحتوى التعليمي العربي متفرق وغير منظم، فقررت بناء منصة تجمع أفضل الكورسات المجانية مع ذكاء اصطناعي يرسم لكل طالب مسار تعلّم مخصص — من الصفر حتى الاحتراف.
                            </p>

                            {/* Contact & Social */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="mailto:hamzaali200410@gmail.com"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 text-sm font-bold"
                                >
                                    <Mail className="w-4 h-4" />
                                    hamzaali200410@gmail.com
                                </a>
                                <a
                                    href="https://www.instagram.com/taallm.jo/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/20 hover:bg-pink-500 hover:text-white transition-all duration-300 text-sm font-bold"
                                >
                                    <Instagram className="w-4 h-4" />
                                    @taallm.jo
                                </a>
                                <a
                                    href="https://wa.me/962777000000"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all duration-300 text-sm font-bold"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    واتساب
                                </a>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* CTA */}
            <div className="container px-4 md:px-8 max-w-screen-xl pb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-[2.5rem] p-12 md:p-16 border border-primary/20 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black mb-4">انضم لعائلة تعلّم</h2>
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                            ابدأ رحلتك التعليمية اليوم مع مئات الكورسات المجانية ومساعد ذكي يرسم لك الطريق.
                        </p>
                        <Link href="/courses">
                            <Button size="lg" className="rounded-xl px-8 font-bold text-base gap-2">
                                <BookOpen className="w-5 h-5" />
                                تصفح الكورسات
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
}
