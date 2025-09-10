export type SupportedLanguage = 'en' | 'ko';

export interface UITranslationResource {
  status: {
    kubelingoAssist: string;
    on: string;
    off: string;
  };
  modes: {
    translation: string;
    review: string;
  };
  buttons: {
    openTranslationFile: string;
    openReviewFile: string;
    syncOn: string;
    syncOff: string;
  };
  accessibility: {
    translationModeSelector: string;
    openReviewFile: string;
    openTranslationFile: string;
    enableSyncScroll: string;
    disableSyncScroll: string;
  };
}