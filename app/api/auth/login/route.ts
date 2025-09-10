import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, testConnection } from "../../../lib/database";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET 메서드 - 서버 상태 확인용
export async function GET(request: NextRequest) {
  try {
    const isDbConnected = await testConnection();
    return NextResponse.json({
      status: "서버가 정상 작동 중입니다.",
      database: isDbConnected ? "MariaDB 연결됨" : "메모리 기반 사용 중",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "서버 오류",
        database: "메모리 기반 사용 중",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Member 테이블 로그인 시도:", email);

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 데이터베이스 연결 테스트
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      console.error("MariaDB 연결 실패, 메모리 기반 데이터로 폴백");
      // MariaDB 연결 실패 시 메모리 기반 데이터로 폴백
      const { findUserByEmail: memoryFindUser } = await import(
        "../../../lib/userData"
      );
      const user = memoryFindUser(email);

      if (!user || password !== user.password) {
        return NextResponse.json(
          { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
          { status: 401 }
        );
      }

      const token = jwt.sign(
        {
          userId: user.id,
          memberId: user.id, // MEMBER_ID 추가
          email: user.email,
          zipcode: user.zipCode, // 우편번호 추가 (메모리 사용자: zipCode)
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { password: _password, ...userWithoutPassword } = user;
      const userResponse = {
        ...userWithoutPassword,
        memberId: user.id, // MEMBER_ID 명시적으로 추가
        zipcode: user.zipCode, // 우편번호 명시적으로 추가 (메모리 사용자: zipCode)
      };

      return NextResponse.json({
        message: "로그인이 완료되었습니다. (메모리 기반)",
        token,
        user: userResponse,
      });
    }

    // MariaDB member 테이블에서 사용자 찾기
    const user = await findUserByEmail(email);
    console.log(
      "MariaDB member 테이블 사용자 검색 결과:",
      user ? { id: user.id, email: user.email } : "없음"
    );

    if (!user) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 비밀번호 확인 (bcrypt 해시 확인 또는 평문 비교)
    let isPasswordValid = false;

    // 해시된 비밀번호인지 확인
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      // bcrypt 해시된 비밀번호
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // 평문 비밀번호 (개발 환경)
      isPasswordValid = password === user.password;
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // JWT 토큰 생성 - MEMBER_ID 명시적으로 추가
    const token = jwt.sign(
      {
        userId: user.id,
        memberId: user.member_id, // MEMBER_ID (MariaDB의 member 테이블 기본키)
        email: user.email,
        name: user.name,
        zipcode: user.zipcode, // 우편번호 추가 (DB 사용자: zipcode)
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(
      "MariaDB member 테이블 로그인 성공, 토큰 생성 완료",
      "사용자 ID:",
      user.id,
      "MEMBER_ID:",
      user.id,
      "이메일:",
      user.email,
      "이름:",
      user.name
    );

    // 응답에서 비밀번호 제외하고 MEMBER_ID 포함
    const { password: _, ...userWithoutPassword } = user;
    const userResponse = {
      ...userWithoutPassword,
      id: user.id,
      memberId: user.member_id, // MEMBER_ID 명시적으로 추가
      email: user.email,
      name: user.name,
      username: user.name,
      zipcode: user.zipcode, // 우편번호 명시적으로 추가 (DB 사용자: zipcode)
    };

    console.log("로그인 응답 사용자 정보:", userResponse);

    return NextResponse.json({
      message: "로그인이 완료되었습니다. (MariaDB member 테이블)",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("MariaDB member 테이블 로그인 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
