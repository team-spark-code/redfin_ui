import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

interface SearchNewsItem {
  title: string;
  source: string;
  time: string;
  link?: string;
  description?: string;
  category?: string;
  imageUrl?: string; // 이미지 URL 추가
}

// 검색 가능한 RSS 피드들 - 미국 뉴스 사이트로 변경
const SEARCH_RSS_FEEDS = [
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
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    source: "New York Times",
    category: "종합"
  },
  {
    url: "https://feeds.washingtonpost.com/rss/world",
    source: "Washington Post",
    category: "국제"
  },
  {
    url: "https://feeds.reuters.com/reuters/topNews",
    source: "Reuters",
    category: "종합"
  },
  {
    url: "https://feeds.bloomberg.com/news.xml",
    source: "Bloomberg",
    category: "경제"
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
  },
  {
    url: "https://feeds.reuters.com/reuters/sportsNews",
    source: "Reuters Sports",
    category: "스포츠"
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const category = searchParams.get('category') || 'all';

  if (!query || query.length < 2) {
    return NextResponse.json({
      success: false,
      message: "검색어는 2글자 이상 입력해주세요.",
      data: [],
      count: 0
    });
  }

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const searchResults: SearchNewsItem[] = [];

    // 카테고리에 따른 RSS 피드 필터링
    let feedsToSearch = SEARCH_RSS_FEEDS;
    if (category !== 'all') {
      // 카테고리 매핑
      const categoryMapping: Record<string, string[]> = {
        'economy': ['경제'],
        'politics': ['종합'],
        'society': ['종합'],
        'technology': ['기술'],
        'international': ['국제'],
        'sports': ['스포츠'],
        'culture': ['문화']
      };

      const targetCategories = categoryMapping[category] || [category];
      feedsToSearch = SEARCH_RSS_FEEDS.filter(feed =>
        targetCategories.some(cat => feed.category.includes(cat))
      );
    }

    // 각 RSS 피드에서 검색
    for (const feed of feedsToSearch) {
      try {
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          next: { revalidate: 180 } // 3분 캐시
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
            ? result.rss.channel.item
            : [result.rss.channel.item];
        }

        // 검색어로 필터링
        const filteredItems = items.filter(item => {
          const title = (item.title?.["#text"] || item.title || "").toLowerCase();
          const description = (item.description || "").toLowerCase();
          return title.includes(query) || description.includes(query);
        });

        const newsItems: SearchNewsItem[] = filteredItems.map(item => {
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
            title: (item.title?.["#text"] || item.title || "제목 없음").substring(0, 100),
            description: (item.description || "").substring(0, 200),
            source: feed.source,
            category: feed.category,
            time: timeAgo,
            link: item.link?.["@_href"] || item.link || item.guid || "",
            imageUrl: imageUrl
          };
        });

        searchResults.push(...newsItems);
      } catch (feedError) {
        console.warn(`Error processing feed ${feed.source}:`, feedError);
      }
    }

    // 검색 결과를 시간순으로 정렬하여 최대 20개 반환
    const sortedResults = searchResults
      .filter(item => item.title && item.title !== "제목 없음")
      .sort((a, b) => {
        if (a.time.includes('분') && b.time.includes('분')) {
          const aMin = parseInt(a.time);
          const bMin = parseInt(b.time);
          return aMin - bMin;
        }
        return 0;
      })
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: sortedResults,
      count: sortedResults.length,
      query: query,
      category: category,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error("Search news fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "뉴스 검색에 실패했습니다.",
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
