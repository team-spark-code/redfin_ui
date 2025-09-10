// app/components/FeaturedNewsSection.tsx
"use client";

import Link from "next/link";
import { getCatStyle, getCategoryIcon } from "@/app/lib/categoryStyle";

type NewsItem = {
  id: string;
  title: string;
  description: string;
  publishedAt?: string;
  source?: string;
  imageUrl?: string | null;
  category?: string;
  sourceUrl?: string; // 실제 뉴스 링크 추가
};

function formatDateKST(s?: string) {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function FeaturedNewsSection({ featuredNews, onNewsClick }: { featuredNews: NewsItem[]; onNewsClick?: (id: string) => void }) {
  // 카드 클릭 핸들러
  const handleCardClick = (newsItem: NewsItem) => {
    if (onNewsClick) {
      onNewsClick(newsItem.id);
      return;
    }
    if (newsItem.sourceUrl) {
      // 실제 뉴스 링크가 있으면 새 탭에서 열기
      window.open(newsItem.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      // 링크가 없으면 내부 상세 페이지로 이동
      window.location.href = `/news/${newsItem.id}`;
    }
  };

  return (
    <section className="border-b bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">핵심 뉴스</h2>
          <Link href="/featured-news" className="text-sm text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredNews.map((n) => {
            const s = getCatStyle(n.category);
            const Icon = getCategoryIcon(n.category);
            return (
              <li key={n.id}>
                <div
                  onClick={() => handleCardClick(n)}
                  className="group block focus:outline-none cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(n);
                    }
                  }}
                >
                  <article className={`h-full overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md focus:ring-2 group-hover:scale-[1.02] ${s.border} ${s.ring}`}>
                    {/* 이미지 썸네일 또는 그라데이션 타일 */}
                    <div className={`relative aspect-[16/9] w-full border-b ${s.border}`}>
                      {n.imageUrl ? (
                        // 실제 이미지가 있을 때
                        <div className="relative w-full h-full">
                          <img
                            src={n.imageUrl}
                            alt={n.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // 이미지 로드 실패 시 그라데이션 타일로 대체
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          {/* 이미지 오버레이 */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          {/* 카테고리 배지 */}
                          <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-medium border ${s.bg} ${s.text} ${s.border} backdrop-blur-sm`}>
                            {n.category ?? "Uncategorized"}
                          </span>
                          {/* 외부 링크 표시 */}
                          {n.sourceUrl && (
                            <span className="absolute right-2 top-2 text-xs text-white bg-black/50 rounded px-1.5 py-0.5 backdrop-blur-sm">
                              외부링크
                            </span>
                          )}
                          {/* 이미지 로드 실패 시 대체할 그라데이션 타일 */}
                          <div className={`absolute inset-0 ${s.grad} flex items-center justify-center`} style={{ display: 'none' }}>
                            <div className={`flex size-16 items-center justify-center rounded-2xl ${s.bg} ${s.border} border shadow-sm`}>
                              <Icon className={`size-8 ${s.text}`} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // 이미지가 없을 때 그라데이션 타일
                        <div className={`relative w-full h-full ${s.grad} flex items-center justify-center`}>
                          <div className={`flex size-16 items-center justify-center rounded-2xl ${s.bg} ${s.border} border shadow-sm`}>
                            <Icon className={`size-8 ${s.text}`} />
                          </div>
                          <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}>
                            {n.category ?? "Uncategorized"}
                          </span>
                          {/* 외부 링크 표시 */}
                          {n.sourceUrl && (
                            <span className="absolute right-2 top-2 text-xs text-white bg-black/50 rounded px-1.5 py-0.5">
                              외부링크
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 본문 */}
                    <div className="flex h-full flex-col gap-2 p-4">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:underline">
                        {n.title}
                      </h3>
                      {n.description ? (
                        <p className="line-clamp-3 text-sm text-muted-foreground">{n.description}</p>
                      ) : (
                        <div className="h-[0.75rem]" />
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
                        <span className="truncate">{n.source ?? "articles"}</span>
                        <span>{formatDateKST(n.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
