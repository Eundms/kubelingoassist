// src/status-bar.ts
import * as vscode from 'vscode';
import { extractLanguageCode, compareLineCounts } from '../translation/translation-utils';

export class StatusBarManager {
  private languageStatusBarItem: vscode.StatusBarItem;
  private currentOriginalPath?: string;
  private currentTranslationPath?: string;
  private updateTimeout?: NodeJS.Timeout;

  constructor() {
    // 번역 파일 열기 버튼
    this.languageStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.languageStatusBarItem.command = 'kubelingoassist.openTranslationFile';
    this.languageStatusBarItem.text = '$(globe) 번역파일';
    this.languageStatusBarItem.tooltip = '번역 파일 열기';
    this.languageStatusBarItem.show();
  }

  public async updateAllStatusBarItems(originalPath?: string, translationPath?: string) {
    if (originalPath && translationPath) {
      // 현재 파일 경로 저장
      this.currentOriginalPath = originalPath;
      this.currentTranslationPath = translationPath;

      const sourceLanguage = extractLanguageCode(originalPath);
      const targetLanguage = extractLanguageCode(translationPath);

      const lineComparison = await compareLineCounts(originalPath, translationPath);
      let lineInfo = '';

      if (lineComparison) {
        if (lineComparison.isEqual) lineInfo = ' ✓';
        else lineInfo = ` (${lineComparison.percentage}%)`;
      }

      this.languageStatusBarItem.text = `$(globe) ${sourceLanguage} → ${targetLanguage}${lineInfo}`;
      this.languageStatusBarItem.tooltip = lineComparison
        ? `원본: ${lineComparison.originalLines}줄, 번역: ${lineComparison.translationLines}줄 (${lineComparison.percentage}%)`
        : '번역 파일 열기';
    } else {
      this.languageStatusBarItem.text = '$(globe) 번역파일';
      this.languageStatusBarItem.tooltip = '번역 파일 열기';
    }
  }

  /**
   * 현재 열려있는 파일들의 라인수를 자동으로 업데이트
   */
  public async refreshLineCount() {
    if (this.currentOriginalPath && this.currentTranslationPath) {
      await this.updateAllStatusBarItems(this.currentOriginalPath, this.currentTranslationPath);
    }
  }

  /**
   * 디바운싱을 적용한 라인수 업데이트 (문서 변경시 너무 자주 호출되는 것을 방지)
   */
  public debouncedRefreshLineCount(delay: number = 1000) {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(async () => {
      await this.refreshLineCount();
    }, delay);
  }


  public dispose() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.languageStatusBarItem.dispose();
  }

  public getItems(): vscode.StatusBarItem[] {
    return [this.languageStatusBarItem];
  }
}
