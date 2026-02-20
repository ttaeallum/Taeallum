import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Pricing() {
  return (
    <Layout>
      <div className="bg-muted/30 py-20">
        <div className="container px-4 md:px-8 max-w-screen-lg text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">باقة واحدة، كل المزايا</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16">
            نؤمن بأن التعليم يجب أن يكون متاحاً للجميع. لذلك نقدم خطة اشتراك واحدة تمنحك الوصول الكامل لكل شيء.
          </p>

          <div className="relative bg-card rounded-3xl shadow-2xl border border-border overflow-hidden max-w-md mx-auto">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-400 to-primary"></div>
            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-bold text-muted-foreground mb-4">الاشتراك الشهري</h3>
              <div className="flex items-baseline justify-center gap-2 mb-8">
                <span className="text-6xl font-black text-foreground">45</span>
                <span className="text-xl text-muted-foreground font-medium">ر.س / شهر</span>
              </div>

              <Link href="/checkout/subscription">
                <Button
                  className="w-full h-14 text-lg font-bold rounded-xl mb-8 shadow-lg shadow-primary/20"
                >
                  45 ريال — ادفع الآن
                </Button>
              </Link>

              <div className="space-y-4 text-right">
                {[
                  "وصول غير محدود لجميع الكورسات",
                  "مسارات تعليمية متكاملة",
                  "شهادات إتمام للكورسات",
                  "مشاريع تطبيقية عملية",
                  "تحديثات مستمرة للمحتوى",
                  "مشاهدة بدون إنترنت (عبر التطبيق)",
                  "دعم فني على مدار الساعة"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-muted/50 p-4 text-center text-sm text-muted-foreground">
              ضمان استرداد الأموال خلال 14 يوم
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 bg-background">
        <div className="container px-4 md:px-8 max-w-screen-md">
          <h2 className="text-3xl font-bold text-center mb-12">الأسئلة الشائعة</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-medium">هل يمكنني إلغاء الاشتراك في أي وقت؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                نعم، يمكنك إلغاء اشتراكك في أي وقت من خلال لوحة التحكم الخاصة بك. سيستمر اشتراكك فعالاً حتى نهاية الفترة المدفوعة.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-medium">هل الشهادات معتمدة؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                نقدم شهادات إتمام لكل كورس ومسار تعليمي. شهاداتنا معترف بها في سوق العمل وتثبت اكتسابك للمهارات العملية.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">هل المحتوى مناسب للمبتدئين؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                نعم، لدينا مسارات مخصصة تبدأ معك من الصفر وتتدرج في المستوى حتى الاحتراف. كل دورة موضح مستواها بوضوح.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
