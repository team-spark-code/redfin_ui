import { FeaturedNewsCard } from "./FeaturedNewsCard";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRef } from "react";

interface FeaturedNewsSectionProps {
  featuredNews: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    publishedAt: string;
    imageUrl: string;
    sourceUrl: string;
    source: string;
  }>;
  onNewsClick?: (id: string) => void;
}

export function FeaturedNewsSection({ featuredNews, onNewsClick }: FeaturedNewsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/10 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-primary fill-current" />
              <h2>핵심 뉴스</h2>
            </div>
            <p className="text-muted-foreground">가장 중요한 소식들</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollLeft}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollRight}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitScrollbar: { display: 'none' }
          }}
        >
          {featuredNews.map((news) => (
            <FeaturedNewsCard key={news.id} {...news} onClick={onNewsClick} />
          ))}
        </div>

        {/* Scroll indicator dots */}
        <div className="flex justify-center mt-4 gap-2">
          {featuredNews.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}