// 클라이언트 사이드 오타 교정 유틸리티

// Levenshtein Distance 계산 (편집 거리)
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// 유사도 계산 (0-1 사이 값, 1에 가까울수록 유사)
export function similarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return (maxLength - distance) / maxLength;
}

// AI 관련 키워드 사전 (오타 교정을 위한)
export const AI_KEYWORDS = [
  'ai', 'artificial intelligence', '인공지능',
  'machine learning', '머신러닝', 'ml',
  'deep learning', '딥러닝', 'dl',
  'neural network', '신경망',
  'chatgpt', 'gpt', 'gpt-4', 'gpt-3',
  'openai', 'anthropic', 'claude',
  'llm', 'large language model',
  'generative ai', '생성형ai',
  'computer vision', '컴퓨터비전',
  'natural language processing', 'nlp', '자연어처리',
  'robotics', '로봇공학',
  'automation', '자동화',
  'algorithm', '알고리즘',
  'data science', '데이터사이언스',
  'tensorflow', 'pytorch', 'keras',
  'transformer', '트랜스포머',
  'attention', 'bert', 'resnet',
  // 회사명
  'apple', 'google', 'microsoft', 'amazon', 'meta', 'facebook',
  'nvidia', 'intel', 'amd', 'tesla', 'samsung', 'sony',
  // 기술 용어
  'blockchain', '블록체인', 'cryptocurrency', '암호화폐',
  'quantum computing', '양자컴퓨팅', 'edge computing', '엣지컴퓨팅',
  'cloud computing', '클라우드컴퓨팅', 'iot', 'internet of things'
];

// 기술 회사명 사전 (주로 검색되는 회사들)
export const TECH_COMPANIES = [
  'apple', 'google', 'microsoft', 'amazon', 'meta', 'facebook',
  'nvidia', 'intel', 'amd', 'tesla', 'samsung', 'sony', 'lg',
  'openai', 'anthropic', 'deepmind', 'huggingface',
  'netflix', 'spotify', 'uber', 'airbnb', 'twitter', 'x'
];

// 오타 교정 함수
export function correctTypo(query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const correctedWords = words.map(word => {
    // 정확한 매치가 있으면 그대로 반환
    if (AI_KEYWORDS.includes(word) || TECH_COMPANIES.includes(word)) {
      return word;
    }

    // 유사도 검사
    let bestMatch = word;
    let bestSimilarity = 0.6; // 최소 60% 유사도 필요

    // AI 키워드에서 검사
    for (const keyword of AI_KEYWORDS) {
      const sim = similarity(word, keyword);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = keyword;
      }
    }

    // 기술 회사명에서 검사
    for (const company of TECH_COMPANIES) {
      const sim = similarity(word, company);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatch = company;
      }
    }

    return bestMatch;
  });

  return correctedWords.join(' ');
}

// 검색어 제안 생성
export function generateSearchSuggestions(query: string): string[] {
  const corrected = correctTypo(query);
  const suggestions: string[] = [];

  if (corrected !== query.toLowerCase()) {
    suggestions.push(corrected);
  }

  // 부분 매치 제안
  const queryLower = query.toLowerCase();
  const partialMatches = AI_KEYWORDS.filter(keyword =>
    keyword.includes(queryLower) || queryLower.includes(keyword)
  ).slice(0, 3);

  suggestions.push(...partialMatches);

  // 유사한 키워드 제안
  const similarKeywords = AI_KEYWORDS
    .map(keyword => ({ keyword, sim: similarity(queryLower, keyword) }))
    .filter(({ sim }) => sim > 0.4 && sim < 0.9)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 2)
    .map(({ keyword }) => keyword);

  suggestions.push(...similarKeywords);

  // 중복 제거
  return Array.from(new Set(suggestions)).slice(0, 5);
}

// 강화된 검색 함수 (Elasticsearch 대안)
export function fuzzySearch<T extends { title: string; description?: string; tags?: string[] }>(
  items: T[],
  query: string,
  options?: { threshold?: number; maxResults?: number }
): Array<T & { score: number; isCorrected?: boolean }> {
  const { threshold = 0.3, maxResults = 20 } = options || {};

  // 원본 검색어와 교정된 검색어로 검색
  const originalQuery = query.toLowerCase();
  const correctedQuery = correctTypo(query);
  const isCorrected = correctedQuery !== originalQuery;

  const results = items.map(item => {
    const titleLower = item.title.toLowerCase();
    const descLower = item.description?.toLowerCase() || '';
    const tagsLower = item.tags?.join(' ').toLowerCase() || '';
    const searchText = `${titleLower} ${descLower} ${tagsLower}`;

    // 정확한 매치 점수
    let exactScore = 0;
    if (searchText.includes(originalQuery)) exactScore += 2.0;
    if (searchText.includes(correctedQuery)) exactScore += 1.5;

    // 유사도 점수
    const titleSim = Math.max(
      similarity(originalQuery, titleLower),
      similarity(correctedQuery, titleLower)
    );
    const descSim = Math.max(
      similarity(originalQuery, descLower),
      similarity(correctedQuery, descLower)
    );

    // 키워드 매치 점수
    const queryWords = correctedQuery.split(/\s+/);
    const keywordScore = queryWords.reduce((score, word) => {
      if (searchText.includes(word)) score += 0.5;
      return score;
    }, 0);

    // 최종 점수 계산
    const totalScore = exactScore + (titleSim * 2) + descSim + keywordScore;

    return {
      ...item,
      score: totalScore,
      isCorrected: isCorrected && totalScore > threshold
    };
  });

  return results
    .filter(item => item.score > threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
