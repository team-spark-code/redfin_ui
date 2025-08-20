# RedFin UI - AI News Frontend

AI RSS 뉴스 피드를 위한 Next.js 기반 프론트엔드 애플리케이션입니다.

## 📋 프로젝트 개요

- **프레임워크**: Next.js 14.2.31 (App Router)
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS v4
- **패키지 매니저**: pnpm
- **Node.js**: 22.18.0 LTS

## 🏗️ 프로젝트 구조

```
redfin_ui/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지 (AI 뉴스 피드)
│   ├── globals.css        # 전역 스타일
│   └── favicon.ico        # 파비콘
├── public/                # 정적 파일
├── package.json           # 프로젝트 설정
├── tsconfig.json          # TypeScript 설정
├── next.config.js         # Next.js 설정
├── postcss.config.mjs     # PostCSS 설정
└── eslint.config.mjs      # ESLint 설정
```

## 🚀 환경 설정

### Windows 환경 설정

#### 1. Node.js 설치

**방법 1: 공식 설치 프로그램 사용**
1. [Node.js 공식 사이트](https://nodejs.org/)에서 22.x LTS 버전 다운로드
2. 설치 프로그램 실행 및 설치 완료
3. PowerShell에서 버전 확인:
```powershell
node --version
npm --version
```

**방법 2: NVM for Windows 사용**
1. [nvm-windows](https://github.com/coreybutler/nvm-windows/releases)에서 최신 릴리스 다운로드
2. `nvm-setup.exe` 실행 및 설치
3. PowerShell에서 Node.js 설치:
```powershell
nvm install 22.0.0
nvm use 22.0.0
nvm alias default 22.0.0
```

#### 2. pnpm 설치

PowerShell에서 다음 명령어 실행:
```powershell
# corepack 활성화 (Node.js 16.13+ 기본 포함)
corepack enable

# pnpm 설치 및 활성화
corepack prepare pnpm@latest --activate

# 설치 확인
pnpm --version
```

#### 3. 프로젝트 설정

```powershell
# 프로젝트 디렉토리로 이동
cd D:\workspace\redfin_ui

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

### Linux/macOS 환경 설정

```bash
# NVM 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc

# Node.js 설치
nvm install 22.0.0
nvm alias default 22.0.0
nvm use 22.0.0

# pnpm 설치
corepack enable
corepack prepare pnpm@latest --activate

# 프로젝트 설정
cd ~/workspace/redfin_ui
pnpm install
pnpm dev
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행 (http://localhost:3000)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 검사
pnpm lint
```

## 🔧 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하여 다음 환경 변수를 설정하세요:

```env
# API 서버 URL (기본값: http://localhost:8000)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 📱 주요 기능

### AI 뉴스 피드
- 24개의 최신 AI 관련 뉴스 표시
- 소스, 발행일, 제목, 요약 정보 제공
- 태그 기반 분류
- 반응형 그리드 레이아웃

### API 연동
- 백엔드 API와 RESTful 통신
- 헬스체크 엔드포인트 제공
- 실시간 데이터 페칭

### UI/UX
- Tailwind CSS v4 기반 모던 디자인
- 다크모드 지원 (시스템 설정 기반)
- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 호버 효과 및 부드러운 전환

## 🎨 스타일링

### Tailwind CSS v4 설정
- PostCSS 기반 빌드 시스템
- 인라인 테마 설정
- CSS 변수를 통한 다크모드 지원

### 컴포넌트 스타일
```css
/* 전역 스타일 */
:root {
  --background: #ffffff;
  --foreground: #171717;
}

/* 다크모드 */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

## 🔍 TypeScript 설정

- **strict mode**: 활성화
- **target**: ES2017
- **module**: esnext
- **jsx**: preserve (Next.js 최적화)
- **paths**: `@/*` 별칭 설정

## 📦 의존성

### 핵심 의존성
- `next`: 14.2.31
- `react`: 18.3.1
- `react-dom`: 18.3.1

### 개발 의존성
- `typescript`: ^5
- `tailwindcss`: ^4
- `@tailwindcss/postcss`: ^4
- `eslint`: 8.57.0
- `eslint-config-next`: 14.2.31

## 🚀 배포

### Vercel 배포 (권장)
1. [Vercel](https://vercel.com) 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포 활성화

### 수동 배포
```bash
# 프로덕션 빌드
pnpm build

# 정적 파일 생성 (선택사항)
pnpm export

# 서버 실행
pnpm start
```

## 🔧 문제 해결

### 일반적인 문제

**1. Node.js 버전 오류**
```bash
# Node.js 버전 확인
node --version

# 올바른 버전으로 변경
nvm use 22.0.0
```

**2. pnpm 설치 실패**
```bash
# corepack 재활성화
corepack enable
corepack prepare pnpm@latest --activate
```

**3. 포트 충돌**
```bash
# 다른 포트로 실행
pnpm dev --port 3001
```

**4. API 연결 실패**
- 백엔드 서버가 실행 중인지 확인
- 환경 변수 `NEXT_PUBLIC_API_BASE_URL` 설정 확인
- CORS 설정 확인

## 📚 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Tailwind CSS v4 문서](https://tailwindcss.com/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [React 18 문서](https://react.dev/)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**개발팀**: RedFin Team  
**최종 업데이트**: 2025년 8월
