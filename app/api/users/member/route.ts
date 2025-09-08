import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { findUserById, testConnection } from '../../../lib/database'; // 마리아DB 직접 조회 함수 추가

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    console.log('MEMBER 테이블에서 사용자 정보 조회 요청 시작');

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

    // JWT에서 memberId 추출 (우선순위: memberId > userId > id)
    const memberId = decoded.memberId || decoded.userId || decoded.id;
    if (!memberId) {
      console.log('토큰에서 MEMBER ID를 찾을 수 없음');
      return NextResponse.json(
        { error: 'MEMBER ID를 찾을 수 없습니다.' },
        { status: 401 }
      );
    }

    console.log('MEMBER ID 추출:', memberId);

    // Spring Boot 백엔드에서 MEMBER 정보 조회
    try {
      const memberResponse = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Spring Boot MEMBER API 응답 상태:', memberResponse.status);

      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        console.log('Spring Boot에서 MEMBER 데이터 조회 성공:', memberData);

        // 응답 데이터 정규화
        const normalizedUser = {
          id: memberData.id || memberData.memberId,
          memberId: memberData.memberId || memberData.id,
          email: memberData.email,
          name: memberData.name || memberData.username,
          username: memberData.username,
          phone: memberData.phone,
          zipcode: memberData.zipcode || memberData.zipCode, // zipcode 필드로 통일
          address: memberData.address,
          detailAddress: memberData.detailAddress,
          bio: memberData.bio,
          createdAt: memberData.createdAt,
          updatedAt: memberData.updatedAt
        };

        return NextResponse.json({
          success: true,
          user: normalizedUser,
          message: 'Spring Boot에서 MEMBER 정보 조회 성공'
        });
      } else {
        const errorText = await memberResponse.text();
        console.error('Spring Boot MEMBER 조회 실패:', errorText);
        // Spring Boot 실패 시 마리아DB 직접 조회로 폴백
        throw new Error(`Spring Boot API failed: ${memberResponse.status}`);
      }

    } catch (fetchError) {
      console.error('Spring Boot API 호출 오류, 마리아DB 직접 조회로 폴백:', fetchError);

      // 마리아DB 연결 테스트
      const isDbConnected = await testConnection();
      if (!isDbConnected) {
        console.error('마리아DB 연결도 실패');
        return NextResponse.json(
          { error: 'MEMBER 정보를 조회할 수 없습니다. 서버와 연결할 수 없습니다.' },
          { status: 500 }
        );
      }

      // 마리아DB에서 직접 사용자 정보 조회
      console.log('마리아DB에서 직접 사용자 정보 조회 시도, memberId:', memberId);
      const dbUser = await findUserById(memberId);

      if (!dbUser) {
        console.error('마리아DB에서도 사용자를 찾을 수 없음');
        return NextResponse.json(
          { error: 'MEMBER 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      console.log('마리아DB에서 사용자 정보 조회 성공:', dbUser);

      // 마리아DB 데이터 정규화 (zipcode 필드 포함)
      const normalizedUser = {
        id: dbUser.id,
        memberId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        username: dbUser.name,
        phone: dbUser.phone,
        zipcode: dbUser.zipcode, // 마리아DB에서 가져온 zipcode
        address: dbUser.address,
        detailAddress: dbUser.detailAddress,
        bio: dbUser.bio,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      };

      return NextResponse.json({
        success: true,
        user: normalizedUser,
        message: '마리아DB에서 MEMBER 정보 조회 성공'
      });
    }

  } catch (error) {
    console.error('MEMBER 정보 조회 중 예상치 못한 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 쿼리 파라미터로 memberId를 받아서 조회하는 엔드포인트
export async function POST(request: NextRequest) {
  try {
    console.log('쿼리를 통한 MEMBER 테이블 사용자 정보 조회 요청');

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: 'MEMBER ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('요청된 MEMBER ID:', memberId);

    // Authorization 헤더에서 토큰 추출 (인증 확인)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Spring Boot 백엔드에서 MEMBER 정보 조회
    try {
      const memberResponse = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        console.log('Spring Boot에서 MEMBER 데이터 조회 성공:', memberData);

        // 응답 데이터 정규화
        const normalizedUser = {
          id: memberData.id || memberData.memberId,
          memberId: memberData.memberId || memberData.id,
          email: memberData.email,
          name: memberData.name || memberData.username,
          username: memberData.username,
          phone: memberData.phone,
          zipcode: memberData.zipcode || memberData.zipCode, // zipcode 필드로 통일
          address: memberData.address,
          detailAddress: memberData.detailAddress,
          bio: memberData.bio,
          createdAt: memberData.createdAt,
          updatedAt: memberData.updatedAt
        };

        return NextResponse.json({
          success: true,
          user: normalizedUser,
          message: 'MEMBER 정보 조회 성공'
        });

      } else {
        const errorText = await memberResponse.text();
        console.error('MEMBER 조회 실패:', errorText);
        // Spring Boot 실패 시 마리아DB 직접 조회로 폴백
        throw new Error(`Spring Boot API failed: ${memberResponse.status}`);
      }

    } catch (fetchError) {
      console.error('Spring Boot API 호출 오류, 마리아DB 직접 조회로 폴백:', fetchError);

      // 마리아DB 연결 테스트
      const isDbConnected = await testConnection();
      if (!isDbConnected) {
        console.error('마리아DB 연결도 실패');
        return NextResponse.json(
          { error: 'MEMBER 정보를 조회할 수 없습니다. 서버와 연결할 수 없습니다.' },
          { status: 500 }
        );
      }

      // 마리아DB에서 직접 사용자 정보 조회
      console.log('마리아DB에서 직접 사용자 정보 조회 시도, memberId:', memberId);
      const dbUser = await findUserById(memberId);

      if (!dbUser) {
        console.error('마리아DB에서도 사용자를 찾을 수 없음');
        return NextResponse.json(
          { error: 'MEMBER 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      console.log('마리아DB에서 사용자 정보 조회 성공:', dbUser);

      // 마리아DB 데이터 정규화 (zipcode 필드 포함)
      const normalizedUser = {
        id: dbUser.id,
        memberId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        username: dbUser.name,
        phone: dbUser.phone,
        zipcode: dbUser.zipcode, // 마리아DB에서 가져온 zipcode
        address: dbUser.address,
        detailAddress: dbUser.detailAddress,
        bio: dbUser.bio,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      };

      return NextResponse.json({
        success: true,
        user: normalizedUser,
        message: '마리아DB에서 MEMBER 정보 조회 성공'
      });
    }

  } catch (error) {
    console.error('MEMBER 정보 조회 중 예상치 못한 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
