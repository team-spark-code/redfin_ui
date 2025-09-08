import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById, updateUser, testConnection } from '../../../lib/database';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(request: NextRequest) {
  try {
    console.log('MariaDB member 테이블 프로필 업데이트 요청 시작');

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'Bearer ***' : 'missing');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('토큰이 없거나 형식이 잘못됨');
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    console.log('토큰 추출 완료, 길이:', token.length);

    // JWT 토큰 검증
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
      console.log('토큰 검증 성공, payload:', decoded);
    } catch (e) {
      console.error('토큰 검증 실패:', e);
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // MEMBER_ID를 우선적으로 사용
    const userId = decoded.memberId || decoded.userId || decoded.id;
    if (!userId) {
      console.log('토큰에서 사용자 ID를 찾을 수 없음');
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 401 }
      );
    }

    console.log('프로필 업데이트 대상 MEMBER_ID:', userId);

    // 요청 본문 파싱
    const body = await request.json();
    console.log('요청 본문:', body);
    const { name, email, phone, zipcode, address, detailAddress, bio } = body; // zipCode를 zipcode로 변경

    // 필수 필드 검증
    if (!name || !email) {
      console.log('필수 필드 누락:', { name: !!name, email: !!email });
      return NextResponse.json(
        { error: '이름과 이메일은 필수 항목입니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('이메일 형식 오류:', email);
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 데이터베이스 연결 테스트
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      console.error('MariaDB 연결 실패, 메모리 기반 데이터로 폴백');
      // MariaDB 연결 실패 시 메모리 기반 데이터로 폴백
      const { findUserById: memoryFindUser, updateUser: memoryUpdateUser } = await import('../../../lib/userData');

      const existingUser = memoryFindUser(userId);
      if (!existingUser) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const updatedUser = memoryUpdateUser(userId, {
        name,
        email,
        phone: phone || undefined,
        zipCode: zipcode || undefined, // 메모리 사용자 타입은 zipCode
        address: address || undefined,
        detailAddress: detailAddress || undefined,
        bio: bio || undefined,
      });

      if (!updatedUser) {
        return NextResponse.json(
          { error: '사용자 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }

      const { password: _memoryPassword, ...updatedUserWithoutPassword } = updatedUser;
      return NextResponse.json({
        ...updatedUserWithoutPassword,
        message: "프로필이 업데이트되었습니다. (메모리 기반)"
      }, { status: 200 });
    }

    // MariaDB member 테이블에서 사용자 찾기
    console.log('MariaDB member 테이블에서 사용자 검색 중, userId:', userId);
    const existingUser = await findUserById(userId);
    console.log('MariaDB member 테이블 사용자 검색 결과:', existingUser ? { id: existingUser.id, email: existingUser.email } : '없음');

    if (!existingUser) {
      console.log('MariaDB member 테이블에서 사용자를 찾을 수 없음');
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // MariaDB member 테이블에서 사용자 정보 업데이트
    console.log('=== MariaDB member 테이블 업데이트 시작 ===');
    const updatedUser = await updateUser(userId, {
      name,
      email,
      phone: phone || undefined,
      zipcode: zipcode || undefined, // DB 사용자 타입은 zipcode
      address: address || undefined,
      detailAddress: detailAddress || undefined,
      bio: bio || undefined,
    });

    console.log('업데이트 함수 실행 완료, 결과:', updatedUser ? 'SUCCESS' : 'FAILED');

    if (!updatedUser) {
      console.error('=== 업데이트 실패 분석 ===');
      console.error('userId:', userId);
      console.error('updateUser 함수 반환값:', updatedUser);

      // 사용자가 여전히 존재하는지 다시 확인
      const stillExists = await findUserById(userId);
      console.error('사용자 존재 여부 재확인:', stillExists ? 'EXISTS' : 'NOT_EXISTS');

      return NextResponse.json(
        {
          error: 'MariaDB member 테이블 사용자 업데이트에 실패했습니다.',
          details: {
            userId: userId,
            userExists: !!stillExists,
            requestData: { name, email, phone, zipcode, address, detailAddress, bio }
          }
        },
        { status: 500 }
      );
    }

    console.log('=== MariaDB member 테이블 사용자 정보 업데이트 성공 ===');
    console.log('업데이트된 사용자:', { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name });

    // 비밀번호 제외하고 반환
    const { password: _password, ...updatedUserWithoutPassword } = updatedUser;

    // memberId도 응답에 포함
    const responseUser = {
      ...updatedUserWithoutPassword,
      memberId: updatedUser.id, // MEMBER_ID 추가
    };

    console.log('프로필 업데이트 API 응답 데이터:', responseUser);

    return NextResponse.json({
      ...responseUser,
      message: "프로필이 업데이트되었습니다. (MariaDB member 테이블)"
    }, { status: 200 });

  } catch (error) {
    console.error('MariaDB member 테이블 프로필 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST 메서드도 동일하게 처리 (PUT과 동일한 로직)
export async function POST(request: NextRequest) {
  return PUT(request);
}

// PATCH 메서드도 지원
export async function PATCH(request: NextRequest) {
  return PUT(request);
}
