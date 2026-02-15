import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the form data to your backend
      // For now, we'll just simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitStatus("success");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background py-12">
        <div className="container max-w-6xl px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">اتصل بنا</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نحن هنا للإجابة على جميع استفساراتك والمساعدة في أي مشكلة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 border-border/40 h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">البريد الإلكتروني</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  أرسل لنا رسالة مباشرة
                </p>
                <a
                  href="mailto:support@taallm.com"
                  className="text-primary hover:underline font-medium"
                >
                  support@taallm.com
                </a>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 border-border/40 h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">الهاتف</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  اتصل بنا مباشرة
                </p>
                <a
                  href="tel:+966501234567"
                  className="text-primary hover:underline font-medium"
                >
                  +966 50 123 4567
                </a>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 border-border/40 h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">الموقع</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  الرياض، المملكة العربية السعودية
                </p>
                <p className="text-primary font-medium">
                  شارع الملك فهد، الرياض 12345
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 border-border/40">
              <h2 className="text-2xl font-bold mb-6">أرسل لنا رسالة</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      الاسم
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="أدخل اسمك"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="أدخل بريدك الإلكتروني"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    الموضوع
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="ما موضوع رسالتك؟"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    الرسالة
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 rounded-lg border border-border/40 bg-background focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    placeholder="أكتب رسالتك هنا..."
                  />
                </div>

                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700"
                  >
                    شكراً! تم استقبال رسالتك بنجاح. سنرد عليك قريباً.
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700"
                  >
                    حدث خطأ. يرجى المحاولة مرة أخرى.
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full"
                >
                  {isSubmitting ? "جاري الإرسال..." : "أرسل الرسالة"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Business Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center bg-primary/5 rounded-lg p-8 border border-primary/20"
          >
            <h2 className="text-2xl font-bold mb-4">ساعات العمل</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="font-medium mb-2">أيام الأسبوع</p>
                <p className="text-muted-foreground">9:00 صباحاً - 6:00 مساءً</p>
              </div>
              <div>
                <p className="font-medium mb-2">يوم الجمعة</p>
                <p className="text-muted-foreground">2:00 مساءً - 10:00 مساءً</p>
              </div>
              <div>
                <p className="font-medium mb-2">يوم السبت</p>
                <p className="text-muted-foreground">مغلق</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
