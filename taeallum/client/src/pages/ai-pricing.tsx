import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Sparkles, Zap, ArrowRight, ShieldCheck, Clock, Headphones, Tag, X } from "lucide-react";
import { motion } from "framer-motion";
import { pricingTiers } from "@/lib/ai-questions";

const PROMO_CODE = "TAALLUM30";
const PRICE_FULL = 50;
const PRICE_DISCOUNTED = 35;

// PayTabs links
const PAYTABS_FULL_LINK = "https://secure-jordan.paytabs.com/payment/link/175686/8515210";
const PAYTABS_DISCOUNTED_LINK = "https://secure-jordan.paytabs.com/payment/link/175686/8515210"; // TODO: replace with $70 link

export default function AIPricing() {
  const [promoInput, setPromoInput] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentPrice = discountApplied ? PRICE_DISCOUNTED : PRICE_FULL;
  const paymentLink = discountApplied ? PAYTABS_DISCOUNTED_LINK : PAYTABS_FULL_LINK;

  const handleApplyPromo = () => {
    if (promoInput.trim().toUpperCase() === PROMO_CODE) {
      setDiscountApplied(true);
      setPromoError("");
    } else {
      setPromoError("كود الخصم غير صحيح. تأكد من الكود وحاول مجدداً.");
    }
  };

  const handleRemovePromo = () => {
    setDiscountApplied(false);
    setPromoInput("");
    setPromoError("");
  };

  return (
    <PayPalScriptProvider options={{ clientId: "AWIukiVVZaHXiMRjZz9kNtnMxYVBuzf9BitSgltroDI0RqVgtFNdqwxZwT6Po9RSGtvJ2fhcBZDXMjaV", "enable-funding": "paypal", currency: "EUR" }}>
      <Layout>
      <div className="min-h-screen py-16 md:py-24" dir="rtl">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-sm font-bold">
              <Sparkles className="w-4 h-4 ml-2" />
              استثمار واحد، مسيرة بأكملها
            </Badge>
            <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tight text-primary">
              الخطة الدراسية الاحترافية
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
              خطة دراسية شخصية مدروسة بالذكاء الاصطناعي — من الصفر إلى الاحتراف في تخصصك.
            </p>
            <p className="text-sm text-green-600 font-bold bg-green-100 px-6 py-2 rounded-full w-fit mx-auto mb-10 border border-green-200 shadow-sm">
              دفعة واحدة — وصول مدى الحياة
            </p>
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
                  <h3 className="text-2xl font-bold mb-2">خطة متكاملة</h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 my-4 justify-center">
                    {discountApplied && (
                      <span className="text-2xl font-bold text-muted-foreground line-through opacity-50">
                      €{PRICE_FULL}
                    </span>
                  )}
                  <span className="text-5xl font-black text-primary">€{currentPrice}</span>
                </div>

                {discountApplied && (
                  <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20 font-bold">
                    🎉 وفّرت €{PRICE_FULL - PRICE_DISCOUNTED}!
                  </Badge>
                )}

                  {/* Promo Code Input */}
                  {!discountApplied ? (
                    <div className="w-full space-y-2 mb-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="كود الخصم"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          className="text-center font-bold tracking-widest"
                          onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        />
                        <Button variant="outline" size="sm" onClick={handleApplyPromo} className="shrink-0">
                          <Tag className="w-4 h-4" />
                        </Button>
                      </div>
                      {promoError && (
                        <p className="text-xs text-red-500 font-bold">{promoError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full mb-4">
                      <div className="flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                        <span className="text-green-600 text-sm font-black">{PROMO_CODE}</span>
                        <button onClick={handleRemovePromo} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="w-full relative z-0 mt-4">
                    <PayPalButtons
                      style={{ layout: "vertical", shape: "rect", color: "blue", label: "pay" }}
                      createOrder={async () => {
                        console.log("PayPal createOrder initiated");
                        try {
                          const courseId = discountApplied ? "subscription_discounted" : "subscription";
                          console.log("[DEBUG] Fetching /api/payments/paypal/create-order with courseId:", courseId);
                          const res = await fetch("/api/payments/paypal/create-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ courseId }),
                          });
                          
                          if (!res.ok) {
                            const errorText = await res.text();
                            console.error("[DEBUG] Backend error response:", errorText);
                            throw new Error(`Server error: ${res.status} ${errorText}`);
                          }

                          const data = await res.json();
                          console.log("[DEBUG] PayPal order created successfully:", data.id);
                          return data.id;
                        } catch (err: any) {
                          toast({ title: "خطأ", description: err.message, variant: "destructive" });
                          throw err;
                        }
                      }}
                      onApprove={async (data, actions) => {
                        try {
                          const res = await fetch("/api/payments/paypal/capture-order", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orderID: data.orderID }),
                          });
                          const captureData = await res.json();
                          if (!res.ok) throw new Error(captureData.message || "Failed to capture order");
                          
                          toast({ title: "نجاح", description: "تم الدفع بنجاح! جاري إعداد خطتك..." });
                          await queryClient.invalidateQueries({ queryKey: ["auth-me"] });
                          window.location.href = `/dashboard?session_id=${data.orderID}&plan=subscription&gateway=paypal`;
                        } catch (err: any) {
                          toast({ title: "خطأ", description: err.message, variant: "destructive" });
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal SDK Error:", err);
                        toast({ title: "خطأ", description: "حدث خطأ أثناء الاتصال بـ PayPal. يرجى المحاولة لاحقاً.", variant: "destructive" });
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    دفعة واحدة — بدون رسوم شهرية
                  </p>
                </div>

                {/* Features Section */}
                <div className="p-10 md:w-3/5">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-primary" />
                    ماذا تحصل في خطتك الدراسية؟
                  </h3>
                  <div className="grid gap-4">
                    {[
                      "خارطة طريق ذكية مخصصة لمسارك المهني",
                      "إتقان الجوهر التقني (Core IT) كأساس متين",
                      "تخصص منهجي متدرج من الصفر حتى الاحتراف",
                      "التعمق في المهارات الأكثر طلباً في سوق العمل",
                      "نظام تقييم وتحديات دورية لقياس المستوى",
                      "شهادات إتمام رقمية موثقة لكل مرحلة",
                      "مرافقة ذكية ودعم تقني على مدار الساعة",
                      "استثمار لمرة واحدة مع وصول كامل مدى الحياة",
                      "تحديثات مستمرة تواكب أحدث تقنيات السوق",
                    ].map((feature, idx) => (
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

            {/* Trust Badges */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                <ShieldCheck className="w-8 h-8 mx-auto text-primary mb-4" />
                <h4 className="font-bold mb-2">أمان وخصوصية</h4>
                <p className="text-sm text-muted-foreground">بياناتك محمية وآمنة تماماً</p>
              </div>
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                <Clock className="w-8 h-8 mx-auto text-primary mb-4" />
                <h4 className="font-bold mb-2">وصول مدى الحياة</h4>
                <p className="text-sm text-muted-foreground">خطتك متاحة دائماً بدون انتهاء صلاحية</p>
              </div>
              <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                <Headphones className="w-8 h-8 mx-auto text-primary mb-4" />
                <h4 className="font-bold mb-2">دعم فني</h4>
                <p className="text-sm text-muted-foreground">فريق دعم جاهز لمساعدتك دائماً</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
    </PayPalScriptProvider>
  );
}
