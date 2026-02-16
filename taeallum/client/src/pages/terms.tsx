import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Seo } from "@/components/seo";

export default function Terms() {
  return (
    <Layout>
      <Seo title="الشروط والأحكام" description="الشروط والأحكام القانونية لاستخدام منصة تعلّم." />
      <div className="min-h-screen py-16 md:py-24" dir="rtl">
        <div className="container max-w-3xl mx-auto px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold mb-4">الشروط والأحكام</h1>
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
              <h2 className="text-xl font-bold mb-4">1. قبول الشروط</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                بالوصول إلى واستخدام منصة تعلّم، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">2. استخدام المنصة</h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>أنت توافق على استخدام المنصة فقط للأغراض القانونية والمشروعة. لا يجوز لك:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>انتهاك أي قوانين أو لوائح محلية أو دولية</li>
                  <li>نسخ أو توزيع محتوى المنصة بدون إذن كتابي</li>
                  <li>محاولة الوصول غير المصرح به إلى أنظمة المنصة</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">3. حقوق الملكية الفكرية</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                جميع المحتوى على المنصة، بما في ذلك النصوص والصور والفيديوهات والكود، محمي بموجب قوانين الملكية الفكرية. لا يجوز لك استخدام أي محتوى بدون إذن كتابي من منصة تعلّم.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">4. الدفع والفواتير</h2>
              <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
                <p>عند اختيار خطة مدفوعة، فإنك توافق على:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>دفع الرسوم المحددة في الوقت المحدد</li>
                  <li>توفير معلومات دفع دقيقة وكاملة</li>
                  <li>الامتثال لسياسة الاستحقاق الخاصة بنا</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">5. المسؤولية</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                لن تكون منصة تعلّم مسؤولة عن أي أضرار غير مباشرة أو عرضية ناشئة عن استخدام أو عدم القدرة على استخدام المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/30 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">11. التواصل</h2>
              <p className="text-muted-foreground leading-relaxed text-sm italic">
                إذا كان لديك أي أسئلة، يرجى التواصل معنا على البريد الرسمي: info@taallm.com
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
