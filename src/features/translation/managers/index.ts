// Translation managers barrel export
export * from './TranslationPathManager';
export * from './TranslationFileManager';

import { TranslationPathManager } from './TranslationPathManager';
import { TranslationFileManager } from './TranslationFileManager';

/**
 * 번역 관련 모든 관리자를 통합하는 팩토리 클래스
 */
export class TranslationManagerFactory {
  private static pathManager: TranslationPathManager | null = null;
  private static fileManager: TranslationFileManager | null = null;

  /**
   * TranslationPathManager 싱글톤 인스턴스 반환
   */
  public static getPathManager(): TranslationPathManager {
    if (!this.pathManager) {
      this.pathManager = new TranslationPathManager();
    }
    return this.pathManager;
  }

  /**
   * TranslationFileManager 싱글톤 인스턴스 반환
   */
  public static getFileManager(): TranslationFileManager {
    if (!this.fileManager) {
      this.fileManager = new TranslationFileManager();
    }
    return this.fileManager;
  }

  /**
   * 모든 매니저 인스턴스를 새로 생성
   */
  public static createNew(): {
    pathManager: TranslationPathManager;
    fileManager: TranslationFileManager;
  } {
    return {
      pathManager: new TranslationPathManager(),
      fileManager: new TranslationFileManager()
    };
  }

  /**
   * 싱글톤 인스턴스들을 초기화
   */
  public static reset(): void {
    this.pathManager = null;
    this.fileManager = null;
  }
}