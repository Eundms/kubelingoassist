/**
 * 지원되는 언어 코드를 나타내는 타입입니다.
 */
export type SupportedLanguage = 'en' | 'ko' | 'ja' | 'zh-cn' | 'zh' | 'fr' | 'de' | 'es';

/**
 * 번역 키 구조를 정의하는 인터페이스입니다.
 */
export interface TranslationKeys {
  // Common messages
  common: {
    ok: string;
    cancel: string;
    create: string;
    overwrite: string;
    loading: string;
    error: string;
    success: string;
  };

  // Commands and actions
  commands: {
    openTranslationFile: string;
    openReviewFile: string;
    toggleSyncScroll: string;
    toggleKubelingo: string;
    changeMode: string;
    configureAI: string;
    showAPIKeyStatus: string;
    translateSelected: string;
  };

  // Messages
  messages: {
    kubelingoDisabled: string;
    enableKubelingoFirst: string;
    noActiveFile: string;
    cannotFindTranslationPath: string;
    splitViewOpened: string;
    syncScrollEnabled: string;
    syncScrollDisabled: string;
    kubelingoEnabled: string;
    kubelingoDisabledMsg: string;
    reviewModeEnabled: string;
    translationModeEnabled: string;
    translationFileNotExists: string;
    createNewFile: string;
    fileAlreadyExists: string;
    fileCopied: string;
    fileCopyFailed: string;
    originalFileNotFound: string;
    gitUtilitiesNotAvailable: string;
    noRecentCommits: string;
    noTranslationFilesFound: string;
    openedForReview: string;
    failedToOpenReviewMode: string;
    notKubernetesRepo: string;
    kubernetesRepoOnly: string;
  };

  // UI Labels
  ui: {
    selectTargetLanguage: string;
    selectFileToReview: string;
    fileStatus: {
      modified: string;
      added: string;
      other: string;
    };
    fromCommit: string;
  };

  // File paths and extensions
  paths: {
    contentDirectory: string;
    englishContent: string;
    translationContent: string;
  };
}

/**
 * 언어별 번역 리소스를 나타내는 타입입니다.
 */
export type TranslationResource = TranslationKeys;

/**
 * 언어 정보를 나타내는 인터페이스입니다.
 */
export interface LanguageInfo {
    label: string;
    value: string;
}

/**
 * 지원되는 언어 코드와 언어명 매핑입니다.
 */


/**
 * 지원되는 언어 코드 배열입니다.
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['ko', 'ja', 'zh-cn', 'zh', 'fr', 'de', 'es'];

/**
 * 언어 선택을 위한 옵션 배열입니다.
 */


export const LANGUAGE_NAMES: { [key: string]: string } = {
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

export const LANGUAGE_OPTIONS: LanguageInfo[] = [
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