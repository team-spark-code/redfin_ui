"use server";

import { redirect } from "next/navigation";

// Spring Boot 백엔드 API 기본 URL
const API_BASE_URL = "http://localhost:8080/api";

export interface LoginResult {
  error?: string;
  success?: boolean;
  token?: string;
  user?: any;
}

export interface SignupResult {
  error?: {
    form?: string;
    fields?: Record<string, string[]>;
  };
  success?: string;
}

// Spring Boot 백엔드로 회원가입 요청
export async function signup(prevState: any, formData: FormData): Promise<SignupResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 기본적인 유효성 검사
  if (!name || name.length < 2) {
    return {
      error: {
        fields: { name: ["이름은 2자 이상이어야 합니다."] }
      }
    };
  }

  if (!email || !email.includes("@")) {
    return {
      error: {
        fields: { email: ["유효한 이메일을 입력해주세요."] }
      }
    };
  }

  if (!password || password.length < 6) {
    return {
      error: {
        fields: { password: ["비밀번호는 6자 이상이어야 합니다."] }
      }
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: name,
        email: email,
        password: password,
        phoneNumber: "" // 기본값
      }),
    });

    const result = await response.json();

    if (result.success) {
      return { success: "회원가입이 완료되었습니다. 이제 로그인할 수 있습니다." };
    } else {
      return { error: { form: result.message || "회원가입에 실패했습니다." } };
    }
  } catch (error) {
    console.error("회원가입 오류:", error);
    return { error: { form: "서버 연결에 실패했습니다. 다시 시도해주세요." } };
  }
}

// Spring Boot 백엔드로 로그인 요청
export async function login(prevState: any, formData: FormData): Promise<LoginResult & { token?: string; user?: any }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해주세요." };
  }

  try {
    console.log('로그인 액션 시작:', email);

    // Next.js API 라우트 사용 (상대 경로)
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const result = await response.json();
    console.log('로그인 응답:', response.status, result);

    if (response.ok && result.token && result.user) {
      console.log('로그인 성공, 토큰 길이:', result.token.length);
      return {
        success: true,
        token: result.token,
        user: result.user
      };
    } else {
      console.log('로그인 실패:', result.message);
      return { error: result.message || "로그인에 실패했습니다." };
    }
  } catch (error) {
    console.error("로그인 오류:", error);
    return { error: "서버 연결에 실패했습니다. 다시 시도해주세요." };
  }
}

// 로그아웃
export async function logout() {
  redirect("/");
}

// 이메일 중복 확인
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/check-email?email=${encodeURIComponent(email)}`, {
      method: "GET",
    });

    const result = await response.json();
    return !result.exists; // 존재하지 않으면 사용 가능
  } catch (error) {
    console.error("이메일 중복 확인 오류:", error);
    return false; // 오류 시 사용 불가능으로 처리
  }
}
