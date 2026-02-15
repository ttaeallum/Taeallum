import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, Clock, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { pricingTiers } from "@/lib/ai-questions";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create checkout session");
      }
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Detect user's country and currency
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        const countryCurrency = data.currency?.toLowerCase();

        setDetectedCountry(data.country_name || "");

        if (countryCurrency && currencies[countryCurrency as CurrencyCode]) {
          setCurrency(countryCurrency as CurrencyCode);
        }
      } catch (error) {
        console.error("Failed to detect currency:", error);
      }
    };

    detectCurrency();
  }, []);

  const formatPrice = () => {
    // Default to 'pro' pricing since we only have one paid plan now
    const tierPrice = pricingTiers.pro.price;
    const price = tierPrice[currency] || tierPrice.usd;

    const yearlyPrice = isYearly ? Math.round(price * 12 * 0.8) : price;
    const monthlyEquivalent = isYearly ? Math.round(yearlyPrice / 12) : price;

    return {
      price: isYearly ? yearlyPrice : price,
      monthly: monthlyEquivalent,
      symbol: currencies[currency].symbol,
    };
  };

  const pricing = formatPrice();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-20" dir="rtl">
        <div className="container max-w-7xl px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-sm font-bold">
              <Sparkles className="w-4 h-4 ml-2" />
              خطة واحدة، كل المميزات
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-primary">
              اشتراك حمزة الذكي
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              احصل على مساعدك الشخصي الذكي، خطط دراسية لا نهائية، ودعم فني متواصل بسعر رمزي.
            </p>

            {/* Currency Selector */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="text-sm text-muted-foreground font-bold">العملة:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="px-4 py-2 rounded-lg border-2 border-primary/20 bg-background text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                {Object.entries(currencies).map(([code, data]) => (
                  <option key={code} value={code}>
                    {data.flag} {data.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12 bg-muted/30 p-2 rounded-full w-fit mx-auto border border-border">
              <span className={`text-sm px-4 py-1 rounded-full transition-all ${!isYearly ? "font-bold bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
                شهري
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm px-4 py-1 rounded-full transition-all ${isYearly ? "font-bold bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
                سنوي <span className="text-xs text-green-600 font-bold mr-1">(وفّر 20%)</span>
              </span>
            </div>
          </motion.div>

          {/* Main Pricing Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="relative overflow-hidden border-2 border-primary/20 shadow-2xl bg-background/60 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

              <div className="flex flex-col md:flex-row">
                {/* Price Section */}
                <div className="p-10 md:w-2/5 bg-primary/5 flex flex-col justify-center items-center text-center border-l border-border/50">
                  <div className="p-4 bg-primary/10 rounded-2xl mb-6">
                    <Zap className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">اشتراك شامل</h3>
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-5xl font-black text-primary">
                      {pricing.symbol}{pricing.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground font-medium">/{isYearly ? "سنة" : "شهر"}</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full mb-6">
                      تكلفة شهرية: {pricing.symbol}{pricing.monthly.toLocaleString()} فقط
                    </p>
                  )}

                  <Button
                    size="lg"
                    className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 hover:scale-105 transition-transform"
                    onClick={() => checkoutMutation.mutate("pro")}
                  >
                    اشترك الآن
                    <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    يمكنك إلغاء الاشتراك في أي وقت
                  </p>
                </div>

                {/* Features Section */}
                <div className="p-10 md:w-3/5">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    ماذا ستحصل عليه؟
                  </h3>
                  <div className="grid gap-4">
                    {pricingTiers.pro.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium text-foreground/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Satisfaction Guarantee */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                <ShieldCheck className="w-8 h-8 mx-auto text-primary mb-4" />
                <h4 className="font-bold mb-2">أمان وخصوصية</h4>
                <p className="text-sm text-muted-foreground">بياناتك ومحادثاتك مشفرة وآمنة تماماً</p>
              </div>
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                <Clock className="w-8 h-8 mx-auto text-primary mb-4" />
                <h4 className="font-bold mb-2">متاح دائماً</h4>
                <p className="text-sm text-muted-foreground">حمزة جاهز لمساعدتك 24 ساعة طوال أيام الأسبوع</p>
              </div>
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                <Headphones className="w-8 h-8 mx-auto text-primary mb-4" />
                <h4 className="font-bold mb-2">دعم فني</h4>
                <p className="text-sm text-muted-foreground">فريق دعم جاهز لحل أي مشكلة تواجهك</p>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
