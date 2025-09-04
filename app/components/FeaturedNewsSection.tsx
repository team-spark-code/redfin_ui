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
};

function formatDateKST(s?: string) {
  if (!s) return "";
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function FeaturedNewsSection({ featuredNews }: { featuredNews: NewsItem[] }) {
  return (
    <section className="border-b bg-gradient-to-br from-primary/5 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">핵심 뉴스</h2>
          <Link href="/news" className="text-sm text-primary hover:underline">
            전체 보기 →
          </Link>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredNews.map((n) => {
            const s = getCatStyle(n.category);
            const Icon = getCategoryIcon(n.category);
            return (
              <li key={n.id}>
                <Link href={`/news/${n.id}`} className="group block focus:outline-none">
                  <article className={`h-full overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md focus:ring-2 ${s.border} ${s.ring}`}>
                    {/* ✅ 그라데이션 타일 */}
                    <div className={`relative aspect-[16/9] w-full ${s.grad} border-b ${s.border} flex items-center justify-center`}>
                      <div className={`flex size-16 items-center justify-center rounded-2xl ${s.bg} ${s.border} border shadow-sm`}>
                        <Icon className={`size-8 ${s.text}`} />
                      </div>
                      <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}>
                        {n.category ?? "Uncategorized"}
                      </span>
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
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
