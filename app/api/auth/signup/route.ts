import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 임시 사용자 데이터베이스 (실제로는 데이터베이스를 사용해야 함)
const users: Array<{ id: number; email: string; name: string; password: string }> = [
  {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    password: "password", // 임시로 평문 비밀번호 사용
  },
];
let nextUserId = 2;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // 입력 검증
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 중복 검사
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return NextResponse.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 암호화 (임시로 평문 사용)
    const hashedPassword = password;

    // 새 사용자 생성
    const newUser = {
      id: nextUserId++,
      email,
      name,
      password: hashedPassword,
    };

    users.push(newUser);

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 응답에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
