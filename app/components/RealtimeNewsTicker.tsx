"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

type NewsItem = {
  title: string;
  source: string;
  time: string;
  link?: string;
};

interface RealtimeNewsTickerProps {
  refreshMs?: number; // API 폴링 주기
  rotateMs?: number;  // 뉴스 회전 주기
  className?: string;
}

export default function RealtimeNewsTicker({ refreshMs = 300000, rotateMs = 4000, className = "" }: RealtimeNewsTickerProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const rotateRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  const current = useMemo(() => (items.length ? items[index % items.length] : null), [items, index]);

  const fetchNews = async () => {
    try {
      setError(null);
      const res = await fetch("/api/realtime-news", { cache: "no-store" });
      const data = await res.json();

      if (res.ok && data?.success && data?.data?.length) {
        setItems(data.data as NewsItem[]);
        setLastUpdated(data.lastUpdated || new Date().toISOString());
        console.log(`실시간 뉴스 업데이트: ${data.count}개 항목`);
      } else {
        // 데이터가 없을 때 기본 메시지 설정
        setItems([{
          title: "실시간 뉴스를 불러오는 중입니다...",
          source: "시스템",
          time: "방금 전"
        }]);
      }
    } catch (e) {
      console.error("실시간 뉴스 fetch 오류:", e);
      setError("뉴스 가져오기 실패");
      // 오류 시 기본 메시지 설정
      setItems([{
        title: "뉴스 서비스에 일시적인 문제가 발생했습니다.",
        source: "시스템",
        time: "방금 전"
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 수동 새로고침 기능
  const handleRefresh = async () => {
    setLoading(true);
    await fetchNews();
  };

  useEffect(() => {
    fetchNews();

    // 폴링 설정 (5분마다)
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = window.setInterval(fetchNews, refreshMs);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshMs]);

  useEffect(() => {
    if (!items.length) return;

    // 뉴스 회전 타이머 (4초마다)
    if (rotateRef.current) clearInterval(rotateRef.current);
    rotateRef.current = window.setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % items.length);
    }, rotateMs);

    return () => {
      if (rotateRef.current) clearInterval(rotateRef.current);
    };
  }, [items, rotateMs]);

  // 포맷된 업데이트 시간
  const formattedUpdateTime = useMemo(() => {
    if (!lastUpdated) return "";
    try {
      const date = new Date(lastUpdated);
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "";
    }
  }, [lastUpdated]);

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {/* 실시간 표시 */}
      <div className="flex items-center gap-1">
        <span className="inline-flex items-center gap-1 text-primary font-medium">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          실시간
        </span>

        {/* 새로고침 버튼 */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          title="뉴스 새로고침"
        >
          <RefreshCw className={`w-3 h-3 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 뉴스 컨텐츠 영역 */}
      <div className="flex-1 min-w-0 relative">
        {loading && items.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            불러오는 중...
          </span>
        ) : error && items.length === 0 ? (
          <span className="text-red-500 text-xs">{error}</span>
        ) : current ? (
          <div className="flex items-center gap-2 min-w-0">
            {/* 뉴스 제목 */}
            <div className="flex-1 min-w-0">
              {current.link ? (
                <a
                  href={current.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block whitespace-nowrap text-ellipsis overflow-hidden hover:text-primary transition-colors"
                  title={current.title}
                >
                  {current.title}
                  <ExternalLink className="inline w-3 h-3 ml-1 align-middle opacity-60" />
                </a>
              ) : (
                <span
                  className="block whitespace-nowrap text-ellipsis overflow-hidden"
                  title={current.title}
                >
                  {current.title}
                </span>
              )}
            </div>

            {/* 메타 정보 */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-medium">
                {current.source}
              </span>
              <span>{current.time}</span>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">뉴스를 불러올 수 없습니다.</span>
        )}
      </div>

      {/* 업데이트 시간 표시 */}
      {formattedUpdateTime && (
        <span className="hidden lg:block text-xs text-muted-foreground flex-shrink-0">
          {formattedUpdateTime}
        </span>
      )}
    </div>
  );
}
