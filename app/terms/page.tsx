"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Separator } from "../components/ui/separator";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-accent/10 via-background to-secondary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold">이용약관</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            서비스 이용과 관련된 권리, 의무 및 책임 사항을 안내드립니다.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <section className="space-y-8 text-sm leading-7">
            <div>
              <h2 className="text-xl font-semibold">제1조 (목적)</h2>
              <p className="text-muted-foreground mt-1">
                본 약관은 뉴스 크롤러 서비스의 이용 조건과 절차를 규정함을 목적으로 합니다.
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">제2조 (회원의 의무)</h2>
              <ul className="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
                <li>관련 법령 및 본 약관 준수</li>
                <li>타인의 권리 침해 금지</li>
                <li>서비스의 안정적 운영에 협조</li>
              </ul>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">제3조 (서비스 제공)</h2>
              <p className="text-muted-foreground mt-1">
                회사는 안정적인 서비스 제공을 위해 최선을 다하며, 필요한 경우 공지 후 서비스 내용을 변경할 수 있습니다.
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">제4조 (약관의 효력 및 변경)</h2>
              <p className="text-muted-foreground mt-1">
                본 약관은 게시와 동시에 효력을 가지며, 관련 법령 또는 서비스 정책에 따라 변경될 수 있습니다.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
