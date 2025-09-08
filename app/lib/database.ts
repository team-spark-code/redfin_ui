import mysql, { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1111',
  database: process.env.DB_NAME || 'redfin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 연결 풀 생성
const pool = mysql.createPool(dbConfig);

export interface User {
  member_id?: number;
  id: number; // 이것이 member_id를 의미함
  email: string;
  name: string;
  password: string;
  phone?: string;
  zipcode?: string;
  address?: string;
  detailAddress?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

// DB member 테이블 레코드 타입
interface MemberRow extends RowDataPacket {
  member_id: number;
  email: string;
  name: string;
  password: string;
  phone: string | null;
  zip_code: string | null;
  address: string | null;
  detail_address: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// 이메일로 사용자 찾기 (member 테이블 사용)
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    console.log('DB member 테이블에서 사용자 검색:', email);

    const [rows] = await pool.execute<MemberRow[]>(
      'SELECT * FROM member WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      console.log('DB member 테이블에서 사용자를 찾을 수 없음:', email);
      return null;
    }

    const user = rows[0];
    console.log('DB member 테이블에서 사용자 찾음:', { member_id: user.member_id, email: user.email });

    return {
      member_id: user.member_id,
      id: user.member_id,
      email: user.email,
      name: user.name,
      password: user.password,
      phone: user.phone ?? undefined,
      zipcode: user.zip_code ?? undefined, // DB zip_code -> zipcode
      address: user.address ?? undefined,
      detailAddress: user.detail_address ?? undefined,
      bio: user.bio ?? undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('DB member 테이블 사용자 검색 오류:', error);
    return null;
  }
}

// ID로 사용자 찾기 (member 테이블 사용)
export async function findUserById(id: number): Promise<User | null> {
  try {
    console.log('DB member 테이블에서 사용자 ID로 검색:', id);

    const [rows] = await pool.execute<MemberRow[]>(
      'SELECT * FROM member WHERE member_id = ?',
      [id]
    );

    if (rows.length === 0) {
      console.log('DB member 테이블에서 사용자 ID를 찾을 수 없음:', id);
      return null;
    }

    const user = rows[0];
    console.log('DB member 테이블에서 사용자 ID로 찾음:', { member_id: user.member_id, email: user.email });

    return {
      member_id: user.member_id,
      id: user.member_id,
      email: user.email,
      name: user.name,
      password: user.password,
      phone: user.phone ?? undefined,
      zipcode: user.zip_code ?? undefined, // DB zip_code -> zipcode
      address: user.address ?? undefined,
      detailAddress: user.detail_address ?? undefined,
      bio: user.bio ?? undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  } catch (error) {
    console.error('DB member 테이블 사용자 ID 검색 오류:', error);
    return null;
  }
}

// 사용자 정보 업데이트 (member 테이블 사용)
export async function updateUser(userId: number, userData: Partial<User>): Promise<User | null> {
  try {
    console.log('=== DB member 테이블 사용자 업데이트 시작 ===');
    console.log('업데이트 대상 userId:', userId);
    console.log('업데이트 데이터:', userData);
    console.log('업데이트 데이터 타입 검사:', {
      name: typeof userData.name, nameValue: userData.name,
      email: typeof userData.email, emailValue: userData.email,
      phone: typeof userData.phone, phoneValue: userData.phone,
      zipcode: typeof userData.zipcode, zipcodeValue: userData.zipcode,
      detailAddress: typeof userData.detailAddress, detailAddressValue: userData.detailAddress,
      bio: typeof userData.bio, bioValue: userData.bio
    });

    // 먼저 사용자가 존재하는지 확인
    const existingUser = await findUserById(userId);
    if (!existingUser) {
      console.error('업데이트할 사용자를 찾을 수 없음:', userId);
      return null;
    }
    console.log('업데이트할 사용자 확인됨:', { id: existingUser.id, email: existingUser.email });

    const updateFields: string[] = [];
    const updateValues: Array<string | number | null> = [];

    // 필드별 상세 검사 - 빈 문자열 허용 안 함
    if (userData.name !== undefined && userData.name !== null) {
      if (typeof userData.name === 'string' && userData.name.trim() === '') {
        console.log('⚠️ name 필드가 빈 문자열임');
        return null; // 이름은 빈 문자열일 수 없음
      }
      updateFields.push('name = ?');
      updateValues.push(userData.name);
      console.log('✓ name 필드 업데이트 추가:', userData.name);
    } else {
      console.log('✗ name 필드 스킵:', { undefined: userData.name === undefined, null: userData.name === null });
    }

    if (userData.email !== undefined && userData.email !== null) {
      if (typeof userData.email === 'string' && userData.email.trim() === '') {
        console.log('⚠️ email 필드가 빈 문자열임');
        return null; // 이메일은 빈 문자열일 수 없음
      }
      updateFields.push('email = ?');
      updateValues.push(userData.email);
      console.log('✓ email 필드 업데이트 추가:', userData.email);
    } else {
      console.log('✗ email 필드 스킵:', { undefined: userData.email === undefined, null: userData.email === null });
    }

    if (userData.phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(userData.phone || null);
      console.log('✓ phone 필드 업데이트 추가:', userData.phone);
    } else {
      console.log('✗ phone 필드 스킵 (undefined)');
    }

    if (userData.zipcode !== undefined) {
      updateFields.push('zip_code = ?');
      updateValues.push(userData.zipcode || null);
      console.log('✓ zip_code 필드 업데이트 추가:', userData.zipcode);
    } else {
      console.log('✗ zip_code 필드 스킵 (undefined)');
    }

    if (userData.address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(userData.address || null);
      console.log('✓ address 필드 업데이트 추가:', userData.address);
    } else {
      console.log('✗ address 필드 스킵 (undefined)');
    }

    if (userData.detailAddress !== undefined) {
      updateFields.push('detail_address = ?');
      updateValues.push(userData.detailAddress || null);
      console.log('✓ detail_address 필드 업데이트 추가:', userData.detailAddress);
    } else {
      console.log('✗ detail_address 필드 스킵 (undefined)');
    }

    if (userData.bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(userData.bio || null);
      console.log('✓ bio 필드 업데이트 추가:', userData.bio);
    } else {
      console.log('✗ bio 필드 스킵 (undefined)');
    }

    console.log('=== 필드 구성 완료 ===');
    console.log('업데이트 필드 개수:', updateFields.length);
    console.log('업데이트 필드 목록:', updateFields);
    console.log('업데이트 값 목록:', updateValues);

    if (updateFields.length === 0) {
      console.log('업데이트할 필드가 없음, 기존 사용자 정보 반환');
      return existingUser;
    }

    // updated_at 필드 추가
    updateFields.push('updated_at = NOW()');

    // member_id로 업데이트
    const query = `UPDATE member SET ${updateFields.join(', ')} WHERE member_id = ?`;
    updateValues.push(userId);

    console.log('=== SQL 쿼리 실행 ===');
    console.log('쿼리:', query);
    console.log('파라미터:', updateValues);
    console.log('파라미터 개수:', updateValues.length);

    const [result] = await pool.execute<ResultSetHeader>(query, updateValues);
    console.log('SQL 실행 결과:', result);

    // 업데이트 결과 확인
    const updateResult = result;
    console.log('영향받은 행 수:', updateResult.affectedRows);
    console.log('변경된 행 수:', updateResult.changedRows);
    console.log('경고 개수:', updateResult.warningCount);

    if (updateResult.affectedRows === 0) {
      console.error('=== 업데이트 실패: 영향받은 행이 0개 ===');
      console.error('사용자 ID 재확인:', userId);

      // 사용자 존재 여부 다시 확인
      const recheck = await findUserById(userId);
      console.error('사용자 재확인 결과:', recheck ? 'EXISTS' : 'NOT_EXISTS');

      return null;
    }

    console.log('=== SQL 업데이트 성공, 사용자 정보 재조회 ===');

    // 업데이트된 사용자 정보 반환
    const updatedUser = await findUserById(userId);
    console.log('=== 업데이트 완료 ===');
    console.log('업데이트된 사용자 정보:', updatedUser ? { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name } : '없음');

    return updatedUser;
  } catch (error) {
    console.error('=== DB member 테이블 사용자 업데이트 오류 ===');
    console.error('오류 상세:', error);

    type SqlError = Error & { code?: string; sqlMessage?: string; sqlState?: string };
    const e = error as SqlError;
    console.error('오류 메시지:', e?.message ?? '알 수 없는 오류');
    console.error('오류 스택:', e?.stack ?? '스택 없음');

    // SQL 오류인 경우 추가 정보
    if (e && (e.code || e.sqlMessage || e.sqlState)) {
      console.error('SQL 오류 코드:', e.code);
      console.error('SQL 오류 메시지:', e.sqlMessage);
      console.error('SQL 상태:', e.sqlState);
    }

    return null;
  }
}

// 새 사용자 생성 (member 테이블 사용)
export async function createUser(userData: Omit<User, 'id' | 'member_id'>): Promise<User | null> {
  try {
    console.log('DB member 테이블에 새 사용자 생성:', userData.email);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO member (email, name, password, phone, zip_code, address, detail_address, bio, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userData.email,
        userData.name,
        userData.password,
        userData.phone || null,
        userData.zipcode || null,
        userData.address || null,
        userData.detailAddress || null,
        userData.bio || null
      ]
    );

    const newUserId = result.insertId;

    console.log('DB member 테이블에 새 사용자 생성 완료:', newUserId);

    return await findUserById(newUserId);
  } catch (error) {
    console.error('DB member 테이블 새 사용자 생성 오류:', error);
    return null;
  }
}

// 데이터베이스 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('MariaDB 연결 성공');
    return true;
  } catch (error) {
    console.error('MariaDB 연결 실패:', error);
    return false;
  }
}

export default pool;
