import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, ExternalLink, TrendingUp } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FeaturedNewsCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  imageUrl: string;
  sourceUrl: string;
  source: string;
  onClick?: (id: string) => void;
}

export function FeaturedNewsCard({
  id,
  title,
  description,
  category,
  publishedAt,
  imageUrl,
  sourceUrl,
  source,
  onClick
}: FeaturedNewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer min-w-80 bg-gradient-to-br from-card to-card/80 border-2 hover:border-primary/20"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-t-lg">
        <div className="aspect-[16/10] relative">
          <ImageWithFallback
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground shadow-lg flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {category}
          </Badge>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white mb-2 group-hover:text-primary-foreground transition-colors line-clamp-2">
              {title}
            </h3>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatDate(publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{source}</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}