import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Tag, Sparkles, BookOpen, Award, BrainCircuit, ClipboardCheck, Headphones, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { motion } from "framer-motion";
import { Seo } from "@/components/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const VALID_CODES: Record<string, number> = {
  "TAALLM20": 20,
  "WELCOME10": 10,
  "JORDAN25": 25,
};

const features = [
  { icon: BrainCircuit, label: "خارطة طريق ذكية مخصصة", desc: "خطة مصممة لنموك المهني، تبدأ من مستواك وتأخذك لأهدافك" },
  { icon: BookOpen, label: "وصول كامل وشامل للمحتوى", desc: "مئات الساعات من المحتوى المحدث باستمرار لأقوى المهارات" },
  { icon: ClipboardCheck, label: "تقييمات وتحديات مستمرة", desc: "كويزات وتحديات عملية تضمن تحويل المعرفة لمهارة برمجية" },
  { icon: Award, label: "شهادات إتمام احترافية", desc: "وثق إنجازاتك بشهادات رقمية تدعم ملفك الوظيفي وتقوي حضورك" },
  { icon: Sparkles, label: "مساعد ذكي يرافقك دائماً", desc: "تواصل مع مستشارك التعليمي الذكي في أي لحظة لتجاوز العقبات" },
  { icon: Zap, label: "تحديثات تقنية مستمرة", desc: "محتوى يتطور معك يواكب آخر التحديثات في عالم التكنولوجيا" },
  { icon: Headphones, label: "دعم فني وتوجيه متخصص", desc: "فريق دعم حقيقي جاهز للرد على استفساراتك وحل مشاكلك" },
];

export default function Pricing() {
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const basePrice = 50;
  const finalPrice = (basePrice * (1 - discount / 100)).toFixed(2);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (VALID_CODES[code]) {
      setDiscount(VALID_CODES[code]);
      setPromoSuccess(`✅ تم تطبيق كود الخصم! خصم ${VALID_CODES[code]}%`);
      setPromoError("");
    } else {
      setPromoError("❌ كود الخصم غير صحيح أو منتهي الصلاحية.");
      setPromoSuccess("");
      setDiscount(0);
    }
  };

  return (
    <Layout>
      <Seo title="الأسعار والاشتراك" description="اشترك في منصة تعلّم واحصل على وصول كامل للكورسات والمساعد الذكي والشهادات." />

      {/* Hero Section */}
      <div className="relative py-24 overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />
        <div className="container px-4 md:px-8 max-w-screen-lg text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              باقة شاملة واحدة — كل ما تحتاجه في مكان واحد
            </span>
            <h1 className="text-4xl md:text-6xl font-heading font-black mb-6 leading-tight">
              ابدأ رحلتك نحو الاحتراف
              <br />
              <span className="text-primary">اليوم وليس غداً</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              اشتراك واحد يمنحك وصولاً كاملاً لجميع الكورسات، خطط دراسية ذكية، شهادات معتمدة، ومساعد ذكي يرافقك خطوة بخطوة.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pricing Card + Features */}
      <div className="pb-24" dir="rtl">
        <div className="container px-4 md:px-8 max-w-screen-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Features List */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold mb-8">ماذا تحصل باشتراكك؟</h2>
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{f.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
              <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>بدون رسوم خفية — يمكنك الإلغاء في أي وقت</span>
              </div>
            </motion.div>

            {/* Pricing Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24"
            >
              <div className="relative bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                {/* Top gradient bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-primary to-purple-500" />

                <div className="p-8">
                  {/* Badge */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-bold text-muted-foreground">الاشتراك الشهري</span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 font-bold px-3 py-1 rounded-full border border-emerald-500/20">
                      🔥 الأكثر اختياراً
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-7xl font-black text-foreground tracking-tight">
                      {discount > 0 ? finalPrice : basePrice}
                    </span>
                    <span className="text-2xl text-muted-foreground font-medium mb-3">$</span>
                    <span className="text-lg text-muted-foreground font-medium mb-3">/ شهر</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl text-muted-foreground line-through">${basePrice}</span>
                      <span className="bg-emerald-500/10 text-emerald-600 text-sm font-bold px-2 py-0.5 rounded-lg">
                        خصم {discount}%
                      </span>
                    </div>
                  )}

                  {/* Promo Code */}
                  <div className="mb-6 mt-4 space-y-3">
                    <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      كود الخصم (اختياري)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="أدخل كود الخصم..."
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-12 text-right font-mono tracking-widest"
                        dir="ltr"
                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      />
                      <Button
                        variant="outline"
                        onClick={applyPromo}
                        className="h-12 px-5 font-bold shrink-0 border-primary/30 hover:bg-primary/5"
                      >
                        تطبيق
                      </Button>
                    </div>
                    {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                    {promoSuccess && <p className="text-xs text-emerald-600 font-medium">{promoSuccess}</p>}
                  </div>

                  {/* CTA Button */}
                  <Link href="/checkout/subscription">
                    <Button className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/25 relative overflow-hidden group">
                      <span className="relative z-10 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        اشترك الآن — {discount > 0 ? `$${finalPrice}` : "$50"}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>

                  <p className="text-center text-xs text-muted-foreground mt-3">
                    دفع آمن ومشفر — بدون رسوم خفية
                  </p>

                  {/* Divider */}
                  <div className="border-t border-border/40 my-6" />

                  {/* Mini features in card */}
                  <div className="space-y-3">
                    {[
                      "✅ خطط دراسية بالذكاء الاصطناعي",
                      "✅ وصول لجميع الكورسات والمسارات",
                      "✅ كويزات تقييمية بعد كل وحدة",
                      "✅ شهادات رقمية موثقة",
                      "✅ مساعد ذكي للمتابعة أول بأول",
                      "✅ دعم فني مستمر",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-muted/30 px-8 py-4 border-t border-border/40">
                  <p className="text-xs text-center text-muted-foreground mb-3">نقبل جميع البطاقات البنكية العالمية</p>
                  <div className="flex gap-3 justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 bg-muted/20 border-t border-border/40" dir="rtl">
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
              <AccordionTrigger className="text-lg font-medium">كيف تعمل أكواد الخصم؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                أدخل كود الخصم في الحقل المخصص في صفحات الأسعار ثم اضغط "تطبيق". سيتم تعديل السعر النهائي تلقائياً قبل إتمام الدفع.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg font-medium">ما الذي يميز الخطط الدراسية بالذكاء الاصطناعي؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                يقوم المساعد الذكي بتحليل مستواك الحالي وأهدافك المهنية ثم يبني لك خطة دراسية من الصفر حتى الاحتراف، مرتبة بالمستويات الثلاث (أساسيات، تخصص مشترك، تخصص عميق) مع جدول زمني واضح.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-lg font-medium">هل الشهادات معتمدة في سوق العمل؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                نقدم شهادات رقمية موثقة لكل كورس ومسار تعليمي، تُثبت اكتسابك مهارات محددة وقابلة للتحقق. يمكن إضافتها مباشرة لملفك على LinkedIn.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-lg font-medium">هل المحتوى مناسب للمبتدئين؟</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                نعم، لدينا مسارات مخصصة تبدأ معك من الصفر وتتدرج في المستوى حتى الاحتراف. المساعد الذكي يحدد نقطة البداية المناسبة لك بحسب مستواك.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
