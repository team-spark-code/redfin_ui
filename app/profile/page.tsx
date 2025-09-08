"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { ProfileEditPage } from "../components/ProfileEditPage";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
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

  const handleUpdateProfile = (updatedUser: any) => {
    console.log("프로필 업데이트:", updatedUser);
    // AuthContext의 updateUser 함수 호출
    if (updateUser) {
      updateUser(updatedUser);
      console.log("AuthContext 업데이트 완료");
    } else {
      console.warn("updateUser 함수가 정의되지 않았습니다.");
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
    <ProfileEditPage
      user={user}
      onBack={handleBack}
      onUpdateProfile={handleUpdateProfile}
    />
  );
}
