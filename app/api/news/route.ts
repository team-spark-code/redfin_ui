// app/api/news/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BACKEND_BASE = process.env.BACKEND_BASE_URL ?? "http://192.168.0.123:8000";
const CANDIDATE_PATHS = ["/news", "/v1/news", "/articles"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawLimit = url.searchParams.get("limit") ?? "24";
  const requested = Number.parseInt(rawLimit, 10);
  const limit = Number.isFinite(requested) ? Math.min(requested, 100) : 24; // ✅ 100으로 클램프
  const q = url.searchParams.get("q") ?? "";

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 15000);

  try {
    for (const p of CANDIDATE_PATHS) {
      const upstream = `${BACKEND_BASE}${p}?limit=${limit}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
      try {
        const r = await fetch(upstream, { signal: ac.signal, cache: "no-store" });
        const text = await r.text();
        if (r.ok) {
          try {
            const json = JSON.parse(text);
            const res = NextResponse.json(json, { status: 200 });
            res.headers.set("x-upstream-url", upstream);
            res.headers.set("x-effective-limit", String(limit));
            return res;
          } catch {
            return new NextResponse(text, {
              status: 200,
              headers: {
                "content-type": r.headers.get("content-type") ?? "application/json",
                "x-upstream-url": upstream,
                "x-effective-limit": String(limit),
              },
            });
          }
        }
      } catch {
        // 다음 후보 경로 시도
      }
    }
    return NextResponse.json(
      { error: "Upstream /news fetch failed (all candidates tried)", hint: "limit must be ≤ 100" },
      { status: 502 }
    );
  } finally {
    clearTimeout(to);
  }
}
