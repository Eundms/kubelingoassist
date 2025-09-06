import * as vscode from 'vscode';
import * as path from 'path';
import { i18n } from '../../../core/i18n';
import { LineComparisonResult } from './TranslationPathManager';

export interface FileCreationOptions {
  overwrite?: boolean;
  copyContent?: boolean;
}

export class TranslationFileError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'TranslationFileError';
  }
}

/**
 * 번역 파일의 생성, 열기, 비교 등을 담당하는 클래스
 */
export class TranslationFileManager {
  
  /**
   * 원본과 번역 파일을 분할 뷰로 열기
   */
  public async openSplitView(originalPath: string, translationPath: string): Promise<void> {
    try {
      await this.openFileInColumn(originalPath, vscode.ViewColumn.One);
      await this.openFileInColumn(translationPath, vscode.ViewColumn.Two);
      
      vscode.window.showInformationMessage(
        i18n.t('translationFile.splitViewOpened')
      );
    } catch (error) {
      await this.handleFileNotFound(originalPath, translationPath, error);
    }
  }

  /**
   * 번역 파일 생성
   */
  public async createTranslationFile(
    originalPath: string, 
    translationPath: string, 
    options: FileCreationOptions = {}
  ): Promise<void> {
    this.validatePaths(originalPath, translationPath);

    const originalExists = await this.fileExists(originalPath);
    if (!originalExists) {
      throw new TranslationFileError(
        i18n.t('translationFile.originalNotFound', originalPath),
        'ORIGINAL_NOT_FOUND'
      );
    }

    const translationExists = await this.fileExists(translationPath);
    if (translationExists && !options.overwrite) {
      const shouldOverwrite = await this.confirmOverwrite(translationPath);
      if (!shouldOverwrite) {
        return;
      }
    }

    try {
      await this.ensureDirectory(path.dirname(translationPath));
      
      let content = '';
      if (options.copyContent) {
        content = await this.readFileContent(originalPath);
      }
      
      await this.writeFile(translationPath, content);
      
      vscode.window.showInformationMessage(
        i18n.t('translationFile.created')
      );

      await this.openSplitView(originalPath, translationPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new TranslationFileError(
        i18n.t('translationFile.creationFailed', errorMessage),
        'CREATION_FAILED'
      );
    }
  }

  /**
   * 원본과 번역 파일의 라인 수 비교
   */
  public async compareLineCounts(
    originalPath: string, 
    translationPath: string
  ): Promise<LineComparisonResult | null> {
    try {
      const originalExists = await this.fileExists(originalPath);
      const translationExists = await this.fileExists(translationPath);
      
      if (!originalExists || !translationExists) {
        return null;
      }

      const originalContent = await this.readFileContent(originalPath);
      const translationContent = await this.readFileContent(translationPath);
      
      const originalLines = this.countLines(originalContent);
      const translationLines = this.countLines(translationContent);
      
      return {
        originalLines,
        translationLines,
        isEqual: originalLines === translationLines,
        percentage: originalLines > 0 ? Math.round((translationLines / originalLines) * 100) : 0
      };
    } catch (error) {
      console.error('Error comparing line counts:', error);
      return null;
    }
  }

  /**
   * 파일이 존재하는지 확인
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
  }

  private validatePaths(originalPath: string, translationPath: string): void {
    if (!originalPath || !translationPath) {
      throw new TranslationFileError(
        i18n.t('translationFile.invalidPaths'),
        'INVALID_PATHS'
      );
    }
  }

  private async openFileInColumn(filePath: string, viewColumn: vscode.ViewColumn): Promise<void> {
    const uri = vscode.Uri.file(filePath);
    await vscode.commands.executeCommand('vscode.open', uri, { viewColumn });
  }

  private async handleFileNotFound(
    originalPath: string, 
    translationPath: string, 
    error: any
  ): Promise<void> {
    const createFile = await vscode.window.showWarningMessage(
      i18n.t('translationFile.notFound'),
      i18n.t('translationFile.create'),
      i18n.t('translationFile.cancel')
    );
    
    if (createFile === i18n.t('translationFile.create')) {
      await this.createTranslationFile(originalPath, translationPath);
    }
  }

  private async confirmOverwrite(translationPath: string): Promise<boolean> {
    const fileName = path.basename(translationPath);
    const overwrite = await vscode.window.showWarningMessage(
      i18n.t('translationFile.alreadyExists', fileName),
      i18n.t('translationFile.overwrite'),
      i18n.t('translationFile.cancel')
    );
    
    return overwrite === i18n.t('translationFile.overwrite');
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
  }

  private async readFileContent(filePath: string): Promise<string> {
    const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
    return content.toString();
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(filePath),
      Buffer.from(content, 'utf8')
    );
  }

  private countLines(content: string): number {
    return content.split('\n').length;
  }
}