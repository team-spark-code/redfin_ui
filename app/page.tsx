"use client";

import { useState, useMemo, useEffect } from "react";
// ▼ 기존 섹션/컴포넌트
import { FeaturedNewsSection } from "./components/FeaturedNewsSection";
import { LLMRecommendationSection } from "./components/LLMRecommendationSection";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { SignupPage } from "./components/SignupPage";
import { NewsDetailPage } from "./components/NewsDetailPage";
import { Skeleton } from "./components/ui/skeleton";

/** ------------------ 원자료 타입 ------------------ */
type RawNews = {
  source?: string | null;
  title?: string | null;
  link: string;
  published?: string | null;
  summary?: string | null;
  authors?: string[] | null;
  tags?: string[] | null; // ✅ 서버에서 내려오는 태그 (있으면 사용)
};

/** ------------------ 정규화 타입 ------------------ */
type NewsNormalized = {
  id: string;
  title: string;
  description: string;
  category: string;        // tags[0] 또는 'technology'
  publishedAt: string;     // ISO string
  imageUrl: string;        // 썸네일 없으면 placeholder
  sourceUrl: string;       // 원문 링크
  source: string;          // 출처 이름
  tags: string[];          // ✅ 태그(급상승/기업 집계용)
};

/** ------------------ 더미 한 건 ------------------ */
const DUMMY_NEWS: NewsNormalized = {
  id: "1", // ← NewsDetailPage의 getNewsDetail("1")과 매칭
  title: "인공지능 기술의 새로운 돌파구, 차세대 언어 모델 발표",
  description:
    "최신 AI 기술이 다양한 산업 분야에서 혁신적인 변화를 이끌고 있으며, 특히 자연어 처리 능력이 크게 향상되었습니다.",
  category: "technology",
  publishedAt: new Date().toISOString(),
  imageUrl:
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
  sourceUrl:
    "https://towardsdatascience.com/building-a-modern-dashboard-with-python-and-tkinter-606894",
  source: "테크뉴스",
  tags: ["인공지능", "언어모델", "자연어처리"],
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.0.123:8000";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1523742810063-4f61a38b7e1b?w=1200&q=80&auto=format&fit=crop";

/** ------------------ API 호출 ------------------ */
async function fetchNews(): Promise<RawNews[]> {
  // 필요 시 /api/news 프록시로 바꿔도 됨: fetch(`/api/news?limit=24`, { cache: "no-store" })
  const res = await fetch(`${API_BASE}/news?limit=24`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch /news");
  return res.json();
}

/** ------------------ 정규화 ------------------ */
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
    tags: n.tags ?? [], // ✅ 추가
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

type PageType = "home" | "signup" | "newsDetail";

/** 날짜 포맷 유틸 */
function formatDateKST(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return iso;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [selectedNewsId, setSelectedNewsId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ 뉴스 상태
  const [news, setNews] = useState<NewsNormalized[]>([]);

  /** 최초 로딩 */
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

  /** 새로고침 */
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

  /** 상단 피처드 (첫 3개) */
  const featuredNews = useMemo(() => news.slice(0, 3), [news]);

  /** 페이지 라우팅 */
  const handleSignupClick = () => setCurrentPage("signup");
  const handleBackToHome = () => setCurrentPage("home");
  const handleNewsClick = (newsId: string) => {
    setSelectedNewsId(newsId);
    setCurrentPage("newsDetail");
  };

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

  /** 상세/회원가입 분기 */
  if (currentPage === "newsDetail") {
    return <NewsDetailPage newsId={selectedNewsId} onBack={handleBackToHome} />;
  }
  if (currentPage === "signup") {
    return <SignupPage onBack={handleBackToHome} />;
  }

  /** ------------------ 홈 ------------------ */
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
        <FeaturedNewsSection featuredNews={featuredNews} onNewsClick={handleNewsClick} />
      )}

      <LLMRecommendationSection onNewsClick={handleNewsClick} />

      {/* ▼▼▼ 하단: 대시보드 위젯들 ▼▼▼ */}
      <main className="container mx-auto px-4 py-8 flex-1 space-y-10">
        {/* 1) 오늘/이번주/이번달 하이라이트 */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">하이라이트</h2>
            <a
              href="/news"
              className="text-sm text-primary hover:underline"
              title="전체 뉴스 보러가기"
            >
              전체 보기 →
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {([
              { key: "today", label: "오늘", days: 1 },
              { key: "week", label: "이번 주", days: 7 },
              { key: "month", label: "이번 달", days: 30 },
            ] as const).map(({ key, label, days }) => {
              const from = Date.now() - days * 24 * 3600 * 1000;
              const items = news
                .filter((n) => {
                  const ts = n.publishedAt ? Date.parse(n.publishedAt) : 0;
                  // 상단 검색/카테고리도 반영
                  const matchSearch = !searchQuery
                    ? true
                    : `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchCat = selectedCategory === "all" || n.category === selectedCategory;
                  return ts >= from && matchSearch && matchCat;
                })
                .sort((a, b) => {
                  const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
                  const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
                  return tb - ta;
                })
                .slice(0, 6);

              return (
                <div key={key} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{label} 하이라이트</h3>
                    <span className="text-xs text-muted-foreground">총 {items.length}건</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                  ) : (
                    <div className="grid gap-4">
                      {items.map((n) => (
                        <div key={n.id} className="flex gap-3">
                          <img
                            src={n.imageUrl}
                            alt=""
                            className="w-24 h-16 object-cover rounded-lg border"
                          />
                          <div className="min-w-0">
                            <a
                              href={n.sourceUrl}
                              target="_blank"
                              className="font-semibold hover:underline line-clamp-2"
                            >
                              {n.title}
                            </a>
                            <div className="text-xs text-muted-foreground mt-1">
                              {n.source} · {formatDateKST(n.publishedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 2) 카테고리별 Top 3 */}
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
              // 검색/상단 카테고리 필터 반영
              const filtered = items.filter((n) => {
                const matchSearch = !searchQuery
                  ? true
                  : `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase());
                const matchCat = selectedCategory === "all" || n.category === selectedCategory;
                return matchSearch && matchCat;
              });

              const top = filtered
                .slice()
                .sort((a, b) => {
                  const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
                  const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
                  return tb - ta;
                })
                .slice(0, 3);

              return (
                <div key={cat} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{categoryLabels[cat] ?? cat}</h3>
                    <span className="text-xs text-muted-foreground">Top 3</span>
                  </div>

                  {top.length === 0 ? (
                    <p className="text-sm text-muted-foreground">데이터 없음</p>
                  ) : (
                    <div className="space-y-4">
                      {top.map((n) => (
                        <div key={n.id} className="flex gap-3">
                          <img
                            src={n.imageUrl}
                            alt=""
                            className="w-24 h-16 object-cover rounded-lg border"
                          />
                          <div className="min-w-0">
                            <a
                              href={n.sourceUrl}
                              target="_blank"
                              className="font-semibold hover:underline line-clamp-2"
                            >
                              {n.title}
                            </a>
                            <div className="text-xs text-muted-foreground mt-1">
                              {n.source} · {formatDateKST(n.publishedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 3) 급상승 태그 & 기업(org/*) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">급상승 태그 & 기업</h2>

          {/* 최근 7일 태그 Top 12 */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-2">최근 7일 태그 Top 12</h3>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const weekFrom = Date.now() - 7 * 24 * 3600 * 1000;
                const counts = new Map<string, number>();
                news.forEach((n) => {
                  const ts = n.publishedAt ? Date.parse(n.publishedAt) : 0;
                  if (ts < weekFrom) return;
                  (n.tags ?? []).forEach((t) => {
                    // 상단 검색/카테고리 필터 반영
                    const matchSearch = !searchQuery
                      ? true
                      : `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchCat = selectedCategory === "all" || n.category === selectedCategory;
                    if (matchSearch && matchCat) {
                      counts.set(t, (counts.get(t) || 0) + 1);
                    }
                  });
                });
                const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

                return top.length ? (
                  top.map(([t, c]) => (
                    <span
                      key={t}
                      className="px-2 py-1 rounded-full border text-xs bg-slate-50"
                      title={`${t} (${c})`}
                    >
                      {t} <span className="opacity-60">({c})</span>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">데이터 없음</p>
                );
              })()}
            </div>
          </div>

          {/* 기업(org/*) Top 8 */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold mb-2">기업( org/* ) Top 8</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(() => {
                const counts = new Map<string, number>();
                news.forEach((n) => {
                  const matchSearch = !searchQuery
                    ? true
                    : `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchCat = selectedCategory === "all" || n.category === selectedCategory;
                  if (!matchSearch || !matchCat) return;

                  (n.tags ?? [])
                    .filter((t) => t.startsWith("org/"))
                    .forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
                });
                const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

                return top.length ? (
                  top.map(([t, c]) => (
                    <div
                      key={t}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 bg-white"
                    >
                      <span className="font-medium">{t.replace(/^org\//, "")}</span>
                      <span className="text-xs text-muted-foreground">{c}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">데이터 없음</p>
                );
              })()}
            </div>
          </div>
        </section>

        {/* 4) 소스별 커버리지 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">소스별 커버리지</h2>
          <div className="rounded-xl border bg-card p-4">
            <div className="space-y-3">
              {(() => {
                const counts = new Map<string, number>();
                news.forEach((n) => {
                  const matchSearch = !searchQuery
                    ? true
                    : `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchCat = selectedCategory === "all" || n.category === selectedCategory;
                  if (!matchSearch || !matchCat) return;

                  counts.set(n.source, (counts.get(n.source) || 0) + 1);
                });

                const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
                const list = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

                return list.length ? (
                  list.map(([src, cnt]) => {
                    const pct = Math.round((cnt / total) * 100);
                    return (
                      <div key={src}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{src}</div>
                          <div className="text-xs text-muted-foreground">
                            {cnt}건 · {pct}%
                          </div>
                        </div>
                        <div className="h-2 rounded bg-slate-100 overflow-hidden mt-1">
                          <div className="h-2 bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">데이터 없음</p>
                );
              })()}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
