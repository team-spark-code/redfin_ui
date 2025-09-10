"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Eye, EyeOff, ArrowLeft, Database, HardDrive } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dbStatus, setDbStatus] = useState<'checking' | 'mariadb' | 'memory' | 'unknown'>('checking');
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();

  // 이미 로그인된 상태라면 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, router, authLoading]);

  // 컴포넌트 마운트 시 데이터베이스 상태 확인
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        // GET 요청으로 서버 상태 확인
        const response = await fetch('/api/auth/login', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('서버 상태:', data);

          // 데이터베이스 상태에 따라 UI 업데이트
          if (data.database?.includes('MariaDB')) {
            setDbStatus('mariadb');
          } else if (data.database?.includes('메모리')) {
            setDbStatus('memory');
          } else {
            setDbStatus('unknown');
          }
        } else {
          setDbStatus('unknown');
        }
      } catch (error) {
        console.log('서버 연결 확인 중 오류:', error);
        setDbStatus('unknown');
      }
    };

    checkDbStatus();

    // 1초 후에도 여전히 checking 상태라면 unknown으로 변경
    const timer = setTimeout(() => {
      setDbStatus(prev => prev === 'checking' ? 'unknown' : prev);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("이메일과 비밀번호를 모두 입력해주세요.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return false;
    }
    if (formData.password.length < 3) {
      setError("비밀번호는 3자 이상이어야 합니다.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      console.log('로그인 시도:', formData.email);

      // Next.js API 라우트 호출
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();
      console.log('로그인 응답:', response.status, result);

      // 응답에서 데이터베이스 상태 확인
      if (result.message) {
        if (result.message.includes('MariaDB')) {
          setDbStatus('mariadb');
        } else if (result.message.includes('메모리')) {
          setDbStatus('memory');
        }
      }

      if (response.ok && result.token && result.user) {
        console.log('로그인 성공, AuthContext 업데이트');

        // AuthContext의 login 함수 호출
        login(result.token, result.user);

        // 성공 메시지 표시
        const dbType = dbStatus === 'mariadb' ? 'MariaDB' : '메모리 기반';
        console.log(`로그인 성공 (${dbType})`);

        // 메인 페이지로 리다이렉트
        router.push('/');
      } else {
        setError(result.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setDbStatus('unknown');
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">로그인</CardTitle>
              {/* 데이터베이스 상태 표시 */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {dbStatus === 'mariadb' && (
                  <>
                    <Database className="w-3 h-3" />
                    <span>MariaDB</span>
                  </>
                )}
                {dbStatus === 'memory' && (
                  <>
                    <HardDrive className="w-3 h-3" />
                    <span>메모리</span>
                  </>
                )}
                {dbStatus === 'checking' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>확인중</span>
                  </>
                )}
              </div>
            </div>
            <CardDescription className="text-center">
              계정에 로그인하여 서비스를 이용하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 오류 메시지 */}
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="test@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10 transition-all duration-200"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-3">


              <div className="text-center">
                <p className="text-sm text-gray-600">
                  계정이 없으신가요?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    회원가입하기
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  );
}
