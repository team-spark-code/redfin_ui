import Link from "next/link";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { Github, Twitter, Mail, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3>뉴스 크롤러</h3>
            <p className="text-muted-foreground text-sm">
              실시간 뉴스 모니터링과 분석을 위한 플랫폼입니다. 
              다양한 소스로부터 뉴스를 수집하여 제공합니다.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4>빠른 링크</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground">
                  홈
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-muted-foreground hover:text-foreground">
                  전체 뉴스
                </Link>
              </li>
              <li>
                <Link href="/explore" className="text-muted-foreground hover:text-foreground">
                  카테고리
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  분석 대시보드
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4>카테고리</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/politics">정치</Link></li>
              <li><Link href="/category/economy">경제</Link></li>
              <li><Link href="/category/tech">기술</Link></li>
              <li><Link href="/category/sports">스포츠</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4>지원</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help">도움말</Link></li>
              <li><Link href="/contact">문의하기</Link></li>
              <li><Link href="/privacy">개인정보처리방침</Link></li>
              <li><Link href="/terms">이용약관</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} 뉴스 크롤러. 모든 권리 보유.</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by News Crawler Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
