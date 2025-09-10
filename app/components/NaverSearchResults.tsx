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

interface NaverSearchResultsProps {
  searchQuery: string;
  selectedCategory: string;
  onNewsClick?: (url: string) => void;
}

const categoryKeywords = {
  all: "",
  politics: "정치",
  economy: "경제",
  society: "사회",
  culture: "문화",
  international: "국제",
  sports: "스포츠",
  technology: "기술",
};

export function NaverSearchResults({ searchQuery, selectedCategory, onNewsClick }: NaverSearchResultsProps) {
  const [news, setNews] = useState<NaverNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setNews([]);
      return;
    }

    const fetchNaverNews = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 카테고리별 검색 쿼리 구성
        let finalQuery = searchQuery.trim();
        if (selectedCategory !== "all") {
          const categoryKeyword = categoryKeywords[selectedCategory as keyof typeof categoryKeywords];
          if (categoryKeyword) {
            finalQuery = `${searchQuery.trim()} ${categoryKeyword}`;
          }
        }

        const response = await fetch(`/api/naver/news?query=${encodeURIComponent(finalQuery)}&display=12&sort=date`);

        if (!response.ok) {
          throw new Error('네이버 뉴스 검색에 실패했습니다.');
        }

        const data = await response.json();
        setNews(data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        console.error('네이버 뉴스 검색 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchNaverNews, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

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

  if (!searchQuery.trim()) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-60 mb-2" />
            <Skeleton className="h-4 w-80" />
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
      <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              검색 결과
            </h2>
            <p className="text-muted-foreground">"{searchQuery}"에 대한 검색 중 오류가 발생했습니다</p>
          </div>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            검색 결과
          </h2>
          <p className="text-muted-foreground">
            "{searchQuery}"에 대한 {selectedCategory !== "all" ? `${categoryKeywords[selectedCategory as keyof typeof categoryKeywords]} ` : ""}뉴스 {news.length}개
          </p>
        </div>

        {news.length === 0 ? (
          <div className="text-center py-12">
            <h3>검색 결과가 없습니다</h3>
            <p className="text-muted-foreground">
              다른 검색어를 시도해보세요.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}

export default NaverSearchResults;
