import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.0.123:8000";

export async function GET(req: NextRequest) {
  try {
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

    console.log(`[API] Fetching from: ${upstream.toString()}`);

    const r = await fetch(upstream.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(10000) // 10초 타임아웃 추가
    });

    if (!r.ok) {
      const text = await r.text();
      console.error(`[API] Upstream error: ${r.status} - ${text}`);

      // 외부 API 오류 시 더 친화적인 메시지 반환
      return NextResponse.json({
        error: "뉴스 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        details: `Upstream API returned ${r.status}`,
        upstreamUrl: upstream.toString()
      }, { status: 503 }); // Service Unavailable
    }

    const data = await r.json();
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (error) {
    console.error(`[API] News fetch error:`, error);

    // 네트워크 오류나 기타 예외 처리
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json({
          error: "요청 시간이 초과되었습니다. 다시 시도해주세요."
        }, { status: 408 }); // Request Timeout
      }

      if (error.message.includes('fetch')) {
        return NextResponse.json({
          error: "뉴스 서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
        }, { status: 503 });
      }
    }

    return NextResponse.json({
      error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }, { status: 500 });
  }
}
