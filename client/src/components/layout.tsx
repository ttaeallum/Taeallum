import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, User, LogOut, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
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
        headers: getSessionHeaders(),
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

  const navLinks = [
    { href: "/", label: "الرئيسية" },
    { href: "/tracks", label: "المسارات" },
    { href: "/courses", label: "جميع الكورسات" },
    { href: "/ai-agent", label: "مساعدك الذكي" },
    { href: "/blog", label: "المدونة" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/brand/logo.png" alt="تعلّم" className="h-10 w-auto" />
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
          <Button variant="ghost" size="icon" className="text-muted-foreground mr-2">
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <LanguageSwitcher />

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
              <Link href="/ai-pricing">
                <Button className="font-bold shadow-lg shadow-primary/20">اشترك الآن</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          <LanguageSwitcher />
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
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
                    <Link href="/ai-pricing">
                      <Button className="w-full font-bold" onClick={() => setIsMenuOpen(false)}>اشترك الآن</Button>
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
  return (
    <footer className="border-t border-border/40 bg-muted/20" dir="rtl">
      <div className="container max-w-screen-2xl py-12 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4 text-right">
            <Link
              href="/"
              className="hover:opacity-90 transition-opacity w-fit mr-0 md:mr-auto lg:mr-0 ml-auto md:ml-0"
            >
              <img src="/brand/logo.png" alt="تعلّم" className="h-12 w-auto" />
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              منصتك الأولى لتعلم المهارات الرقمية والتقنية في الشرق الأوسط. انضم إلينا وابدأ رحلة مستقبلك اليوم.
            </p>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <h4 className="font-bold text-foreground">روابط سريعة</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/tracks" className="hover:text-primary transition-colors">المسارات التعليمية</Link>
              <Link href="/courses" className="hover:text-primary transition-colors">تصفح الكورسات</Link>
              <Link href="/ai-pricing" className="hover:text-primary transition-colors">الأسعار والاشتراكات</Link>
              <Link href="/blog" className="hover:text-primary transition-colors">المدونة</Link>
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-colors cursor-pointer">
                <span className="sr-only">Twitter</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} منصة تعلّم. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
