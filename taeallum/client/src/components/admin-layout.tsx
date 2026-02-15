import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    BookOpen,
    Layers,
    Users,
    CreditCard,
    History,
    LogOut,
    ExternalLink,
    ChevronLeft,
    GraduationCap,
    ShieldCheck,
    Search,
    Bell,
    Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "./Logo";
import { useQuery } from "@tanstack/react-query";
import { getSessionHeaders } from "@/lib/queryClient";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sidebarLinks = [
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/courses", label: "الكورسات", icon: BookOpen },
    { href: "/admin/categories", label: "التخصصات", icon: Layers },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
    { href: "/admin/enrollments", label: "الالتحاقات", icon: GraduationCap },
    { href: "/admin/orders", label: "الطلبات", icon: CreditCard },
    { href: "/admin/ads", label: "الإعلانات", icon: Radio },
    { href: "/admin/audit", label: "سجلات العمليات", icon: History },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();

    const { data: notifications } = useQuery({
        queryKey: ["admin-notifications"],
        queryFn: async () => {
            const res = await fetch("/api/admin-panel/notifications", {
                credentials: "include",
                headers: getSessionHeaders() as Record<string, string>
            });
            if (!res.ok) throw new Error("Failed to fetch notifications");
            return res.json();
        },
        refetchInterval: 30000, // Refresh every 30s
    });

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setLocation("/admin/login");
    };

    return (
        <div className="flex min-h-screen bg-background font-sans relative overflow-hidden" dir="rtl">
            {/* Elite Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -z-10" />

            {/* Sidebar */}
            <aside className="w-72 border-l border-border/40 bg-card/50 backdrop-blur-xl hidden lg:flex flex-col sticky top-0 h-screen z-20">
                <div className="p-8 border-b border-border/40">
                    <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105">
                        <Logo />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Admin Elite</span>
                    </Link>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2 opacity-50">القائمة الرئيسية</div>
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const active = location === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 group relative",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
                                        : "text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:translate-x-[-4px]"
                                )}
                            >
                                <Icon className={cn("w-5 h-5", active ? "text-white" : "text-primary/60 group-hover:text-primary transition-colors")} />
                                {link.label}
                                {active && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-border/40 space-y-3">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all group"
                    >
                        <ExternalLink className="w-5 h-5" />
                        عرض الموقع الأساسي
                        <ChevronLeft className="w-4 h-4 mr-auto opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </Link>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-4 py-6 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5 hover:text-destructive group transition-all"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-5 h-5 transition-transform group-hover:rotate-12" />
                        تسجيل الخروج
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto bg-transparent relative z-10 custom-scrollbar">
                {/* Modern Header */}
                <header className="h-20 border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
                    <div className="flex items-center gap-6 flex-1">
                        <div className="relative max-w-md w-full hidden md:block group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="ابحث عن أي شيء..."
                                className="h-11 bg-muted/20 border-border/40 pr-11 rounded-2xl focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
                            />
                        </div>
                        <div className="lg:hidden w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-full w-10 h-10 relative bg-background/50 border-border/40 hover:bg-muted transition-all">
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                    {notifications?.unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 w-4 h-4 bg-destructive text-[10px] font-bold text-white border-2 border-background rounded-full flex items-center justify-center animate-bounce">
                                            {notifications.unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[320px] p-2 bg-card/95 backdrop-blur-xl border-border/40 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
                                <DropdownMenuLabel className="font-black text-xs px-3 py-2 opacity-50 uppercase tracking-widest">الإشعارات الجديدة</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border/40 mb-2" />
                                {notifications?.pendingOrders?.length > 0 ? (
                                    <div className="space-y-1">
                                        {notifications.pendingOrders.map((order: any) => (
                                            <DropdownMenuItem
                                                key={order.id}
                                                className="flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors focus:bg-primary/5"
                                                onClick={() => setLocation("/admin/orders")}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-sm font-bold truncate">طلب من {order.user?.fullName}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">{new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {order.course?.title || `اشتراك ${order.planId}`} -
                                                    <span className="text-primary font-bold mr-1">${order.amount}</span>
                                                </p>
                                            </DropdownMenuItem>
                                        ))}
                                        <DropdownMenuSeparator className="bg-border/40 mt-2" />
                                        <DropdownMenuItem
                                            className="justify-center text-xs font-black text-primary p-2 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors"
                                            onClick={() => setLocation("/admin/orders")}
                                        >
                                            عرض جميع الطلبات
                                        </DropdownMenuItem>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground font-medium">لا توجد إشعارات جديدة</p>
                                    </div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <div className="h-8 w-[1px] bg-border/40 mx-2" />
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setLocation("/admin/dashboard")}>
                            <div className="text-left hidden sm:block">
                                <p className="text-xs font-black leading-none mb-1">المسؤول</p>
                                <p className="text-[10px] text-muted-foreground leading-none">Admin Panel v8.5</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-500 border-2 border-background shadow-lg shadow-primary/10 transition-transform group-hover:scale-110" />
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--primary) / 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: hsl(var(--primary) / 0.2); }
                @keyframes pulse-slow { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.2; } }
                .animate-pulse-slow { animation: pulse-slow 6s infinite; }
            `}} />
        </div>
    );
}
