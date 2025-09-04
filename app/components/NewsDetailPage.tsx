// app/components/NewsDetailPage.tsx
"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import {
  ArrowLeft,
  Calendar,
  User,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Clock,
  Hash,
  Zap,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export interface NewsRecord {
  _id: string;
  post_id?: string;
  article_id?: string;
  article_code?: string;
  url?: string;
  title: string;
  dek?: string;
  tldr?: string[];
  body_md?: string;
  hero_image_url?: string | null;
  author_name?: string | null;
  category?: string;
  categories?: string[];
  tags?: string[];
  sources?: string[];
  status?: string;
  created_at?: string;
  published_at?: string;
}

interface NewsDetailPageProps {
  article: NewsRecord | undefined;
  onBack: () => void; // 미사용(외부 전파 X), 내부에서 router.back 처리
}

export function NewsDetailPage({ article }: NewsDetailPageProps) {
  const router = useRouter();

  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(147);
  const [dislikeCount, setDislikeCount] = useState(8);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "발행일 정보 없음";
    const date = new Date(dateString.replace(" ", "T"));
    if (isNaN(date.getTime())) return "발행일 정보 없음";
    return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4" aria-label="뒤로 가기">
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <p className="text-muted-foreground">기사 데이터를 불러오지 못했습니다.</p>
        </main>
      </div>
    );
  }

  const primaryCategory = useMemo(() => {
    const cats = article?.categories ?? [];
    const cat = article?.category ?? "";
    return cats.length ? cats[0] : cat || "NEWS";
  }, [article]);

  const sourceKey = useMemo(
    () =>
      [
        article?.sources?.[0] ?? "",
        article?.url ?? "",
        article?.article_id ?? "",
        article?.article_code ?? "",
      ].join("|"),
    [article]
  );

  const sourceDomain = useMemo(() => {
    const candidate = sourceKey.split("|").find(Boolean) ?? "";
    try {
      const u = new URL(candidate);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return candidate || "출처 미상";
    }
  }, [sourceKey]);

  const heroImage = article?.hero_image_url || undefined;
  const author = article?.author_name || "무기명";
  const publishedAt = article?.published_at || article?.created_at;

  // 좋아요/싫어요
  const handleLike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikeCount((prev) => Math.max(0, prev - 1));
    }
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
  };

  const handleDislike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    }
    setDisliked((prev) => !prev);
    setDislikeCount((prev) => (disliked ? Math.max(0, prev - 1) : prev + 1));
  };

  // 공유
  const shareKey = useMemo(() => {
    const currentHref = typeof window !== "undefined" ? window.location.href : "";
    const fallback =
      article?.url ||
      article?.sources?.[0] ||
      article?.article_id ||
      article?.article_code ||
      "";
    const urlForShare = currentHref || fallback;
    return `${article?.title ?? ""}|${urlForShare}`;
  }, [article]);

  const shareUrls = useMemo(() => {
    const [title, url] = shareKey.split("|");
    const safeTitle = title || "";
    const safeUrl = url || "";
    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(safeUrl)}&text=${encodeURIComponent(
        safeTitle
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(safeUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(safeTitle)}&body=${encodeURIComponent(
        `${safeTitle}\n\n${safeUrl}`
      )}`,
    } as const;
  }, [shareKey]);

  type SharePlatform = "facebook" | "twitter" | "linkedin" | "email";

  const handleShare = (platform: SharePlatform) => {
    if (platform === "email") {
      window.location.href = shareUrls.email;
    } else {
      const w = window.open(shareUrls[platform], "_blank", "width=600,height=400");
      if (w) w.opener = null;
    }
  };

  // 본문 안전 처리(마크다운 포맷이 아닐 때 줄바꿈만이라도 유지)
  const body = article.body_md ?? "";
  const safeBody = /[#*_`>\-]/.test(body) ? body : body.replaceAll("\n", "\n\n");

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button (상세에서만 라우팅 제어) */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4" aria-label="뒤로 가기">
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로 가기
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="space-y-8">
          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span className="truncate max-w-[220px]" title={sourceDomain || undefined}>
                  {sourceDomain}
                </span>
              </div>
            </div>
            <Badge variant="outline">{primaryCategory}</Badge>
          </div>

          {/* Title and Author */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold leading-tight">{article?.title ?? "(제목 없음)"}</h1>
            {article?.dek && <p className="text-base text-muted-foreground">{article.dek}</p>}
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{author}</span>
            </div>
          </div>

          {/* TL;DR */}
          {article?.tldr && article.tldr.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold"> TL;DR </h3>
                </div>
                <div className="space-y-3">
                  {article.tldr.map((summary, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Badge
                        variant="outline"
                        className="flex-shrink-0 w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {idx + 1}
                      </Badge>
                      <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Image */}
          {heroImage && (
            <div className="relative overflow-hidden rounded-lg">
              <ImageWithFallback
                src={heroImage}
                alt={article?.title ?? ""}
                className="w-full h-80 object-cover"
              />
            </div>
          )}

          {/* Article Body (Markdown) */}
          {safeBody.trim() ? (
            <div className="prose prose-lg max-w-none space-y-6 leading-relaxed prose-a:underline prose-img:rounded-md dark:prose-invert">
              <ReactMarkdown
                components={{
                  a({ node, ...props }) {
                    return (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      />
                    );
                  },
                }}
              >
                {safeBody}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-muted-foreground">
              본문이 없습니다. {article?.dek ? "상단 요약을 참고하세요." : ""}
            </div>
          )}

          {/* Tags */}
          {article?.tags && article.tags.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span>관련 태그</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, idx) => (
                  <Badge
                    key={`${tag}-${idx}`}
                    variant="secondary"
                    className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-8" />

          {/* Share & Reaction */}
          <div className="flex items-center justify-between">
            {/* Share */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Share2 className="w-4 h-4" />
                <span>공유하기:</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("facebook")}
                className="hover:bg-blue-50 hover:border-blue-200"
                aria-label="페이스북으로 공유"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("twitter")}
                className="hover:bg-gray-50 hover:border-gray-200"
                aria-label="트위터(X)로 공유"
              >
                <Twitter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("linkedin")}
                className="hover:bg-blue-50 hover:border-blue-200"
                aria-label="링크드인으로 공유"
              >
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare("email")}
                className="hover:bg-gray-50 hover:border-gray-200"
                aria-label="이메일로 공유"
              >
                <Mail className="w-4 h-4" />
              </Button>
            </div>

            {/* Like / Dislike */}
            <div className="flex items-center gap-2">
              <Button
                variant={liked ? "default" : "outline"}
                onClick={handleLike}
                className="flex items-center gap-2"
                aria-pressed={liked}
                aria-label="좋아요"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{likeCount}</span>
              </Button>
              <Button
                variant={disliked ? "destructive" : "outline"}
                onClick={handleDislike}
                className="flex items-center gap-2"
                aria-pressed={disliked}
                aria-label="싫어요"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{dislikeCount}</span>
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Sources */}
          {article?.sources && article.sources.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  관련 출처
                </h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {article.sources.map((src, i) => {
                      let label = src;
                      try {
                        const u = new URL(src);
                        label = `${u.hostname.replace(/^www\./, "")} / ${
                          decodeURIComponent(u.pathname).slice(1) || ""
                        }`;
                      } catch {
                        // 원본 문자열 유지
                      }
                      return (
                        <a
                          key={`${src}-${i}`}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg hover:bg-accent transition-colors"
                          title={src}
                        >
                          <p className="text-sm leading-relaxed hover:text-primary truncate">{label}</p>
                        </a>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </article>
      </main>
    </div>
  );
}
