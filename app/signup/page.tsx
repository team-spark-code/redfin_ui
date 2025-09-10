"use client";

import { signup } from "../../lib/actions/user";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { SiKakaotalk } from "react-icons/si";
import { useRouter } from "next/navigation";

// 폼 제출 버튼 컴포넌트 (로딩 상태 표시)
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          회원가입 중...
        </>
      ) : (
        "회원가입"
      )}
    </Button>
  );
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signup, { error: undefined });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phone1, setPhone1] = useState("");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeTermsError, setAgreeTermsError] = useState("");

  const phone1Ref = useRef<HTMLInputElement>(null);
  const phone2Ref = useRef<HTMLInputElement>(null);
  const phone3Ref = useRef<HTMLInputElement>(null);

  // === Google Identity Services 준비 ===
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 클라이언트 ID가 없으면 렌더링 생략
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되어 있지 않습니다. 구글 가입 버튼 렌더링을 건너뜁니다.");
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

    const onLoad = () => {
      try {
        // @ts-ignore - 전역 google 객체 사용
        const google = (window as any).google;
        if (!google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              const credential: string | undefined = response?.credential;
              if (!credential) return;

              const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
              });

              const result = await res.json();
              if (res.ok && result.token && result.user) {
                // 로그인/가입 성공 처리: 토큰 저장 후 리다이렉트
                localStorage.setItem("auth_token", result.token);
                localStorage.setItem("auth_user", JSON.stringify(result.user));
                router.push("/");
              } else {
                alert(result?.message || "구글 가입에 실패했습니다.");
              }
            } catch (err) {
              console.error("구글 가입 처리 오류:", err);
              alert("구글 가입 처리 중 오류가 발생했습니다.");
            }
          },
          auto_select: false,
          ux_mode: "popup",
          context: "signup",
        });

        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            type: "standard",
            theme: "filled_blue",
            text: "signup_with",
            shape: "rectangular",
            size: "large",
            logo_alignment: "left",
          });
        }
      } catch (e) {
        console.error("Google Identity 초기화 오류", e);
      }
    };

    if (existing) {
      // 이미 스크립트가 로드된 경우 바로 초기화
      if ((existing as HTMLScriptElement).getAttribute("data-loaded")) {
        onLoad();
      } else {
        existing.addEventListener("load", onLoad, { once: true } as any);
      }
      return () => existing.removeEventListener("load", onLoad as any);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      onLoad();
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [router]);

  // 커스텀 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConfirmPasswordError("");
    setPhoneError("");
    setAgreeTermsError("");
    if (!agreeTerms) {
      setAgreeTermsError("회원가입을 위해 이용약관에 동의해야 합니다.");
      return;
    }
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;
    if (password !== confirmPassword) {
      setConfirmPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }
    // 전화번호 유효성 검사
    if (!/^\d{3}$/.test(phone1) || !/^\d{3,4}$/.test(phone2) || !/^\d{4}$/.test(phone3)) {
      setPhoneError("휴대폰 번호를 올바르게 입력하세요. 예: 010-1234-5678");
      return;
    }
    // FormData에 phone 필드 추가
    const formData = new FormData(form);
    formData.set("phone", `${phone1}-${phone2}-${phone3}`);
    formAction(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center relative">
                <Link href="/" className="absolute left-0">
                    <Button variant="ghost" size="icon" aria-label="뒤로가기">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
            </div>
            <CardDescription className="text-center">
              새 계정을 만들어 서비스를 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 성공 메시지 */}
            {state?.success && (
              <Alert className="mb-4">
                <AlertDescription>{state.success}</AlertDescription>
              </Alert>
            )}

            {/* 폼 전체 오류 메시지 */}
            {state?.error?.form && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{state.error.form}</AlertDescription>
              </Alert>
            )}

            {/* 비밀번호 불일치 오류 메시지 */}
            {confirmPasswordError && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{confirmPasswordError}</AlertDescription>
              </Alert>
            )}

            {/* 휴대폰 번호 오류 메시지 */}
            {phoneError && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{phoneError}</AlertDescription>
              </Alert>
            )}

            {/* 소셜 로그인 아이콘 버튼 */}
            <div className="flex justify-center gap-4 mb-6">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded bg-[#FEE500] hover:bg-[#FAD400] text-black font-semibold shadow"
                onClick={() => alert('카카오로 가입 기능은 준비 중입니다.')}
                aria-label="카카오로 가입"
              >
                <SiKakaotalk className="w-5 h-5" aria-hidden="true" />
                카카오로 가입
              </button>
              {/* 구글 GSI 버튼 컨테이너 */}
              <div
                className="flex items-center"
                aria-label="구글로 가입"
              >
                <div ref={googleBtnRef} />
              </div>
            </div>

            <form action={formAction} className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  required
                  autoComplete="name"
                />
                {/* 필드별 오류 메시지 */}
                {state?.error?.fields?.name && (
                  <p className="text-sm text-red-600">
                    {state.error.fields.name[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
                {/* 필드별 오류 메시지 */}
                {state?.error?.fields?.email && (
                  <p className="text-sm text-red-600">
                    {state.error.fields.email[0]}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6자 이상의 비밀번호"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {/* 필드별 오류 메시지 */}
                {state?.error?.fields?.password && (
                  <p className="text-sm text-red-600">
                    {state.error.fields.password[0]}
                  </p>
                )}
              </div>

              {/* 비밀번호 재입력 필드 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 재입력</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">생년월일</Label>
                <Input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  required
                  autoComplete="bday"
                />
                {/* 필드별 오류 메시지 */}
                {state?.error?.fields?.birthdate && (
                  <p className="text-sm text-red-600">
                    {state.error.fields.birthdate[0]}
                  </p>
                )}
              </div>

              {/* 휴대폰 번호 입력 필드 (3개) */}
              <div className="space-y-2">
                <Label htmlFor="phone1">휴대폰 번호</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone1"
                    name="phone1"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    pattern="\d{3}"
                    placeholder="010"
                    required
                    value={phone1}
                    ref={phone1Ref}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setPhone1(value);
                      if (value.length === 3) {
                        phone2Ref.current?.focus();
                      }
                    }}
                    className="w-16"
                  />
                  <span className="self-center">-</span>
                  <Input
                    id="phone2"
                    name="phone2"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{3,4}"
                    placeholder="1234"
                    required
                    value={phone2}
                    ref={phone2Ref}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      setPhone2(value);
                      if ((value.length === 4 || value.length === 3) && value.length === e.target.maxLength) {
                        phone3Ref.current?.focus();
                      }
                    }}
                    className="w-20"
                  />
                  <span className="self-center">-</span>
                  <Input
                    id="phone3"
                    name="phone3"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="5678"
                    required
                    value={phone3}
                    ref={phone3Ref}
                    onChange={e => setPhone3(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-20"
                  />
                </div>
                {/* 필드별 오류 메시지 */}
                {state?.error?.fields?.phone && (
                  <p className="text-sm text-red-600">
                    {state.error.fields.phone[0]}
                  </p>
                )}
              </div>

              {/* 이용약관 동의 체크박스 */}
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="mr-2 w-4 h-4 accent-blue-600"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-700 select-none">
                  <span className="font-semibold text-blue-700">이용약관</span>에 동의합니다.
                </label>
              </div>
              {/* 이용약관 동의 오류 메시지 */}
              {agreeTermsError && (
                <Alert className="mb-4" variant="destructive">
                  <AlertDescription>{agreeTermsError}</AlertDescription>
                </Alert>
              )}

              <SubmitButton />
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  로그인하기
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
