"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Separator } from "../components/ui/separator";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold">도움말 & 가이드</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            뉴스 크롤러 사용에 필요한 팁과 자주 묻는 질문을 모았습니다.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 flex-1">
        {/* 빠른 가이드 카드 3개 */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">뉴스 검색</h3>
            <p className="text-sm text-muted-foreground mt-2">
              키워드/카테고리로 뉴스를 빠르게 필터링하고 저장하세요.
            </p>
            <ul className="list-disc pl-4 text-sm mt-4 space-y-1">
              <li>상단 검색바 활용</li>
              <li>카테고리 탭 전환</li>
              <li>정렬/최신순 보기</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">AI 분석</h3>
            <p className="text-sm text-muted-foreground mt-2">
              LLM 추천 섹션에서 관심 주제를 입력하면 요약/출처를 제공합니다.
            </p>
            <ul className="list-disc pl-4 text-sm mt-4 space-y-1">
              <li>마크다운 요약 지원</li>
              <li>출처 링크 확인</li>
              <li>공유/피드백 버튼</li>
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">알림/저장</h3>
            <p className="text-sm text-muted-foreground mt-2">
              계정을 만들고 알림 및 즐겨찾기 기능을 사용하세요.
            </p>
            <ul className="list-disc pl-4 text-sm mt-4 space-y-1">
              <li>키워드 알림</li>
              <li>즐겨찾기 관리</li>
              <li>이메일 구독</li>
            </ul>
          </div>
        </div>

        <Separator className="my-10" />

        {/* FAQ – details/summary로 간단 아코디언 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">자주 묻는 질문</h2>
          {[
            {
              q: "검색 결과가 비어 있어요.",
              a: "검색어를 더 일반적으로 변경하거나 카테고리를 '전체'로 바꿔보세요.",
            },
            {
              q: "AI 분석이 느리게 보여요.",
              a: "일시적인 API 지연일 수 있어요. 잠시 후 다시 시도하거나 네트워크 상태를 확인하세요.",
            },
            {
              q: "로그인 없이도 사용할 수 있나요?",
              a: "네, 대부분의 기능은 사용 가능하지만 알림/저장은 로그인이 필요합니다.",
            },
          ].map((item, i) => (
            <details key={i} className="rounded-xl border bg-card p-5">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="text-sm text-muted-foreground mt-2">{item.a}</p>
            </details>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
