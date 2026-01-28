import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { pricingTiers } from "@/lib/ai-questions";

// Currency data
const currencies = {
  usd: { symbol: "$", name: "USD", flag: "🇺🇸" },
  eur: { symbol: "€", name: "EUR", flag: "🇪🇺" },
  gbp: { symbol: "£", name: "GBP", flag: "🇬🇧" },
  aed: { symbol: "د.إ", name: "AED", flag: "🇦🇪" },
  sar: { symbol: "ر.س", name: "SAR", flag: "🇸🇦" },
  egp: { symbol: "ج.م", name: "EGP", flag: "🇪🇬" },
  jod: { symbol: "د.أ", name: "JOD", flag: "🇯🇴" },
  iqd: { symbol: "د.ع", name: "IQD", flag: "🇮🇶" },
};

type CurrencyCode = keyof typeof currencies;

export default function AIPricing() {
  const [, setLocation] = useLocation();
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("usd");
  const [detectedCountry, setDetectedCountry] = useState<string>("");

  // Detect user's country and currency
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        const countryCurrency = data.currency?.toLowerCase();

        setDetectedCountry(data.country_name || "");

        // Map currency if supported
        if (countryCurrency && currencies[countryCurrency as CurrencyCode]) {
          setCurrency(countryCurrency as CurrencyCode);
        }
      } catch (error) {
        console.error("Failed to detect currency:", error);
      }
    };

    detectCurrency();
  }, []);

  const formatPrice = (tier: "personal" | "pro") => {
    const price = pricingTiers[tier].price[currency];
    const yearlyPrice = isYearly ? Math.round(price * 12 * 0.8) : price;
    const monthlyEquivalent = isYearly ? Math.round(yearlyPrice / 12) : price;

    return {
      price: isYearly ? yearlyPrice : price,
      monthly: monthlyEquivalent,
      symbol: currencies[currency].symbol,
    };
  };

  const plans = [
    {
      id: "personal",
      name: "Personal",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      popular: true,
      description: "للطلاب والمحترفين الذين يريدون خطة واضحة",
      features: pricingTiers.personal.features,
    },
    {
      id: "pro",
      name: "Pro",
      icon: Crown,
      color: "from-amber-500 to-orange-500",
      popular: false,
      description: "للجادين في تطوير مسارهم المهني",
      features: pricingTiers.pro.features,
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-20">
        <div className="container max-w-7xl px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              المساعد الذكي المدعوم بـ AI
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              اختر خطتك المثالية
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              احصل على خطة دراسية مخصصة من <span className="font-bold text-primary">500 دورة مجانية</span> مع متابعة ذكية ودعم احترافي
            </p>

            {/* Currency Selector */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-sm text-muted-foreground">العملة:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
              >
                {Object.entries(currencies).map(([code, data]) => (
                  <option key={code} value={code}>
                    {data.flag} {data.name}
                  </option>
                ))}
              </select>
              {detectedCountry && (
                <span className="text-xs text-muted-foreground">
                  (تم اكتشاف: {detectedCountry})
                </span>
              )}
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isYearly ? "font-bold" : "text-muted-foreground"}`}>
                شهري
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={`text-sm ${isYearly ? "font-bold" : "text-muted-foreground"}`}>
                سنوي
              </span>
              {isYearly && (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  وفّر 20%
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Free Tier Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    500 دورة مجانية بالكامل! 🎉
                  </h3>
                  <p className="text-muted-foreground">
                    تصفح وتعلم من مكتبتنا الضخمة بدون أي تكلفة. المساعد الذكي يساعدك فقط في اختيار المسار الأنسب لك.
                  </p>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation("/courses")}
                  className="whitespace-nowrap"
                >
                  تصفح الدورات المجانية
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const pricing = formatPrice(plan.id as "personal" | "pro");
              const Icon = plan.icon;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        الأكثر شعبية
                      </Badge>
                    </div>
                  )}

                  <Card className={`h-full p-8 ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
                    {/* Header */}
                    <div className="mb-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">
                          {pricing.symbol}{pricing.price.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          /{isYearly ? "سنة" : "شهر"}
                        </span>
                      </div>
                      {isYearly && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {pricing.symbol}{pricing.monthly.toLocaleString()} شهرياً
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full mb-6"
                      size="lg"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => setLocation(`/ai-agent?plan=${plan.id}`)}
                    >
                      ابدأ الآن
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </Button>

                    {/* Features */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">
                        المميزات:
                      </p>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20"
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              مقارنة تفصيلية
            </h2>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right p-4 font-semibold">الميزة</th>
                      <th className="text-center p-4 font-semibold">Personal</th>
                      <th className="text-center p-4 font-semibold">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-4">الوصول للدورات المجانية</td>
                      <td className="text-center p-4">✅</td>
                      <td className="text-center p-4">✅</td>
                    </tr>
                    <tr>
                      <td className="p-4">عدد الأسئلة</td>
                      <td className="text-center p-4">20 سؤال</td>
                      <td className="text-center p-4">غير محدود</td>
                    </tr>
                    <tr>
                      <td className="p-4">خطة دراسية مخصصة</td>
                      <td className="text-center p-4">✅</td>
                      <td className="text-center p-4">✅ متقدمة</td>
                    </tr>
                    <tr>
                      <td className="p-4">محادثة AI مباشرة (GPT-4)</td>
                      <td className="text-center p-4">❌</td>
                      <td className="text-center p-4">✅</td>
                    </tr>
                    <tr>
                      <td className="p-4">تحديث الخطة</td>
                      <td className="text-center p-4">1/شهر</td>
                      <td className="text-center p-4">غير محدود</td>
                    </tr>
                    <tr>
                      <td className="p-4">جلسات استشارية</td>
                      <td className="text-center p-4">❌</td>
                      <td className="text-center p-4">2/شهر</td>
                    </tr>
                    <tr>
                      <td className="p-4">مجموعة دراسية خاصة</td>
                      <td className="text-center p-4">❌</td>
                      <td className="text-center p-4">✅</td>
                    </tr>
                    <tr>
                      <td className="p-4">الدعم الفني</td>
                      <td className="text-center p-4">بريد إلكتروني</td>
                      <td className="text-center p-4">24/7 أولوية</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-12">
              أسئلة شائعة
            </h2>

            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="font-bold mb-2">هل الدورات مجانية؟</h3>
                <p className="text-sm text-muted-foreground">
                  نعم! جميع الـ 500 دورة مجانية بالكامل. المساعد الذكي هو خدمة إضافية تساعدك في اختيار المسار الأنسب ومتابعة تقدمك.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">ما الفرق بين Personal و Pro؟</h3>
                <p className="text-sm text-muted-foreground">
                  Personal يعطيك خطة ثابتة بناءً على إجاباتك. Pro يستخدم GPT-4 للمحادثة المباشرة وتعديل الخطة ديناميكياً حسب تقدمك.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">هل يمكنني إلغاء الاشتراك؟</h3>
                <p className="text-sm text-muted-foreground">
                  نعم، يمكنك إلغاء الاشتراك في أي وقت. لن يتم تجديد الاشتراك تلقائياً بعد انتهاء الفترة الحالية.
                </p>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-2">هل هناك تجربة مجانية؟</h3>
                <p className="text-sm text-muted-foreground">
                  نعم! يمكنك تجربة المساعد الذكي لمدة 14 يوم مجاناً قبل أن يتم تحصيل أي رسوم.
                </p>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
