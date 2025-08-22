# 기능 목록

## 🎯 핵심 기능

### 1. 번역 파일 자동 열기
- **설명**: 영어 원본 파일에서 해당하는 한국어 번역 파일을 Split View로 자동 열기
- **트리거**: "번역 파일 열기" 버튼 또는 `kubelingoassist.openTranslation` 명령
- **지원 경로**: `/content/en/docs/` → `/content/ko/docs/`
- **상태**: ✅ 구현 완료

### 2. 스크롤 동기화
- **설명**: 원본과 번역 파일의 스크롤을 절대 라인 번호 기준으로 동기화
- **트리거**: "동기화 ON/OFF" 토글 버튼
- **동작**: 한쪽 파일 스크롤 시 다른 파일도 같은 라인으로 이동
- **필터링**: `/content/` 경로 파일만 대상
- **상태**: ✅ 구현 완료 (v0.0.2에서 개선)

### 3. 링크 검증
- **설명**: 한국어 번역 파일에서 언어 코드가 누락된 링크 감지
- **패턴**: `[텍스트](/docs/...)` → `[텍스트](/ko/docs/...)` 권장
- **표시**: VS Code Problems 패널에 경고로 표시
- **대상**: `/content/ko/docs/` 파일만
- **상태**: ✅ 구현 완료

### 4. 상태 관리
- **번역 모드**: 번역 작업 모드 활성화/비활성화
- **동기화 상태**: 스크롤 동기화 ON/OFF 상태
- **상태바 표시**: 현재 모드와 상태를 상태바에 표시
- **언어 정보**: 번역 중인 파일의 언어 코드 표시
- **상태**: ✅ 구현 완료

### 5. Activity Bar 패널
- **웹뷰 UI**: React 기반 제어 패널
- **컨트롤**: 번역 파일 열기, 동기화 토글 버튼
- **AI 채팅**: 번역 도움을 위한 AI 채팅 인터페이스
- **번역 가이드**: 용어 참조 순서 툴팁 제공
- **상태**: ✅ 구현 완료

## 🔧 기술적 구현 세부사항

### 프로젝트 아키텍처

#### 백엔드 (VS Code Extension)
- **`src/extension.ts`**: 확장 프로그램 메인 진입점 및 활성화 관리
- **`src/commands.ts`**: VS Code 명령어 핸들러 (번역 파일 열기, 스크롤 동기화)
- **`src/scroll-sync.ts`**: 스크롤 동기화 로직 및 이벤트 처리
- **`src/status-bar.ts`**: 상태바 아이템 관리 및 상태 표시
- **`src/translation-utils.ts`**: 번역 파일 경로 변환 및 파일 조작 유틸리티
- **`src/webview-providers.ts`**: React 웹뷰 패널 프로바이더 관리
- **`src/validator/link.ts`**: 링크 검증 및 진단 메시지 생성

#### 프론트엔드 (React UI)
- **컴포넌트 구조**:
  - `chat/`: AI 채팅 관련 컴포넌트 (AIChat, ChatHistory, ChatInput, ChatMessage)
  - `layout/`: 메인 레이아웃 컴포넌트 (AIChatSection, ControlSection, TranslationView)
  - `ui/`: 재사용 가능한 UI 컴포넌트 (ControlButton, StatusBar, TranslationGuideTooltip)
- **상태 관리**: VS Code API를 통한 postMessage 방식으로 백엔드와 통신
- **빌드**: Vite를 사용한 React 애플리케이션 빌드 및 번들링

### 개발 환경
- **TypeScript**: 전체 프로젝트에 타입 안전성 적용
- **React**: 웹뷰 UI 개발 프레임워크
- **Vite**: 프론트엔드 빌드 도구
- **VS Code Extension API**: 확장 프로그램 기능 구현
