import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Mail, Lock, User, Phone, Eye, EyeOff, Github, Chrome } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

interface SignupPageProps {
  onBack: () => void;
}

export function SignupPage({ onBack }: SignupPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SignupFormData>();

  const password = watch("password");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    // 실제 구현에서는 여기서 API 호출
    console.log("회원가입 데이터:", data);
    
    // 모의 지연
    setTimeout(() => {
      setIsLoading(false);
      alert("회원가입이 완료되었습니다!");
    }, 2000);
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`${provider} 로그인`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="text-center">
            <h1 className="mb-4">뉴스 크롤러에 오신 것을 환영합니다</h1>
            <p className="text-muted-foreground mb-8">
              실시간 뉴스 모니터링과 분석을 위한 최고의 플랫폼
            </p>
          </div>
          <div className="relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80"
              alt="뉴스 분석"
              className="w-full h-80 object-cover rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-card rounded-lg border">
              <h3>10,000+</h3>
              <p className="text-muted-foreground text-sm">일일 뉴스 수집</p>
            </div>
            <div className="p-4 bg-card rounded-lg border">
              <h3>실시간</h3>
              <p className="text-muted-foreground text-sm">뉴스 업데이트</p>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2>회원가입</h2>
            </div>
            <CardDescription>
              계정을 생성하여 뉴스 크롤러의 모든 기능을 이용해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("Google")}
                className="w-full"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSocialLogin("GitHub")}
                className="w-full"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  또는 이메일로 계속하기
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="fullName">이름 *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="홍길동"
                    className="pl-10"
                    {...register("fullName", {
                      required: "이름을 입력해주세요",
                      minLength: {
                        value: 2,
                        message: "이름은 2자 이상이어야 합니다"
                      }
                    })}
                  />
                </div>
                {errors.fullName && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.fullName.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    className="pl-10"
                    {...register("email", {
                      required: "이메일을 입력해주세요",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "올바른 이메일 형식을 입력해주세요"
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.email.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 전화번호 */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">전화번호</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    placeholder="010-1234-5678"
                    className="pl-10"
                    {...register("phoneNumber", {
                      pattern: {
                        value: /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/,
                        message: "올바른 전화번호 형식을 입력해주세요"
                      }
                    })}
                  />
                </div>
                {errors.phoneNumber && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.phoneNumber.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8자 이상의 비밀번호"
                    className="pl-10 pr-10"
                    {...register("password", {
                      required: "비밀번호를 입력해주세요",
                      minLength: {
                        value: 8,
                        message: "비밀번호는 8자 이상이어야 합니다"
                      }
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.password.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    className="pl-10 pr-10"
                    {...register("confirmPassword", {
                      required: "비밀번호 확인을 입력해주세요",
                      validate: value => value === password || "비밀번호가 일치하지 않습니다"
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.confirmPassword.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 약관 동의 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    {...register("agreeToTerms", {
                      required: "이용약관에 동의해주세요"
                    })}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    <span className="text-destructive">*</span> 이용약관 및 개인정보처리방침에 동의합니다
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToMarketing"
                    {...register("agreeToMarketing")}
                  />
                  <Label htmlFor="agreeToMarketing" className="text-sm text-muted-foreground">
                    마케팅 정보 수신에 동의합니다 (선택)
                  </Label>
                </div>
                {errors.agreeToTerms && (
                  <Alert variant="destructive">
                    <AlertDescription>{errors.agreeToTerms.message}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "가입 중..." : "회원가입"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
              <Button variant="link" className="p-0 h-auto">
                로그인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}