"use client";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Separator } from "../components/ui/separator";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/10 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold">개인정보 처리방침</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            이용자의 개인정보를 안전하게 보호하며 관련 법령을 준수합니다.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <section className="space-y-6 text-sm leading-7">
            <div>
              <h2 className="text-xl font-semibold">1. 수집하는 개인정보</h2>
              <p className="text-muted-foreground mt-1">
                회원가입/로그인/알림 등을 위해 이메일, 이름 등 최소한의 정보를 수집합니다.
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">2. 이용 목적</h2>
              <p className="text-muted-foreground mt-1">
                서비스 제공, 고객 지원, 서비스 개선, 법적 의무 이행을 위한 목적에 한해 사용합니다.
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">3. 보유 및 파기</h2>
              <p className="text-muted-foreground mt-1">
                관련 법령에 따른 보존 기간을 준수하며, 목적 달성 시 지체 없이 파기합니다.
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">4. 제3자 제공/처리위탁</h2>
              <p className="text-muted-foreground mt-1">
                법령에 근거하거나 이용자 동의가 있는 경우에 한해 제한적으로 제공/위탁합니다.
              </p>
            </div>
            <Separator />
            <div>
              <h2 className="text-xl font-semibold">5. 이용자 권리</h2>
              <p className="text-muted-foreground mt-1">
                열람, 정정, 삭제, 처리정지를 요구할 수 있으며, 고객센터를 통해 언제든지 문의할 수 있습니다.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
