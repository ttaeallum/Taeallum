import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    category: "الكورسات",
    question: "هل جميع الكورسات مجانية؟",
    answer:
      "نعم! جميع الكورسات والمسارات التعليمية على منصة تعلّم مجانية تماماً. يمكنك الوصول إلى جميع المحتوى التعليمي بدون أي رسوم. الخدمة المدفوعة الوحيدة هي خدمة المدرب الشخصي بالذكاء الاصطناعي.",
  },
  {
    id: "2",
    category: "الكورسات",
    question: "هل يمكنني تحميل الكورسات للعمل بدون إنترنت؟",
    answer:
      "حالياً، المنصة تتطلب اتصال إنترنت للوصول إلى المحتوى. نحن نعمل على إضافة ميزة التحميل المسبق في المستقبل القريب.",
  },
  {
    id: "3",
    category: "الكورسات",
    question: "هل هناك شهادات عند إكمال الكورس؟",
    answer:
      "نعم، عند إكمال أي كورس بنجاح، ستحصل على شهادة رسمية قابلة للتحميل والمشاركة على LinkedIn وملفاتك الشخصية.",
  },
  {
    id: "4",
    category: "المدرب الشخصي",
    question: "كيف يعمل المدرب الشخصي بالذكاء الاصطناعي؟",
    answer:
      "المدرب الشخصي يطرح عليك 10 أسئلة ذكية لفهم أهدافك وخبرتك وأسلوب تعلمك. بناءً على إجاباتك، ينشئ لك خطة دراسية مخصصة تماماً تناسب احتياجاتك.",
  },
  {
    id: "5",
    category: "المدرب الشخصي",
    question: "ما الفرق بين خطة مخصصة وخطة + متابعة؟",
    answer:
      "خطة مخصصة ($49): توفر خطة دراسية مخصصة لمرة واحدة. خطة + متابعة ($149/شهر): توفر الخطة المخصصة بالإضافة إلى متابعة أسبوعية وتوصيات ذكية مستمرة ودعم 24/7.",
  },
  {
    id: "6",
    category: "المدرب الشخصي",
    question: "هل يمكنني الترقية من خطة إلى أخرى؟",
    answer:
      "نعم، يمكنك الترقية من خطة مخصصة إلى خطة + متابعة في أي وقت. سيتم احتساب الفرق في السعر.",
  },
  {
    id: "7",
    category: "الدفع",
    question: "ما طرق الدفع المتاحة؟",
    answer:
      "نحن نقبل جميع بطاقات الائتمان (Visa, Mastercard, American Express) والمحافظ الرقمية. الدفع آمن وموثوق عبر Stripe.",
  },
  {
    id: "8",
    category: "الدفع",
    question: "هل يمكنني استرجاع المال؟",
    answer:
      "نعم، إذا لم تكن راضياً عن الخدمة في أول 7 أيام، سنعيد لك كامل المبلغ بدون أسئلة.",
  },
  {
    id: "9",
    category: "الدفع",
    question: "هل يمكنني إلغاء الاشتراك في أي وقت؟",
    answer:
      "نعم، يمكنك إلغاء اشتراكك في أي وقت من لوحة التحكم الخاصة بك. لا توجد التزامات طويلة الأجل.",
  },
  {
    id: "10",
    category: "الحساب",
    question: "كيف أنشئ حساباً؟",
    answer:
      "يمكنك التسجيل مباشرة من الموقع باستخدام بريدك الإلكتروني أو حسابك على Google. التسجيل مجاني وسريع.",
  },
  {
    id: "11",
    category: "الحساب",
    question: "هل يمكنني استخدام حساب واحد على أجهزة متعددة؟",
    answer:
      "نعم، يمكنك تسجيل الدخول على حسابك من أي جهاز. محتوى تعلمك سيكون متزامناً عبر جميع الأجهزة.",
  },
  {
    id: "12",
    category: "الحساب",
    question: "كيف أغير كلمة المرور؟",
    answer:
      "يمكنك تغيير كلمة المرور من إعدادات حسابك. انقر على صورة ملفك الشخصي ثم اختر 'الإعدادات' ثم 'الأمان'.",
  },
];

const categories = ["الكل", "الكورسات", "المدرب الشخصي", "الدفع", "الحساب"];

export default function FAQ() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = faqItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "الكل" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-12">
        <div className="container max-w-4xl px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              الأسئلة الشائعة
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              هنا ستجد إجابات لأكثر الأسئلة التي يطرحها مستخدمونا
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث عن سؤال..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* FAQ Items */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="overflow-hidden border-border/40 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(
                        expandedId === item.id ? null : item.id
                      )
                    }
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">
                            {item.question}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.category}
                          </p>
                        </div>
                        <motion.div
                          animate={{
                            rotate: expandedId === item.id ? 180 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {expandedId === item.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-border/40"
                          >
                            <p className="text-muted-foreground leading-relaxed">
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground text-lg">
                لم نجد أسئلة تطابق بحثك. جرب كلمات مختلفة.
              </p>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center bg-primary/5 rounded-lg p-8 border border-primary/20"
          >
            <h2 className="text-2xl font-bold mb-4">لم تجد إجابتك؟</h2>
            <p className="text-muted-foreground mb-6">
              تواصل معنا مباشرة وسنكون سعداء بمساعدتك
            </p>
            <Button size="lg">اتصل بنا</Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
