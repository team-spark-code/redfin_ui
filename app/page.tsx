// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FeaturedNewsSection } from "./components/FeaturedNewsSection";
import { LLMRecommendationSection } from "./components/LLMRecommendationSection";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Skeleton } from "./components/ui/skeleton";
import { getCatStyle, getCategoryIcon, categoryLabels } from "./lib/categoryStyle";
import { useAuth } from "./contexts/AuthContext";

// RSS 데이터 타입 추가
type RSSItem = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  category?: string;
};

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

  // AI 관련 뉴스만 가져오도록 설정
  if (params?.search) {
    qp.set("search", params.search);
  } else {
    // 검색어가 없으면 AI 관련 키워드로 검색
    qp.set("search", "AI OR 인공지능 OR ChatGPT OR GPT OR 머신러닝 OR 딥러닝 OR OpenAI OR 생성형AI");
  }

  // AI 관련 태그 추가
  qp.append("tags", "topic/AI");
  qp.append("tags", "technology");
  (params?.tags ?? []).forEach((t) => qp.append("tags", t));

  try {
    const r = await fetch(`/api/news?${qp.toString()}`, { cache: "no-store" });
    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `API returned ${r.status}`);
    }
    const json: ArticlesListResponse = await r.json();
    return json;
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    // 빈 결과 반환하여 앱이 계속 작동하도록 함
    return { items: [], total: 0, page: 1, size: 200 };
  }
}

// RSS 데이터를 NewsNormalized 형식으로 변환하는 함수 (AI 필터링 추가)
function normalizeRSSData(rssItems: RSSItem[]): NewsNormalized[] {
  const aiKeywords = [
    'ai', 'artificial intelligence', '인공지능', 'chatgpt', 'gpt',
    '머신러닝', 'machine learning', '딥러닝', 'deep learning',
    'openai', '생성형ai', 'generative ai', '자율주행', 'autonomous',
    'neural network', '신경망', 'llm', 'large language model'
  ];

  return rssItems
    .filter((item) => {
      // 제목이나 설명에 AI 관련 키워드가 포함된 뉴스만 필터링
      const text = `${item.title} ${item.description || ''}`.toLowerCase();
      return aiKeywords.some(keyword => text.includes(keyword));
    })
    .map((item, i) => ({
      id: item.link || `rss-${i}`,
      title: item.title || "(제목 없음)",
      description: item.description || "",
      category: "technology", // AI 뉴스는 모두 technology 카테고리로 설정
      publishedAt: item.pubDate || new Date().toISOString(),
      imageUrl: item.imageUrl || null,
      sourceUrl: item.link,
      source: "RSS",
      tags: ["AI", "technology"],
    }));
}

// RSS 데이터 가져오기 함수
async function fetchRSSNews(): Promise<NewsNormalized[]> {
  try {
    const response = await fetch("/api/rss", { cache: "no-store" });
    if (!response.ok) throw new Error(`RSS fetch failed (${response.status})`);
    const data = await response.json();
    return normalizeRSSData(data.data || []);
  } catch (error) {
    console.error("RSS fetch error:", error);
    return [];
  }
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
  const [news, setNews] = useState<NewsNormalized[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, logout, login: authLogin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [rssNews, setRssNews] = useState<NewsNormalized[]>([]);



  // 뉴스 데이터 가져오기 (기존 + RSS)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 기존 뉴스와 RSS 뉴스를 병렬로 가져오기
        const [articlesRes, rssData] = await Promise.all([
          fetchNews(),
          fetchRSSNews(),
        ]);

        const normalizedArticles = normalizeNews(articlesRes).sort(sortByRecent);
        const sortedRssNews = rssData.sort(sortByRecent);

        if (alive) {
          setNews(normalizedArticles);
          setRssNews(sortedRssNews);
        }
      } catch (e: any) {
        if (alive) setError(e?.message ?? "뉴스를 불러오지 못했습니다.");
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // FeaturedLoadingSkeleton 컴포넌트 정의
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

  const handleRefreshRSS = async () => {
    try {
      setIsLoading(true);
      const rssData = await fetchRSSNews();
      setRssNews(rssData.sort(sortByRecent));
    } catch (e: any) {
      setError("RSS 새로고침 실패");
    } finally {
      setIsLoading(false);
    }
  };

  // 기존 새로고침 + RSS 새로고침
  const handleRefresh = () => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [articlesRes, rssData] = await Promise.all([
          fetchNews(searchQuery ? { search: searchQuery } : undefined),
          fetchRSSNews(),
        ]);

        const normalizedArticles = normalizeNews(articlesRes).sort(sortByRecent);
        const sortedRssNews = rssData.sort(sortByRecent);

        setNews(normalizedArticles);
        setRssNews(sortedRssNews);
      } catch (e: any) {
        setError(e?.message ?? "새로고침 실패");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // 모든 뉴스 합치기 (기존 + RSS)
  const allNews = useMemo(() => {
    return [...news, ...rssNews].sort(sortByRecent);
  }, [news, rssNews]);

  // 검색 및 필터링 함수들
  const textOf = (n: NewsNormalized) =>
    `${n.title} ${n.description} ${n.source} ${n.tags.join(" ")}`.toLowerCase();
  const passesSearch = (n: NewsNormalized) =>
    !searchQuery || textOf(n).includes(searchQuery.toLowerCase());
  const passesCategory = (n: NewsNormalized) =>
    selectedCategory === "all" || n.category === selectedCategory;

  // 검색 및 필터링을 allNews에 적용
  const filteredNews = useMemo(() => {
    return allNews.filter((n) => {
      const searchPasses = !searchQuery || textOf(n).includes(searchQuery.toLowerCase());
      const categoryPasses = selectedCategory === "all" || n.category === selectedCategory;
      return searchPasses && categoryPasses;
    });
  }, [allNews, searchQuery, selectedCategory]);

  const featuredNews = useMemo(() => filteredNews.slice(0, 3), [filteredNews]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  // Header에서 사용할 핸들러들 업데이트
  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  const handleLogout = () => {
    logout();
  };

  // 로그인 성공 핸들러 추가
  const handleLoginSuccess = (userData: any) => {
    console.log('메인 페이지에서 로그인 성공 처리:', userData);

    // localStorage에서 토큰 가져오기
    const token = localStorage.getItem('auth_token');

    if (token && userData) {
      // AuthContext의 login 함수 호출
      authLogin(token, userData);
      console.log('AuthContext login 함수 호출 완료');
    } else {
      console.error('토큰 또는 사용자 데이터가 없음');
    }
  };

  const handleProfileClick = () => {
    // 프로필 페이지로 이동
    router.push('/profile');
  };

  const handleInterestsClick = () => {
    // 관심사 설정 페이지로 이동
    router.push('/interests');
  };

  const handleHomeClick = () => {
    router.push('/');
  };

  // 뉴스 카드 클릭 핸들러
  const handleNewsClick = (newsItem: NewsNormalized) => {
    if (newsItem.sourceUrl) {
      // 실제 뉴스 링크가 있으면 새 탭에서 열기
      window.open(newsItem.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 링크가 없으면 내부 상세 페이지로 이동
      window.location.href = `/news/${newsItem.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        user={user}
        onLogout={handleLogout}
        onLoginClick={handleLogin}
        onSignupClick={handleSignup}
        onProfileClick={handleProfileClick}
        onInterestsClick={handleInterestsClick}
        onHomeClick={handleHomeClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {error && (
        <div className="container mx-auto px-4 mt-3">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={handleRefresh}
              className="ml-2 underline hover:no-underline"
            ></button>
              ��시 시도
          </div>
        </div>
      )}

      {/* AI 뉴스 상태 표시 */}
      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>총 {filteredNews.length}개 AI 뉴스 (일반: {news.length}, RSS: {rssNews.length})</span>
          <button
            onClick={handleRefreshRSS}
            className="hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            AI RSS 새로고침
          </button>
        </div>
      </div>

      {isLoading ? <FeaturedLoadingSkeleton /> : <FeaturedNewsSection featuredNews={featuredNews} />}

      <LLMRecommendationSection onNewsClick={() => {}} />

      <main className="container mx-auto px-4 py-8 flex-1 space-y-10">
        {/* 하이라이트 - filteredNews 사용 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">하이라이트</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {(["오늘", "이번 주", "이번 달"] as const).map((label, idx) => {
              const days = [1, 7, 30][idx];
              const from = Date.now() - days * 24 * 3600 * 1000;
              const items = filteredNews
                .filter((n) => {
                  const ts = n.publishedAt ? Date.parse(n.publishedAt) : 0;
                  return ts >= from;
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
                          <div
                            key={n.id}
                            className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => handleNewsClick(n)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNewsClick(n);
                              }
                            }}
                          >
                            {/* ✅ 그라데이션 썸네일 */}
                            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border ${s.grad} ${s.border}`}>
                              <div className={`flex size-10 items-center justify-center rounded-xl ${s.bg} ${s.border} border shadow-sm`}>
                                <Icon className={`size-6 ${s.text}`} />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold hover:underline line-clamp-2">
                                {n.title}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className={`mr-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${s.bg} ${s.text} ${s.border}`}>
                                  {n.category ?? "Uncategorized"}
                                </span>
                                {n.source} · {formatDateKST(n.publishedAt)}
                                {n.sourceUrl && (
                                  <span className="ml-2 text-blue-500">🔗</span>
                                )}
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
                          <div
                            key={n.id}
                            className="flex gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                            onClick={() => handleNewsClick(n)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNewsClick(n);
                              }
                            }}
                          >
                            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border ${tone.grad} ${tone.border}`}>
                              <div className={`flex size-10 items-center justify-center rounded-xl ${tone.bg} ${tone.border} border shadow-sm`}>
                                <Icon className={`size-6 ${tone.text}`} />
                              </div>
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold hover:underline line-clamp-2">
                                {n.title}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                <span className={`mr-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${tone.bg} ${tone.text} ${tone.border}`}>
                                  {n.category ?? "Uncategorized"}
                                </span>
                                {n.source} · {formatDateKST(n.publishedAt)}
                                {n.sourceUrl && (
                                  <span className="ml-2 text-blue-500">🔗</span>
                                )}
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
