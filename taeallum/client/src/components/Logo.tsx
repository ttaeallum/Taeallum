import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className="relative flex items-center justify-center w-10 h-10 group transition-all duration-500 hover:scale-110 active:scale-95">
                {/* Modern Circular Logo Icon */}
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10 drop-shadow-md transition-transform duration-500 group-hover:rotate-12"
                >
                    {/* Outer Circle Ring */}
                    <circle cx="50" cy="50" r="48" fill="white" />
                    <circle cx="50" cy="50" r="44" fill="#22C55E" className="text-primary" />

                    {/* Abstract Tree/Knowledge Icon */}
                    <path
                        d="M50 25 C55 25, 65 30, 70 45 C75 60, 65 75, 50 75 C35 75, 25 60, 30 45 C35 30, 45 25, 50 25 Z"
                        fill="white"
                    />
                    <path
                        d="M50 75 L50 88 M40 82 L60 82"
                        stroke="white"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />

                    {/* Inner detail/seed of knowledge */}
                    <circle cx="50" cy="40" r="6" fill="#22C55E" className="text-primary" />
                </svg>

                {/* Background Glow */}
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
            </div>

            {!iconOnly && (
                <div className="relative font-heading font-black text-2xl tracking-tighter flex items-center h-8">
                    <span className="text-foreground whitespace-nowrap drop-shadow-sm">
                        تعلّ<span className="text-primary tracking-tight">ـم</span>
                    </span>
                    {/* Premium Dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-primary ml-1 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
            )}
        </div>
    );
}
