// Header.tsx
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Newspaper,
  TrendingUp,
  Settings,
  LogOut,
  User,
  UserPlus,
} from "lucide-react";
import { NewsFilters } from "./NewsFilters";
import RealtimeNewsTicker from "./RealtimeNewsTicker";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";

// 사용자 정보 타입 정의
type User = {
  id: number;
  name: string;
  email: string;
};

// 커스텀 드롭다운 컴포넌트
interface UserDropdownProps {
  user: User;
  onProfileClick: () => void;
  onInterestsClick: () => void;
  onLogout: () => void;
}

function UserDropdown({ user, onProfileClick, onInterestsClick, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
      >
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-left min-w-0">
          <div className="text-sm font-medium truncate">
            {user.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold text-card-foreground">내 계정</p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => handleMenuClick(onProfileClick)}
              className="flex items-center w-full px-3 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
            >
              <User className="mr-2 h-4 w-4" />
              프로필
            </button>
            
            <button
              onClick={() => handleMenuClick(onInterestsClick)}
              className="flex items-center w-full px-3 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
            >
              <Settings className="mr-2 h-4 w-4" />
              관심사 설정
            </button>
            
            <hr className="my-1 border-border" />

            <button
              onClick={() => handleMenuClick(onLogout)}
              className="flex items-center w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 Header 컴포넌트의 Props 정의 수정
interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onProfileClick: () => void; // 🔹 프로필 클릭 핸들러 prop 추가
  onInterestsClick: () => void; // 관심사 설정 핸들러 추가
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  onHomeClick?: () => void; // 🔹 홈으로 이동 핸들러 추가 (옵션)
}

export function Header({
  user,
  onLogout,
  onLoginClick,
  onSignupClick,
  onProfileClick, // 🔹 prop 받기
  onInterestsClick, // 관심사 설정 핸들러 받기
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRefresh,
  isLoading = false,
  onHomeClick,
}: HeaderProps) {
  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="flex items-center gap-2 shrink-0 cursor-pointer select-none"
              onClick={onHomeClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onHomeClick?.();
                }
              }}
            >
              <Newspaper className="w-8 h-8 text-primary" />
              <h1>뉴스 크롤러</h1>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <TrendingUp className="w-4 h-4" />
              <RealtimeNewsTicker
                className="ml-2 truncate"
                refreshMs={60000}
                rotateMs={4000}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <>
                {/* 직접 로그아웃 버튼 추가 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="hidden sm:flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </Button>

                <UserDropdown 
                  user={user} 
                  onProfileClick={onProfileClick}
                  onInterestsClick={onInterestsClick}
                  onLogout={onLogout}
                />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={onLoginClick}>
                  로그인
                </Button>
                <Button onClick={onSignupClick}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>

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
