"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { InterestsSettingsPage } from "../components/InterestsSettingsPage";
import { useEffect } from "react";

export default function InterestsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleBack = () => {
    router.back();
  };

  const handleUpdateInterests = async (interests: string[]) => {
    console.log("관심사 업데이트 (MEMBER_ID 사용):", interests);
    console.log("사용자 정보:", {
      memberId: user?.memberId,
      id: user?.id,
      email: user?.email
    });

    // 추가 로직이 필요한 경우 여기에 구현
    // 예: 상태 업데이트, 다른 컴포넌트에 알림 등

    // MEMBER_ID를 통한 관심사 저장 완료 알림
    if (user?.memberId || user?.id) {
      console.log(`MEMBER_ID ${user.memberId || user.id}를 통해 관심사가 성공적으로 업데이트되었습니다.`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <InterestsSettingsPage
      onBack={handleBack}
      user={user}
      onUpdateInterests={handleUpdateInterests}
    />
  );
}
