import { NextRequest, NextResponse } from "next/server";
import {
  searchNewsWithFuzzy,
  getSpellingSuggestions,
  getSearchSuggestions,
  createNewsIndex,
  indexNewsDocument
} from "@/lib/elasticsearch";

// 뉴스 데이터를 Elasticsearch에 동기화하는 함수
async function syncNewsToElastic(newsData: any[]) {
  try {
    await createNewsIndex();

    for (const news of newsData) {
      await indexNewsDocument({
        id: news.id,
        title: news.title || '',
        description: news.description || '',
        category: news.category || 'technology',
        source: news.source || 'unknown',
        sourceUrl: news.sourceUrl || '',
        publishedAt: news.publishedAt || new Date().toISOString(),
        tags: news.tags || []
      });
    }
  } catch (error) {
    console.error('Elasticsearch 동기화 오류:', error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'all';
  const size = parseInt(searchParams.get('size') || '20');
  const enableSpellCheck = searchParams.get('spell_check') === 'true';

  try {
    if (!query) {
      return NextResponse.json({
        success: false,
        message: "검색어를 입력해주세요."
      });
    }

    // Elasticsearch에서 오타 교정을 포함한 검색 실행
    const searchResults = await searchNewsWithFuzzy(query, {
      category: category !== 'all' ? category : undefined,
      size
    });

    // 오타 교정 제안 가져오기
    let correctedQuery = query;
    let spellingSuggestions: string[] = [];

    if (enableSpellCheck) {
      correctedQuery = await getSpellingSuggestions(query);

      // 원래 검색어와 교정된 검색어가 다르면 제안으로 추가
      if (correctedQuery !== query) {
        spellingSuggestions.push(correctedQuery);
      }
    }

    // 자동완성 제안 가져오기
    const autocompleteSuggestions = await getSearchSuggestions(query, 5);

    // 검색 결과를 API 형식에 맞게 변환
    const formattedResults = searchResults.hits.map((hit: any) => {
      const source = hit._source;
      const highlight = hit.highlight || {};

      return {
        title: highlight.title ? highlight.title[0] : source.title,
        description: highlight.description ? highlight.description[0] : source.description,
        source: source.source,
        time: source.publishedAt,
        link: source.sourceUrl,
        category: source.category,
        score: hit._score,
        isHighlighted: !!(highlight.title || highlight.description)
      };
    });

    // 검색 결과가 적을 때 오타 교정된 검색어로 재검색
    if (formattedResults.length < 3 && correctedQuery !== query) {
      const retryResults = await searchNewsWithFuzzy(correctedQuery, {
        category: category !== 'all' ? category : undefined,
        size
      });

      const retryFormatted = retryResults.hits.map((hit: any) => {
        const source = hit._source;
        return {
          title: source.title,
          description: source.description,
          source: source.source,
          time: source.publishedAt,
          link: source.sourceUrl,
          category: source.category,
          score: hit._score,
          isHighlighted: false,
          isCorrected: true
        };
      });

      formattedResults.push(...retryFormatted);
    }

    return NextResponse.json({
      success: true,
      data: formattedResults,
      query: {
        original: query,
        corrected: correctedQuery,
        hasSuggestions: spellingSuggestions.length > 0
      },
      suggestions: {
        spelling: spellingSuggestions,
        autocomplete: autocompleteSuggestions.map((item: any) => item.text || item._source?.title).filter(Boolean)
      },
      total: searchResults.total.value || searchResults.total,
      took: searchResults.took
    });

  } catch (error) {
    console.error("Elasticsearch 검색 오류:", error);

    // Elasticsearch 오류 시 기존 검색 API로 폴백
    try {
      const fallbackParams = new URLSearchParams({
        q: query,
        category: category
      });

      const fallbackResponse = await fetch(`${request.nextUrl.origin}/api/search-news?${fallbackParams.toString()}`);
      const fallbackData = await fallbackResponse.json();

      return NextResponse.json({
        ...fallbackData,
        isFallback: true,
        suggestions: {
          spelling: [],
          autocomplete: []
        }
      });
    } catch (fallbackError) {
      console.error("폴백 검색도 실패:", fallbackError);
      return NextResponse.json({
        success: false,
        message: "검색 중 오류가 발생했습니다."
      }, { status: 500 });
    }
  }
}

// 뉴스 데이터를 Elasticsearch에 인덱싱하는 POST 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (action === 'sync') {
      await syncNewsToElastic(data);
      return NextResponse.json({
        success: true,
        message: "뉴스 데이터가 Elasticsearch에 동기화되었습니다."
      });
    }

    if (action === 'index') {
      await createNewsIndex();
      return NextResponse.json({
        success: true,
        message: "Elasticsearch 인덱스가 생성되었습니다."
      });
    }

    return NextResponse.json({
      success: false,
      message: "잘못된 액션입니다."
    }, { status: 400 });

  } catch (error) {
    console.error("POST 요청 오류:", error);
    return NextResponse.json({
      success: false,
      message: "요청 처리 중 오류가 발생했습니다."
    }, { status: 500 });
  }
}
