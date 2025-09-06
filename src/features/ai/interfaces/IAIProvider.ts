import { AITranslationRequest, AITranslationResponse } from '../types';

/**
 * AI 제공업체의 기본 인터페이스
 */
export interface IAIProvider {
  /**
   * 제공업체 이름
   */
  readonly name: string;

  /**
   * 제공업체 식별자
   */
  readonly identifier: string;

  /**
   * 텍스트 번역
   */
  translateText(request: AITranslationRequest, apiKey: string): Promise<AITranslationResponse>;

  /**
   * API 키 유효성 검사
   */
  validateApiKey(apiKey: string): Promise<boolean>;

  /**
   * 지원되는 모델 목록 반환
   */
  getSupportedModels(): string[];

  /**
   * 기본 설정값 반환
   */
  getDefaultConfig(): Partial<AIConfig>;
}

export interface AIConfig {
  provider: string;
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * AI 제공업체 관리를 위한 인터페이스
 */
export interface IAIProviderManager {
  /**
   * 제공업체 등록
   */
  registerProvider(provider: IAIProvider): void;

  /**
   * 제공업체 반환
   */
  getProvider(identifier: string): IAIProvider | null;

  /**
   * 모든 제공업체 목록 반환
   */
  getAllProviders(): IAIProvider[];

  /**
   * 제공업체 지원 여부 확인
   */
  isSupported(identifier: string): boolean;
}