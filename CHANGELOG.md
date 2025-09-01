# Changelog

All notable changes to the "k8s-translation-helper" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2025-09-01
### Added
- AI 채팅 인터페이스 구현 (AIChat, ChatHistory, ChatInput, ChatMessage 컴포넌트)
- 번역 용어 참조 순서 툴팁 추가 (TranslationGuideTooltip)
- 컴포넌트 구조 개선 (chat, ui, layout 폴더로 체계적 분리)
- 레이아웃 컴포넌트 추가 (AIChatSection, ControlSection, TranslationView)
- barrel export 패턴 적용 (각 폴더별 index.ts)

### Fixed
- 동기화 토글 UI 상태가 올바르게 갱신되지 않는 문제 수정
- 스크롤 동기화 지연 및 정확도 개선 (절대 라인 번호 기준으로 동작하도록 변경)

### Changed
- WebView 상태 관리를 postMessage 방식으로 전환
- React 컴포넌트 세분화 및 폴더 구조 재정리:
  - `chat/`: AI 채팅 관련 컴포넌트
  - `layout/`: 메인 레이아웃 컴포넌트  
  - `ui/`: 재사용 가능한 UI 컴포넌트
- 프로젝트 구조 문서 업데이트 (README.md, FEATURES.md)

## [0.0.3] - 2025-09-01

### Added
- 포괄적인 JSDoc 문서화 추가

### Fixed
- 멀티 프로젝트 워크스페이스에서 리뷰 모드 가능하도록 수정
- 함수 안정성 개선

## [Unreleased]

## [0.0.1] - 2025-08-30
### Added
- 번역 파일 자동 열기 (Split View)
- 스크롤 동기화 기능
- 링크 검증 (언어 코드 누락 감지)
- 번역 모드 토글
- 상태바 표시 (번역 모드, 동기화 상태)
- Activity Bar 웹뷰 패널

### Technical
- TypeScript 기반 구현
- React + Vite 웹뷰 UI 적용
- VS Code Extension API 활용
- 모듈별 구조 분리
