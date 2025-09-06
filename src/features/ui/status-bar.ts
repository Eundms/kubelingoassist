// src/status-bar.ts
import * as vscode from 'vscode';
import { TranslationManagerFactory } from '../translation/managers';

export class StatusBarManager {
  private languageStatusBarItem: vscode.StatusBarItem;
  private readonly pathManager = TranslationManagerFactory.getPathManager();
  private readonly fileManager = TranslationManagerFactory.getFileManager();

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
      const sourceLanguage = this.pathManager.extractLanguageCode(originalPath) || 'unknown';
      const targetLanguage = this.pathManager.extractLanguageCode(translationPath) || 'unknown';

      const lineComparison = await this.fileManager.compareLineCounts(originalPath, translationPath);
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


  public dispose() {
    this.languageStatusBarItem.dispose();
  }

  public getItems(): vscode.StatusBarItem[] {
    return [this.languageStatusBarItem];
  }
}
