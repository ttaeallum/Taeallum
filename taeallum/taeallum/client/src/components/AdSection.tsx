import { motion } from "framer-motion";
import { ExternalLink, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AdSectionProps {
    className?: string;
    variant?: "banner" | "sidebar" | "inline";
    location?: string;
}

export function AdSection({ className = "", variant = "banner", location }: AdSectionProps) {
    // Determine location key based on variant if not provided
    const adLocation = location || (variant === "sidebar" ? "sidebar" : "footer_banner");

    const { data: ad, isLoading } = useQuery({
        queryKey: ["ad", adLocation],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/ads/${adLocation}`);
                if (!res.ok) return null;
                return res.json();
            } catch (error) {
                return null;
            }
        },
        staleTime: 60000, // cache for 1 minute
    });

    if (isLoading || !ad || !ad.isActive) return null;

    // Handle Script/Custom Code
    if (ad.type === "script") {
        return (
            <div className={`container mx-auto py-8 ${className}`} dangerouslySetInnerHTML={{ __html: ad.scriptCode }} />
        );
    }

    if (variant === "sidebar") {
        return (
            <div className={`p-4 rounded-xl border border-border/50 bg-muted/30 ${className}`}>
                <div className="flex items-center gap-2 mb-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <span>Sponsored</span>
                    <Info className="w-3 h-3" />
                </div>
                {ad.mediaUrl && (
                    <img src={ad.mediaUrl} alt={ad.headline} className="w-full rounded-lg mb-3 object-cover" />
                )}
                <h4 className="font-bold text-sm mb-1">{ad.headline}</h4>
                <p className="text-xs text-muted-foreground mb-3">{ad.description}</p>
                {ad.primaryLink && (
                    <a href={ad.primaryLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                        {ad.primaryText || "Learn More"} <ExternalLink className="w-3 h-3" />
                    </a>
                )}
                <div className="absolute top-0 right-0 p-3 bg-background/80 backdrop-blur-sm rounded-bl-2xl text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-l border-b border-border/20">
                    Advertisement
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`container max-w-screen-xl mx-auto py-8 ${className}`}
        >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-muted/50 via-background to-muted/50 border border-border/50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 p-3 bg-background/80 backdrop-blur-sm rounded-bl-2xl text-[10px] uppercase tracking-widest font-bold text-muted-foreground border-l border-b border-border/20 z-10">
                    Advertisement
                </div>

                <div className="flex-1 text-center md:text-right pt-4 md:pt-0">
                    <h3 className="text-base md:text-xl font-bold mb-2 text-foreground">
                        {ad.headline || "Special Offer"}
                    </h3>
                    <p className="text-muted-foreground text-xs md:text-base max-w-2xl">
                        {ad.description}
                    </p>
                </div>

                {ad.mediaUrl && (
                    <div className="w-full md:w-48 h-32 md:h-32 rounded-lg overflow-hidden shrink-0">
                        {ad.type === 'video' ? (
                            <video src={ad.mediaUrl} controls className="w-full h-full object-cover" />
                        ) : (
                            <img src={ad.mediaUrl} alt={ad.headline} className="w-full h-full object-cover" />
                        )}
                    </div>
                )}

                {ad.primaryLink && (
                    <a
                        href={ad.primaryLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full md:w-auto px-6 py-2.5 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                    >
                        {ad.primaryText || "Learn More"}
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
            </div>
        </motion.div>
    );
}
