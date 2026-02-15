import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-12">
        <div className="container max-w-4xl px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              سياسة الخصوصية
            </h1>
            <p className="text-muted-foreground">
              آخر تحديث: يناير 2026
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">مقدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن في منصة تعلّم نقدر خصوصيتك. تشرح هذه السياسة كيف نجمع وننظم ونستخدم معلوماتك الشخصية.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">1. المعلومات التي نجمعها</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>نجمع المعلومات التالية:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>معلومات التسجيل: الاسم والبريد الإلكتروني وكلمة المرور</li>
                  <li>معلومات الملف الشخصي: الصورة والمدينة والاهتمامات</li>
                  <li>معلومات الدفع: بيانات البطاقة (معالجة بواسطة Stripe)</li>
                  <li>معلومات الاستخدام: الكورسات المتابعة والتقدم</li>
                  <li>معلومات التصفح: عنوان IP والمتصفح والجهاز</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">2. كيف نستخدم معلوماتك</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>نستخدم معلوماتك لـ:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>توفير وتحسين خدماتنا</li>
                  <li>معالجة الدفع والفواتير</li>
                  <li>إرسال تحديثات وإشعارات مهمة</li>
                  <li>تخصيص تجربتك على المنصة</li>
                  <li>تحليل الاستخدام وتحسين الأداء</li>
                  <li>الامتثال للقوانين والتزاماتنا القانونية</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">3. حماية البيانات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن نستخدم تقنيات التشفير والحماية المتقدمة لحماية معلوماتك الشخصية. جميع البيانات المرسلة محمية بـ SSL/TLS. بيانات الدفع تتم معالجتها بواسطة Stripe وفقاً لمعايير PCI DSS.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">4. مشاركة البيانات</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>عندما يكون ذلك ضرورياً لتوفير الخدمة (مثل Stripe للدفع)</li>
                  <li>عندما يكون مطلوباً بموجب القانون</li>
                  <li>عندما تعطينا إذناً صريحاً</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">5. ملفات تعريف الارتباط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك. رفض ملفات تعريف الارتباط قد يؤثر على وظائف المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">6. حقوقك</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  لديك الحق في:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>الوصول إلى معلوماتك الشخصية</li>
                  <li>تصحيح المعلومات غير الدقيقة</li>
                  <li>حذف حسابك وبيانات</li>
                  <li>الاعتراض على معالجة بيانات</li>
                  <li>نقل بيانات إلى جهة أخرى</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">7. الاحتفاظ بالبيانات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بمعلوماتك طالما كان حسابك نشطاً. بعد حذف حسابك، سيتم حذف البيانات خلال 30 يوماً، باستثناء البيانات المطلوبة قانوناً.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">8. الأطفال</h2>
              <p className="text-muted-foreground leading-relaxed">
                المنصة موجهة للأشخاص البالغين من العمر 18 سنة فأكثر. لا نجمع عن قصد معلومات من الأطفال دون 18 سنة. إذا أدركنا أننا جمعنا معلومات من طفل، سنحذفها فوراً.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">9. تحديث السياسة</h2>
              <p className="text-muted-foreground leading-relaxed">
                قد نحدث هذه السياسة من وقت لآخر. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">10. التواصل معنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كان لديك أسئلة حول سياسة الخصوصية أو ممارسات البيانات الخاصة بنا، يرجى التواصل معنا:
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground">
                  البريد الإلكتروني: privacy@taallm.com
                </p>
                <p className="text-muted-foreground">
                  الهاتف: +966 50 123 4567
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
