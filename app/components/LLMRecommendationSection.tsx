"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DOMPurify from "isomorphic-dompurify";
import {
  Search,
  Sparkles,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Share2,
  Clock,
  TrendingUp,
} from "lucide-react";

interface LLMRecommendationSectionProps {
  onNewsClick?: (newsId: string) => void;
}

const API_URL = "/api/llm";
const REQ_TIMEOUT_MS = 120_000;

type ApiResponse = {
  data?: {
    text?: string;
    format?: "markdown" | "html" | "text";
    answer?: {
      text?: string;
      bullets?: string[] | null;
      format?: "markdown" | "html" | "text";
    };
    sources?: Array<
      | string
      | {
          id?: string;
          title?: string;
          url?: string;
        }
    >;
  };
  answer?: string;
  text?: string;
  summary?: string;
  output?: string;
  content?: string;
  choices?: Array<{ message?: { content?: string } }>;
  result?: string;
  [k: string]: any;
};

interface UiArticle {
  id: string;
  title: string;
  url?: string;
}

interface UiLLMResponse {
  summary: string;
  format: "markdown" | "html" | "text";
  bullets: string[] | null;
  relatedArticles: UiArticle[];
}

/* ---------- 유틸: 다양한 스키마에서 텍스트 추출 ---------- */
function extractAnswerFlexible(obj: any): string {
  if (!obj) return "";
  if (typeof obj?.data?.answer?.text === "string") return obj.data.answer.text;
  if (typeof obj?.data?.text === "string") return obj.data.text;
  if (typeof obj?.answer === "string") return obj.answer;
  if (typeof obj?.text === "string") return obj.text;
  if (typeof obj?.summary === "string") return obj.summary;
  if (typeof obj?.output === "string") return obj.output;
  if (typeof obj?.content === "string") return obj.content;
  if (typeof obj?.result === "string") return obj.result;
  const openai = obj?.choices?.[0]?.message?.content;
  if (typeof openai === "string") return openai;
  return "";
}

/* 간단한 마크다운 감지(헤딩/리스트/코드블록 등) */
function looksLikeMarkdown(s: string) {
  return /(^|\n)#{1,6}\s|(^|\n)[*-]\s|(^|\n)\d+\.\s|```|__|\*\*/.test(s);
}

/* 서버 JSON → UI 모델 */
function mapApiToUi(json: ApiResponse): UiLLMResponse {
  const mainText = extractAnswerFlexible(json);
  const format =
    (json?.data?.answer?.format ??
      json?.data?.format ??
      "text") as UiLLMResponse["format"];

  const sources = json?.data?.sources ?? [];
  const relatedArticles: UiArticle[] = sources.map((s, idx) => {
    if (typeof s === "string") {
      try {
        const u = new URL(s);
        const host = u.hostname.replace(/^www\./, "");
        const firstPath = u.pathname.split("/").filter(Boolean)[0] ?? "";
        const title = firstPath ? `${host} / ${decodeURIComponent(firstPath)}` : host;
        return { id: `${idx}`, title, url: s };
      } catch {
        return { id: `${idx}`, title: s, url: s };
      }
    }
    return {
      id: s.id ?? `${idx}`,
      title: s.title ?? s.url ?? `출처 ${idx + 1}`,
      url: s.url,
    };
  });

  return {
    summary: mainText || "(응답이 비어 있습니다)",
    format,
    bullets: json?.data?.answer?.bullets ?? null,
    relatedArticles,
  };
}

export function LLMRecommendationSection({ onNewsClick }: LLMRecommendationSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState<UiLLMResponse | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);

  // 디버그(raw 보기)
  const [rawBody, setRawBody] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 연속 검색 시 취소
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSearch = async () => {
    if (!prompt.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQ_TIMEOUT_MS);

    setIsLoading(true);
    setLlmResponse(null);
    setErrorMsg(null);
    setRawBody(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ question: prompt }),
        signal: controller.signal,
      });

      const rawText = await res.text();
      setRawBody(rawText);

      if (!res.ok) throw new Error(`API ${res.status}`);

      let ui: UiLLMResponse;
      try {
        const json: ApiResponse = rawText ? JSON.parse(rawText) : ({} as any);
        ui = mapApiToUi(json);
      } catch {
        ui = { summary: rawText || "(본문 없음)", format: "text", bullets: null, relatedArticles: [] };
      }

      if (!ui.summary || ui.summary === "(응답이 비어 있습니다)") {
        ui.summary = rawText || "(본문 없음)";
      }

      setLlmResponse(ui);
      setLiked(false);
      setDisliked(false);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setErrorMsg(
        err?.message?.startsWith("API ")
          ? `서버 오류: ${err.message}`
          : "요청 처리 중 문제가 발생했습니다. (네트워크/CORS/서버 상태 확인)"
      );
      setLlmResponse({ summary: "", format: "text", bullets: null, relatedArticles: [] });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // @ts-ignore
    if (e.nativeEvent?.isComposing) return;
    if (e.key === "Enter") handleSearch();
  };

  const handleLike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikeCount((p) => p - 1);
    }
    setLiked((v) => !v);
    setLikeCount((p) => (liked ? p - 1 : p + 1));
  };
  const handleDislike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((p) => p - 1);
    }
    setDisliked((v) => !v);
    setDislikeCount((p) => (disliked ? p - 1 : p + 1));
  };

const handleShare = (
  platform: "facebook" | "twitter" | "linkedin" | "email"
) => {
  if (typeof window === "undefined") return;

  const url = window.location.href;
  const title = `LLM 뉴스 분석: ${prompt}`;

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
  } as const;

  if (platform === "email") {
    window.location.href = shareUrls.email;
  } else {
    const win = window.open(
      shareUrls[platform],
      "_blank",
      "width=600,height=400"
    );
    if (win) {
      // 옵셔널 체이닝 없이 안전하게 할당
      win.opener = null;
    }
  }
};

  const handleArticleClick = (articleId: string) => onNewsClick?.(articleId);

  /* ---------- 본문 렌더러 ---------- */
  const renderBody = () => {
    if (!llmResponse) return null;

    const text = llmResponse.summary ?? "";
    const fmt = llmResponse.format ?? "text";
    const isMd = fmt === "markdown" || looksLikeMarkdown(text);
    const isHtml = fmt === "html" || /^</.test(text.trim());

    if (isHtml) {
      const safe = DOMPurify.sanitize(text, { USE_PROFILES: { html: true } });
      return (
        <div
          className="markdown-body prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      );
    }

    if (isMd) {
      return (
        <div className="markdown-body prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (p) => <h1 className="mt-6 mb-3 text-2xl font-extrabold" {...p} />,
              h2: (p) => <h2 className="mt-5 mb-2 text-xl font-bold" {...p} />,
              h3: (p) => <h3 className="mt-4 mb-2 text-lg font-bold" {...p} />,
              p: (p) => <p className="leading-relaxed" {...p} />,
              ul: (p) => <ul className="list-disc pl-5 space-y-1" {...p} />,
              ol: (p) => <ol className="list-decimal pl-5 space-y-1" {...p} />,
              li: (p) => <li className="leading-relaxed" {...p} />,
              code: ({ inline, className, children, ...props }) =>
                inline ? (
                  <code className="px-1 py-0.5 rounded bg-slate-100 text-[90%]" {...props}>
                    {children}
                  </code>
                ) : (
                  <pre className="rounded-lg bg-slate-950/95 text-slate-50 p-3 overflow-x-auto">
                    <code className={className} {...props}>{children}</code>
                  </pre>
                ),
              blockquote: (p) => (
                <blockquote
                  className="border-l-4 border-primary/50 bg-primary/5 px-4 py-2 rounded-r-lg text-slate-700"
                  {...p}
                />
              ),
              a: (p) => (
                <a
                  className="text-primary underline underline-offset-2 hover:opacity-80"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...p}
                />
              ),
              hr: (p) => <hr className="my-4 border-dashed" {...p} />,
              table: (p) => (
                <div className="overflow-x-auto">
                  <table className="min-w-full border rounded-md" {...p} />
                </div>
              ),
              th: (p) => <th className="border px-3 py-2 bg-slate-50 text-left" {...p} />,
              td: (p) => <td className="border px-3 py-2" {...p} />,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      );
    }

    // 일반 텍스트
    return <div className="whitespace-pre-line leading-relaxed">{text}</div>;
  };

  return (
    <section className="bg-gradient-to-br from-secondary/10 via-background to-accent/10 border-b">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h2>AI 뉴스 분석</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            궁금한 주제를 입력하면 AI가 관련 뉴스를 분석하여 맞춤형 브리핑을 제공합니다
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="분석하고 싶은 주제를 입력하세요 (예: 인공지능, 경제, 환경 등)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !prompt.trim()}>
              {isLoading ? "분석 중..." : "분석하기"}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-16 w-full" />
              <div className="flex justify-between">
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {llmResponse && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 관련 기사 */}
            {llmResponse.relatedArticles.length > 0 && (
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    관련 기사
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {llmResponse.relatedArticles.map((article, index) => (
                      <div
                        key={article.id}
                        className="group p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                        onClick={() =>
                          article.url
                            ? window.open(article.url, "_blank", "noopener,noreferrer")
                            : onNewsClick?.(article.id)
                        }
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed group-hover:text-primary transition-colors">
                              {article.title}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>출처</span>
                              {article.url && (
                                <>
                                  <span>·</span>
                                  <a
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 underline"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    원문 <ExternalLink className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 브리핑 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI 분석 브리핑
                  <Badge variant="secondary" className="ml-auto">
                    "{prompt}" 분석 결과
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {errorMsg && (
                  <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
                    {errorMsg}
                  </div>
                )}

                {/* ⬇️ 여기서 마크다운/HTML/텍스트 자동 렌더 */}
                {renderBody()}

                {/* bullets 있으면 표시 */}
                {llmResponse.bullets && llmResponse.bullets.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {llmResponse.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}

                {/* Raw 응답 (디버그용) */}
                {rawBody && (
                  <details className="text-xs text-slate-600">
                    <summary className="cursor-pointer">Raw 응답 보기</summary>
                    <pre className="mt-2 p-2 border rounded bg-slate-50 overflow-auto max-h-64">
                      {rawBody}
                    </pre>
                  </details>
                )}

                <Separator />

                {/* Interaction Bar */}
                <div className="flex items-center justify-between">
                  {/* 공유 */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">공유:</span>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => handleShare("facebook")}>
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare("twitter")}>
                      <Twitter className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare("linkedin")}>
                      <Linkedin className="w-4 h-4 text-blue-700" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleShare("email")}>
                      <Mail className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>

                  {/* 좋아요/싫어요 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={liked ? "default" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{likeCount}</span>
                    </Button>
                    <Button
                      variant={disliked ? "destructive" : "outline"}
                      size="sm"
                      onClick={handleDislike}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      <span>{dislikeCount}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!llmResponse && !isLoading && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3>AI 뉴스 분석을 시작해보세요</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              관심 있는 주제를 입력하면 AI가 관련 뉴스를 종합 분석하여 맞춤형 브리핑을 제공합니다
            </p>
          </div>
        )}
      </div>

      {/* 🔹 Markdown 구역 전용 스타일 (Tailwind Typography 미사용 시에도 기본 모양 보장) */}
      <style jsx>{`
        .markdown-body :where(h1, h2, h3) {
          scroll-margin-top: 80px;
        }
        .markdown-body pre {
          line-height: 1.35;
        }
        .markdown-body blockquote > :last-child {
          margin-bottom: 0;
        }
      `}</style>
    </section>
  );
}
