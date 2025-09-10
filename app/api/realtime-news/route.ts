import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

interface RealtimeNewsItem {
  title: string;
  source: string;
  time: string;
  link?: string;
  imageUrl?: string; // 이미지 URL 추가
}

// 실시간 뉴스를 위한 주요 RSS 피드들 - 미국 뉴스 사이트로 변경
const REALTIME_RSS_FEEDS = [
  {
    url: "http://rss.cnn.com/rss/edition.rss",
    source: "CNN",
    category: "종합"
  },
  {
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    source: "BBC News",
    category: "종합"
  },
  {
    url: "https://feeds.reuters.com/reuters/topNews",
    source: "Reuters",
    category: "종합"
  },
  {
    url: "https://feeds.reuters.com/reuters/businessNews",
    source: "Reuters Business",
    category: "경제"
  },
  {
    url: "https://feeds.reuters.com/reuters/technologyNews",
    source: "Reuters Tech",
    category: "기술"
  }
];

export async function GET(request: NextRequest) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const allNews: RealtimeNewsItem[] = [];

    // 각 RSS 피드에서 최신 뉴스만 가져오기
    for (const feed of REALTIME_RSS_FEEDS) {
      try {
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          next: { revalidate: 300 } // 5분 캐시
        });

        if (!response.ok) {
          console.warn(`Failed to fetch RSS from ${feed.source}: ${response.status}`);
          continue;
        }

        const xmlText = await response.text();
        const result = parser.parse(xmlText);

        let items: any[] = [];

        // RSS 2.0 형식
        if (result.rss?.channel?.item) {
          items = Array.isArray(result.rss.channel.item)
            ? result.rss.channel.item.slice(0, 3) // 최신 3개만
            : [result.rss.channel.item];
        }

        const newsItems: RealtimeNewsItem[] = items.map(item => {
          const pubDate = item.pubDate || item.published || item.updated;
          const timeAgo = getTimeAgo(pubDate);

          // 이미지 URL 추출
          let imageUrl = null;

          // RSS 2.0 이미지 처리
          if (item.enclosure && item.enclosure["@_type"]?.startsWith("image/")) {
            imageUrl = item.enclosure["@_url"];
          }
          // media:thumbnail 처리
          else if (item["media:thumbnail"]) {
            imageUrl = item["media:thumbnail"]["@_url"];
          }
          // media:content 이미지 처리
          else if (item["media:content"] && item["media:content"]["@_type"]?.startsWith("image/")) {
            imageUrl = item["media:content"]["@_url"];
          }
          // description에서 img 태그 추출
          else if (item.description) {
            const imgMatch = item.description.match(/<img[^>]+src=['"]+([^'"]*)['"]/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
            }
          }

          return {
            title: (item.title?.["#text"] || item.title || "제목 없음").substring(0, 80),
            source: feed.source,
            time: timeAgo,
            link: item.link?.["@_href"] || item.link || item.guid || "",
            imageUrl: imageUrl
          };
        });

        allNews.push(...newsItems);
      } catch (feedError) {
        console.warn(`Error processing feed ${feed.source}:`, feedError);
      }
    }

    // 시간순으로 정렬하여 최신 10개만 반환
    const sortedNews = allNews
      .filter(item => item.title && item.title !== "제목 없음")
      .sort((a, b) => {
        // 최신순 정렬
        if (a.time.includes('분') && b.time.includes('분')) {
          const aMin = parseInt(a.time);
          const bMin = parseInt(b.time);
          return aMin - bMin;
        }
        return 0;
      })
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: sortedNews,
      count: sortedNews.length,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Realtime news fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "실시간 뉴스를 가져오는데 실패했습니다.",
        data: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

// 시간 차이를 "N분 전", "N시간 전" 형태로 변환
function getTimeAgo(dateString: string): string {
  if (!dateString) return "방금 전";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return "1주 전";
  } catch {
    return "방금 전";
  }
}
