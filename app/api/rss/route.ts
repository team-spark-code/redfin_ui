import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  category?: string;
  imageUrl?: string;
}

// 미국과 영국 주요 언론사의 AI/Technology RSS 피드
const DEFAULT_RSS_FEEDS = [
  // 미국 언론사
  "https://feeds.a.dj.com/rss/RSSWSJD.xml", // Wall Street Journal - Technology
  "https://www.wired.com/feed/", // Wired - AI/Tech 전문
  "https://techcrunch.com/feed/", // TechCrunch
  "https://rss.cnn.com/rss/edition_technology.rss", // CNN Technology
  "https://feeds.npr.org/1019/rss.xml", // NPR Technology
  "https://www.theverge.com/rss/index.xml", // The Verge
  "https://www.technologyreview.com/feed/", // MIT Technology Review

  // 영국 언론사
  "https://feeds.bbci.co.uk/news/technology/rss.xml", // BBC Technology
  "https://www.theguardian.com/technology/artificialintelligenceai/rss", // Guardian AI
  "https://www.theguardian.com/technology/rss", // Guardian Technology
  "https://www.reuters.com/arc/outboundfeeds/rss/category/tech/?outputType=xml", // Reuters Technology
  "https://www.ft.com/technology?format=rss", // Financial Times Technology
];

// AI 관련 키워드 리스트
const AI_KEYWORDS = [
  'ai', 'artificial intelligence', 'machine learning', 'deep learning',
  'chatgpt', 'gpt', 'openai', 'neural network', 'llm', 'large language model',
  'generative ai', 'automation', 'robotics', 'computer vision',
  'natural language processing', 'nlp', 'algorithm', 'data science'
];

// AI 뉴스 필터링 함수
function isAIRelatedNews(item: RSSItem): boolean {
  const searchText = `${item.title} ${item.description} ${item.category}`.toLowerCase();
  return AI_KEYWORDS.some(keyword => searchText.includes(keyword));
}

// 미국/영국 언론사 판별 함수
function isUSUKNews(link: string): boolean {
  try {
    const url = new URL(link);
    const usukDomains = [
      // 미국
      'wsj.com', 'wired.com', 'techcrunch.com', 'cnn.com', 'npr.org',
      'theverge.com', 'technologyreview.com', 'nytimes.com', 'washingtonpost.com',
      // 영국
      'bbc.co.uk', 'theguardian.com', 'reuters.com', 'ft.com', 'independent.co.uk'
    ];
    return usukDomains.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

function extractImageUrl(item: any): string | null {
  // RSS 2.0 이미지 처리
  if (item.enclosure && item.enclosure["@_type"]?.startsWith("image/")) {
    return item.enclosure["@_url"];
  }
  // media:thumbnail 처리
  if (item["media:thumbnail"]) {
    return item["media:thumbnail"]["@_url"];
  }
  // media:content 이미지 처리
  if (item["media:content"] && item["media:content"]["@_type"]?.startsWith("image/")) {
    return item["media:content"]["@_url"];
  }
  // description에서 img 태그 추출
  if (item.description) {
    const imgMatch = item.description.match(/<img[^>]+src=['"]+([^'"]*)['"]/i);
    if (imgMatch) {
      return imgMatch[1];
    }
  }
  // 기본 이미지 필드들
  if (item.image?.url) {
    return item.image.url;
  }
  if (item.image && typeof item.image === 'string') {
    return item.image;
  }

  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get('url');
  const feeds = feedUrl ? [feedUrl] : DEFAULT_RSS_FEEDS;

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    const allItems: RSSItem[] = [];

    for (const url of feeds) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          console.warn(`Failed to fetch RSS from ${url}: ${response.status}`);
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
        // Atom 형식
        else if (result.feed?.entry) {
          items = Array.isArray(result.feed.entry)
            ? result.feed.entry
            : [result.feed.entry];
        }

        const normalizedItems: RSSItem[] = items.map(item => ({
          title: item.title?.["#text"] || item.title || "제목 없음",
          link: item.link?.["@_href"] || item.link || item.guid || "",
          description: item.description || item.summary?.["#text"] || item.summary || "",
          pubDate: item.pubDate || item.published || item.updated || "",
          author: item.author?.name || item.author || item["dc:creator"] || "",
          category: item.category?.["#text"] || item.category || "일반",
          imageUrl: (() => { const img = extractImageUrl(item); return img ?? undefined; })()
        }));

        // AI 관련 뉴스만 필터링
        const aiFilteredItems = normalizedItems.filter(isAIRelatedNews);

        // 미국/영국 언론사 뉴스만 필터링
        const usukFilteredItems = aiFilteredItems.filter(item => isUSUKNews(item.link));

        allItems.push(...usukFilteredItems);
      } catch (feedError) {
        console.warn(`Error processing feed ${url}:`, feedError);
      }
    }

    // 날짜순으로 정렬 (최신순)
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate || 0);
      const dateB = new Date(b.pubDate || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      success: true,
      data: allItems.slice(0, 100), // 최대 100개 항목
      count: allItems.length
    });

  } catch (error) {
    console.error("RSS fetch error:", error);
    return NextResponse.json(
      { success: false, message: "RSS 피드를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
