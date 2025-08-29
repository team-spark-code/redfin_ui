"use client";

import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
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

/** 프록시 라우트(동일 출처)로 호출 → CORS 문제 없음 */
const API_URL = "/api/llm";

/** 백엔드 응답 타입 */
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

/** 서버 JSON → UI 모델 매핑 */
function mapApiToUi(json: ApiResponse): UiLLMResponse {
  const text = json?.data?.text ?? json?.data?.answer?.text ?? "";
  const format =
    (json?.data?.format ??
      json?.data?.answer?.format ??
      "text") as UiLLMResponse["format"];

  const sources = json?.data?.sources ?? [];
  const relatedArticles: UiArticle[] = sources.map((s, idx) => {
    if (typeof s === "string") {
      // URL이면 호스트/첫 경로를 제목으로
      try {
        const u = new URL(s);
        const host = u.hostname.replace(/^www\./, "");
        const firstPath = u.pathname.split("/").filter(Boolean)[0] ?? "";
        const title = firstPath ? `${host} / ${decodeURIComponent(firstPath)}` : host;
        return { id: `${idx}`, title, url: s };
      } catch {
        // 일반 문자열
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
    summary: text || "(응답이 비어 있습니다)",
    format,
    bullets: json?.data?.answer?.bullets ?? null,
    relatedArticles,
  };
}

export function LLMRecommendationSection({
  onNewsClick,
}: LLMRecommendationSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState<UiLLMResponse | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);

  // 연속 검색 시 이전 요청 취소
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSearch = async () => {
    if (!prompt.trim()) return;

    // 이전 요청 취소 + 새 컨트롤러
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // 타임아웃(선택)
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    setIsLoading(true);
    setLlmResponse(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ question: prompt }),
        signal: controller.signal,
      });

      const rawText = await res.text();
      if (!res.ok) {
        console.error("API error:", res.status, rawText);
        throw new Error(`API ${res.status}`);
      }

      const json: ApiResponse = rawText ? JSON.parse(rawText) : ({} as any);
      const ui = mapApiToUi(json);
      setLlmResponse(ui);
      setLiked(false);
      setDisliked(false);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // 사용자가 취소
      console.error("요청 실패:", err);
      setLlmResponse({
        summary:
          "요청 처리 중 문제가 발생했습니다. (네트워크/CORS/서버 상태를 확인해주세요)",
        format: "text",
        bullets: null,
        relatedArticles: [],
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // onKeyPress 대신 onKeyDown 권장 (+ 한글 조합 입력 보호)
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

  const handleShare = (platform: string) => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const title = `LLM 뉴스 분석: ${prompt}`;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
        `${title}\n\n${url}`
      )}`,
    } as const;

    if (platform === "email") {
      window.location.href = shareUrls.email;
    } else {
      const win = window.open(
        shareUrls[platform as keyof typeof shareUrls],
        "_blank",
        "width=600,height=400"
      );
      if (win) (win as any).opener = null;
    }
  };

  const handleArticleClick = (articleId: string) => {
    onNewsClick?.(articleId);
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

        {/* Loading State */}
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
            {/* Left – Related Articles */}
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
                            ? window.open(
                                article.url,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            : handleArticleClick(article.id)
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

            {/* Right – LLM Summary */}
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
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-line leading-relaxed">
                    {llmResponse.summary}
                  </div>
                </div>

                <Separator />

                {/* Interaction Bar */}
                <div className="flex items-center justify-between">
                  {/* Share Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">공유:</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare("facebook")}
                      className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare("twitter")}
                      className="h-8 w-8 hover:bg-gray-50 hover:border-gray-200"
                    >
                      <Twitter className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare("linkedin")}
                      className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare("email")}
                      className="h-8 w-8 hover:bg-gray-50 hover:border-gray-200"
                    >
                      <Mail className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>

                  {/* Like/Dislike Buttons */}
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
    </section>
  );
}
