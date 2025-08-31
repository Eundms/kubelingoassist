export interface TranslationState {
  isSyncScrollEnabled: boolean;
  isKubelingoEnabled: boolean;
  currentMode: 'translation' | 'review';
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: CommitFile[];
}

export interface CommitFile {
  path: string;
  status: 'M' | 'A' | 'D' | 'R' | 'C';
  originalPath?: string;
}

export interface VSCodeMessage {
  type: string;
  payload?: any;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TranslationProgress {
  totalLines: number;
  translatedLines: number;
  completionPercentage: number;
}