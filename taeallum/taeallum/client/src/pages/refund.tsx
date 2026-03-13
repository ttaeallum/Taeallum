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
                            <h2 className="text-xl font-bold mb-4">1. سياسة المنتجات الرقمية</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                نظراً لأن الخدمات المقدمة هي منتجات رقمية (دورات تدريبية واشتراكات في أدوات ذكاء اصطناعي) يتم تفعيلها فورياً، فإن المبالغ المدفوعة لا يمكن استردادها بمجرد بدء الوصول إلى المحتوى التعليمي. هذا الإجراء ضروري لحماية حقوق الملكية الفكرية وتكاليف تشغيل الخوادم.
                            </p>
                        </Card>

                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">2. الاشتراكات المتكررة</h2>
                            <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                                <p>بشأن نظام الاشتراكات الشهرية أو السنوية:</p>
                                <ul className="list-disc list-inside space-y-2 mr-4">
                                    <li>يمكنك إلغاء الاشتراك في أي وقت، ولن يتم سحب مبالغ إضافية في الدورة القادمة.</li>
                                    <li>لا تتوفر مبالغ مستردة جزئية للفترات الزمنية المتبقية من الشهر الحالي.</li>
                                    <li>يحق للمنصة إلغاء أي اشتراك في حال ثبوت مخالفة شروط الاستخدام دون التزام برد المبلغ.</li>
                                </ul>
                            </div>
                        </Card>

                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">3. المشاكل التقنية واسترجاع الأموال</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                في حالات استثنائية (مثل تكرار الخصم عن طريق الخطأ أو وجود عطل فني يمنع الوصول للمنصة تماماً لم يتم إصلاحه خلال 72 ساعة)، يتم تقديم طلب استرجاع عبر البريد الرسمي بشرط عدم تجاوز 24 ساعة من تاريخ العملية.
                            </p>
                        </Card>

                        <Card className="p-8 border-border/30 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">4. قنوات الدعم الرسمية</h2>
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                للتواصل مع القسم المالي وبحث حالاتكم الخاصة، يرجى مراسلتنا فقط عبر: <span className="font-bold text-primary">info@taallm.com</span>
                            </p>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
