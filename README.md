# KubeLingoAssist

쿠버네티스 문서 번역 작업을 위한 VS Code 확장 프로그램입니다.

> 📋 **기능 상세**: [FEATURES.md](./docs/FEATURES.md)에서 전체 기능 목록을 확인하세요.

## 🚀 빠른 시작

### GitHub Releases에서 설치 (권장)
1. [Releases 페이지](https://github.com/eundms/k8s-translation-helper/releases)에서 최신 VSIX 파일 다운로드
2. VS Code에서 설치:
   ```bash
   code --install-extension kubelingoassist-x.x.x.vsix
   ```
3. VS Code 재시작 후 Activity Bar에서 🌐 아이콘 확인

### 기본 사용법
1. **번역 파일 열기**: `Cmd+Shift+T` (Mac) / `Ctrl+Shift+T` (Windows/Linux)
2. **스크롤 동기화**: `Cmd+Shift+S` (Mac) / `Ctrl+Shift+S` (Windows/Linux)
3. **Activity Bar 패널**: 🌐 아이콘 클릭하여 제어 패널 사용

## 🛠️ 개발 환경 설정

### 전제 조건
- Node.js 18+
- VS Code 1.74.0+
- Git

### 저장소 클론 및 설정
```bash
git clone https://github.com/eundms/k8s-translation-helper.git
cd k8s-translation-helper

# 의존성 설치
npm install
cd ui && npm install && cd ..

# 빌드
npm run compile
```

### 개발 및 테스트
```bash
# 개발 모드 (자동 재컴파일)
npx tsc -watch -p ./

# VS Code Extension Development Host에서 테스트
# F5 키 누르기

# 테스트 실행
npm test

# VSIX 패키지 생성
npm run package
```

## 🏗️ 프로젝트 구조

```
src/                       # VS Code 확장 프로그램 백엔드
├── extension.ts           # 확장 프로그램 진입점
├── commands.ts            # VS Code 명령어 처리
├── scroll-sync.ts         # 스크롤 동기화 로직
├── status-bar.ts          # 상태바 관리
├── translation-utils.ts   # 번역 파일 유틸리티
├── webview-providers.ts   # 웹뷰 프로바이더 관리
├── validator/
│   └── link.ts           # 링크 검증 로직
└── test/                 # 테스트 파일
    ├── runTest.ts
    └── suite/
        ├── index.ts
        └── extension.test.ts

ui/                        # React 프론트엔드
├── src/
│   ├── App.tsx           # 메인 애플리케이션
│   ├── App.css           # 스타일시트
│   ├── main.tsx          # React 엔트리 포인트
│   ├── components/       # React 컴포넌트
│   │   ├── index.ts      # 컴포넌트 barrel 익스포트
│   │   ├── chat/         # AI 채팅 관련 컴포넌트
│   │   │   ├── index.ts
│   │   │   ├── AIChat.tsx
│   │   │   ├── ChatHistory.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── layout/       # 레이아웃 컴포넌트
│   │   │   ├── index.ts
│   │   │   ├── AIChatSection.tsx
│   │   │   ├── ControlSection.tsx
│   │   │   └── TranslationView.tsx
│   │   └── ui/           # 재사용 가능한 UI 컴포넌트
│   │       ├── index.ts
│   │       ├── ControlButton.tsx
│   │       ├── StatusBar.tsx
│   │       └── TranslationGuideTooltip.tsx
│   ├── hooks/            # React 커스텀 훅
│   │   └── useVSCodeAPI.ts
│   └── types/            # TypeScript 타입 정의
│       └── vscode.ts
├── package.json          # UI 의존성 및 스크립트
├── vite.config.ts        # Vite 빌드 설정
└── tsconfig.json         # TypeScript 설정

docs/                      # 문서
├── FEATURES.md           # 전체 기능 목록
└── CHANGELOG.md          # 버전별 변경사항

.github/                   # GitHub 워크플로우
├── workflows/            # CI/CD 파이프라인
└── ...

.vscode/                   # VS Code 설정
├── launch.json           # 디버깅 설정
└── ...
```

## 🧪 테스트

### 자동 테스트
```bash
# 단위 테스트 실행
npm test

# 특정 테스트 실행
npm test -- --grep "translation-utils"
```

### 수동 테스트
[FEATURES.md](./docs/FEATURES.md)의 테스트 체크리스트를 참고하여 수동 테스트를 진행하세요.

## 🚀 배포

### GitHub Releases 배포 (자동)
1. `CHANGELOG.md` 업데이트
2. `package.json` 버전 업데이트
3. 태그 생성 및 푸시:
   ```bash
   npm version patch  # 또는 minor, major
   git push origin main --tags
   ```
4. GitHub Actions가 자동으로 VSIX 빌드 및 릴리즈 생성

### 수동 배포
```bash
# VSIX 패키지 생성
npm run package

# 수동으로 GitHub Releases에 업로드
```

## 🤝 기여하기

### 버그 리포트 & 기능 요청
- [GitHub Issues](https://github.com/eundms/k8s-translation-helper/issues)에서 버그나 기능 요청을 제출해주세요.
- 가능하면 재현 단계와 환경 정보를 포함해주세요.

### Pull Request
1. Fork 후 기능 브랜치 생성
2. 변경사항 개발 및 테스트
3. `CHANGELOG.md` 업데이트
4. Pull Request 생성

### 개발 가이드라인
- TypeScript 사용
- 기존 코드 스타일 유지
- 테스트 추가 (가능한 경우)
- 커밋 메시지는 명확하게 작성

## 📝 라이선스

MIT

## 🔗 관련 링크

- [쿠버네티스 한글화 프로젝트](https://kubernetes.io/ko/docs/contribute/localization_ko/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Repository](https://github.com/eundms/k8s-translation-helper)

## ❓ 문의사항

문제가 발생하거나 궁금한 점이 있으시면 [Issues](https://github.com/eundms/k8s-translation-helper/issues)에서 문의해주세요.