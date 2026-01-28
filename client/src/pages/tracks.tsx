import { Layout } from "@/components/layout";
import { tracks } from "@/lib/mock-data";
import { BookOpen, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Tracks() {
  return (
    <Layout>
      <div className="bg-muted/30 py-16">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <h1 className="text-4xl font-heading font-bold mb-4">المسارات التعليمية</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            مسارات منظمة ومدروسة تأخذ بيدك من البداية وحتى الاحتراف في مجال معين. وفر وقتك وجهدك مع خطة واضحة.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-8 max-w-screen-2xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tracks.map((track) => (
            <div key={track.id} className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="relative h-56 overflow-hidden">
                <img src={track.image} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4">
                  <span className="bg-background/90 backdrop-blur text-foreground font-medium px-3 py-1 rounded-md text-sm shadow-sm">
                    {track.level}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors">{track.title}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-3 flex-1">{track.description}</p>
                
                <div className="flex items-center gap-6 text-sm text-foreground/70 mb-6">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> {track.coursesCount} دورات</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {track.duration}</span>
                </div>
                
                <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-white transition-all">
                  عرض المسار <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
