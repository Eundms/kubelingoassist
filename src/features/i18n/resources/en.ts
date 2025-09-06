import { TranslationResource } from '../types';

export const en: TranslationResource = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    create: 'Create',
    overwrite: 'Overwrite',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },

  commands: {
    openTranslationFile: 'Open Translation File',
    openReviewFile: 'Open Review File',
    toggleSyncScroll: 'Toggle Sync Scroll',
    toggleKubelingo: 'Toggle KubelingoAssist',
    changeMode: 'Change Mode',
    configureAI: 'Configure AI',
    showAPIKeyStatus: 'Show API Key Status',
    translateSelected: 'Translate Selected Text',
  },

  messages: {
    kubelingoDisabled: 'KubelingoAssist is disabled. Please enable it first.',
    enableKubelingoFirst: 'Please enable KubelingoAssist first.',
    noActiveFile: 'No active file found.',
    invalidFilePath: 'File path is not valid.',
    cannotFindTranslationPath: 'Cannot find translation file path. This extension works with Kubernetes documentation repository\'s /content/en/ or /content/{language}/ structure.',
    splitViewOpened: 'Files opened in split view. Use Cmd+Shift+Z to enable scroll synchronization.',
    syncScrollEnabled: 'Synchronized scrolling enabled.',
    syncScrollDisabled: 'Synchronized scrolling disabled.',
    kubelingoEnabled: 'KubelingoAssist enabled.',
    kubelingoDisabledMsg: 'KubelingoAssist disabled.',
    reviewModeEnabled: 'Review mode enabled. You can now see changed files from recent commits.',
    translationModeEnabled: 'Translation mode enabled.',
    translationFileNotExists: 'Translation file does not exist. Would you like to create a new one?',
    createNewFile: 'Create new file?',
    fileAlreadyExists: 'Translation file already exists: {filename}\nWould you like to overwrite it?',
    fileCopied: 'File copied successfully. Start translating!',
    fileCopyFailed: 'File copy failed: {error}',
    originalFileNotFound: 'Original file not found: {path}',
    gitUtilitiesNotAvailable: 'Git utilities not available',
    noRecentCommits: 'No recent commits found',
    noTranslationFilesFound: 'No translation files found in recent commits. This extension works with Kubernetes documentation repositories that have content/{language} structure. Make sure you have committed some translated markdown files in the expected directory structure.',
    openedForReview: 'Opened {path} with original English file for review',
    failedToOpenReviewMode: 'Failed to open file in review mode: {error}',
    failedToGetRecentCommits: 'Failed to get recent commits: {error}',
    couldNotDetermineOriginalPath: 'Could not determine original English file path',
    notKubernetesRepo: 'This extension only works with the Kubernetes documentation repository (kubernetes/website). Please open the kubernetes/website repository to use translation features.',
    kubernetesRepoOnly: 'This extension only works with the Kubernetes documentation repository (kubernetes/website). Please open the kubernetes/website repository to use review mode.',
  },

  ui: {
    selectTargetLanguage: 'Select target language for translation',
    selectFileToReview: 'Select a translation file to review',
    fileStatus: {
      modified: 'Modified',
      added: 'Added',
      other: 'Other',
    },
    fromCommit: 'From commit: {message}',
  },

  paths: {
    contentDirectory: '/content/',
    englishContent: '/content/en/',
    translationContent: '/content/{language}/',
  },
};