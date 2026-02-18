import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, User, LogOut, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeToggle from "./ThemeToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionHeaders } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "./Logo";
import { AdSection } from "./AdSection";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: getSessionHeaders() as Record<string, string>,
      });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth-me"], null);
      localStorage.removeItem("sessionId");
      toast({ title: "تم تسجيل الخروج", description: "نتمنى رؤيتك قريباً!" });
      setLocation("/");
    }
  });

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    ...(isSubscribed ? [
      { href: "/tracks", label: "المسارات" },
      { href: "/ai-agent", label: "المساعد الذكي" }
    ] : []),
    { href: "/courses", label: "جميع الكورسات" },
    { href: "/about", label: "من نحن" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(link.href)
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground mr-2">
                <Search className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="h-[200px]" dir="rtl">
              <div className="container max-w-2xl mt-8">
                <h2 className="text-xl font-bold mb-4 text-right">البحث عن الكورسات</h2>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="ماذا تريد أن تتعلم اليوم؟"
                    className="w-full h-14 pr-12 pl-4 rounded-xl border-2 border-primary/20 bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val.trim()) {
                          const searchParams = new URLSearchParams(window.location.search);
                          searchParams.set("q", val);
                          window.location.href = `/courses?q=${encodeURIComponent(val)}`;
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal text-right">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem className="gap-2 cursor-pointer text-right justify-end">
                    <LayoutDashboard className="h-4 w-4" />
                    لوحة التحكم
                  </DropdownMenuItem>
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin/dashboard">
                    <DropdownMenuItem className="gap-2 cursor-pointer text-right justify-end text-primary font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      لوحة الإدارة
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/account">
                  <DropdownMenuItem className="gap-2 cursor-pointer text-right justify-end">
                    <Settings className="h-4 w-4" />
                    إعدادات الحساب
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive text-right justify-end"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" className="font-bold">تسجيل الدخول</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]" dir="rtl">
              <div className="flex flex-col gap-6 mt-8 text-right">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-lg font-medium py-2 transition-colors hover:text-primary border-b border-border/50",
                        isActive(link.href)
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {user ? (
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{user.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="text-right">
                        <p className="text-sm font-bold">{user.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsMenuOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        لوحة التحكم
                      </Button>
                    </Link>
                    {user.role === "admin" && (
                      <Link href="/admin/dashboard">
                        <Button variant="default" className="w-full justify-start gap-2 bg-primary" onClick={() => setIsMenuOpen(false)}>
                          <ShieldCheck className="h-4 w-4" />
                          لوحة الإدارة
                        </Button>
                      </Link>
                    )}
                    <Link href="/account">
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setIsMenuOpen(false)}>
                        <Settings className="h-4 w-4" />
                        إعدادات الحساب
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-destructive"
                      onClick={() => {
                        setIsMenuOpen(false);
                        localStorage.removeItem("sessionId");
                        logoutMutation.mutate();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      تسجيل الخروج
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-4">
                    <Link href="/auth">
                      <Button variant="outline" className="w-full justify-start gap-2 font-bold" onClick={() => setIsMenuOpen(false)}>
                        <User className="h-4 w-4 ml-1" />
                        تسجيل الدخول
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    }
  });

  const isSubscribed = user?.isSubscribed || user?.role === "admin";

  return (
    <footer className="border-t border-border/40 bg-muted/20" dir="rtl">
      <div className="max-w-7xl mx-auto py-12 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 text-right">
            <Link
              href="/"
              className="hover:opacity-90 transition-opacity w-fit mr-0 md:mr-auto lg:mr-0 ml-auto md:ml-0"
            >
              <Logo className="scale-125" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              منصتك الأولى لتعلم المهارات الرقمية والتقنية في الشرق الأوسط. انضم إلينا وابدأ رحلة مستقبلك اليوم.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <h4 className="font-bold text-foreground">روابط سريعة</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {isSubscribed && (
                <>
                  <Link href="/tracks" className="hover:text-primary transition-colors">المسارات التعليمية</Link>
                  <Link href="/ai-agent" className="hover:text-primary transition-colors">المساعد الذكي</Link>
                </>
              )}
              <Link href="/courses" className="hover:text-primary transition-colors">تصفح الكورسات</Link>
              <Link href="/about" className="hover:text-primary transition-colors">من نحن</Link>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <h4 className="font-bold text-foreground">الدعم والمساعدة</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/faq" className="hover:text-primary transition-colors">الأسئلة الشائعة</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">اتصل بنا</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">الشروط والأحكام</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">سياسة الخصوصية</Link>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <h4 className="font-bold text-foreground">تواصل معنا</h4>
            <p className="text-sm text-muted-foreground">تابعنا على وسائل التواصل الاجتماعي للحصول على آخر التحديثات.</p>
            <div className="flex gap-4 mt-2 justify-end md:justify-start">
              <a href="https://www.instagram.com/taallm.jo/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors cursor-pointer">
                <span className="sr-only">Instagram</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.53c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} منصة تعلّم. جميع الحقوق محفوظة.</p>
          <p className="mt-2 font-medium">تطوير وتصميم: <span className="text-primary">حمزة علي أمين السرخي</span></p>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground selection:bg-primary/30 selection:text-primary relative">
      {/* Premium Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] -z-10 pointer-events-none animate-pulse-slow" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <AdSection location="header_top" variant="inline" className="py-2 bg-primary/5 border-b border-primary/10" />
      <Navbar />
      <main className="flex-1 w-full relative z-10">
        {children}
      </main>
      <AdSection className="mb-[-20px] relative z-20" />
      <Footer />

      {/* Custom Global Styles for Premium feel */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.15; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: hsl(var(--background));
        }
        ::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.1);
          border-radius: 10px;
          border: 2px solid hsl(var(--background));
        }
        ::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.2);
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.1) hsl(var(--background));
        }
      `}} />
    </div>
  );
}
