import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface NewsCardProps {
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

export function NewsCard({
  id,
  title,
  description,
  category,
  publishedAt,
  imageUrl,
  sourceUrl,
  source,
  onClick
}: NewsCardProps) {
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
      className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <ImageWithFallback
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          {category}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{formatDate(publishedAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{source}</span>
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}