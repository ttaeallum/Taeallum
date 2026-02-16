import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Globe, MapPin, Send, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Seo } from "@/components/seo";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Seo
        title="اتصل بنا"
        description="تواصل مع فريق منصة تعلّم للاستفسارات والمساعدة."
      />
      <div className="min-h-screen py-16 md:py-24" dir="rtl">
        <div className="container max-w-4xl mx-auto px-4 md:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">تواصل معنا</h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              نحن هنا لمساعدتك. أرسل استفسارك وسنعود إليك في أقرب وقت.
            </p>
          </motion.div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 text-center h-full border-border/30 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">البريد الإلكتروني</h3>
                <a href="mailto:info@taallm.com" className="text-sm text-primary hover:underline">
                  info@taallm.com
                </a>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="p-6 text-center h-full border-border/30 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">الموقع الإلكتروني</h3>
                <a href="https://taallm.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                  taallm.com
                </a>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 text-center h-full border-border/30 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">وقت الاستجابة</h3>
                <p className="text-sm text-muted-foreground">خلال 24 ساعة</p>
              </Card>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="p-6 md:p-8 border-border/30">
              <h2 className="text-xl font-bold mb-6">أرسل لنا رسالة</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">الاسم</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border/40 bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="اسمك الكامل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-border/40 bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                      placeholder="بريدك الإلكتروني"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الموضوع</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-border/40 bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    placeholder="موضوع الرسالة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الرسالة</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/40 bg-background focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all resize-none text-sm"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-medium text-center"
                  >
                    تم استقبال رسالتك بنجاح. سنعود إليك قريبا.
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm font-medium text-center"
                  >
                    حدث خطأ. يرجى المحاولة مرة أخرى.
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full rounded-xl h-12 font-bold"
                >
                  {isSubmitting ? "جاري الإرسال..." : "إرسال الرسالة"}
                  <Send className="w-4 h-4 mr-2" />
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
