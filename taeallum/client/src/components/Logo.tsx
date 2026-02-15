import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex items-center justify-center w-10 h-10 group">
                {/* Modern Abstract Leaf/Book Icon */}
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full relative z-10 drop-shadow-sm transition-transform duration-500 group-hover:scale-110"
                >
                    {/* Detailed Realistic Tree Canopy (Scalloped edges) */}
                    <path
                        d="M50 10 C65 10, 75 15, 82 25 C90 35, 90 50, 85 62 C80 75, 65 80, 50 80 C35 80, 20 75, 15 62 C10 50, 10 35, 18 25 C25 15, 35 10, 50 10 Z"
                        fill="currentColor"
                        className="text-primary/10"
                    />
                    <path
                        d="M50 15 C62 15, 70 20, 78 28 C85 35, 85 48, 80 58 C75 68, 62 75, 50 75 C38 75, 25 68, 20 58 C15 48, 15 35, 22 28 C30 20, 38 15, 50 15 Z"
                        fill="currentColor"
                        className="text-primary/30"
                    />

                    {/* Trunk and Flowing Branches */}
                    <path
                        d="M48 90 L52 90 L52 75 C52 75 55 65 65 60 M50 75 C50 75 45 65 35 60 M50 75 L50 45 M50 65 C50 65 60 55 70 45 M50 65 C50 65 40 55 30 45"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        className="text-primary"
                    />

                    {/* Inner Light Leaves/Highlights for added depth */}
                    <path
                        d="M50 25 C55 25, 60 28, 60 32 C60 36, 55 38, 50 38 C45 38, 40 36, 40 32 C40 28, 45 25, 50 25 Z"
                        fill="currentColor"
                        className="text-emerald-500"
                    />
                    <circle cx="70" cy="40" r="3" fill="currentColor" className="text-emerald-600/50" />
                    <circle cx="30" cy="40" r="3" fill="currentColor" className="text-emerald-600/50" />

                    {/* Ground Curve */}
                    <path
                        d="M20 92 Q50 88 80 92"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-primary/40"
                    />
                </svg>

                {/* Background Glow */}
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {!iconOnly && (
                <div className="relative font-black text-2xl tracking-tighter flex items-center h-8 ml-1">
                    <span className="text-foreground whitespace-nowrap">
                        تعلّ<span className="text-primary">م</span>
                    </span>
                </div>
            )}
        </div>
    );
}
