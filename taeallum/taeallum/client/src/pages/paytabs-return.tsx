import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSessionHeaders } from "@/lib/queryClient";

export default function PayTabsReturn() {
    const [location, setLocation] = useLocation();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("جاري التحقق من عملية الدفع...");

    useEffect(() => {
        const verifyPayment = async () => {
            // Extract tranRef from URL query
            // PayTabs usually sends it as post, but for redirect it might be Get?
            // Actually PayTabs "Return" is a POST to the server usually if configured, 
            // OR a GET if we configured it as such. 
            // Let's assume we get "tranRef" or "trandata" in query string if it's a GET redirect.
            // If PayTabs uses POST for return, we can't handle it easily in client-side routing directly without a backend intermediary.
            // However, usually we can configure PayTabs to do a GET redirect or we accept the POST in backend and redirect to frontend with query param.

            // Let's check query params
            const searchParams = new URLSearchParams(window.location.search);
            const tranRef = searchParams.get("tranRef") || searchParams.get("tran_ref");

            if (!tranRef) {
                setStatus("error");
                setMessage("لم يتم العثور على رقم المعاملة.");
                return;
            }

            try {
                const res = await fetch("/api/paytabs/verify", {
                    method: "POST",
                    headers: {
                        ...getSessionHeaders(),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ tranRef }),
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    setStatus("success");
                    setMessage("تمت عملية الدفع بنجاح! تم تفعيل اشتراكك.");
                    // Redirect after 3 seconds
                    setTimeout(() => setLocation("/dashboard"), 3000);
                } else {
                    setStatus("error");
                    setMessage(data.message || "فشلت عملية الدفع.");
                }
            } catch (error) {
                setStatus("error");
                setMessage("حدث خطأ أثناء الاتصال بالخادم.");
            }
        };

        verifyPayment();
    }, [setLocation]);

    return (
        <Layout>
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/10">
                <Card className="w-full max-w-md p-8 text-center space-y-6">
                    {status === "loading" && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                            <h2 className="text-xl font-bold">{message}</h2>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="flex flex-col items-center gap-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                            <h2 className="text-2xl font-bold text-green-600">عملية ناجحة</h2>
                            <p className="text-muted-foreground">{message}</p>
                            <p className="text-sm text-muted-foreground">سيتم توجيهك إلى لوحة التحكم...</p>
                            <Link href="/dashboard">
                                <Button className="w-full">الذهاب للوحة التحكم</Button>
                            </Link>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="flex flex-col items-center gap-4">
                            <XCircle className="w-16 h-16 text-destructive" />
                            <h2 className="text-2xl font-bold text-destructive">خطأ في الدفع</h2>
                            <p className="text-foreground">{message}</p>
                            <div className="flex gap-4 w-full">
                                <Link href="/ai-pricing" className="flex-1">
                                    <Button variant="outline" className="w-full">المحاولة مرة أخرى</Button>
                                </Link>
                                <Link href="/dashboard" className="flex-1">
                                    <Button variant="ghost" className="w-full">إلغاء</Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
}
