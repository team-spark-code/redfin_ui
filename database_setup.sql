-- MariaDB member 테이블 생성 및 테스트 데이터 삽입

-- 데이터베이스 생성 (존재하지 않는 경우)
CREATE DATABASE IF NOT EXISTS redfin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 사용
USE redfin;

-- member 테이블 생성 (기존 users 테이블 대신)
CREATE TABLE IF NOT EXISTS member (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  zip_code VARCHAR(10) NULL,
  address VARCHAR(500) NULL,
  detail_address VARCHAR(500) NULL,
  bio TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 테스트 사용자 데이터 삽입 (중복 시 무시)
INSERT IGNORE INTO member (email, name, password, created_at, updated_at) VALUES
('test@example.com', 'Test User', 'password', NOW(), NOW()),
('dz1@na.com', 'DZ User', 'password123', NOW(), NOW()),
('admin@example.com', 'Admin User', 'admin123', NOW(), NOW());

-- 삽입된 데이터 확인
SELECT id, email, name, created_at FROM member;

-- 테이블 구조 확인
DESCRIBE member;
