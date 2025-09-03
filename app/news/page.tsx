// app/news/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { NewsCard } from "../components/NewsCard";
import { Skeleton } from "../components/ui/skeleton";
import { Newspaper } from "lucide-react";

type RawNews = {
  source?: string | null;
  title?: string | null;
  link: string;
  published?: string | null;
  summary?: string | null;
  authors?: string[] | null;
  tags?: string[] | null;
};

type NewsNormalized = {
  id: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  imageUrl: string;
  sourceUrl: string;
  source: string;
  tags: string[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.0.123:8000";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1523742810063-4f61a38b7e1b?w=1200&q=80&auto=format&fit=crop";

async function fetchAllNews(limit = 100) { // ✅ 기본 100
  const res = await fetch(`/api/news?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch /api/news: ${res.status} ${text}`);
  }
  return res.json();
}

function normalizeNews(raw: RawNews[]): NewsNormalized[] {
  return raw.map((n) => ({
    id: n.link,
    title: n.title ?? "(제목 없음)",
    description: n.summary ?? "",
    category: n.tags?.[0] ?? "technology",
    publishedAt: n.published ?? "",
    imageUrl: PLACEHOLDER_IMG,
    sourceUrl: n.link,
    source: n.source ?? "Unknown",
    tags: n.tags ?? [],
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
  Uncategorized: "미분류",
};

export default function AllNewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<NewsNormalized[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 더 보기 (클라이언트 페이징)
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const raw = await fetchAllNews(300); // 필요 시 늘려도 됨
        setRows(normalizeNews(raw));
      } catch (e: any) {
        setError(e?.message ?? "불러오기 실패");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows
      .filter((n) => {
        const matchesCategory =
          selectedCategory === "all" || n.category === selectedCategory;
        if (!matchesCategory) return false;

        if (!q) return true;
        const hay = `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        return tb - ta;
      });
  }, [rows, searchQuery, selectedCategory]);

  const pageItems = filtered.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((v) => v + 24);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRefresh={async () => {
          try {
            setIsLoading(true);
            const raw = await fetchAllNews(300);
            setRows(normalizeNews(raw));
          } catch (e: any) {
            setError(e?.message ?? "불러오기 실패");
          } finally {
            setIsLoading(false);
          }
        }}
        isLoading={isLoading}
        isLoggedIn={false}
        onSignupClick={() => {}}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>
                {selectedCategory === "all"
                  ? "전체 뉴스"
                  : `${categoryLabels[selectedCategory] ?? selectedCategory} 뉴스`}
              </h2>
              <p className="text-muted-foreground">
                총 {filtered.length}건 · 현재 {pageItems.length}건 표시
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
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
        )}

        {error && !isLoading && (
          <div className="p-4 rounded-lg border bg-card text-red-600">{error}</div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3>결과가 없습니다</h3>
            <p className="text-muted-foreground">검색어나 카테고리를 바꿔보세요.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((n) => (
                <NewsCard
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  description={n.description}
                  category={n.category}
                  publishedAt={n.publishedAt}
                  imageUrl={n.imageUrl}
                  sourceUrl={n.sourceUrl}
                  source={n.source}
                  onClick={() => window.open(n.sourceUrl, "_blank")}
                />
              ))}
            </div>

            {pageItems.length < filtered.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 rounded-lg border bg-background hover:bg-accent"
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
