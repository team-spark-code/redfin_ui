// InterestsSettingsPage.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

// 사용자 관심사 설정 페이지 Props
interface InterestsSettingsPageProps {
  onBack: () => void;
  user: any;
  onUpdateInterests?: (interests: string[]) => void;
}

// API 기본 URL (Spring Boot 백엔드)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// 관심사 데이터 정의
const JOB_INTERESTS = [
  { id: "developer", label: "개발자", value: "개발자" },
  { id: "planner", label: "기획자", value: "기획자" },
  { id: "student", label: "대학생", value: "대학생" },
  { id: "researcher", label: "연구원/교수", value: "연구원/교수" },
  { id: "policy", label: "정책작성자", value: "정책작성자" },
  { id: "general", label: "일반인", value: "일반인" },
];

const AI_COMPANIES = [
  { id: "openai", label: "OPENAI", value: "OPENAI" },
  { id: "xAI", label: "xAI", value: "xAI" },
  { id: "google", label: "GOOGLE", value: "GOOGLE" },
  { id: "microsoft", label: "MICROSOFT", value: "MICROSOFT" },
  { id: "meta", label: "META", value: "META" },
  { id: "amazon", label: "AMAZON", value: "AMAZON" },
];

const AI_FIELDS = [
  { id: "deep", label: "딥러닝", value: "딥러닝" },
  { id: "ml", label: "머신러닝", value: "머신러닝" },
  { id: "llm", label: "LLM", value: "LLM" },
  { id: "finetune", label: "파인튜닝", value: "파인튜닝" },
  { id: "data", label: "데이터분석", value: "데이터분석" },
  { id: "nlp", label: "자연어처리", value: "자연어처리" },
  { id: "cv", label: "컴퓨터비전", value: "컴퓨터비전" },
  { id: "rec", label: "추천시스템", value: "추천시스템" },
  { id: "genai", label: "생성AI", value: "생성AI" },
  { id: "rl", label: "강화학습", value: "강화학습" },
];

export function InterestsSettingsPage({ onBack, user, onUpdateInterests }: InterestsSettingsPageProps) {
  const [selectedInterest, setSelectedInterest] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 상태 변화 감지를 위한 useEffect 추가
  useEffect(() => {
    console.log('Selected interests updated:', {
      interest: selectedInterest,
      company: selectedCompany,
      field: selectedField
    });
  }, [selectedInterest, selectedCompany, selectedField]);

  // AuthContext에서 refreshUserFromMember 함수 가져오기
  useEffect(() => {
    // 컴포넌트 마운트 시 MEMBER 테이블에서 최신 사용자 정보 확인
    const refreshUserInfo = async () => {
      try {
        // AuthContext의 refreshUserFromMember 사용하기 위해 useAuth 훅 사용 필요
        // 하지만 현재 컴포넌트에서는 user를 props로 받고 있으므로
        // 대신 직접 MEMBER 테이블 조회를 수행
        if (user && (user.memberId || user.id)) {
          console.log('InterestsSettingsPage: MEMBER 테이블에서 사용자 정보 확인');
          await refreshMemberInfo();
        }
      } catch (error) {
        console.warn('사용자 정보 새로고침 중 오류:', error);
      }
    };

    refreshUserInfo();
  }, []);

  // 사용자 ID를 안전하게 찾는 헬퍼 함수
  const getUserId = (userObj: any): string | number | null => {
    if (!userObj) return null;

    // 우선순위에 따른 ID 필드 검사
    const priorityFields = ['memberId', 'id', 'userId', 'MEMBER_ID', 'ID'];

    for (const field of priorityFields) {
      if (userObj[field] && (typeof userObj[field] === 'string' || typeof userObj[field] === 'number')) {
        console.log(`사용자 ID 발견 (${field}):`, userObj[field]);
        return userObj[field];
      }
    }

    // 추가 검사: ID 관련 필드 동적 검색
    const idKeys = Object.keys(userObj).filter(key =>
      key.toLowerCase().includes('id') ||
      key.toLowerCase().includes('member')
    );

    for (const key of idKeys) {
      if (userObj[key] && (typeof userObj[key] === 'string' || typeof userObj[key] === 'number')) {
        console.log(`동적 ID 필드 발견 (${key}):`, userObj[key]);
        return userObj[key];
      }
    }

    return null;
  };

  // MEMBER 테이블에서 사용자 정보 새로고침
  const refreshMemberInfo = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 MEMBER 테이블 조회를 건너뜁니다.');
      return;
    }

    const memberId = getUserId(user);
    if (!memberId) {
      console.log('사용자 ID를 찾을 수 없어서 MEMBER 테이블 조회를 건너뜁니다.');
      return;
    }

    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');

    if (!authToken) {
      console.warn('인증 토큰이 없어서 MEMBER 테이블 조회를 건너뜁니다.');
      return;
    }

    try {
      console.log('MEMBER 테이블에서 사용자 정보 새로고침 시도:', memberId);

      const response = await fetch('/api/users/member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ memberId: memberId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('MEMBER 테이블에서 최신 사용자 정보 조회 성공:', data.user);
          // 필요시 사용자 정보 업데이트 (부모 컴포넌트에 알림)
          // 현재는 로깅만 수행
        }
      } else {
        console.warn('MEMBER 테이블 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('MEMBER 테이블 조회 중 오류:', error);
    }
  };

  // API 호출을 위한 공통 헤더 설정
  const getHeaders = () => {
    // AuthContext에서 토큰을 가져오거나 localStorage에서 가져오기
    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');

    if (!authToken) {
      console.warn('인증 토큰이 없습니다. 로그인이 필요할 수 있습니다.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': authToken ? `Bearer ${authToken}` : '',
    };
  };

  // 사용자 세션 유효성 검증
  const validateUserSession = () => {
    if (!user) {
      console.error('사용자 정보가 없습니다.');
      showMessage("로그인이 필요합니다. 다시 로그인해주세요.", "error");
      return false;
    }

    // 사용자 객체 전체 구조 로깅 (디버깅용)
    console.log('사용자 객체 전체 구조:', JSON.stringify(user, null, 2));
    console.log('사용자 객체 키들:', Object.keys(user));

    // MEMBER_ID를 우선적으로 사용, 다양한 ID 필드 검사
    const userId = user.memberId || user.id || user.userId || user.MEMBER_ID || user.ID;

    // 추가 ID 필드 검사 (대소문자 구분 없이)
    let foundUserId = userId;
    if (!foundUserId) {
      // 객체의 모든 키를 검사하여 ID 관련 필드 찾기
      const idKeys = Object.keys(user).filter(key =>
        key.toLowerCase().includes('id') ||
        key.toLowerCase().includes('member')
      );
      console.log('발견된 ID 관련 키들:', idKeys);

      // 가장 적절한 ID 필드 선택
      for (const key of idKeys) {
        if (user[key] && (typeof user[key] === 'string' || typeof user[key] === 'number')) {
          foundUserId = user[key];
          console.log(`ID 필드 발견: ${key} = ${foundUserId}`);
          break;
        }
      }
    }

    if (!foundUserId) {
      console.error('사용자 ID를 찾을 수 없습니다. 사용자 객체:', user);
      console.error('검사한 필드들:', {
        memberId: user.memberId,
        id: user.id,
        userId: user.userId,
        MEMBER_ID: user.MEMBER_ID,
        ID: user.ID
      });
      showMessage("사용자 정보에 문제가 있습니다. 다시 로그인해주세요.", "error");
      return false;
    }

    console.log('최종 선택된 사용자 ID:', foundUserId);

    const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('authToken');
    if (!authToken) {
      console.error('인증 토큰이 없습니다.');
      showMessage("인증이 만료되었습니다. 다시 로그인해주세요.", "error");
      return false;
    }

    // JWT 토큰 만료 검증
    try {
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.error('토큰이 만료되었습니다.');
          showMessage("세션이 만료되었습니다. 다시 로그인해주세요.", "error");
          // 만료된 토큰 제거
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('authToken');
          return false;
        }
      }
    } catch (error) {
      console.warn('토큰 검증 중 오류 발생:', error);
    }

    return true;
  };

  // 기존 관심사 데이터 로드
  const loadExistingInterests = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 기존 관심사를 로드하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // getUserId 헬퍼 함수 사용
    const userId = getUserId(user);
    if (!userId) {
      console.error('사용자 ID를 찾을 수 없습니다. 사용자 객체:', user);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting to load existing interests for MEMBER_ID:', userId);

      // 사용자 ID를 쿼리 파라미터로 통일하여 세 개의 API를 병렬로 호출
      const userIdParam = `?memberId=${userId}`;

      const [jobResponse, companyResponse, fieldResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/job-interest${userIdParam}`, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/ai-company${userIdParam}`, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/api/ai-field${userIdParam}`, {
          method: 'GET',
          headers: getHeaders(),
          credentials: 'include',
        })
      ]);

      console.log('API responses status:', {
        job: jobResponse.status,
        company: companyResponse.status,
        field: fieldResponse.status
      });

      // 직업 정보 응답 처리
      if (jobResponse.ok) {
        const contentType = jobResponse.headers.get('content-type');
        console.log('Job response content-type:', contentType);

        if (contentType && contentType.includes('application/json')) {
          try {
            const jobData = await jobResponse.json();
            console.log('Job data received:', jobData);
            if (jobData && jobData.interest) {
              setSelectedInterest(jobData.interest);
              console.log('Set selected interest:', jobData.interest);
            }
          } catch (jsonError) {
            console.error('Failed to parse job response as JSON:', jsonError);
          }
        } else {
          const textResponse = await jobResponse.text();
          console.warn('직업 정보 API가 JSON이 아닌 응답을 반환했습니다:', textResponse.substring(0, 200) + '...');
        }
      } else if (jobResponse.status === 404) {
        console.log('직업 정보가 아직 설정되지 않았습니다 (404)');
      } else {
        console.warn('직업 정보 로드 실패:', jobResponse.status, jobResponse.statusText);
      }

      // AI기업 정보 응답 처리
      if (companyResponse.ok) {
        const contentType = companyResponse.headers.get('content-type');
        console.log('Company response content-type:', contentType);

        if (contentType && contentType.includes('application/json')) {
          try {
            const companyData = await companyResponse.json();
            console.log('Company data received:', companyData);
            if (companyData && companyData.aiCompany) {
              setSelectedCompany(companyData.aiCompany);
              console.log('Set selected company:', companyData.aiCompany);
            }
          } catch (jsonError) {
            console.error('Failed to parse company response as JSON:', jsonError);
          }
        } else {
          const textResponse = await companyResponse.text();
          console.warn('AI기업 정보 API가 JSON이 아닌 응답을 반환했습니다:', textResponse.substring(0, 200) + '...');
        }
      } else if (companyResponse.status === 404) {
        console.log('AI기업 정보가 아직 설정되지 않았습니다 (404)');
      } else {
        console.warn('AI기업 정보 로드 실패:', companyResponse.status, companyResponse.statusText);
      }

      // AI분야 정보 응답 처리
      if (fieldResponse.ok) {
        const contentType = fieldResponse.headers.get('content-type');
        console.log('Field response content-type:', contentType);

        if (contentType && contentType.includes('application/json')) {
          try {
            const fieldData = await fieldResponse.json();
            console.log('Field data received:', fieldData);
            if (fieldData && fieldData.aiField) {
              setSelectedField(fieldData.aiField);
              console.log('Set selected field:', fieldData.aiField);
            }
          } catch (jsonError) {
            console.error('Failed to parse field response as JSON:', jsonError);
          }
        } else {
          const textResponse = await fieldResponse.text();
          console.warn('AI분야 정보 API가 JSON이 아닌 응답을 반환했습니다:', textResponse.substring(0, 200) + '...');
        }
      } else if (fieldResponse.status === 404) {
        console.log('AI분야 정보가 아직 설정되지 않았습니다 (404)');
      } else {
        console.warn('AI분야 정보 로드 실패:', fieldResponse.status, fieldResponse.statusText);
      }

    } catch (error) {
      console.error("기존 관심사 로드 오류:", error);
      // 네트워크 오류 등의 경우만 사용자에게 메시지 표시
      if (error instanceof TypeError && error.message.includes('fetch')) {
        showMessage("서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.", "error");
      }
    } finally {
      setIsLoading(false);
      console.log('Finished loading existing interests');
    }
  };

  // 컴포넌트 마운트 시 기존 관심사 로드
  useEffect(() => {
    if (user) {
      loadExistingInterests();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // 직업 선택 처리
  const handleInterestChange = (value: string) => {
    setSelectedInterest(value);
  };

  // AI기업 선택 처리
  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
  };

  // AI분야 선택 처리
  const handleFieldChange = (value: string) => {
    setSelectedField(value);
  };

  // 메시지 표시
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // 저장 처리 - Spring Boot API 호출
  const handleSave = async () => {
    if (!(selectedInterest && selectedCompany && selectedField)) {
      showMessage("모든 항목을 선택해주세요.", "error");
      return;
    }

    // 세션 유효성 검증
    if (!validateUserSession()) {
      return;
    }

    // getUserId 헬퍼 함수를 사용하여 사용자 ID 확인
    const userId = getUserId(user);
    if (!userId) {
      console.error('사용자 ID를 찾을 수 없습니다. 저장을 중단합니다.');
      showMessage("사용자 정보에 문제가 있습니다. 다시 로그인해주세요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("=== 관심사 저장 프로세스 시작 ===");
      console.log("User session info:", {
        memberId: user.memberId,
        userId: userId,
        userEmail: user.email,
        userName: user.name,
        hasToken: !!localStorage.getItem('auth_token'),
        userObject: user
      });
      console.log("Selected interests:", {
        interest: selectedInterest,
        company: selectedCompany,
        field: selectedField
      });

      // 세 개의 API를 순차적으로 호출하여 각각의 테이블에 저장 (MEMBER_ID 우선 사용)
      const jobResponse = await fetch(`${API_BASE_URL}/api/job-interest`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          interest: selectedInterest,
          memberId: userId.toString() // getUserId로 얻은 ID 사용
        }),
      });

      const companyResponse = await fetch(`${API_BASE_URL}/api/ai-company`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          aiCompany: selectedCompany,
          memberId: userId.toString() // getUserId로 얻은 ID 사용
        }),
      });

      const fieldResponse = await fetch(`${API_BASE_URL}/api/ai-field`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          aiField: selectedField,
          memberId: userId.toString() // getUserId로 얻은 ID 사용
        }),
      });

      console.log("API responses:", {
        job: jobResponse.status,
        company: companyResponse.status,
        field: fieldResponse.status
      });

      // 모든 API 호출이 성공했는지 확인
      if (jobResponse.ok && companyResponse.ok && fieldResponse.ok) {
        // 부모 컴포넌트에 업데이트 알림
        if (onUpdateInterests) {
          onUpdateInterests([selectedInterest, selectedCompany, selectedField]);
        }

        showMessage("선택한 정보가 MEMBER_ID를 통해 MariaDB 데이터베이스에 성공적으로 저장되었습니다!", "success");
      } else {
        // 실패한 API 응답 내용 확인
        const errors = [];
        if (!jobResponse.ok) {
          const jobError = await jobResponse.text();
          errors.push(`직업 정보 저장 실패 (${jobResponse.status}): ${jobError}`);
        }
        if (!companyResponse.ok) {
          const companyError = await companyResponse.text();
          errors.push(`AI기업 정보 저장 실패 (${companyResponse.status}): ${companyError}`);
        }
        if (!fieldResponse.ok) {
          const fieldError = await fieldResponse.text();
          errors.push(`AI분야 정보 저장 실패 (${fieldResponse.status}): ${fieldError}`);
        }

        console.error("저장 실패 상세:", errors);
        showMessage("일부 저장에 실패했습니다. 개발자 콘솔을 확인해주세요.", "error");
      }

    } catch (error) {
      console.error("저장 오류:", error);
      showMessage("저장 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 메인페이지로 이동
  const handleGoMain = () => {
    onBack();
  };

  const canSave = selectedInterest && selectedCompany && selectedField;

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">관심사 설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* 사용자 정보 섹션 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">로그인 사용자 정보</h3>
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
                {user?.name || user?.username || '이름 정보 없음'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium text-blue-700 mr-2">상태:</span>
              <span className="text-green-600 font-medium">
                ✓ 로그인됨 (MEMBER 테이블)
              </span>
            </div>
            {/* 세션 정보 표시 */}
            <div className="col-span-full mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
              <div className="text-green-700 font-medium mb-1">세션 정보:</div>
              <div className="text-green-600">
                토큰: {localStorage.getItem('auth_token') ? '✓ 저장됨' : '✗ 없음'} |
                사용자 정보: {localStorage.getItem('auth_user') ? '✓ 저장됨' : '✗ 없음'}
              </div>
              <div className="text-green-600 mt-1">
                현재 MEMBER_ID: <span className="font-mono font-bold">{user?.memberId || user?.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 직업 선택 */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">직업 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {JOB_INTERESTS.map((job) => {
            const isSelected = selectedInterest === job.value;
            return (
              <div
                key={job.id}
                onClick={() => handleInterestChange(job.value)}
                className={`
                  flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  id={job.id}
                  checked={isSelected}
                  onChange={() => handleInterestChange(job.value)}
                  className="mr-3 transform scale-120"
                />
                <label
                  htmlFor={job.id}
                  className="cursor-pointer font-medium text-base"
                >
                  {job.label}
                </label>
              </div>
            );
          })}
        </div>

        {/* AI기업 선택 */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8 mt-10">관심 있는 AI기업 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {AI_COMPANIES.map((company) => {
            const isSelected = selectedCompany === company.value;
            return (
              <div
                key={company.id}
                onClick={() => handleCompanyChange(company.value)}
                className={`
                  flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  id={company.id}
                  checked={isSelected}
                  onChange={() => handleCompanyChange(company.value)}
                  className="mr-3 transform scale-120"
                />
                <label
                  htmlFor={company.id}
                  className="cursor-pointer font-medium text-base"
                >
                  {company.label}
                </label>
              </div>
            );
          })}
        </div>

        {/* AI분야 선택 */}
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-8 mt-10">관심 있는 분야 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {AI_FIELDS.map((field) => {
            const isSelected = selectedField === field.value;
            return (
              <div
                key={field.id}
                onClick={() => handleFieldChange(field.value)}
                className={`
                  flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }
                `}
              >
                <input
                  type="checkbox"
                  id={field.id}
                  checked={isSelected}
                  onChange={() => handleFieldChange(field.value)}
                  className="mr-3 transform scale-120"
                />
                <label 
                  htmlFor={field.id}
                  className="cursor-pointer font-medium text-base"
                >
                  {field.label}
                </label>
              </div>
            );
          })}
        </div>

        {/* 버튼 그룹 */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={!canSave || isSubmitting}
            className={`
              flex-1 py-3 text-base font-bold rounded-lg transition-colors
              ${!canSave 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                DB에 저장 중...
              </>
            ) : (
              "데이터베이스에 저장"
            )}
          </Button>
          <Button
            onClick={handleGoMain}
            className="flex-1 py-3 text-base font-bold bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            메인페이지로 이동
          </Button>
        </div>

        {/* 메시지 */}
        {message && (
          <div
            className={`
              mt-4 p-3 rounded border text-center
              ${message.type === 'success' 
                ? 'bg-green-100 border-green-300 text-green-800' 
                : 'bg-red-100 border-red-300 text-red-800'
              }
            `}
          >
            {message.text}
          </div>
        )}

        {/* 개발자 정보 */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          💾 MariaDB에 실시간으로 저장됩니다
        </div>
      </div>
    </div>
  );
}
