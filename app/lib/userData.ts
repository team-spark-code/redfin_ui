// 공통 사용자 데이터 저장소
// 실제 환경에서는 데이터베이스를 사용해야 함

export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  phone?: string;
  zipCode?: string;
  address?: string;
  detailAddress?: string;
  bio?: string;
  updatedAt?: string;
}

// 임시 사용자 데이터베이스 (메모리)
let users: User[] = [
  {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    password: "password", // 임시로 평문 비밀번호 사용
  },
  {
    id: 2,
    email: "dz1@na.com",
    name: "DZ User",
    password: "password123",
  },
];

export const getUsersDatabase = () => users;

export const findUserByEmail = (email: string) => {
  return users.find(u => u.email === email);
};

export const findUserById = (id: number) => {
  return users.find(u => u.id === id);
};

export const updateUser = (userId: number, userData: Partial<User>) => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return null;
  }

  users[userIndex] = {
    ...users[userIndex],
    ...userData,
    updatedAt: new Date().toISOString()
  };

  return users[userIndex];
};

export const createUser = (userData: Omit<User, 'id'>) => {
  const newId = Math.max(...users.map(u => u.id), 0) + 1;
  const newUser: User = {
    id: newId,
    ...userData,
    updatedAt: new Date().toISOString()
  };

  users.push(newUser);
  return newUser;
};
