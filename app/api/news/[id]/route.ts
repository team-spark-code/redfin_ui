import { NextResponse } from "next/server";

// 예: http://192.168.0.66:8030
const BASE = process.env.BACKEND_BASE_URL ?? "http://http://192.168.0.123:8000/docs";

/** 백엔드 응답 타입(예시) */
type BackendArticle = {
  _id?: { $oid?: string } | string;
  Title?: string | null;
  Summary?: string | null;
  URL?: string | null;
  category?: string | null;
  body?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  tags?: string[] | null;
  keywords?: string | null;
  hero_image_url?: string | null;
  author_name?: string | null;
  sources?: string[] | null;
};

/** 프론트에서 쓰는 형태로 변환 */
function toNewsRecord(b: BackendArticle) {
  const oid =
    (typeof b._id === "string" ? b._id : b._id?.$oid) ??
    b.URL ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`);

  return {
    _id: oid,
    url: b.URL ?? undefined,
    title: b.Title ?? "(제목 없음)",
    dek: b.Summary ?? undefined,
    tldr: undefined,
    body_md: b.body ?? undefined,
    hero_image_url: b.hero_image_url ?? null,
    author_name: b.author_name ?? null,
    category: b.category ?? "Technology & Product",
    categories: undefined,
    tags: b.tags ?? undefined,
    sources: b.sources ?? (b.URL ? [b.URL] : undefined),
    status: undefined,
    created_at: b.created_at ?? undefined,
    published_at: b.published_at ?? b.created_at ?? undefined,
  };
}

/** 후보 엔드포인트를 순차 시도 */
async function tryFetchOne(id: string): Promise<BackendArticle | null> {
  // 필요에 맞게 후보를 추가/삭제하세요.
  const candidates = [
    // 1) 경로 파라미터 방식
    `${BASE}/api/v1/articles/${encodeURIComponent(id)}`,
    // 2) ObjectId 전용 경로가 따로 있는 경우
    `${BASE}/api/v1/articles/by-oid/${encodeURIComponent(id)}`,
    // 3) 쿼리 파라미터 방식
    `${BASE}/api/v1/articles?_id=${encodeURIComponent(id)}`,
    `${BASE}/api/v1/articles?oid=${encodeURIComponent(id)}`,
    `${BASE}/api/v1/articles?id=${encodeURIComponent(id)}`,
    // 4) find-one 같은 헬퍼 엔드포인트가 있을 수도 있음
    `${BASE}/api/v1/articles/find-one?oid=${encodeURIComponent(id)}`,
  ];

  for (const url of candidates) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) {
        // 404면 다음 후보로 넘어가고, 500 등은 그대로 중단해도 됨
        if (r.status >= 500) {
          // 서버 오류라면 바로 중단하는 쪽을 선호
          // 아니면 계속 시도하려면 주석 처리
          continue;
        }
        continue;
      }

      const data = await r.json();

      // 일부 백엔드는 리스트 형태로 돌려줄 수 있음
      if (Array.isArray(data)) {
        if (data.length === 0) continue;
        return data[0] as BackendArticle;
      }

      // 단건 객체
      if (data && typeof data === "object") {
        return data as BackendArticle;
      }
    } catch (e) {
      // 네트워크 에러면 다음 후보 시도
      continue;
    }
  }

  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const backend = await tryFetchOne(params.id);

    if (!backend) {
      return NextResponse.json(
        {
          message:
            "not found in upstream with tried patterns (path, by-oid, query). " +
            "Check BACKEND_BASE_URL or single-article endpoint shape.",
        },
        { status: 404 }
      );
    }

    const normalized = toNewsRecord(backend);
    return NextResponse.json(normalized);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? "proxy failed" },
      { status: 500 }
    );
  }
}
