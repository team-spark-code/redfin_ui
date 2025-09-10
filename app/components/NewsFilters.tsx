import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Search, Filter, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { correctTypo, generateSearchSuggestions, fuzzySearch } from "@/lib/fuzzy-search";

interface SearchNewsItem {
  title: string;
  source: string;
  time: string;
  link?: string;
  description?: string;
  category?: string;
  isHighlighted?: boolean;
  isCorrected?: boolean;
  score?: number;
}

interface NewsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const categories = [
  { value: "all", label: "전체" },
  { value: "politics", label: "정치" },
  { value: "economy", label: "경제" },
  { value: "society", label: "사회" },
  { value: "culture", label: "문화" },
  { value: "international", label: "국제" },
  { value: "sports", label: "스포츠" },
  { value: "technology", label: "기술" },
];

export function NewsFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRefresh,
  isLoading = false,
}: NewsFiltersProps) {
  const [searchResults, setSearchResults] = useState<SearchNewsItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 시간 포맷 함수
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays}일 전`;
      } else if (diffHours > 0) {
        return `${diffHours}시간 전`;
      } else {
        return '방금 전';
      }
    } catch {
      return dateString;
    }
  };

  // 강화된 실시간 검색 함수 (클라이언트 사이드 오타 교정 + Elasticsearch)
  const performSearch = async (query: string, category: string = selectedCategory) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setCorrectedQuery(null);
      return;
    }

    setSearchLoading(true);

    // 1. 클라이언트 사이드 오타 교정 먼저 실행
    const corrected = correctTypo(query);
    const hasCorrectionSuggestion = corrected !== query.toLowerCase();

    if (hasCorrectionSuggestion) {
      setCorrectedQuery(corrected);
    } else {
      setCorrectedQuery(null);
    }

    // 2. 검색어 제안 생성
    const suggestions = generateSearchSuggestions(query);
    setAutocompleteSuggestions(suggestions);

    try {
      let searchResults: SearchNewsItem[] = [];
      let isElasticsearchWorking = false;

      // 3. Elasticsearch API 시도 (강화된 오타 교정 포함)
      try {
        const params = new URLSearchParams({
          q: hasCorrectionSuggestion ? corrected : query, // 교정된 검색어 사용
          category: category,
          spell_check: 'true',
          size: '10'
        });

        const response = await fetch(`/api/search-elastic?${params.toString()}`, {
          cache: "no-store"
        });

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          isElasticsearchWorking = true;
          searchResults = data.data.map((item: any) => ({
            title: item.title.replace(/<mark>/g, '').replace(/<\/mark>/g, ''),
            source: item.source,
            time: formatTimeAgo(item.time),
            link: item.link,
            description: item.description?.replace(/<mark>/g, '').replace(/<\/mark>/g, ''),
            category: item.category,
            isHighlighted: item.isHighlighted,
            isCorrected: hasCorrectionSuggestion || item.isCorrected,
            score: item.score
          }));

          // Elasticsearch의 추가 교정 제안이 있는 경우
          if (data.query?.corrected && data.query.corrected !== query) {
            setCorrectedQuery(data.query.corrected);
          }
        }
      } catch (elasticError) {
        console.warn("Elasticsearch 검색 실패, 폴백 모드로 전환:", elasticError);
      }

      // 4. Elasticsearch 실패 또는 결과가 부족할 때 폴백 검색
      if (!isElasticsearchWorking || searchResults.length < 3) {
        try {
          // 기존 API로 폴백
          const fallbackParams = new URLSearchParams({
            q: hasCorrectionSuggestion ? corrected : query,
            category: category
          });

          const fallbackResponse = await fetch(`/api/search-news?${fallbackParams.toString()}`, {
            cache: "no-store"
          });
          const fallbackData = await fallbackResponse.json();

          if (fallbackData.success && fallbackData.data) {
            const fallbackResults = fallbackData.data.map((item: any) => ({
              title: item.title,
              source: item.source,
              time: item.time,
              link: item.link,
              description: item.description,
              category: item.category,
              isCorrected: hasCorrectionSuggestion,
              score: 1.0
            }));

            // 5. 클라이언트 사이드 fuzzy search로 추가 보완
            if (fallbackResults.length < 5) {
              const fuzzyResults = fuzzySearch(fallbackResults, corrected, {
                threshold: 0.2,
                maxResults: 10
              }).map(item => ({
                title: item.title,
                source: item.source,
                time: item.time,
                link: item.link,
                description: item.description,
                category: item.category,
                isCorrected: item.isCorrected || hasCorrectionSuggestion,
                score: item.score
              }));

              searchResults = [...searchResults, ...fuzzyResults];
            } else {
              searchResults = [...searchResults, ...fallbackResults];
            }
          }
        } catch (fallbackError) {
          console.error("폴백 검색도 실패:", fallbackError);
        }
      }

      // 중복 제거 및 점수순 정렬
      const uniqueResults = searchResults.filter((item, index, self) =>
        index === self.findIndex(t => t.link === item.link || t.title === item.title)
      ).sort((a, b) => (b.score || 0) - (a.score || 0));

      setSearchResults(uniqueResults);
      setShowResults(uniqueResults.length > 0);

    } catch (error) {
      console.error("검색 오류:", error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // 디바운스된 검색
  const handleSearchInput = (value: string) => {
    onSearchChange(value);

    // 기존 타이머 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 새 타이머 설정 (500ms 딜레이)
    debounceRef.current = setTimeout(() => {
      performSearch(value, selectedCategory);
    }, 500);
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (category: string) => {
    onCategoryChange(category);

    // 검색어가 있으면 즉시 새 카테고리로 검색 실행
    if (searchQuery && searchQuery.length >= 2) {
      performSearch(searchQuery, category);
    }
  };

  // 카테고리나 검색어 변경을 감지하여 자동 검색
  useEffect(() => {
    if (searchQuery && searchQuery.length >= 2) {
      // 디바운스 타이머 클리어
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // 카테고리 변경시에는 즉시 검색 (디바운스 없이)
      debounceRef.current = setTimeout(() => {
        performSearch(searchQuery, selectedCategory);
      }, 100);
    }
  }, [selectedCategory]); // selectedCategory가 변경될 때마다 실행

  // 검색 결과 클릭 처리
  const handleResultClick = (result: SearchNewsItem) => {
    if (result.link) {
      window.open(result.link, '_blank');
    }
    setShowResults(false);
  };

  // 외부 클릭 시 결과창 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1" ref={searchContainerRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="뉴스 검색... (실시간 검색)"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-10 pr-10 text-black bg-white placeholder:text-gray-500 border border-gray-300 dark:text-white dark:bg-gray-900 dark:placeholder:text-gray-400 dark:border-gray-700"
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}

          {/* 오타 교정 제안 표시 */}
          {correctedQuery && correctedQuery !== searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 mb-1 bg-blue-50 border border-blue-200 rounded-md p-3 z-40 dark:bg-blue-900 dark:border-blue-700">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-600 dark:text-blue-300">🔍 다음을 찾으셨나요?</span>
                <button
                  onClick={() => {
                    onSearchChange(correctedQuery);
                    performSearch(correctedQuery, selectedCategory);
                  }}
                  className="text-blue-700 hover:text-blue-900 font-medium underline dark:text-blue-200 dark:hover:text-blue-100"
                >
                  "{correctedQuery}"
                </button>
              </div>
            </div>
          )}

          {/* 실시간 검색 결과 */}
          {showResults && searchResults.length > 0 && (
            <div className={`absolute top-full left-0 right-0 ${correctedQuery ? 'mt-16' : 'mt-1'} bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto dark:bg-gray-900 dark:border-gray-700`}>
              <div className="p-2 text-xs text-gray-500 border-b dark:text-gray-400 dark:border-gray-700 flex items-center justify-between">
                <span>실시간 검색 결과 ({searchResults.length}개)</span>
                {correctedQuery && (
                  <span className="text-blue-600 dark:text-blue-300">오타 교정 적용됨</span>
                )}
              </div>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors dark:hover:bg-gray-800 dark:border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-gray-100">
                          {result.title}
                        </h4>
                        {result.isCorrected && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded dark:bg-blue-800 dark:text-blue-200">
                            교정됨
                          </span>
                        )}
                        {result.link && <ExternalLink className="inline w-3 h-3 ml-1 opacity-60" />}
                      </div>
                      {result.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-1 dark:text-gray-300">
                          {result.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium dark:bg-gray-800 dark:text-gray-300">
                          {result.source}
                        </span>
                        <span>{result.time}</span>
                        {result.score && (
                          <span className="text-green-600 dark:text-green-400">
                            관련도: {Math.round(result.score * 10) / 10}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}