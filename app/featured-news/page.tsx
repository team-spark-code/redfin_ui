"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Skeleton } from "../components/ui/skeleton";
import { getCatStyle, getCategoryIcon } from "../lib/categoryStyle";
import { useAuth } from "../contexts/AuthContext";

// RSS 데이터 타입
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

// RSS 데이터를 NewsNormalized 형식으로 변환하는 함수
function normalizeRSSData(rssItems: RSSItem[]): NewsNormalized[] {
  const aiKeywords = [
    'ai', 'artificial intelligence', '인공지능', 'chatgpt', 'gpt',
    '머신러닝', 'machine learning', '딥러닝', 'deep learning',
    'openai', '생성형ai', 'generative ai', '자율주행', 'autonomous',
    'neural network', '신경망', 'llm', 'large language model'
  ];

  return rssItems
    .filter((item) => {
      const text = `${item.title} ${item.description || ''}`.toLowerCase();
      return aiKeywords.some(keyword => text.includes(keyword));
    })
    .map((item, i) => ({
      id: item.link || `rss-${i}`,
      title: item.title || "(제목 없음)",
      description: item.description || "",
      category: "technology",
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

async function fetchNews(): Promise<NewsNormalized[]> {
  const qp = new URLSearchParams();
  qp.set("page", "1");
  qp.set("size", "200");
  qp.set("include_news", "false");
  qp.set("search", "AI OR 인공지능 OR ChatGPT OR GPT OR 머신러닝 OR 딥러닝 OR OpenAI OR 생성형AI");
  qp.append("tags", "topic/AI");
  qp.append("tags", "technology");

  try {
    const r = await fetch(`/api/news?${qp.toString()}`, { cache: "no-store" });
    if (!r.ok) {
      const errorData = await r.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `API returned ${r.status}`);
    }
    const json: ArticlesListResponse = await r.json();

    return (json.items ?? []).map((n, i) => ({
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
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    return [];
  }
}

export default function FeaturedNewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [allFeaturedNews, setAllFeaturedNews] = useState<NewsNormalized[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "title" | "source">("recent");
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // 미국/영국 언론사 판별 함수
  const isUSUKNews = (n: NewsNormalized) => {
    if (!n.sourceUrl) return false;
    try {
      const url = new URL(n.sourceUrl);
      const usukDomains = [
        'wsj.com', 'wired.com', 'techcrunch.com', 'cnn.com', 'npr.org',
        'theverge.com', 'technologyreview.com', 'nytimes.com', 'washingtonpost.com',
        'bloomberg.com', 'reuters.com', 'associated-press.org', 'time.com',
        'bbc.co.uk', 'theguardian.com', 'ft.com', 'independent.co.uk',
        'telegraph.co.uk', 'economist.com', 'sky.com'
      ];
      return usukDomains.some(domain => url.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  // AI 관련 키워드 체크 함수
  const isAIRelated = (n: NewsNormalized) => {
    const aiKeywords = [
      'ai', 'artificial intelligence', '인공지능', 'machine learning', '머신러닝',
      'deep learning', '딥러닝', 'chatgpt', 'gpt', 'openai', 'neural network',
      '신경망', 'llm', 'large language model', 'generative ai', '생성형ai',
      'automation', 'robotics', 'computer vision', 'nlp', 'algorithm'
    ];
    const text = `${n.title} ${n.description} ${n.tags.join(' ')}`.toLowerCase();
    return aiKeywords.some(keyword => text.includes(keyword));
  };

  // 뉴스 데이터 가져오기
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [articlesData, rssData] = await Promise.all([
          fetchNews(),
          fetchRSSNews(),
        ]);

        const allNews = [...articlesData, ...rssData];
        const featuredNews = allNews
          .filter(n => isUSUKNews(n) && isAIRelated(n))
          .sort(sortByRecent);

        if (alive) {
          setAllFeaturedNews(featuredNews);
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

  // 검색 및 필터링
  const filteredAndSortedNews = useMemo(() => {
    let filtered = allFeaturedNews;

    // 검색 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query) ||
        n.source.toLowerCase().includes(query)
      );
    }

    // 카테고리 필터링
    if (selectedCategory !== "all") {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    // 정렬
    const sorted = [...filtered];
    switch (sortBy) {
      case "recent":
        sorted.sort(sortByRecent);
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "source":
        sorted.sort((a, b) => a.source.localeCompare(b.source));
        break;
    }

    return sorted;
  }, [allFeaturedNews, searchQuery, selectedCategory, sortBy]);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [articlesData, rssData] = await Promise.all([
        fetchNews(),
        fetchRSSNews(),
      ]);

      const allNews = [...articlesData, ...rssData];
      const featuredNews = allNews
        .filter(n => isUSUKNews(n) && isAIRelated(n))
        .sort(sortByRecent);

      setAllFeaturedNews(featuredNews);
    } catch (e: any) {
      setError(e?.message ?? "새로고침 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsClick = (newsItem: NewsNormalized) => {
    if (newsItem.sourceUrl) {
      window.open(newsItem.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLogin = () => router.push('/login');
  const handleSignup = () => router.push('/signup');
  const handleLogout = () => logout();
  const handleProfileClick = () => router.push('/profile');
  const handleInterestsClick = () => router.push('/interests');
  const handleHomeClick = () => router.push('/');

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

      <main className="container mx-auto px-4 py-8 flex-1">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">핵심뉴스 전체보기</h1>
              <p className="text-muted-foreground mt-2">
                미국/영국 주요 언론사의 최신 AI 뉴스 {filteredAndSortedNews.length}건
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              뒤로 가기
            </button>
          </div>

          {/* 정렬 및 필터 옵션 */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">정렬:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "recent" | "title" | "source")}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="recent">최신순</option>
                <option value="title">제목순</option>
                <option value="source">출처순</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 rounded-md text-sm transition-colors"
            >
              {isLoading ? "새로고침 중..." : "새로고침"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            <button
              onClick={handleRefresh}
              className="ml-2 underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 뉴스 리스트 */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <Skeleton className="aspect-[16/9] w-full rounded-lg mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredAndSortedNews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">조건에 맞는 뉴스가 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedNews.map((news) => {
              const s = getCatStyle(news.category);
              const Icon = getCategoryIcon(news.category);

              return (
                <div
                  key={news.id}
                  className="rounded-xl border bg-card p-4 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleNewsClick(news)}
                >
                  {/* 썸네일 */}
                  <div className={`aspect-[16/9] w-full rounded-lg border mb-4 ${s.grad} ${s.border} flex items-center justify-center`}>
                    <div className={`flex size-16 items-center justify-center rounded-xl ${s.bg} ${s.border} border shadow-sm`}>
                      <Icon className={`size-8 ${s.text}`} />
                    </div>
                  </div>

                  {/* 제목 */}
                  <h3 className="font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                    {news.title}
                  </h3>

                  {/* 설명 */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {news.description}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded ${s.bg} ${s.text} ${s.border} border`}>
                        {news.category}
                      </span>
                      <span>{news.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatDateKST(news.publishedAt)}</span>
                      {news.sourceUrl && (
                        <span className="text-blue-500">🔗</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
