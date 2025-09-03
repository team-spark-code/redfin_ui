// app/components/Header.tsx
"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Newspaper,
  TrendingUp,
  Settings,
  LogOut,
  User,
  Bell,
  UserPlus,
} from "lucide-react";
import { NewsFilters } from "./NewsFilters";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
  onSignupClick?: () => void;
}

// 모의 유저 데이터
const mockUser = {
  name: "김철수",
  email: "kim@example.com",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  role: "관리자",
};

export function Header({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRefresh,
  isLoading = false,
  isLoggedIn = true,
  onSignupClick,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    console.log("로그아웃");
  };

  const handleProfile = () => {
    console.log("프로필 보기");
  };

  const handleSettings = () => {
    console.log("설정");
  };

  // ✅ 로그인 버튼 → /login 으로 이동
  const handleLogin = () => {
    router.push("/login");
    // 필요하면 다음처럼 리다이렉트 파라미터도 포함 가능:
    // const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    // router.push(`/login?next=${encodeURIComponent(next)}`);
  };

  // (옵션) 회원가입 핸들러가 안 넘어오면 기본적으로 /signup으로 이동
  const handleSignup = () => {
    if (onSignupClick) onSignupClick();
    else router.push("/signup");
  };

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-8 h-8 text-primary" />
              <h1>뉴스 크롤러</h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>실시간 뉴스 모니터링</span>
            </div>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                    3
                  </span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={mockUser.avatar}
                          alt={mockUser.name}
                        />
                        <AvatarFallback>
                          {mockUser.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="text-sm">{mockUser.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {mockUser.role}
                        </div>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleProfile}>
                      <User className="mr-2 h-4 w-4" />
                      <span>프로필</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>설정</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleLogin}>
                  로그인
                </Button>
                <Button onClick={handleSignup}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <NewsFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          onRefresh={onRefresh}
          isLoading={isLoading}
        />
      </div>
    </header>
  );
}
