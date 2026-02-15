import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, User, ArrowLeft } from "lucide-react";

const posts = [
  {
    id: 1,
    title: "كيف تبدأ مسارك في تطوير الويب في 2026؟",
    excerpt: "دليلك الشامل لتعلم أحدث التقنيات والأدوات المطلوبة في سوق العمل كمطور ويب شامل.",
    author: "أحمد محمد",
    date: "15 يناير 2026",
    category: "برمجة",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80"
  },
  {
    id: 2,
    title: "أهم اتجاهات التصميم الجرافيكي لهذا العام",
    excerpt: "تعرف على الأنماط التصميمية الصاعدة التي ستشكل هوية العلامات التجارية في المستقبل القريب.",
    author: "سارة علي",
    date: "10 يناير 2026",
    category: "تصميم",
    image: "https://images.unsplash.com/photo-1626785774573-4b799314346d?w=800&q=80"
  },
  {
    id: 3,
    title: "كيف تدير وقتك بفعالية أثناء التعلم الذاتي؟",
    excerpt: "استراتيجيات مجربة للحفاظ على التركيز وزيادة الإنتاجية عند دراسة الكورسات أونلاين.",
    author: "كريم حسن",
    date: "5 يناير 2026",
    category: "نصائح",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80"
  }
];

export default function Blog() {
  return (
    <Layout>
      <div className="bg-muted/30 py-16">
        <div className="container px-4 md:px-8 max-w-screen-2xl">
          <h1 className="text-4xl font-heading font-bold mb-4">المدونة</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            مقالات، نصائح، وأخبار تقنية تساعدك على البقاء في الطليعة وتطوير مهاراتك باستمرار.
          </p>
        </div>
      </div>

      <div className="container px-4 md:px-8 max-w-screen-2xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden border-border/40 hover:shadow-lg transition-shadow group cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <CardHeader className="space-y-2 p-5">
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                </div>
                <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </CardContent>
              <CardFooter className="p-5 pt-0 mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  {post.author}
                </div>
                <Button variant="link" className="p-0 h-auto text-primary gap-1">
                  اقرأ المزيد <ArrowLeft className="w-3 h-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
