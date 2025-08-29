"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary/10 via-background to-accent/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold">문의하기</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            서비스 관련 질문/제안이 있다면 아래 양식 또는 이메일로 연락 주세요.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="grid gap-8 md:grid-cols-2">
          {/* 연락 카드 */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">연락처</h3>
            <p className="text-sm text-muted-foreground mt-2">
              업무 시간: 평일 10:00 ~ 18:00 (공휴일 제외)
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div>
                📧 이메일:{" "}
                <a href="mailto:support@newscrawler.com" className="underline">
                  support@newscrawler.com
                </a>
              </div>
              <div>📍 서울특별시 어딘가 123</div>
            </div>

            <Separator className="my-6" />

            <div className="text-sm text-muted-foreground">
              빠른 응답을 위해 문의 내용을 구체적으로 적어주세요.
            </div>
          </div>

          {/* 간단 폼 (동작 없이 스타일만) */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="rounded-2xl border bg-card p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold">문의 남기기</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm">이름</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="text-sm">이메일</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm">내용</label>
                <textarea
                  rows={5}
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="문의 내용을 입력하세요."
                />
              </div>
              <Button type="submit" className="w-full">보내기</Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
