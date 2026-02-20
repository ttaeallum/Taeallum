import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Seo } from "@/components/seo";

export default function Refund() {
    return (
        <Layout>
            <Seo title="سياسة الاسترجاع والالغاء" description="سياسة استرداد الأموال والغاء الاشتراكات في منصة تعلّم." />
            <div className="min-h-screen py-16 md:py-24" dir="rtl">
                <div className="container max-w-3xl mx-auto px-4 md:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12 text-center"
                    >
                        <h1 className="text-3xl md:text-5xl font-bold mb-4">سياسة الاسترجاع والالغاء</h1>
                        <p className="text-muted-foreground text-sm font-medium">آخر تحديث: فبراير 2026</p>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">1. المنتجات الرقمية (الكورسات)</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                نظراً لطبيعة المنتجات الرقمية (الكورسات المسجلة) والوصول الفوري للمحتوى، فإن جميع المشتريات للكورسات الفردية تعتبر نهائية وغير قابلة للاسترجاع بمجرد منح الوصول إليها.
                            </p>
                        </Card>

                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">2. الاشتراكات الشهرية/السنوية</h2>
                            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                                <p>بالنسبة لنظام الاشتراكات، تنطبق القواعد التالية:</p>
                                <ul className="list-disc list-inside space-y-2 mr-4">
                                    <li>يمكنك إلغاء تجديد اشتراكك في أي وقت من خلال إعدادات حسابك.</li>
                                    <li>عند الإلغاء، سيظل بإمكانك الوصول للمحتوى حتى نهاية الفترة المدفوعة الحالية.</li>
                                    <li>لا يتم رد المبالغ المدفوعة عن الفترات التي بدأت بالفعل.</li>
                                </ul>
                            </div>
                        </Card>

                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">3. الحالات الاستثنائية</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                في حال وجود خطأ تقني حال دون وصولك للمحتوى رغم نجاح عملية الدفع، يرجى التواصل مع فريق الدعم الفني خلال 48 ساعة لبحث إمكانية التعويض أو رد المبلغ.
                            </p>
                        </Card>

                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">4. كيفية طلب الدعم</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                لأي طلبات استرجاع أو استفسارات قانونية، يرجى التواصل عبر البريد الرسمي: <span className="font-bold text-primary">support@taallm.com</span>
                            </p>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
