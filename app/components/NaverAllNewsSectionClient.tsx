"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, ExternalLink } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverAllNewsProps {
  onNewsClick?: (url: string) => void;
}

function NaverAllNewsSectionClient({ onNewsClick }: NaverAllNewsProps) {
  const [news, setNews] = useState<NaverNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNaverNews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/naver/news?display=6&sort=date');

        if (!response.ok) {
          throw new Error('네이버 뉴스를 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        setNews(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        console.error('네이버 뉴스 가져오기 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNaverNews();
  }, []);

  const formatDate = (pubDate: string) => {
    try {
      const date = new Date(pubDate);
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '방금 전';
    }
  };

  const handleNewsClick = (item: NaverNewsItem) => {
    if (onNewsClick) {
      onNewsClick(item.originallink || item.link);
    } else {
      window.open(item.originallink || item.link, '_blank');
    }
  };

  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-32 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            네이버 전체뉴스
          </h2>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            네이버 전체뉴스
          </h2>
          <p className="text-muted-foreground">
            네이버에서 가져온 최신 뉴스 6개
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              onClick={() => handleNewsClick(item)}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(item.pubDate)}</span>
                    <Badge variant="secondary" className="ml-auto">
                      네이버
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                      <span>뉴스 보기</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NaverAllNewsSectionClient;
