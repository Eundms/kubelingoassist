/**
 * AI 번역 요청을 위한 인터페이스
 */
export interface AITranslationRequest {
  /** 번역할 원본 텍스트 */
  sourceText: string;
  /** 번역 대상 언어 (예: 'Korean', 'Japanese') */
  targetLanguage: string;
  /** 번역에 도움이 되는 추가 컨텍스트 정보 (선택사항) */
  context?: string;
  /** 소스 언어 (자동 감지가 기본값) */
  sourceLanguage?: string;
}

/**
 * AI 번역 응답을 위한 인터페이스
 */
export interface AITranslationResponse {
  /** 번역된 텍스트 */
  translatedText: string;
  /** 번역의 신뢰도 (0-1 범위, 선택사항) */
  confidence?: number;
  /** 대안 번역 제안들 (선택사항) */
  suggestions?: string[];
  /** 사용된 모델 정보 */
  usedModel?: string;
  /** 사용된 토큰 수 */
  tokensUsed?: number;
}

/**
 * AI 제공업체 정보
 */
export interface AIProviderInfo {
  /** 제공업체 식별자 */
  identifier: string;
  /** 표시명 */
  label: string;
  /** 설명 */
  description: string;
  /** 아이콘 (선택사항) */
  icon?: string;
}

/**
 * API 키 상태 정보
 */
export interface APIKeyStatus {
  /** API 키 설정 여부 */
  configured: boolean;
  /** API 키 유효성 */
  valid?: boolean;
  /** 마지막 확인 시각 */
  lastChecked?: Date;
  /** 에러 메시지 (있는 경우) */
  error?: string;
}

/**
 * 번역 통계 정보
 */
export interface TranslationStats {
  /** 총 번역 요청 수 */
  totalTranslations: number;
  /** 성공한 번역 수 */
  successfulTranslations: number;
  /** 실패한 번역 수 */
  failedTranslations: number;
  /** 총 사용 토큰 수 */
  totalTokensUsed: number;
  /** 마지막 번역 시각 */
  lastTranslation?: Date;
}

/**
 * AI 서비스 에러 타입
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

/**
 * API 키 에러
 */
export class APIKeyError extends AIServiceError {
  constructor(message: string, provider: string) {
    super(message, 'API_KEY_ERROR', provider);
    this.name = 'APIKeyError';
  }
}

/**
 * 번역 에러
 */
export class TranslationError extends AIServiceError {
  constructor(message: string, provider: string, originalError?: any) {
    super(message, 'TRANSLATION_ERROR', provider, originalError);
    this.name = 'TranslationError';
  }
}

/**
 * 설정 에러
 */
export class ConfigurationError extends AIServiceError {
  constructor(message: string) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
  }
}