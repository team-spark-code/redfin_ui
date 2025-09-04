"use client";

import { useState } from "react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<null | { type: "success" | "error"; text: string }>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "전송에 실패했습니다.");
      }

      setNotice({ type: "success", text: "메일이 전송되었습니다. 빠르게 답변드리겠습니다." });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setNotice({ type: "error", text: err.message || "오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
  };

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
              업무 시간: 평일 09:00 ~ 18:00 (공휴일 제외)
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div>
                📧 이메일:{" "}
                <a href="mailto:support@newscrawler.com" className="underline">
                  support@newscrawler.com
                </a>
              </div>
              <div>📍 경기도 수원시 팔달구 인계동 번지 신관 3층 208-5 KR 풍림빌딩</div>
            </div>

            <Separator className="my-6" />

            <div className="text-sm text-muted-foreground">
              빠른 응답을 위해 문의 내용을 구체적으로 적어주세요.
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={onSubmit} className="rounded-2xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">문의 남기기</h3>

            {notice && (
              <div
                className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                  notice.type === "success"
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-red-300 bg-red-50 text-red-700"
                }`}
                role="alert"
              >
                {notice.text}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="text-sm">이름</label>
                <input
                  id="name"
                  name="name"
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="text-sm">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="text-sm">내용</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  placeholder="문의 내용을 입력하세요."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  minLength={10}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "전송 중..." : "보내기"}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
