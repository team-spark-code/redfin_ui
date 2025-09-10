import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Chrome } from "lucide-react";
import Image from 'next/image';

// 사용자 정보 타입 정의
type User = {
  id: number;
  memberId: number; // MEMBER_ID 추가
  name: string;
  email: string;
  username?: string;
};

interface LoginPageProps {
  onBack: () => void;
  onSignupClick: () => void;
  onLoginSuccess: (user: User) => void; // 🔹 로그인 성공 콜백 함수 prop 추가
}

const KakaoIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2C6.486 2 2 5.589 2 10.007c0 2.953 1.904 5.53 4.63 6.91-1.242 2.723-3.833 3.893-3.833 3.893s1.635-.493 3.833-1.947c1.132.343 2.32.537 3.537.537 5.514 0 10-3.589 10-8.007S17.514 2 12 2z" />
  </svg>
);

export function LoginPage({ onBack, onSignupClick, onLoginSuccess }: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 6자 이상이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Next.js API 라우트 사용
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const result = await response.json();
      console.log("로그인 응답:", result);

      if (response.ok && result.token && result.user) {
        console.log("로그인 성공:", result);

        // AuthContext와 일치하는 키로 토큰 저장
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));

        console.log("토큰 저장 완료:", result.token.substring(0, 20) + '...');

        // 부모 컴포넌트에 로그인 성공과 사용자 정보를 알립니다.
        onLoginSuccess(result.user);
      } else {
        setErrors({ general: result.message || "로그인에 실패했습니다." });
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setErrors({ general: "서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl">로그인</CardTitle>
            <CardDescription>
              계정에 로그인하여 맞춤형 뉴스를 확인하세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {errors.general}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-destructive focus:border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? "border-destructive focus:border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm text-muted-foreground hover:text-primary"
                  disabled={isLoading}
                >
                  비밀번호를 잊으셨나요?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                type="button"
                className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/90"
                onClick={() => handleSocialLogin("kakao")}
                disabled={isLoading}
              >
                <KakaoIcon className="w-5 h-5 mr-2" />
                카카오
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("naver")}
                className="w-full p-0 h-10"
                disabled={isLoading}
              >
                <Image src="/web_light_rd_ctn@4x.png" alt="네이버로 로그인" width={100} height={40} style={{ objectFit: 'contain' }} />
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Button
                variant="link"
                className="px-0 text-primary hover:underline"
                onClick={onSignupClick}
                disabled={isLoading}
              >
                회원가입
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
