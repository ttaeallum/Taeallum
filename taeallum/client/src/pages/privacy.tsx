import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Seo } from "@/components/seo";

export default function Privacy() {
  return (
    <Layout>
      <Seo title="سياسة الخصوصية" description="سياسة الخصوصية وحماية البيانات في منصة تعلّم." />
      <div className="min-h-screen py-16 md:py-24" dir="rtl">
        <div className="container max-w-3xl mx-auto px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-4">سياسة الخصوصية</h1>
            <p className="text-muted-foreground text-sm font-medium">آخر تحديث: فبراير 2026</p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">مقدمة</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                نحن في منصة تعلّم نقدر خصوصيتك. تشرح هذه السياسة كيف نجمع وننظم ونستخدم معلوماتك الشخصية عند استخدامك لخدماتنا.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">1. المعلومات التي نجمعها</h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>نجمع المعلومات الضرورية فقط لتوفير الخدمة:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>معلومات التسجيل: الاسم والبريد الإلكتروني</li>
                  <li>معلومات الدفع: تتم معالجتها بشكل آمن عبر مزودي الخدمة المعتمدين</li>
                  <li>معلومات الاستخدام: الكورسات والتقدم التعليمي</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">2. حماية البيانات</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                نستخدم تقنيات التشفير المتقدمة لحماية معلوماتك. جميع البيانات المرسلة محمية ببروتوكولات SSL/TLS لضمان أمان تواصلك مع المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">3. ملفات تعريف الارتباط</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك وتذكر تفضيلاتك. يمكنك التحكم في ذلك من خلال إعدادات متصفحك.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">4. حقوقك</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                لديك الحق في الوصول إلى معلوماتك الشخصية، تعديلها، أو طلب حذفها في أي وقت من خلال إعدادات حسابك أو التواصل معنا.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">5. التواصل</h2>
              <p className="text-muted-foreground leading-relaxed text-sm italic">
                لأي استفسارات بخصوص الخصوصية والبيانات، يرجى مراسلتنا على: info@taallm.com
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
