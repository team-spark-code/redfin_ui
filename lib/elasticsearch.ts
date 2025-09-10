import { Client } from '@elastic/elasticsearch';

// Elasticsearch 클라이언트 설정
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_AUTH ? {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'password'
  } : undefined,
});

// 인덱스 이름
const NEWS_INDEX = 'ai_news';

// 뉴스 문서 타입 정의
export interface NewsDocument {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  tags: string[];
  suggest?: {
    input: string[];
    weight?: number;
  };
}

// Elasticsearch 인덱스 생성/업데이트
export async function createNewsIndex() {
  try {
    const indexExists = await client.indices.exists({ index: NEWS_INDEX });

    if (!indexExists) {
      await client.indices.create({
        index: NEWS_INDEX,
        body: {
          settings: {
            analysis: {
              analyzer: {
                autocomplete: {
                  tokenizer: 'autocomplete',
                  filter: ['lowercase']
                },
                autocomplete_search: {
                  tokenizer: 'keyword',
                  filter: ['lowercase']
                }
              },
              tokenizer: {
                autocomplete: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 10,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                analyzer: 'autocomplete',
                search_analyzer: 'autocomplete_search'
              },
              description: {
                type: 'text',
                analyzer: 'autocomplete',
                search_analyzer: 'autocomplete_search'
              },
              content: {
                type: 'text',
                analyzer: 'standard'
              },
              category: {
                type: 'keyword'
              },
              source: {
                type: 'keyword'
              },
              sourceUrl: {
                type: 'keyword'
              },
              publishedAt: {
                type: 'date'
              },
              tags: {
                type: 'keyword'
              },
              suggest: {
                type: 'completion',
                analyzer: 'simple',
                preserve_separators: true,
                preserve_position_increments: true,
                max_input_length: 50
              }
            }
          }
        }
      });
      console.log(`인덱스 ${NEWS_INDEX} 생성됨`);
    }
  } catch (error) {
    console.error('인덱스 생성 오류:', error);
  }
}

// 뉴스 문서 인덱싱
export async function indexNewsDocument(doc: NewsDocument) {
  try {
    // 자동완성을 위한 suggest 필드 생성
    const suggestInput = [
      doc.title,
      ...doc.tags,
      doc.source,
      doc.category
    ].filter(Boolean);

    const docWithSuggest = {
      ...doc,
      suggest: {
        input: suggestInput,
        weight: 1
      }
    };

    await client.index({
      index: NEWS_INDEX,
      id: doc.id,
      body: docWithSuggest
    });
  } catch (error) {
    console.error('문서 인덱싱 오류:', error);
  }
}

// 오타 교정을 포함한 검색 함수
export async function searchNewsWithFuzzy(query: string, options?: {
  category?: string;
  size?: number;
  from?: number;
}) {
  try {
    const { category, size = 20, from = 0 } = options || {};

    // 기본 검색 쿼리
    const mustQueries: any[] = [];

    if (query) {
      // 1. 정확한 매치 우선 (가장 높은 점수)
      mustQueries.push({
        bool: {
          should: [
            // 정확한 매치
            {
              multi_match: {
                query,
                fields: ['title^5', 'description^3', 'content^2', 'tags^4'],
                type: 'phrase',
                boost: 3.0
              }
            },
            // 부분 매치
            {
              multi_match: {
                query,
                fields: ['title^4', 'description^2', 'content', 'tags^3'],
                type: 'best_fields',
                boost: 2.0
              }
            },
            // 강화된 Fuzzy 매치 (오타 허용)
            {
              multi_match: {
                query,
                fields: ['title^3', 'description^2', 'content', 'tags^2'],
                type: 'best_fields',
                fuzziness: 2, // 최대 2글자 오타 허용 (APPIE -> APPLE)
                prefix_length: 0, // 첫 글자부터 오타 허용
                max_expansions: 100, // 더 많은 변형 허용
                operator: 'or',
                boost: 1.5
              }
            },
            // 와일드카드 매치 (부분 문자열)
            {
              query_string: {
                query: `*${query.toLowerCase()}*`,
                fields: ['title^2', 'description', 'tags^2'],
                boost: 1.0
              }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    // 카테고리 필터
    const filterQueries: any[] = [];
    if (category && category !== 'all') {
      filterQueries.push({
        term: { category }
      });
    }

    const searchBody: any = {
      query: {
        bool: {
          must: mustQueries.length > 0 ? mustQueries : [{ match_all: {} }],
          filter: filterQueries
        }
      },
      sort: [
        { _score: { order: 'desc' } },
        { publishedAt: { order: 'desc' } }
      ],
      size,
      from,
      highlight: {
        fields: {
          title: { pre_tags: ['<mark>'], post_tags: ['</mark>'] },
          description: { pre_tags: ['<mark>'], post_tags: ['</mark>'] }
        },
        fragment_size: 150,
        number_of_fragments: 1
      }
    };

    // 강화된 검색어 제안 (자동완성 + 오타교정)
    if (query) {
      searchBody.suggest = {
        text: query,
        // Term suggester (단어별 오타 교정)
        term_suggest: {
          term: {
            field: 'title',
            suggest_mode: 'always', // 항상 제안
            max_term_freq: 5,
            prefix_length: 0, // 첫 글자부터 교정
            min_word_length: 2,
            max_inspections: 20,
            min_doc_freq: 1,
            max_edits: 2, // 최대 2글자 편집 거리
            sort: 'frequency'
          }
        },
        // Phrase suggester (문구 교정)
        phrase_suggest: {
          phrase: {
            field: 'title',
            size: 3,
            real_word_error_likelihood: 0.95,
            max_errors: 2,
            gram_size: 2,
            direct_generator: [{
              field: 'title',
              suggest_mode: 'always',
              min_word_length: 2,
              prefix_length: 0,
              max_edits: 2
            }]
          }
        },
        // Completion suggester
        completion_suggest: {
          completion: {
            field: 'suggest',
            size: 5,
            skip_duplicates: true
          }
        }
      };
    }

    const response = await client.search({
      index: NEWS_INDEX,
      body: searchBody
    });

    return {
      hits: response.body.hits.hits,
      total: response.body.hits.total,
      suggestions: response.body.suggest || {},
      took: response.body.took
    };
  } catch (error) {
    console.error('검색 오류:', error);
    return {
      hits: [],
      total: { value: 0 },
      suggestions: {},
      took: 0
    };
  }
}

// 검색어 자동완성
export async function getSearchSuggestions(query: string, size: number = 5) {
  try {
    const response = await client.search({
      index: NEWS_INDEX,
      body: {
        suggest: {
          autocomplete: {
            completion: {
              field: 'suggest',
              prefix: query,
              size,
              skip_duplicates: true
            }
          }
        }
      }
    });

    return response.body.suggest?.autocomplete?.[0]?.options || [];
  } catch (error) {
    console.error('자동완성 오류:', error);
    return [];
  }
}

// 오타 교정된 검색어 제안
export async function getSpellingSuggestions(query: string) {
  try {
    const response = await client.search({
      index: NEWS_INDEX,
      body: {
        suggest: {
          spell_check: {
            text: query,
            term: {
              field: 'title',
              suggest_mode: 'popular',
              max_term_freq: 3,
              prefix_length: 1,
              min_word_length: 4,
              max_inspections: 16,
              min_doc_freq: 1,
              max_edits: 2
            }
          }
        }
      }
    });

    const suggestions = response.body.suggest?.spell_check || [];
    const correctedTerms: string[] = [];

    suggestions.forEach((suggestion: any) => {
      if (suggestion.options && suggestion.options.length > 0) {
        correctedTerms.push(suggestion.options[0].text);
      } else {
        correctedTerms.push(suggestion.text);
      }
    });

    return correctedTerms.join(' ');
  } catch (error) {
    console.error('오타 교정 오류:', error);
    return query;
  }
}

export { client };
