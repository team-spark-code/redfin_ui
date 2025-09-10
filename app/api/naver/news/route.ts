import { NextRequest, NextResponse } from 'next/server';

export interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '뉴스'; // 기본 검색어
    const display = parseInt(searchParams.get('display') || '10'); // 기본 10개
    const start = parseInt(searchParams.get('start') || '1'); // 기본 1번부터
    const sort = searchParams.get('sort') || 'date'; // 기본 최신순

    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Naver API credentials not configured' },
        { status: 500 }
      );
    }

    const naverApiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=${sort}`;

    const response = await fetch(naverApiUrl, {
      method: 'GET',
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Naver API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // HTML 태그 제거 함수
    const stripHtml = (html: string) => {
      return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
    };

    // 데이터 정규화
    const normalizedItems: NaverNewsItem[] = data.items?.map((item: any) => ({
      title: stripHtml(item.title || ''),
      originallink: item.originallink || '',
      link: item.link || '',
      description: stripHtml(item.description || ''),
      pubDate: item.pubDate || '',
    })) || [];

    return NextResponse.json({
      total: data.total || 0,
      start: data.start || 1,
      display: data.display || 0,
      items: normalizedItems,
    });

  } catch (error) {
    console.error('Naver news API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news from Naver' },
      { status: 500 }
    );
  }
}
