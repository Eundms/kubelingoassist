import { SupportedLanguage, UITranslationResource } from './types';
import { en } from './resources/en';
import { ko } from './resources/ko';

class UIi18n {
  private currentLanguage: SupportedLanguage = 'ko';
  private resources: Record<SupportedLanguage, UITranslationResource> = {
    'en': en,
    'ko': ko,
  };

  private constructor() {
    this.initializeLanguage();
  }

  private static instance: UIi18n;

  public static getInstance(): UIi18n {
    if (!UIi18n.instance) {
      UIi18n.instance = new UIi18n();
    }
    return UIi18n.instance;
  }

  private initializeLanguage(): void {
    // Try to get language from browser or VS Code
    const browserLang = navigator.language || 'en';
    const baseLang = browserLang.split('-')[0];
    
    if (this.isSupportedLanguage(baseLang)) {
      this.currentLanguage = baseLang as SupportedLanguage;
    } else {
      this.currentLanguage = 'ko'; // Default to Korean
    }
  }

  private isSupportedLanguage(lang: string): lang is SupportedLanguage {
    return Object.keys(this.resources).includes(lang);
  }

  public getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
  }

  private getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
  }

  public t(key: string): string {
    const resource = this.resources[this.currentLanguage];
    let translation = this.getNestedValue(resource, key);
    
    // Fallback to English if translation not found
    if (translation === key && this.currentLanguage !== 'en') {
      translation = this.getNestedValue(this.resources.en, key);
    }
    
    return translation;
  }
}

export const uiI18n = UIi18n.getInstance();