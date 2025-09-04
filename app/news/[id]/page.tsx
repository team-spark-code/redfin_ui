// app/news/[id]/page.tsx
import { headers } from "next/headers";
import { NewsDetailPage } from "@/app/components/NewsDetailPage";
import type { NewsRecord } from "@/app/types/news"; // 타입만 import

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/+$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function getArticle(id: string): Promise<NewsRecord | undefined> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/news/${id}`, { cache: "no-store" });
  if (!res.ok) return undefined;
  return res.json();
}

export default async function Page({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  // ✅ 함수 prop 제거
  return <NewsDetailPage article={article} />;
}
