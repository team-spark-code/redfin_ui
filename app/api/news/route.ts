import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.0.123:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // 기본값: page=1, size=200, include_news=false
  const page = searchParams.get("page") ?? "1";
  const size = searchParams.get("size") ?? "200";
  const include_news = searchParams.get("include_news") ?? "false";

  // 선택 파라미터
  const search = searchParams.get("search");
  const tagsAll = searchParams.getAll("tags"); // /api/news?tags=topic/AI&tags=org/Google 처럼 복수 가능

  const upstream = new URL(`${API_BASE}/api/v1/articles/`);
  upstream.searchParams.set("page", page);
  upstream.searchParams.set("size", size);
  upstream.searchParams.set("include_news", include_news);
  if (search) upstream.searchParams.set("search", search);
  tagsAll.forEach(t => upstream.searchParams.append("tags", t));

  const r = await fetch(upstream.toString(), { cache: "no-store" });
  if (!r.ok) {
    const text = await r.text();
    return NextResponse.json({ error: text }, { status: r.status });
  }
  const data = await r.json();
  return NextResponse.json(data, { status: 200 });
}
