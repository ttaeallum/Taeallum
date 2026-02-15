import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Terms() {
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
              الشروط والأحكام
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
              <h2 className="text-2xl font-bold mb-4">1. قبول الشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                بالوصول إلى واستخدام منصة تعلّم (Learn-Platform)، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">2. استخدام المنصة</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  أنت توافق على استخدام المنصة فقط للأغراض القانونية والمشروعة. لا يجوز لك:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>انتهاك أي قوانين أو لوائح محلية أو دولية</li>
                  <li>نسخ أو توزيع محتوى المنصة بدون إذن</li>
                  <li>محاولة الوصول غير المصرح به إلى أنظمة المنصة</li>
                  <li>إرسال برامج ضارة أو فيروسات</li>
                  <li>الانخراط في أي نشاط يعطل خدمات المنصة</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">3. حقوق الملكية الفكرية</h2>
              <p className="text-muted-foreground leading-relaxed">
                جميع المحتوى على المنصة، بما في ذلك النصوص والصور والفيديوهات والكود، محمي بموجب قوانين الملكية الفكرية. لا يجوز لك استخدام أي محتوى بدون إذن كتابي من منصة تعلّم.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">4. حسابك الشخصي</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  أنت مسؤول عن الحفاظ على سرية بيانات حسابك. أنت توافق على:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>عدم مشاركة كلمة المرور مع أي شخص</li>
                  <li>إخطارنا فوراً بأي وصول غير مصرح به</li>
                  <li>تسجيل الخروج من حسابك على الأجهزة المشتركة</li>
                  <li>تحمل مسؤولية جميع الأنشطة على حسابك</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">5. الدفع والفواتير</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  عند اختيار خطة مدفوعة، فإنك توافق على:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>دفع الرسوم المحددة في الوقت المحدد</li>
                  <li>توفير معلومات دفع دقيقة وكاملة</li>
                  <li>تحديث معلومات الدفع عند الحاجة</li>
                  <li>الامتثال لسياسة الاسترجاع الخاصة بنا</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">6. سياسة الاسترجاع</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا لم تكن راضياً عن الخدمة، يمكنك طلب استرجاع كامل المبلغ خلال 7 أيام من تاريخ الشراء. بعد هذه الفترة، لا يمكن استرجاع المبلغ.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">7. الإلغاء والإنهاء</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  يمكنك إلغاء اشتراكك في أي وقت من لوحة التحكم الخاصة بك. عند الإلغاء:
                </p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>سيتم إيقاف الوصول إلى الخدمات المدفوعة فوراً</li>
                  <li>لن يتم استرجاع الرسوم المدفوعة للفترة الحالية</li>
                  <li>ستحتفظ بالوصول إلى المحتوى المجاني</li>
                </ul>
              </div>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">8. تحديل الشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">9. المسؤولية المحدودة</h2>
              <p className="text-muted-foreground leading-relaxed">
                لن تكون منصة تعلّم مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية ناشئة عن استخدام أو عدم القدرة على استخدام المنصة.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">10. القانون الحاكم</h2>
              <p className="text-muted-foreground leading-relaxed">
                تخضع هذه الشروط والأحكام للقانون السعودي. أي نزاع سينظر فيه المحاكم المختصة في الرياض.
              </p>
            </Card>

            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-4">11. التواصل</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا على:
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-muted-foreground">
                  البريد الإلكتروني: support@taallm.com
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
