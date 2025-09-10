"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: number;
  memberId: number; // MEMBER_ID 필수 필드로 변경
  email: string;
  name: string;
  username?: string;
  phone?: string;
  zipcode?: string; // zipCode에서 zipcode로 변경
  address?: string;
  detailAddress?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUserFromMember: () => Promise<void>; // MEMBER 테이블에서 사용자 정보 새로고침
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// MEMBER 테이블에서 사용자 정보 조회 함수
const fetchUserFromMember = async (token: string): Promise<User | null> => {
  try {
    console.log('MEMBER 테이블에서 사용자 정보 조회 시작');

    const response = await fetch('/api/users/member', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      console.error('MEMBER 테이블 조회 실패:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('MEMBER 테이블에서 사용자 정보 조회 성공:', data);

    if (data.success && data.user) {
      return data.user;
    }

    return null;
  } catch (error) {
    console.error('MEMBER 테이블 조회 중 오류:', error);
    return null;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드에서만 실행되도록 보장
  useEffect(() => {
    setIsClient(true);
  }, []);

  // MEMBER 테이블에서 사용자 정보 새로고침
  const refreshUserFromMember = async () => {
    if (!token) {
      console.log('토큰이 없어서 MEMBER 테이블 조회를 건너뜁니다.');
      return;
    }

    console.log('MEMBER 테이블에서 사용자 정보 새로고침 시작');
    const freshUser = await fetchUserFromMember(token);

    if (freshUser) {
      console.log('MEMBER 테이블에서 최신 사용자 정보 업데이트:', freshUser);
      setUser(freshUser);
      if (isClient) {
        localStorage.setItem('auth_user', JSON.stringify(freshUser));
      }
    } else {
      console.warn('MEMBER 테이블에서 사용자 정보를 가져올 수 없습니다.');
    }
  };

  // 초기 로드 시 저장된 토큰과 사용자 정보 복원 및 MEMBER 테이블에서 최신 정보 조회
  useEffect(() => {
    if (!isClient) return;

    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken) {
          setToken(savedToken);

          // 저장된 사용자 정보가 있으면 임시로 설정
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
          }

          // MEMBER 테이블에서 최신 사용자 정보 조회
          console.log('MEMBER 테이블에서 최신 사용자 정보 조회 시도');
          const freshUser = await fetchUserFromMember(savedToken);

          if (freshUser) {
            console.log('MEMBER 테이블에서 최신 사용자 정보 로드 성공');
            setUser(freshUser);
            localStorage.setItem('auth_user', JSON.stringify(freshUser));
          } else if (!savedUser) {
            // 저장된 사용자 정보도 없고 MEMBER 테이블 조회도 실패한 경우
            console.warn('사용자 정보를 로드할 수 없어 로그아웃 처리');
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isClient]);

  const login = async (newToken: string, newUser: User) => {
    console.log('로그인 처리 시작, MEMBER 테이블에서 최신 정보 조회');

    setToken(newToken);

    // 임시로 로그인 시 받은 사용자 정보 설정
    setUser(newUser);

    if (isClient) {
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
    }

    // MEMBER 테이블에서 최신 사용자 정보 조회하여 업데이트
    try {
      const freshUser = await fetchUserFromMember(newToken);
      if (freshUser) {
        console.log('로그인 후 MEMBER 테이블에서 최신 정보 업데이트 완료');
        setUser(freshUser);
        if (isClient) {
          localStorage.setItem('auth_user', JSON.stringify(freshUser));
        }
      }
    } catch (error) {
      console.warn('로그인 후 MEMBER 테이블 조회 실패, 기본 사용자 정보 유지:', error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (isClient) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (isClient) {
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!(user && token), // 사용자 정보와 토큰 모두 있어야 인증된 상태
    isLoading,
    login,
    logout,
    updateUser,
    refreshUserFromMember,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
