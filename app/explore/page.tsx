// app/explore/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/** ✅ 기존 프로젝트 컴포넌트 재사용 (경로는 프로젝트에 맞게 조정) */
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { NewsCard } from "../components/NewsCard";
import { Skeleton } from "../components/ui/skeleton";
import { Newspaper } from "lucide-react";

/** ======================== 타입 ======================== */
type StoredArticle = {
  id?: string;
  title?: string;
  description?: string;
  summary?: string;
  link?: string;          // 원문 URL
  url?: string;           // 원문 URL (다른 키를 쓰는 백엔드 대비)
  published?: string;     // ISO
  source?: string;
  imageUrl?: string;
  category?: string;      // Primary 1개 (있으면 그대로 사용)
  categories?: string[];  // 혹시 배열로 저장된 경우
  tags?: string[];        // ["org/OpenAI", "topic/RAG", "free/ai"] …
  score?: number;         // 정렬 가중에 사용 가능
};

type Normalized = {
  id: string;
  title: string;
  description: string;
  publishedAt: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: string;         // 하나만
  tags: string[];           // 네임스페이스/프리 태그 모두 포함
  score: number;
};

type TagFacet = {
  key: string;
  ns: string;     // 네임스페이스 (없으면 "free")
  value: string;  // "OpenAI"
  count: number;
};

/** ======================== 환경설정 ======================== */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.0.123:8000";

/** 최대 몇 건까지 한 번에 가져올지. 백엔드가 필터를 지원하면 쿼리스트링 확장 권장 */
const DEFAULT_LIMIT = 500;

/** ======================== 더미(최후 폴백) ======================== */
const DUMMIES: StoredArticle[] = [
  {
    id: "dummy-1",
    title: "인공지능 기술의 새로운 돌파구, 차세대 언어 모델 발표",
    description:
      "자연어 처리 성능이 대폭 향상된 차세대 모델이 공개되었습니다.",
    link: "https://example.com/a1",
    published: new Date(Date.now() - 2 * 86400000).toISOString(),
    source: "테크뉴스",
    imageUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
    category: "technology",
    tags: ["topic/NLP", "org/Stanford", "free/AI"],
  },
  {
    id: "dummy-2",
    title: "경제 전망: 2025년 성장률 예측과 주요 변수들",
    description: "완만한 회복세와 함께 신성장 동력이 부각되고 있습니다.",
    link: "https://example.com/a2",
    published: new Date(Date.now() - 5 * 86400000).toISOString(),
    source: "경제일보",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
    category: "economy",
    tags: ["topic/Inflation", "org/BOK"],
  },
  {
    id: "dummy-3",
    title: "국제 우주정거장, 새로운 실험 모듈 도킹 성공",
    description: "미세중력 환경에서의 신약 후보 물질 실험이 본격화됩니다.",
    link: "https://example.com/a3",
    published: new Date(Date.now() - 9 * 86400000).toISOString(),
    source: "스페이스데일리",
    imageUrl:
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80",
    category: "international",
    tags: ["topic/Space", "org/NASA"],
  },
];

/** ======================== 데이터 가져오기(강화) ======================== */
/** 타임아웃 + 재시도 가능한 fetch */
async function fetchWithTimeout(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = 6000, ...rest } = opts;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 2,
  baseDelay = 400
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

/** 다양한 스키마를 배열로 정규화 */
function coerceArray(json: any): any[] {
  if (Array.isArray(json)) return json;

  const candidates = [
    "items",
    "data",
    "results",
    "articles",
    "entries",
    "rows",
  ];
  for (const key of candidates) {
    if (Array.isArray(json?.[key])) return json[key];
  }

  // 단일 객체 하나만 온 경우
  if (json && typeof json === "object") return [json];

  return [];
}

async function fetchStoredArticles(): Promise<StoredArticle[]> {
  // 1) CORS 회피를 위한 로컬 프록시(라우트 핸들러) 먼저 시도
  const candidates = [
    `/api/articles?limit=${DEFAULT_LIMIT}`,
    `/api/news?limit=${DEFAULT_LIMIT}`,
    `${API_BASE}/articles`,
    `${API_BASE}/news/all`,
    `${API_BASE}/news?limit=${DEFAULT_LIMIT}`,
  ];

  const errors: string[] = [];

  for (const url of candidates) {
    try {
      const res = await retry(
        () =>
          fetchWithTimeout(url, {
            cache: "no-store",
            timeoutMs: 7000,
          }),
        2,
        500
      );

      if (!res.ok) {
        errors.push(`${url} → HTTP ${res.status}`);
        continue;
      }

      // 일부 서버는 text/json 혼용
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        // 응답이 JSON이 아니면 패스
        errors.push(`${url} → Invalid JSON`);
        continue;
      }

      const arr = coerceArray(json);
      if (arr.length) return arr as StoredArticle[];
      errors.push(`${url} → Empty array after coercion`);
    } catch (e: any) {
      const msg = e?.name === "AbortError" ? "Timeout/Abort" : e?.message || "Unknown error";
      errors.push(`${url} → ${msg}`);
      continue;
    }
  }

  // 전부 실패하면 더미 반환 + 에러 던지지 말고 함께 전달
  (globalThis as any).__EXPLORE_FETCH_ERRORS__ = errors;
  return DUMMIES;
}

/** ======================== 정규화 ======================== */
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1523742810063-4f61a38b7e1b?w=1200&q=80&auto=format&fit=crop";

function normalizeRow(n: StoredArticle, idx: number): Normalized {
  const id = n.id || n.link || n.url || `row-${idx}`;
  const title = n.title ?? "(제목 없음)";
  const description = n.description ?? n.summary ?? "";
  const sourceUrl = n.link ?? n.url ?? "";
  const imageUrl = n.imageUrl ?? null;
  const publishedAt = n.published ?? null;

  // 카테고리: 단일 우선 → 없으면 'Uncategorized'
  const category =
    n.category ||
    (Array.isArray(n.categories) && n.categories[0]) ||
    "Uncategorized";

  // 태그: 배열만 사용
  const tags = Array.isArray(n.tags) ? n.tags.slice(0, 64) : [];

  const score =
    typeof n.score === "number"
      ? n.score
      : publishedAt
      ? Date.parse(publishedAt)
      : 0;

  return {
    id,
    title,
    description,
    publishedAt,
    source: n.source ?? "Unknown",
    sourceUrl,
    imageUrl,
    category,
    tags,
    score,
  };
}

/** ======================== 유틸 ======================== */
function formatDateKST(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  } catch {
    return iso;
  }
}

function splitTag(t: string): { ns: string; value: string } {
  const [ns, ...rest] = t.split("/");
  if (!rest.length) return { ns: "free", value: ns };
  return { ns, value: rest.join("/") };
}

function classOfNs(ns: string) {
  // 태그 네임스페이스별 색상 뱃지
  switch (ns) {
    case "org":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "model":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "topic":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "event":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "geo":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "biz":
      return "bg-lime-50 text-lime-700 border-lime-200";
    case "policy":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "domain":
      return "bg-teal-50 text-teal-700 border-teal-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

/** ======================== 페이지 컴포넌트 ======================== */
export default function ExplorePage() {
  /** 헤더 연동 상태 (기존 Header API에 맞춤) */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHeaderCategory, setSelectedHeaderCategory] = useState("all"); // Header에서 쓰는 카테고리 선택
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn] = useState(false);

  /** 데이터 */
  const [rows, setRows] = useState<Normalized[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[] | null>(null);

  /** 탐색용 상태 */
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [datePreset, setDatePreset] = useState<"all" | "7d" | "30d" | "90d">(
    "30d"
  );
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  /** 최초 로드 */
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const raw = await fetchStoredArticles();
        const norm = raw.map(normalizeRow);
        setRows(norm);

        // 실패 내역이 있으면 디버그로 표시
        const errs = (globalThis as any).__EXPLORE_FETCH_ERRORS__ as
          | string[]
          | undefined;
        if (errs && errs.length) setDebug(errs);
        (globalThis as any).__EXPLORE_FETCH_ERRORS__ = undefined;
      } catch (e: any) {
        setError(e?.message ?? "불러오기 실패");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /** 카테고리/태그 파셋 계산 */
  const categoryFacet = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      counts.set(r.category, (counts.get(r.category) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({ key: k, count: v }));
  }, [rows]);

  const tagFacet = useMemo<TagFacet[]>(() => {
    const counts = new Map<string, number>();
    for (const r of rows) {
      for (const t of r.tags) counts.set(t, (counts.get(t) || 0) + 1);
    }
    const arr: TagFacet[] = [];
    for (const [key, count] of counts) {
      const { ns, value } = splitTag(key);
      arr.push({ key, ns, value, count });
    }
    return arr
      .sort((a, b) =>
        a.ns === b.ns ? b.count - a.count : a.ns.localeCompare(b.ns)
      )
      .slice(0, 400);
  }, [rows]);

  /** 날짜 필터 계산 */
  const [fromTs, toTs] = useMemo(() => {
    if (datePreset !== "all" && !customFrom && !customTo) {
      const now = Date.now();
      const days = datePreset === "7d" ? 7 : datePreset === "30d" ? 30 : 90;
      return [now - days * 24 * 3600 * 1000, now];
    }
    const f = customFrom ? Date.parse(customFrom) : Number.NEGATIVE_INFINITY;
    const t = customTo ? Date.parse(customTo) + 24 * 3600 * 1000 - 1 : Number.POSITIVE_INFINITY;
    return [f, t];
  }, [datePreset, customFrom, customTo]);

  /** 결과 필터링 */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return rows
      .filter((r) => {
        // 1) 카테고리
        if (selectedCategory !== "all" && r.category !== selectedCategory)
          return false;

        // 2) 태그(교집합)
        if (selectedTags.size > 0) {
          const hasAll = [...selectedTags].every((t) => r.tags.includes(t));
          if (!hasAll) return false;
        }

        // 3) 날짜
        if (
          fromTs !== Number.NEGATIVE_INFINITY ||
          toTs !== Number.POSITIVE_INFINITY
        ) {
          const ts = r.publishedAt ? Date.parse(r.publishedAt) : 0;
          if (isFinite(ts)) {
            if (ts < fromTs || ts > toTs) return false;
          }
        }

        // 4) 검색어(제목/본문/출처/태그)
        if (q) {
          const hay = `${r.title} ${r.description} ${r.source} ${r.tags.join(
            " "
          )}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 최신순 우선, 동률이면 score
        const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
        const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
        if (tb !== ta) return tb - ta;
        return (b.score ?? 0) - (a.score ?? 0);
      });
  }, [rows, selectedCategory, selectedTags, searchQuery, fromTs, toTs]);

  /** 태그 토글 */
  const toggleTag = (key: string) => {
    const next = new Set(selectedTags);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedTags(next);
  };

  /** 헤더의 카테고리 셀렉터와 내부 상태 동기화 */
  useEffect(() => {
    if (selectedHeaderCategory !== "all") {
      setSelectedCategory(selectedHeaderCategory);
    }
  }, [selectedHeaderCategory]);

  /** 새로고침 */
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const raw = await fetchStoredArticles();
      setRows(raw.map(normalizeRow));

      const errs = (globalThis as any).__EXPLORE_FETCH_ERRORS__ as
        | string[]
        | undefined;
      setDebug(errs && errs.length ? errs : null);
      (globalThis as any).__EXPLORE_FETCH_ERRORS__ = undefined;
    } catch (e: any) {
      setError(e?.message ?? "불러오기 실패");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedHeaderCategory}
        onCategoryChange={setSelectedHeaderCategory}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isLoggedIn={isLoggedIn}
        onSignupClick={() => {}}
      />

      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* =============== 좌측: 파셋 필터 =============== */}
          <aside className="space-y-6">
            {/* 카테고리 */}
            <section className="rounded-xl border bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold">카테고리</h3>
              </div>
              <div className="p-3">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  전체{" "}
                  <span className="text-xs text-muted-foreground">
                    (총 {rows.length})
                  </span>
                </button>
                <div className="mt-2 space-y-2">
                  {categoryFacet.map(({ key, count }) => (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg border ${
                        selectedCategory === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent"
                      }`}
                    >
                      {key}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 날짜 */}
            <section className="rounded-xl border bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold">기간</h3>
              </div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(["7d", "30d", "90d", "all"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setDatePreset(p);
                        setCustomFrom("");
                        setCustomTo("");
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        datePreset === p && !customFrom && !customTo
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent"
                      }`}
                    >
                      {p === "7d"
                        ? "7일"
                        : p === "30d"
                        ? "30일"
                        : p === "90d"
                        ? "90일"
                        : "전체"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => {
                      setCustomFrom(e.target.value);
                      setDatePreset("all");
                    }}
                    className="px-3 py-2 rounded-lg border bg-background"
                  />
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => {
                      setCustomTo(e.target.value);
                      setDatePreset("all");
                    }}
                    className="px-3 py-2 rounded-lg border bg-background"
                  />
                </div>
              </div>
            </section>

            {/* 태그 */}
            <section className="rounded-xl border bg-card">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">태그</h3>
                {selectedTags.size > 0 && (
                  <button
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => setSelectedTags(new Set())}
                  >
                    선택 해제
                  </button>
                )}
              </div>
              <div className="p-3">
                <div className="flex flex-wrap gap-2">
                  {tagFacet.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => toggleTag(t.key)}
                      className={`px-2.5 py-1.5 rounded-full border text-xs ${
                        selectedTags.has(t.key)
                          ? "ring-2 ring-offset-1 ring-primary"
                          : ""
                      } ${classOfNs(t.ns)}`}
                      title={`${t.key} (${t.count})`}
                    >
                      <span className="font-semibold">{t.ns}</span>/{t.value}
                      <span className="ml-1 opacity-70">({t.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </aside>

          {/* =============== 우측: 결과 리스트 =============== */}
          <section className="space-y-4">
            {/* 상단 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">탐색 결과</h2>
                <p className="text-sm text-muted-foreground">
                  총 <b>{filtered.length}</b>건 ·
                  {selectedCategory === "all" ? " 전체 카테고리" : ` ${selectedCategory}`} ·
                  {selectedTags.size > 0 ? ` 태그 ${selectedTags.size}개 선택` : " 태그 전체"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(selectedCategory !== "all" ||
                  selectedTags.size > 0 ||
                  searchQuery ||
                  customFrom ||
                  customTo ||
                  datePreset !== "30d") && (
                  <button
                    className="px-3 py-2 rounded-lg border bg-background hover:bg-accent"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedTags(new Set());
                      setSearchQuery("");
                      setDatePreset("30d");
                      setCustomFrom("");
                      setCustomTo("");
                      setSelectedHeaderCategory("all");
                    }}
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>

            {/* 로딩/에러 */}
            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-video w-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (error || debug) && (
              <details className="p-4 rounded-lg border bg-card text-sm">
                <summary className="cursor-pointer font-medium">
                  로드 이슈 상세 보기
                </summary>
                {error && <div className="mt-2 text-red-600">{error}</div>}
                {debug && (
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                    {debug.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  CORS/HTTPS 혼용(https 페이지에서 http API 호출) 문제일 수 있어요.
                  가능하면 <code>/api/articles</code> 같은 로컬 프록시를 사용하세요.
                </div>
              </details>
            )}

            {!isLoading && !error && filtered.length === 0 && (
              <div className="text-center py-12">
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">결과가 없습니다</h3>
                <p className="text-muted-foreground">
                  검색어/필터 조건을 조정해보세요.
                </p>
              </div>
            )}

            {/* 카드 그리드 */}
            {!isLoading && filtered.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((n) => (
                  <div key={n.id} className="flex flex-col gap-2">
                    <NewsCard
                      id={n.id}
                      title={n.title}
                      description={n.description}
                      category={n.category}
                      publishedAt={n.publishedAt ?? ""}
                      imageUrl={n.imageUrl ?? PLACEHOLDER_IMG}
                      sourceUrl={n.sourceUrl}
                      source={n.source}
                      onClick={() => {
                        // TODO: 내부 상세 페이지로 이동하려면 여기서 라우팅 처리
                        // 예) router.push(`/news/${encodeURIComponent(n.id)}`)
                        window.open(n.sourceUrl || "#", "_blank", "noopener,noreferrer");
                      }}
                    />
                    {/* 태그 표시(간단) */}
                    <div className="flex flex-wrap gap-1.5">
                      {n.tags.slice(0, 6).map((t) => {
                        const { ns, value } = splitTag(t);
                        return (
                          <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-2 py-1 rounded-full border text-[11px] ${classOfNs(
                              ns
                            )} ${
                              selectedTags.has(t)
                                ? "ring-2 ring-offset-1 ring-primary"
                                : ""
                            }`}
                            title={t}
                          >
                            {ns}/{value}
                          </button>
                        );
                      })}
                      {n.tags.length > 6 && (
                        <span className="text-xs text-muted-foreground">
                          +{n.tags.length - 6} more
                        </span>
                      )}
                    </div>
                    {/* 메타 */}
                    <div className="text-xs text-muted-foreground">
                      {formatDateKST(n.publishedAt)} · {n.source}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
