import { useState } from "react";
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
  Zap
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface NewsDetailPageProps {
  newsId: string;
  onBack: () => void;
}

// 모의 뉴스 상세 데이터
const getNewsDetail = (id: string) => {
  const newsDetails: Record<string, any> = {
    "1": {
      id: "1",
      title: "인공지능 기술의 새로운 돌파구, 차세대 언어 모델 발표",
      description: "최신 AI 기술이 다양한 산업 분야에서 혁신적인 변화를 이끌고 있으며, 특히 자연어 처리 능력이 크게 향상되었습니다.",
      category: "technology",
      publishedAt: "2025-01-13T10:30:00Z",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
      source: "테크뉴스",
      author: "김기술 기자",
      tags: ["인공지능", "언어모델", "자연어처리", "AI기술", "혁신", "스타트업", "글로벌"],
      tldr: [
        "글로벌 AI 연구진이 개발한 차세대 언어 모델이 기존 대비 10배 향상된 성능을 보이며 업계 주목",
        "99.8% 정확도의 다국어 번역, 실시간 대화 응답, 코드 생성 등 혁신적 기능 탑재",
        "올해 하반기 상용화 예정으로 교육, 의료, 금융 등 다양한 분야 활용 기대"
      ],
      content: `
        <p>인공지능 분야에서 획기적인 발전이 이루어졌습니다. 글로벌 AI 연구진이 개발한 차세대 언어 모델이 기존 모델 대비 10배 향상된 성능을 보이며 업계의 주목을 받고 있습니다.</p>
        
        <p>이번에 발표된 모델은 특히 자연어 이해와 생성 능력에서 혁신적인 개선을 보였습니다. 복잡한 문맥을 이해하고 일관성 있는 장문의 텍스트를 생성하는 능력이 크게 향상되었다고 연구진은 설명했습니다.</p>
        
        <p>주요 특징은 다음과 같습니다:</p>
        <ul>
          <li>99.8%의 정확도로 다국어 번역 지원</li>
          <li>실시간 대화에서 자연스러운 응답 생성</li>
          <li>코드 생성 및 디버깅 능력 대폭 개선</li>
          <li>창의적 글쓰기 및 시나리오 작성 기능</li>
        </ul>
        
        <p>업계 전문가들은 이번 발표가 AI 기술의 새로운 전환점이 될 것이라고 평가하고 있습니다. 특히 교육, 의료, 금융 등 다양한 분야에서의 활용 가능성이 무궁무진하다는 전망이 나오고 있습니다.</p>
        
        <p>연구를 주도한 스탠포드 대학교의 AI 연구소 소장은 "이번 성과는 수년간의 연구 결과물이며, 앞으로 AI가 인간의 일상생활에 더욱 자연스럽게 녹아들 수 있는 기반이 마련되었다"고 밝혔습니다.</p>
        
        <p>한편, 이 기술의 상용화는 올해 하반기부터 시작될 예정이며, 국내 주요 IT 기업들도 관련 기술 도입을 검토하고 있는 것으로 알려졌습니다.</p>
      `
    },
    "2": {
      id: "2",
      title: "경제 전망: 2025년 성장률 예측과 주요 변수들",
      description: "전문가들이 분석한 올해 경제 전망과 함께 주목해야 할 주요 경제 지표들을 살펴봅니다.",
      category: "economy",
      publishedAt: "2025-01-13T09:15:00Z",
      imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
      source: "경제일보",
      author: "박경제 기자",
      tags: ["경제전망", "성장률", "금리", "인플레이션", "투자", "주식시장", "코스피"],
      tldr: [
        "2025년 한국 경제 성장률 2.8-3.2% 범위 예상으로 안정적 회복세 전망",
        "글로벌 인플레이션 둔화와 반도체 업종 회복세가 주요 긍정 요인으로 작용",
        "AI, 바이오헬스, 친환경 에너지 등 신성장 동력 산업이 경제 성장 견인 기대"
      ],
      content: `
        <p>2025년 한국 경제가 안정적인 회복세를 보일 것이라는 전망이 나오고 있습니다. 주요 경제 연구기관들의 분석에 따르면, 올해 경제 성장률은 2.8-3.2% 범위에서 형성될 것으로 예상됩니다.</p>
        
        <p>경제 전문가들이 주목하는 주요 변수들을 살펴보면 다음과 같습니다:</p>
        
        <h3>긍정적 요인</h3>
        <ul>
          <li>글로벌 인플레이션 둔화로 인한 통화정책 완화</li>
          <li>반도체 업종의 회복세</li>
          <li>소비심리 개선 및 내수 활성화</li>
          <li>신기술 산업 분야의 지속적인 성장</li>
        </ul>
        
        <h3>위험 요인</h3>
        <ul>
          <li>지정학적 불안정성 지속</li>
          <li>중국 경제 둔화의 영향</li>
          <li>가계부채 증가 우려</li>
          <li>글로벌 공급망 재편에 따른 불확실성</li>
        </ul>
        
        <p>한국은행은 기준금리를 현재 수준에서 유지하면서 경제 상황을 지켜보겠다는 입장을 밝혔습니다. 다만 하반기에는 경제 지표에 따라 추가적인 정책 조정이 있을 수 있다고 시사했습니다.</p>
        
        <p>특히 올해는 AI와 바이오헬스, 친환경 에너지 등 신성장 동력 산업이 경제 성장을 견인할 것으로 기대되고 있어, 관련 분야에 대한 투자와 정책 지원이 중요할 것으로 분석됩니다.</p>
      `
    }
  };

  return newsDetails[id] || newsDetails["1"];
};

// 관련 기사 데이터
const relatedArticles = [
  { id: "r1", title: "AI 윤리 가이드라인 발표, 안전한 AI 개발 방향 제시" },
  { id: "r2", title: "국내 스타트업, AI 기술로 글로벌 시장 진출 가속화" },
  { id: "r3", title: "교육 분야 AI 도입, 개인 맞춤형 학습 시대 열려" },
  { id: "r4", title: "의료 AI 진단 정확도 95% 돌파, 의료진 업무 효율성 증대" }
];

// 오늘의 뉴스 데이터
const todaysNews = [
  { id: "t1", title: "주식시장 상승세, 코스피 2,600선 돌파" },
  { id: "t2", title: "새로운 K-드라마 시리즈, 넷플릭스 글로벌 1위 달성" },
  { id: "t3", title: "전기차 충전 인프라 확충, 전국 5만 개소 구축 완료" },
  { id: "t4", title: "국제 우주정거장 새로운 실험 모듈 성공적 도킹" },
  { id: "t5", title: "친환경 패키징 의무화, 대형마트부터 단계적 적용" }
];

export function NewsDetailPage({ newsId, onBack }: NewsDetailPageProps) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(147);
  const [dislikeCount, setDislikeCount] = useState(8);

  const newsDetail = getNewsDetail(newsId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    const title = newsDetail.title;
    
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="mb-4">
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
                <span>{formatDate(newsDetail.publishedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>{newsDetail.source}</span>
              </div>
            </div>
            <Badge variant="outline">{newsDetail.category}</Badge>
          </div>

          {/* Title and Author */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold leading-tight">{newsDetail.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{newsDetail.author}</span>
            </div>
          </div>

          {/* TL;DR Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-lg font-semibold"> TL;DR </h3>
              </div>
              <div className="space-y-3">
                {newsDetail.tldr?.map((summary: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <Badge variant="outline" className="flex-shrink-0 w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {summary}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <div className="relative overflow-hidden rounded-lg">
            <ImageWithFallback
              src={newsDetail.imageUrl}
              alt={newsDetail.title}
              className="w-full h-80 object-cover"
            />
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none space-y-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: newsDetail.content }}
          />

          {/* News Tags Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span>관련 태그</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {newsDetail.tags?.map((tag: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Share and Reaction Buttons */}
          <div className="flex items-center justify-between">
            {/* Share Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Share2 className="w-4 h-4" />
                <span>공유하기:</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('facebook')}
                className="hover:bg-blue-50 hover:border-blue-200"
              >
                <Facebook className="w-4 h-4 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('twitter')}
                className="hover:bg-gray-50 hover:border-gray-200"
              >
                <Twitter className="w-4 h-4 text-gray-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('linkedin')}
                className="hover:bg-blue-50 hover:border-blue-200"
              >
                <Linkedin className="w-4 h-4 text-blue-700" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleShare('email')}
                className="hover:bg-gray-50 hover:border-gray-200"
              >
                <Mail className="w-4 h-4 text-gray-600" />
              </Button>
            </div>

            {/* Like/Dislike Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={liked ? "default" : "outline"}
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{likeCount}</span>
              </Button>
              <Button
                variant={disliked ? "destructive" : "outline"}
                onClick={handleDislike}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>{dislikeCount}</span>
              </Button>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Related Articles and Today's News */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Related Articles */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  관련 기사
                </h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {relatedArticles.map((article) => (
                      <div
                        key={article.id}
                        className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <p className="text-sm leading-relaxed hover:text-primary">
                          {article.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Today's News */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  오늘의 뉴스
                </h3>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {todaysNews.map((news) => (
                      <div
                        key={news.id}
                        className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <p className="text-sm leading-relaxed hover:text-primary">
                          {news.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </article>
      </main>
    </div>
  );
}