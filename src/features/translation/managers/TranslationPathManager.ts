import * as vscode from 'vscode';
import * as path from 'path';
import { i18n } from '../../../core/i18n';

export interface LanguageOption {
  label: string;
  value: string;
}

export interface LineComparisonResult {
  originalLines: number;
  translationLines: number;
  isEqual: boolean;
  percentage: number;
}

export interface TranslationPathResult {
  originalPath: string;
  translationPath: string;
  isReverseTranslation: boolean; // 번역 -> 원본 방향인지
}

export class TranslationPathError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TranslationPathError';
  }
}

/**
 * 번역 경로 및 파일 관리를 담당하는 클래스
 */
export class TranslationPathManager {
  private readonly SUPPORTED_LANGUAGES: LanguageOption[] = [
    { label: '한국어 (ko)', value: 'ko' },
    { label: '日本語 (ja)', value: 'ja' },
    { label: '中文 (zh-cn)', value: 'zh-cn' },
    { label: '中文 (zh)', value: 'zh' },
    { label: 'Français (fr)', value: 'fr' },
    { label: 'Deutsch (de)', value: 'de' },
    { label: 'Español (es)', value: 'es' },
    { label: 'Italiano (it)', value: 'it' },
    { label: 'Português (pt-br)', value: 'pt-br' },
    { label: 'Русский (ru)', value: 'ru' },
    { label: 'Українська (uk)', value: 'uk' },
    { label: 'Polski (pl)', value: 'pl' },
    { label: 'हिन्दी (hi)', value: 'hi' },
    { label: 'Việt Nam (vi)', value: 'vi' },
    { label: 'Indonesia (id)', value: 'id' }
  ];

  private readonly LANGUAGE_NAMES: Record<string, string> = {
    'en': 'English',
    'ko': '한국어',
    'ja': '日本語',
    'zh-cn': '中文(简体)',
    'zh': '中文(繁体)',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'it': 'Italiano',
    'pt-br': 'Português',
    'ru': 'Русский',
    'uk': 'Українська',
    'pl': 'Polski',
    'hi': 'हिन्दी',
    'vi': 'Việt Nam',
    'id': 'Indonesia'
  };

  /**
   * 파일 경로에서 번역 경로를 생성합니다.
   * 영어 파일 → 번역 파일 또는 번역 파일 → 영어 파일
   */
  public async getTranslationPath(filePath: string): Promise<string | null> {
    if (!this.isValidFilePath(filePath)) {
      throw new TranslationPathError(
        i18n.t('translationPath.invalidPath'),
        'INVALID_PATH'
      );
    }

    const normalizedPath = this.normalizePath(filePath);
    
    if (!this.isKubernetesContentPath(normalizedPath)) {
      throw new TranslationPathError(
        i18n.t('translationPath.notContentPath'),
        'NOT_CONTENT_PATH'
      );
    }

    // 영어 파일에서 번역 파일로
    if (this.isEnglishPath(normalizedPath)) {
      return await this.convertEnglishToTranslation(normalizedPath);
    }

    // 번역 파일에서 영어 파일로
    const languageCode = this.extractLanguageCode(normalizedPath);
    if (languageCode && languageCode !== 'en') {
      return this.convertTranslationToEnglish(normalizedPath, languageCode);
    }

    throw new TranslationPathError(
      i18n.t('translationPath.unsupportedStructure'),
      'UNSUPPORTED_STRUCTURE'
    );
  }

  /**
   * 사용자에게 대상 언어 선택 UI 표시
   */
  public async selectTargetLanguage(): Promise<string | null> {
    const selected = await vscode.window.showQuickPick(this.SUPPORTED_LANGUAGES, {
      placeHolder: i18n.t('translationPath.selectLanguage'),
      matchOnDescription: true
    });
    
    return selected?.value || null;
  }

  /**
   * 파일 경로에서 언어 코드 추출
   */
  public extractLanguageCode(filePath: string): string | null {
    const langMatch = filePath.match(/\/content\/([^/]+)\//);
    return langMatch ? langMatch[1] : null;
  }

  /**
   * 언어 코드에서 언어명 반환
   */
  public getLanguageName(languageCode: string): string {
    return this.LANGUAGE_NAMES[languageCode] || languageCode.toUpperCase();
  }

  /**
   * 지원되는 언어 목록 반환
   */
  public getSupportedLanguages(): LanguageOption[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * 언어 코드가 지원되는지 확인
   */
  public isSupported(languageCode: string): boolean {
    return this.SUPPORTED_LANGUAGES.some(lang => lang.value === languageCode);
  }

  private isValidFilePath(filePath: string): boolean {
    return Boolean(filePath && typeof filePath === 'string' && filePath.trim());
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/\\\\/g, '/');
  }

  private isKubernetesContentPath(normalizedPath: string): boolean {
    return normalizedPath.includes('/content/');
  }

  private isEnglishPath(normalizedPath: string): boolean {
    return normalizedPath.includes('/content/en/');
  }

  private async convertEnglishToTranslation(normalizedPath: string): Promise<string | null> {
    const targetLanguage = await this.selectTargetLanguage();
    if (!targetLanguage) {
      return null;
    }
    
    return normalizedPath.replace('/content/en/', `/content/${targetLanguage}/`);
  }

  private convertTranslationToEnglish(normalizedPath: string, languageCode: string): string {
    if (!this.isSupported(languageCode)) {
      throw new TranslationPathError(
        i18n.t('translationPath.unsupportedLanguage', languageCode),
        'UNSUPPORTED_LANGUAGE'
      );
    }
    
    return normalizedPath.replace(`/content/${languageCode}/`, '/content/en/');
  }
}