"use client"; 

import { useState, useMemo, useEffect } from "react";
import { NewsCard } from "./components/NewsCard";
import { FeaturedNewsSection } from "./components/FeaturedNewsSection";
import { LLMRecommendationSection } from "./components/LLMRecommendationSection";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SignupPage } from "./components/SignupPage";
import { NewsDetailPage } from "./components/NewsDetailPage";
import { Skeleton } from "./components/ui/skeleton";
import { Newspaper } from "lucide-react";



// API에서 내려오는 원자료 타입
type RawNews = {
  source?: string | null;
  title?: string | null;
  link: string;
  published?: string | null;
  summary?: string | null;
  authors?: string[] | null;
  tags?: string[] | null;
};

// 앱에서 사용하는 정규화된 뉴스 타입 (NewsCard/섹션들과 호환)
type NewsNormalized = {
  id: string;
  title: string;
  description: string;
  category: string;        // tags[0] 또는 'technology' 등 기본값
  publishedAt: string;     // ISO string
  imageUrl: string;        // API에 없으면 placeholder
  sourceUrl: string;       // link
  source: string;          // source || 'Unknown'
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.0.123:8000";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1523742810063-4f61a38b7e1b?w=1200&q=80&auto=format&fit=crop";

// API 호출
async function fetchNews(): Promise<RawNews[]> {
  const res = await fetch(`${API_BASE}/news?limit=24`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch /news");
  return res.json();
}

// API 데이터를 UI 컴포넌트가 쓰기 좋은 형태로 정규화
function normalizeNews(raw: RawNews[]): NewsNormalized[] {
  return raw.map((n) => ({
    id: n.link,
    title: n.title ?? "(제목 없음)",
    description: n.summary ?? "",
    category: n.tags?.[0] ?? "technology",
    publishedAt: n.published ?? "",
    imageUrl: PLACEHOLDER_IMG, // 필요 시 백엔드에서 썸네일 제공하도록 확장
    sourceUrl: n.link,
    source: n.source ?? "Unknown",
  }));
}

const categoryLabels: Record<string, string> = {
  all: "전체",
  politics: "정치",
  economy: "경제",
  society: "사회",
  culture: "문화",
  international: "국제",
  sports: "스포츠",
  technology: "기술",
};

type PageType = "home" | "signup" | "newsDetail";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [selectedNewsId, setSelectedNewsId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 🔹 API에서 받은 정규화된 뉴스 데이터 상태
  const [news, setNews] = useState<NewsNormalized[]>([]);

  // 최초 로딩
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        const raw = await fetchNews();
        const normalized = normalizeNews(raw);
        if (alive) setNews(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 새로고침(재호출)
  const handleRefresh = () => {
    (async () => {
      try {
        setIsLoading(true);
        const raw = await fetchNews();
        setNews(normalizeNews(raw));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // 🔹 상단 피처드 뉴스(첫 3개 기준)
  const featuredNews = useMemo(() => news.slice(0, 3), [news]);

  // 🔹 검색/카테고리 필터 적용
  const filteredNews = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return news.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "all" || n.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [news, searchQuery, selectedCategory]);

  const handleSignupClick = () => setCurrentPage("signup");
  const handleBackToHome = () => setCurrentPage("home");
  const handleNewsClick = (newsId: string) => {
    setSelectedNewsId(newsId);
    setCurrentPage("newsDetail");
  };

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-video w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  const FeaturedLoadingSkeleton = () => (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/10 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-80 space-y-4">
              <Skeleton className="aspect-[16/10] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // 상세 / 회원가입 페이지 분기
  if (currentPage === "newsDetail") {
    return (
      <NewsDetailPage newsId={selectedNewsId} onBack={handleBackToHome} />
    );
  }
  if (currentPage === "signup") {
    return <SignupPage onBack={handleBackToHome} />;
  }

  // 홈
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isLoggedIn={isLoggedIn}
        onSignupClick={handleSignupClick}
      />

      {isLoading ? (
        <FeaturedLoadingSkeleton />
      ) : (
        <FeaturedNewsSection
          featuredNews={featuredNews}
          onNewsClick={handleNewsClick}
        />
      )}

      <LLMRecommendationSection onNewsClick={handleNewsClick} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>
                {selectedCategory === "all"
                  ? "전체 뉴스"
                  : `${categoryLabels[selectedCategory]} 뉴스`}
              </h2>
              <p className="text-muted-foreground">
                {filteredNews.length}개의 기사가 있습니다
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((n) => (
              <NewsCard key={n.id} {...n} onClick={handleNewsClick} />
            ))}
          </div>
        )}

        {!isLoading && filteredNews.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3>검색 결과가 없습니다</h3>
            <p className="text-muted-foreground">
              다른 검색어나 카테고리를 시도해보세요.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
