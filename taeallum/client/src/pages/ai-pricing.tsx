import { useState } from "react";
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

const PRICE_FULL = 50;

// PayTabs links
const PAYTABS_FULL_LINK = "https://secure-jordan.paytabs.com/payment/link/175686/8515210";
const PAYTABS_DISCOUNTED_LINK = "https://secure-jordan.paytabs.com/payment/link/175686/8515210"; // TODO: replace with $70 link

export default function AIPricing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentPrice = PRICE_FULL;

  return (
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
                    <span className="text-5xl font-black text-primary">${currentPrice}</span>
                  </div>



                  <div className="w-full space-y-3 mt-6">
                    <Button 
                      className="w-full h-14 text-lg font-bold bg-[#ffc439] hover:bg-[#f2ba36] text-black border-none rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
                      onClick={() => window.open("https://www.paypal.com/ncp/payment/CW7JB9W9SH9NE", "_blank")}
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.723a1.603 1.603 0 0 1 1.581-1.337h10.334c1.132 0 2.03.905 2.108 2.04.09 1.343-.16 2.875-.75 4.595-1.07 3.12-3.882 4.14-7.42 4.14h-1.63a.801.801 0 0 0-.791.669l-1.3 6.808z"/>
                      </svg>
                      الدفع بواسطة PayPal
                    </Button>

                    <Button 
                      className="w-full h-14 text-lg font-bold bg-black hover:bg-zinc-900 text-white border-none rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
                      onClick={() => window.open("https://www.paypal.com/ncp/payment/CW7JB9W9SH9NE", "_blank")}
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                        <path d="M17.05 20.28c-.96.95-2.14 1.43-3.15 1.43-1.43 0-2.45-.63-3.64-.63-1.18 0-2.46.63-3.64.63-1.01 0-2.19-.48-3.15-1.43C1.61 18.23 0 14.88 0 11.83c0-3.32 2.02-5.49 4.2-5.49 1.1 0 1.94.67 2.88.67.92 0 1.62-.67 2.88-.67 2.18 0 4.2 2.17 4.2 5.49 0 3.05-1.61 6.4-3.11 8.46M12.03 4.54c-.66.86-1.58 1.46-2.61 1.46-.11 0-.22 0-.32-.01-.12-1.39.52-2.73 1.3-3.62.66-.76 1.71-1.37 2.76-1.37.11 0 .22 0 .32.01.14 1.41-.55 2.77-1.45 3.53z"/>
                      </svg>
                      الدفع بواسطة Apple Pay
                    </Button>
                    
                    <p className="text-[10px] text-center text-muted-foreground/60 mt-2">
                      سيتم فتح بوابة PayPal الآمنة لإتمام العملية
                    </p>
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
  );
}
