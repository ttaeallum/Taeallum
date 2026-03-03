import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, MessageCircle, HelpCircle, Shield, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Support() {
    const categories = [
        {
            icon: BookOpen,
            title: "دليل الطالب",
            desc: "كل ما تحتاجه للبدء في رحلتك التعليمية واستخدام المنصة.",
            link: "/faq"
        },
        {
            icon: CreditCard,
            title: "الاشتراكات والدفع",
            desc: "معلومات عن طرق الدفع المتاحة، تفعيل الاشتراكات، والفواتير.",
            link: "/faq#billing"
        },
        {
            icon: Shield,
            title: "الحساب والأمان",
            desc: "كيفية حماية حسابك، استعادة كلمة المرور، وإدارة بياناتك.",
            link: "/faq#account"
        },
        {
            icon: HelpCircle,
            title: "الأسئلة الشائعة",
            desc: "إجابات سريعة على الأسئلة الأكثر تكراراً من قبل المستخدمين.",
            link: "/faq"
        }
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-20">
                <div className="max-w-5xl mx-auto px-4 md:px-8">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-black mb-6"
                        >
                            مركز المساعدة والدعم
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-muted-foreground max-w-2xl mx-auto"
                        >
                            نحن هنا لمساعدتك في تحقيق أقصى استفادة من منصة تعلّم. ابحث عن إجابات أو تواصل معنا.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-10 max-w-2xl mx-auto relative"
                        >
                            <div className="relative">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6" />
                                <input
                                    type="text"
                                    placeholder="كيف يمكننا مساعدتك اليوم؟"
                                    className="w-full h-16 pr-12 pl-6 rounded-2xl border-2 border-primary/20 bg-background/50 backdrop-blur-xl focus:outline-none focus:border-primary transition-all text-lg"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Link href={cat.link}>
                                    <Card className="p-8 h-full border-border/40 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <cat.icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-3">{cat.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{cat.desc}</p>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-primary rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden text-white"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-black mb-6">لم تجد ما تبحث عنه؟</h2>
                            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
                                فريق الدعم الفني متواجد لمساعدتك في أي وقت. تواصل معنا مباشرة وسنقوم بالرد عليك في أسرع وقت ممكن.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/contact">
                                    <Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-bold rounded-2xl gap-2 text-primary hover:bg-white transition-all">
                                        <MessageCircle className="w-6 h-6" />
                                        تواصل معنا الآن
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
