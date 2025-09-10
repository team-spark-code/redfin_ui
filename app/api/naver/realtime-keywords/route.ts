// 연합뉴스 실시간 RSS 피드 API
import { NextResponse } from 'next/server';
import { parseString } from 'xml2js';

// 뉴스 아이템 타입 정의
interface NewsItem {
  title: string;
  source: string;
  category: string;
  time: string;
  link?: string;
  description?: string;
}

// 연합뉴스 RSS 피드 URL 목록
const YONHAP_RSS_FEEDS = [
  'https://www.yonhapnewstv.co.kr/browse/feed/',
  'https://www.yna.co.kr/rss/news.xml',
  'https://www.yna.co.kr/rss/politics.xml',
  'https://www.yna.co.kr/rss/economy.xml',
  'https://www.yna.co.kr/rss/society.xml',
  'https://www.yna.co.kr/rss/international.xml',
  'https://www.yna.co.kr/rss/sports.xml',
];

// RSS 피드에서 뉴스 데이터 파싱
async function parseRSSFeed(rssUrl: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();

    return new Promise((resolve) => {
      parseString(xmlText, (err, result) => {
        if (err) {
          console.error('RSS 파싱 오류:', err);
          resolve([]);
          return;
        }

        const items: NewsItem[] = [];
        const channel = result.rss?.channel?.[0];
        const rssItems = channel?.item || [];

        rssItems.slice(0, 10).forEach((item: any) => {
          const title = item.title?.[0] || '';
          const link = item.link?.[0] || '';
          const description = item.description?.[0] || '';
          const pubDate = item.pubDate?.[0] || '';

          // 카테고리 추정 (URL이나 제목 기반)
          let category = '종합';
          if (rssUrl.includes('politics')) category = '정치';
          else if (rssUrl.includes('economy')) category = '경제';
          else if (rssUrl.includes('society')) category = '사회';
          else if (rssUrl.includes('international')) category = '국제';
          else if (rssUrl.includes('sports')) category = '스포츠';
          else if (title.includes('경제') || title.includes('주식') || title.includes('��스피')) category = '경제';
          else if (title.includes('정치') || title.includes('대통령') || title.includes('국정')) category = '정치';
          else if (title.includes('사회') || title.includes('사건') || title.includes('사고')) category = '사회';
          else if (title.includes('스포츠') || title.includes('야구') || title.includes('축구')) category = '스포츠';

          // 시간 포맷팅
          let timeString = '';
          if (pubDate) {
            try {
              const date = new Date(pubDate);
              timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            } catch (e) {
              timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
            }
          } else {
            timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
          }

          if (title.trim()) {
            items.push({
              title: title.replace(/<[^>]*>/g, '').trim(), // HTML 태그 제거
              source: '연합뉴스',
              category,
              time: timeString,
              link,
              description: description.replace(/<[^>]*>/g, '').trim().substring(0, 100),
            });
          }
        });

        resolve(items);
      });
    });
  } catch (error) {
    console.error(`RSS 피드 가져오기 실패 (${rssUrl}):`, error);
    return [];
  }
}

// 모든 RSS 피드에서 뉴스 수집
async function fetchYonhapNews(): Promise<NewsItem[]> {
  try {
    const allNewsPromises = YONHAP_RSS_FEEDS.map(url => parseRSSFeed(url));
    const newsArrays = await Promise.all(allNewsPromises);

    // 모든 뉴스를 합치고 중복 제거
    const allNews = newsArrays.flat();
    const uniqueNews = allNews.filter((news, index, self) =>
      index === self.findIndex(n => n.title === news.title)
    );

    // 최신 순으로 정렬하고 최대 20개까지만
    return uniqueNews.slice(0, 20);
  } catch (error) {
    console.error('연합뉴스 RSS 수집 오류:', error);
    return getDefaultNews();
  }
}

// 폴백 데이터
function getDefaultNews(): NewsItem[] {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return [
    { title: "연합뉴스 RSS 연결 중...", source: "연합뉴스", category: "종합", time: timeStr },
    { title: "실시간 뉴스 업데이트 중", source: "연합뉴스", category: "종합", time: timeStr },
    { title: "뉴스 피드 로딩 중", source: "연합뉴스", category: "종합", time: timeStr },
  ];
}

export async function GET() {
  try {
    console.log('연합뉴스 RSS 피드 수집 시작');
    const news = await fetchYonhapNews();

    console.log(`연합뉴스 RSS에서 ${news.length}개 뉴스 수집 완료`);

    return NextResponse.json({
      success: true,
      data: news,
      timestamp: new Date().toISOString(),
      source: 'yonhap_rss_feeds'
    });
  } catch (error) {
    console.error('연합뉴스 RSS API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '연합뉴스 RSS를 가져올 수 없습니다.',
        data: getDefaultNews()
      },
      { status: 200 }
    );
  }
}
