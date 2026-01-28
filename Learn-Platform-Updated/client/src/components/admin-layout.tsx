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
    GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarLinks = [
    { href: "/admin/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { href: "/admin/courses", label: "الكورسات", icon: BookOpen },
    { href: "/admin/categories", label: "التصنيفات", icon: Layers },
    { href: "/admin/users", label: "المستخدمين", icon: Users },
    { href: "/admin/enrollments", label: "الالتحاقات", icon: GraduationCap },
    { href: "/admin/orders", label: "الطلبات", icon: CreditCard },
    { href: "/admin/audit", label: "سجلات العمليات", icon: History },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        setLocation("/admin/login");
    };

    return (
        <div className="flex min-h-screen bg-muted/20 font-sans" dir="rtl">
            {/* Sidebar */}
            <aside className="w-64 border-l bg-card hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6 border-b flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
                        <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl">لوحة الإدارة</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const active = location === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    active
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t space-y-2">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                        <ExternalLink className="w-4 h-4" />
                        عرض الموقع
                        <ChevronLeft className="w-3 h-3 mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3 py-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden">
                <header className="h-16 border-b bg-card flex items-center justify-between px-8 md:hidden sticky top-0 z-10">
                    <span className="font-bold">لوحة الإدارة</span>
                    <div className="flex gap-2">
                        {/* Mobile menu button could go here */}
                    </div>
                </header>
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
