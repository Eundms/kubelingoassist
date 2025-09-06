import * as vscode from 'vscode';
import { i18n } from '../../core/i18n';

/**
 * 번역 파일들 간 스크롤 동기화를 관리하는 클래스
 * - 절대 "맨 위 라인" 기준으로 번역 파일들 간 스크롤을 동기화
 * - 패널 생명주기와 분리: 토글 시에만 등록/해제
 * - 대상: 경로에 /content/ 가 포함된 에디터들
 */
export class ScrollSyncManager {
  private disposables: vscode.Disposable[] = [];
  private readonly updatingEditors = new WeakSet<vscode.TextEditor>();
  private readonly debounceTimers = new WeakMap<vscode.TextEditor, NodeJS.Timeout>();
  private isActive = false;

  public setupSynchronizedScrolling(): void {
    if (this.isActive) {
      this.cleanupScrollListeners(); // 중복 등록 방지
    }
    this.isActive = true;

    const onScroll = vscode.window.onDidChangeTextEditorVisibleRanges(e => {
      const editor = e.textEditor;
      if (!this.isTranslationFile(editor.document.fileName)) return;
      if (this.updatingEditors.has(editor)) return;

      const vr = e.visibleRanges[0];
      if (!vr) return;

      // 현재 에디터의 "맨 위 라인"
      const currentTop = vr.start.line;

      const applyToOthers = () => {
        const others = this.getTranslationEditors().filter(ed => ed !== editor);
        others.forEach(other => {
          this.updatingEditors.add(other);
          try {
            this.revealAtTop(other, currentTop);
          } finally {
            // 우리가 유발한 이벤트는 무시되도록 한 틱 뒤에 해제
            setTimeout(() => this.updatingEditors.delete(other), 0);
          }
        });
      };

      // 소프트 디바운스(기본 20ms): 너무 자주 튀는 것 방지
      const existing = this.debounceTimers.get(editor);
      if (existing) clearTimeout(existing);
      const t = setTimeout(applyToOthers, 20);
      this.debounceTimers.set(editor, t);
    });

    const onEditorsChanged = vscode.window.onDidChangeVisibleTextEditors(() => {
      const editors = this.getTranslationEditors();
      if (editors.length < 2) {
        vscode.window.showWarningMessage(
          i18n.t('scrollSync.insufficientFiles')
        );
      }
    });

    this.disposables.push(onScroll, onEditorsChanged);
  }

  /**
   * 등록된 스크롤 동기화 리스너를 모두 해제한다.
   * - 기능 토글 OFF 시 호출
   */
  public cleanupScrollListeners(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.isActive = false;
  }

  /**
   * 리소스 해제
   */
  public dispose(): void {
    this.cleanupScrollListeners();
  }

  private isTranslationFile(fileName: string): boolean {
    return fileName.includes('/content/') || fileName.includes('\\content\\');
  }

  private getTranslationEditors(): vscode.TextEditor[] {
    return vscode.window.visibleTextEditors.filter(ed => this.isTranslationFile(ed.document.fileName));
  }

  private revealAtTop(editor: vscode.TextEditor, targetTopLine: number): void {
    const safeLine = Math.max(0, Math.min(targetTopLine, editor.document.lineCount - 1));
    const range = new vscode.Range(safeLine, 0, safeLine, 0);
    editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
  }
}

// 이전 버전 호환성을 위한 함수들
let globalScrollSyncManager: ScrollSyncManager | null = null;

export function setupSynchronizedScrolling(): void {
  if (!globalScrollSyncManager) {
    globalScrollSyncManager = new ScrollSyncManager();
  }
  globalScrollSyncManager.setupSynchronizedScrolling();
}

export function cleanupScrollListeners(): void {
  if (globalScrollSyncManager) {
    globalScrollSyncManager.cleanupScrollListeners();
  }
}
