// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { FeaturedNewsSection } from "./components/FeaturedNewsSection";
import { LLMRecommendationSection } from "./components/LLMRecommendationSection";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Skeleton } from "./components/ui/skeleton";
import { getCatStyle, getCategoryIcon, categoryLabels } from "./lib/categoryStyle";

type ArticlesListResponse = {
  items: Array<{
    id?: string;
    _id?: { $oid?: string };
    Title?: string | null;
    Summary?: string | null;
    URL: string;
    category?: string | null;
    published_at?: string | null;
    created_at?: string | null;
    tags?: string[] | null;
    hero_image_url?: string | null;
    author_name?: string | null;
  }>;
  total: number;
  page: number;
  size: number;
};

type NewsNormalized = {
  id: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  imageUrl?: string | null;
  sourceUrl: string;
  source: string;
  tags: string[];
};

function formatDateKST(s?: string) {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

const sortByRecent = (a: NewsNormalized, b: NewsNormalized) => {
  const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
  const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
  return tb - ta;
};

async function fetchNews(params?: { search?: string; tags?: string[] }) {
  const qp = new URLSearchParams();
  qp.set("page", "1");
  qp.set("size", "200");
  qp.set("include_news", "false");
  if (params?.search) qp.set("search", params.search);
  (params?.tags ?? []).forEach((t) => qp.append("tags", t));

  const r = await fetch(`/api/news?${qp.toString()}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed to fetch /api/news (${r.status})`);
  const json: ArticlesListResponse = await r.json();
  return json;
}

function normalizeNews(list: ArticlesListResponse): NewsNormalized[] {
  return (list.items ?? []).map((n, i) => ({
    id: n._id?.$oid || n.id || n.URL || `row-${i}`,
    title: n.Title ?? "(제목 없음)",
    description: n.Summary ?? "",
    category: (n.category ?? "technology").toString(),
    publishedAt: n.published_at ?? n.created_at ?? "",
    imageUrl: null,
    sourceUrl: n.URL,
    source: "articles",
    tags: n.tags ?? [],
  }));
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [news, setNews] = useState<NewsNormalized[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetchNews();
        const normalized = normalizeNews(res).sort(sortByRecent);
        if (alive) setNews(normalized);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "뉴스를 불러오지 못했습니다.");
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleRefresh = () => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetchNews(searchQuery ? { search: searchQuery } : undefined);
        const normalized = normalizeNews(res).sort(sortByRecent);
        setNews(normalized);
      } catch (e: any) {
        setError(e?.message ?? "새로고침 실패");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const FeaturedLoadingSkeleton = () => (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/10 border-b">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="aspect-[16/9] w-full rounded-lg border bg-slate-100" />
              <Skeleton className="mt-4 h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const textOf = (n: NewsNormalized) =>
    `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase();
  const passesSearch = (n: NewsNormalized) =>
    !searchQuery || textOf(n).includes(searchQuery.toLowerCase());
  const passesCategory = (n: NewsNormalized) =>
    selectedCategory === "all" || n.category === selectedCategory;

  const featuredNews = useMemo(() => news.slice(0, 3), [news]);

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
        onSignupClick={() => (location.href = "/signup")}
      />

      {error && (
        <div className="container mx-auto px-4 mt-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {isLoading ? <FeaturedLoadingSkeleton /> : <FeaturedNewsSection featuredNews={featuredNews} />}

      <LLMRecommendationSection onNewsClick={() => {}} />

      <main className="container mx-auto px-4 py-8 flex-1 space-y-10">
        {/* 하이라이트 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">하이라이트</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {(["오늘", "이번 주", "이번 달"] as const).map((label, idx) => {
              const days = [1, 7, 30][idx];
              const from = Date.now() - days * 24 * 3600 * 1000;
              const items = news
                .filter((n) => {
                  const ts = n.publishedAt ? Date.parse(n.publishedAt) : 0;
                  return ts >= from && passesSearch(n) && passesCategory(n);
                })
                .sort(sortByRecent)
                .slice(0, 6);

              return (
                <div key={label} className="rounded-xl border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{label} 하이라이트</h3>
                    <span className="text-xs text-muted-foreground">총 {items.length}건</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                  ) : (
                    <div className="grid gap-4">
                      {items.map((n) => {
                        const s = getCatStyle(n.category);
                        const Icon = getCategoryIcon(n.category);
                        return (
                          <div key={n.id} className="flex gap-3">
                            {/* ✅ 그라데이션 썸네일 */}
                            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border ${s.grad} ${s.border}`}>
                              <div className={`flex size-10 items-center justify-center rounded-xl ${s.bg} ${s.border} border shadow-sm`}>
                                <Icon className={`size-6 ${s.text}`} />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <Link href={`/news/${n.id}`} className="font-semibold hover:underline line-clamp-2">
                                {n.title}
                              </Link>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className={`mr-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${s.bg} ${s.text} ${s.border}`}>
                                  {n.category ?? "Uncategorized"}
                                </span>
                                {n.source} · {formatDateKST(n.publishedAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 카테고리별 Top 3 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">카테고리별 Top 3</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(
              news.reduce<Record<string, NewsNormalized[]>>((acc, cur) => {
                const key = cur.category || "Uncategorized";
                (acc[key] ||= []).push(cur);
                return acc;
              }, {})
            ).map(([cat, items]) => {
              const filtered = items
                .filter((n) => passesSearch(n) && passesCategory(n))
                .sort(sortByRecent)
                .slice(0, 3);

              const s = getCatStyle(cat);
              return (
                <div key={cat} className={`rounded-xl border bg-card p-4 ${s.border}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">{categoryLabels[cat] ?? cat}</h3>
                    <span className="text-xs text-muted-foreground">Top 3</span>
                  </div>

                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                  ) : (
                    <div className="space-y-4">
                      {filtered.map((n) => {
                        const tone = getCatStyle(n.category);
                        const Icon = getCategoryIcon(n.category);
                        return (
                          <div key={n.id} className="flex gap-3">
                            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border ${tone.grad} ${tone.border}`}>
                              <div className={`flex size-10 items-center justify-center rounded-xl ${tone.bg} ${tone.border} border shadow-sm`}>
                                <Icon className={`size-6 ${tone.text}`} />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <Link href={`/news/${n.id}`} className="font-semibold hover:underline line-clamp-2">
                                {n.title}
                              </Link>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className={`mr-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${tone.bg} ${tone.text} ${tone.border}`}>
                                  {n.category ?? "Uncategorized"}
                                </span>
                                {n.source} · {formatDateKST(n.publishedAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
