import { useState } from "react";
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
  TrendingUp
} from "lucide-react";

interface LLMRecommendationSectionProps {
  onNewsClick?: (newsId: string) => void;
}

// 모의 LLM 응답 데이터
const getMockLLMResponse = (prompt: string) => {
  const responses: Record<string, any> = {
    "인공지능": {
      summary: `인공지능 기술의 최신 동향을 종합 분석해보면, 2025년은 생성형 AI의 실용화가 본격적으로 시작되는 원년으로 평가됩니다. 

특히 차세대 언어 모델의 발표로 자연어 처리 능력이 획기적으로 향상되었으며, 이는 교육, 의료, 금융 등 다양한 산업 분야에서 혁신적인 변화를 이끌고 있습니다. 

주목할 점은 AI 윤리 가이드라인의 수립과 함께 안전하고 신뢰할 수 있는 AI 개발 방향이 제시되고 있다는 것입니다. 국내 스타트업들도 이러한 기술 혁신을 바탕으로 글로벌 시장 진출을 가속화하고 있어, 앞으로의 AI 생태계 발전이 기대됩니다.`,
      relatedArticles: [
        { id: "1", title: "인공지능 기술의 새로운 돌파구, 차세대 언어 모델 발표" },
        { id: "ai-1", title: "AI 윤리 가이드라인 발표, 안전한 AI 개발 방향 제시" },
        { id: "ai-2", title: "국내 스타트업, AI 기술로 글로벌 시장 진출 가속화" },
        { id: "ai-3", title: "교육 분야 AI 도입, 개인 맞춤형 학습 시대 열려" },
        { id: "ai-4", title: "의료 AI 진단 정확도 95% 돌파, 의료진 업무 효율성 증대" }
      ]
    },
    "경제": {
      summary: `2025년 한국 경제는 글로벌 경제 회복세와 함께 안정적인 성장 궤도에 진입할 것으로 전망됩니다.

주요 증시의 급등세가 지속되며 코스피가 2,600선을 돌파하는 등 투자 심리가 크게 개선되고 있습니다. 특히 반도체 업종의 회복세와 신기술 산업 분야의 지속적인 성장이 경제 성장의 주요 동력으로 작용하고 있습니다.

중앙은행의 안정적인 통화정책 기조와 함께 인플레이션 둔화 현상이 나타나면서 소비심리도 점차 회복되고 있어, 내수 경제 활성화에도 긍정적인 영향을 미칠 것으로 예상됩니다.`,
      relatedArticles: [
        { id: "2", title: "경제 전망: 2025년 성장률 예측과 주요 변수들" },
        { id: "eco-1", title: "주식시장 상승세, 코스피 2,600선 돌파" },
        { id: "eco-2", title: "반도체 업종 회복세, 글로벌 수요 증가 영향" },
        { id: "eco-3", title: "소비심리 개선, 내수 경제 활성화 기대" },
        { id: "eco-4", title: "중앙은행 기준금리 동결, 안정적 통화정책 유지" }
      ]
    },
    "default": {
      summary: `입력하신 키워드를 바탕으로 관련 뉴스들을 분석한 결과, 현재 국내외에서 주목받고 있는 주요 이슈들과 연관성이 높은 것으로 나타났습니다.

최신 동향을 종합해보면, 기술 혁신과 경제 회복, 그리고 사회적 변화가 동시에 진행되고 있어 다각적인 접근이 필요한 상황입니다. 특히 글로벌 트렌드와 국내 정책 방향이 맞물리면서 새로운 기회와 도전이 공존하고 있습니다.

관련 전문가들은 이러한 변화에 대한 지속적인 모니터링과 분석이 중요하다고 강조하고 있으며, 앞으로의 발전 방향에 대해 긍정적인 전망을 제시하고 있습니다.`,
      relatedArticles: [
        { id: "1", title: "인공지능 기술의 새로운 돌파구, 차세대 언어 모델 발표" },
        { id: "2", title: "경제 전망: 2025년 성장률 예측과 주요 변수들" },
        { id: "3", title: "환경 보호를 위한 새로운 정책 발표, 탄소 중립 목표 앞당겨" },
        { id: "5", title: "K-문화의 세계적 확산, 새로운 한류 콘텐츠 주목받아" }
      ]
    }
  };

  const key = Object.keys(responses).find(k => prompt.includes(k)) || "default";
  return responses[key];
};

export function LLMRecommendationSection({ onNewsClick }: LLMRecommendationSectionProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [llmResponse, setLlmResponse] = useState<any>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  const [dislikeCount, setDislikeCount] = useState(3);

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    // 모의 API 호출 지연
    setTimeout(() => {
      const response = getMockLLMResponse(prompt);
      setLlmResponse(response);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleLike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikeCount(prev => prev - 1);
    }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleDislike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    }
    setDisliked(!disliked);
    setDislikeCount(prev => disliked ? prev - 1 : prev + 1);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = `LLM 뉴스 분석: ${prompt}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`
    };

    if (platform === 'email') {
      window.location.href = shareUrls[platform];
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleArticleClick = (articleId: string) => {
    if (onNewsClick) {
      onNewsClick(articleId);
    }
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
                onKeyPress={handleKeyPress}
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
            {/* Left Column - Related Articles */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  관련 기사
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {llmResponse.relatedArticles.map((article: any, index: number) => (
                    <div
                      key={article.id}
                      className="group p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                      onClick={() => handleArticleClick(article.id)}
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
                            <span>관련도 높음</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - LLM Summary */}
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
                {/* Summary Content */}
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
                      onClick={() => handleShare('facebook')}
                      className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('twitter')}
                      className="h-8 w-8 hover:bg-gray-50 hover:border-gray-200"
                    >
                      <Twitter className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('linkedin')}
                      className="h-8 w-8 hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('email')}
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