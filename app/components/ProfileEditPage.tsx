// ProfileEditPage.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Search } from "lucide-react";

// Daum 주소 검색 API 타입 정의
declare global {
  interface Window {
    daum: any;
  }
}

// 사용자 정보 타입 정의
type User = {
  id: number;
  memberId?: number; // MEMBER_ID 추가
  name: string;
  email: string;
  phone?: string;
  address?: string;
  zipcode?: string; // zipCode에서 zipcode로 변경
  detailAddress?: string;
  bio?: string;
};

interface ProfileEditPageProps {
  user: User;
  onBack: () => void;
  onUpdateProfile: (updatedUser: User) => void;
}

export function ProfileEditPage({ user, onBack, onUpdateProfile }: ProfileEditPageProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    zipcode: user.zipcode || "", // zipCode에서 zipcode로 변경
    address: user.address || "",
    detailAddress: user.detailAddress || "",
    bio: user.bio || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);

  // Daum 주소 검색 스크립트 로드
  useEffect(() => {
    const loadDaumPostcode = () => {
      if (window.daum && window.daum.Postcode) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Daum Postcode API'));
        document.head.appendChild(script);
      });
    };
    loadDaumPostcode().catch(err => console.error('Error loading Daum Postcode API:', err));
  }, []);

  // JWT 토큰에서 우편번호 정보 불러오기
  useEffect(() => {
    const loadZipcodeFromToken = () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');

      if (!token) return;

      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return;

        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('JWT 토큰에서 우편번호 정보 확인:', payload.zipcode);

        // JWT 토큰에 우편번호가 있고 현재 사용자에게 없다면 업데이트
        if (payload.zipcode && !user.zipcode) {
          console.log('JWT 토큰에서 우편번호 정보를 사용자 정보에 반영:', payload.zipcode);

          // formData 업데이트
          setFormData(prev => ({
            ...prev,
            zipcode: payload.zipcode
          }));

          // 사용자 정보 업데이트
          const updatedUser = {
            ...user,
            zipcode: payload.zipcode
          };
          onUpdateProfile(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('JWT 토큰에서 우편번호 정보 추출 실패:', error);
      }
    };

    loadZipcodeFromToken();
  }, [user, onUpdateProfile]);

  // 주소 검색 팝업 열기
  const handleAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIsAddressSearchOpen(true);
    setTimeout(() => {
      const container = document.getElementById('addressSearchContainer');
      if (!container) {
        console.error('Address search container not found');
        setIsAddressSearchOpen(false);
        return;
      }
      new window.daum.Postcode({
        oncomplete: function(data: any) {
          let addr = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
          if (data.userSelectedType === 'R' && data.bname !== '' && /[동로가]$/g.test(data.bname)) {
            addr += ` (${data.bname})`;
          }
          setFormData(prev => ({ ...prev, zipcode: data.zonecode, address: addr }));
          setIsAddressSearchOpen(false);
        },
        onclose: () => setIsAddressSearchOpen(false),
        width: '100%',
        height: '100%',
      }).embed(container);
    }, 100);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "이름은 필수 항목입니다.";
    if (!formData.email.trim()) newErrors.email = "이메일은 필수 항목입니다.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "올바른 이메일 형식이 아닙니다.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      // Next.js API 라우트는 상대 경로를 사용
      const url = '/api/users/profile';

      // AuthContext와 일치하도록 localStorage에서 토큰 가져오기
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');

      console.log('=== 프로필 수정 디버깅 시작 ===');
      console.log('토큰 존재 여부:', !!token);
      console.log('토큰 길이:', token ? token.length : 0);
      console.log('토큰 시작 부분:', token ? token.substring(0, 20) + '...' : 'none');
      console.log('localStorage auth_token:', localStorage.getItem('auth_token') ? 'exists' : 'missing');
      console.log('sessionStorage authToken:', sessionStorage.getItem('authToken') ? 'exists' : 'missing');
      console.log('현재 사용자 정보:', user);
      console.log('요청 URL:', url);

      if (!token) {
        console.log('토큰이 없음 - 로그인 필요');
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        onBack();
        return;
      }

      // 토큰 유효성 간단 체크 (JWT 구조 확인)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.log('토큰 형식이 잘못됨 - JWT가 아님');
        alert('토큰 형식이 잘못되었습니다. 다시 로그인해주세요.');
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('authToken');
        onBack();
        return;
      }

      // JWT payload 디코딩 (검증 없이 내용만 확인)
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('토큰 payload:', payload);
        console.log('토큰 만료 시간:', payload.exp ? new Date(payload.exp * 1000) : 'none');
        console.log('현재 시간:', new Date());

        // 토큰 만료 확인
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log('토큰이 만료됨');
          alert('토큰이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('authToken');
          onBack();
          return;
        }

        // JWT 토큰에서 우편번호 정보가 있다면 현재 사용자 정보에 반영
        if (payload.zipcode && !user.zipcode) {
          console.log('JWT 토큰에서 우편번호 정보 발견:', payload.zipcode);
          const updatedUserWithZipcode = {
            ...user,
            zipcode: payload.zipcode
          };
          onUpdateProfile(updatedUserWithZipcode);
          localStorage.setItem('auth_user', JSON.stringify(updatedUserWithZipcode));
        }
      } catch (e) {
        console.log('토큰 payload 디코딩 실패:', e);
        // 디코딩 실패해도 서버에서 검증하므로 계속 진행
      }

      const requestBody = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        zipcode: formData.zipcode, // zipCode에서 zipcode로 변경
        address: formData.address,
        detailAddress: formData.detailAddress,
        bio: formData.bio,
      };

      console.log('요청 본문:', requestBody);

      const doRequest = (method: 'PUT' | 'POST' | 'PATCH') => {
        console.log(`${method} 요청 시작`);
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
        console.log('요청 헤더:', { ...headers, Authorization: 'Bearer ***' });

        return fetch(url, {
          method,
          headers,
          body: JSON.stringify(requestBody),
        });
      };

      let response = await doRequest('PUT');
      console.log('PUT 응답 상태:', response.status);

      if (response.status === 405) {
        console.warn('PUT 405(Method Not Allowed) -> POST로 재시도');
        response = await doRequest('POST');
        console.log('POST 응답 상태:', response.status);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('응답 오류:', response.status, errorText);

        if (response.status === 401) {
          console.log('401 오류 - 인증 실패');
          alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          // 만료된 토큰 삭제
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('authToken');
          onBack();
          return;
        }
        if (response.status === 403) {
          alert('수정 권한이 없습니다.');
          return;
        }
        if (response.status === 404) {
          alert('프로필 API 엔드포인트를 찾을 수 없습니다.');
          return;
        }
        if (response.status === 405) {
          alert('서버가 해당 메서드를 허용하지 않습니다.');
          return;
        }

        throw new Error(`서버 오류: ${response.status} - ${errorText}`);
      }

      // 서버 응답 처리 개선
      let updatedUserData;
      try {
        const responseText = await response.text();
        console.log('서버 응답:', responseText);
        updatedUserData = JSON.parse(responseText);
      } catch (e) {
        // JSON 파싱 실패 시 formData를 사용
        console.warn('서버 응답 JSON 파싱 실패, formData 사용:', e);
        updatedUserData = {
          id: user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          zipcode: formData.zipcode, // zipCode에서 zipcode로 변경
          address: formData.address,
          detailAddress: formData.detailAddress,
          bio: formData.bio,
        };
      }

      // 업데이트된 사용자 정보 생성
      const updatedUser: User = {
        ...user,
        ...updatedUserData
      };

      console.log('업데이트된 사용자 정보:', updatedUser);

      // AuthContext의 updateUser 함수를 통해 상태 업데이트
      onUpdateProfile(updatedUser);

      // localStorage에도 업데이트된 정보 저장 (AuthContext와 일치)
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

      console.log('=== 프로필 수정 성공 ===');
      alert('프로필이 성공적으로 업데이트되었습니다!');
      onBack();
    } catch (err) {
      console.error('Profile update error:', err);
      alert(`프로필 업데이트에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">회원정보 수정</h1>
            <p className="text-muted-foreground">프로필 정보를 수정할 수 있습니다.</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* 사용자 정보 섹션 추가 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">현재 로그인 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <span className="font-medium text-blue-700 mr-2">MEMBER_ID:</span>
                <span className="text-blue-900 font-mono bg-blue-100 px-2 py-1 rounded">
                  {user?.memberId || user?.id || 'ID를 찾을 수 없음'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-blue-700 mr-2">이메일:</span>
                <span className="text-blue-900">
                  {user?.email || '이메일 정보 없음'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-blue-700 mr-2">이름:</span>
                <span className="text-blue-900">
                  {user?.name || '이름 정보 없음'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-blue-700 mr-2">우편번호:</span>
                <span className="text-blue-900 font-mono bg-blue-100 px-2 py-1 rounded">
                  {user?.zipcode || '우편번호 정보 없음'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-blue-700 mr-2">상태:</span>
                <span className="text-green-600 font-medium">
                  ✓ 로그인됨 (MEMBER 테이블)
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">기본 정보</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  이름 <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="이름을 입력하세요"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  이메일 <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="이메일을 입력하세요"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="전화번호를 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  주소
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.zipcode}
                    onChange={(e) => handleInputChange('zipcode', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="우편번호"
                    readOnly
                  />
                  <Button type="button" onClick={handleAddressSearch} className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    검색
                  </Button>
                </div>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="주소를 입력하세요"
                />
                <input
                  type="text"
                  value={formData.detailAddress}
                  onChange={(e) => handleInputChange('detailAddress', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="상세주소"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>취소</Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    저장하기
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {isAddressSearchOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">주소 검색</h3>
                <Button variant="ghost" onClick={() => setIsAddressSearchOpen(false)} className="p-1">✕</Button>
              </div>
              <div id="addressSearchContainer" className="w-full h-96 border border-border rounded" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
