"use client";

import { useEffect, useMemo, useState } from "react";
import { FeaturedNewsSection } from "./FeaturedNewsSection";
import { Skeleton } from "./ui/skeleton";

// Naver API normalized item (from our API route)
interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1523742810063-4f61a38b7e1b?w=1200&q=80&auto=format&fit=crop";

export function FeaturedAINewsSection() {
  const [items, setItems] = useState<NaverNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // 최근순으로 충분히 가져온 뒤 상위 3개만 사용
        const res = await fetch(`/api/naver/news?query=${encodeURIComponent("인공지능")}&display=12&sort=date`, { cache: "no-store" });
        if (!res.ok) throw new Error("네이버 AI 뉴스를 가져오지 못했습니다.");
        const data = await res.json();
        if (alive) setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "알 수 없는 오류");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const featuredNews = useMemo(() => {
    const keywords = [
      "ai",
      "인공지능",
      "머신러닝",
      "딥러닝",
      "llm",
      "gpt",
      "오픈ai",
      "openai",
      "copilot",
      "코파일럿",
      "chatgpt",
      "claude",
      "gemini",
      "생성형",
    ];
    const containsAI = (t: string) => {
      const s = (t || "").toLowerCase();
      return keywords.some((k) => s.includes(k));
    };
    const uniqBy = <T, K extends string | number>(arr: T[], key: (v: T) => K) => {
      const seen = new Set<K>();
      const out: T[] = [];
      for (const v of arr) {
        const k = key(v);
        if (!seen.has(k)) {
          seen.add(k);
          out.push(v);
        }
      }
      return out;
    };

    const filtered = items.filter(
      (i) => containsAI(i.title) || containsAI(i.description)
    );

    const deduped = uniqBy(filtered, (i) => i.originallink || i.link);

    let picked = deduped;
    if (picked.length < 3) {
      // 부족하면 전체 결과에서 중복 제거 후 보충
      const allDeduped = uniqBy(items, (i) => i.originallink || i.link);
      const supplement = allDeduped.filter((i) => !picked.includes(i));
      picked = [...picked, ...supplement].slice(0, 3);
    } else {
      picked = picked.slice(0, 3);
    }

    return picked.map((i) => ({
      id: i.originallink || i.link,
      title: i.title,
      description: i.description,
      category: "AI",
      publishedAt: i.pubDate,
      imageUrl: PLACEHOLDER_IMG,
      sourceUrl: i.originallink || i.link,
      source: "Naver",
    }));
  }, [items]);

  const handleCardClick = (id: string) => {
    // id는 원문 URL로 설정되어 있음
    window.open(id, "_blank");
  };

  if (loading) {
    return (
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
  }

  if (error || featuredNews.length === 0) {
    // 에러이거나 결과 0개면 섹션을 표시하되, 안내 문구만 출력
    return (
      <section className="bg-gradient-to-br from-primary/5 to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted" />
              <h2>핵심 뉴스</h2>
            </div>
          </div>
          <p className="text-muted-foreground">현재 표시할 AI 핵심 뉴스가 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <FeaturedNewsSection featuredNews={featuredNews} onNewsClick={handleCardClick} />
  );
}

export default FeaturedAINewsSection;
