import * as vscode from 'vscode';

let disposables: vscode.Disposable[] = [];

/**
 * 절대 "맨 위 라인" 기준으로 번역 파일들 간 스크롤을 동기화한다.
 * - 패널 생명주기와 분리: 토글 시에만 등록/해제하도록 외부에서 호출
 * - 대상: 경로에 /content/ 가 포함된 에디터들
 */
export function setupSynchronizedScrolling() {
  cleanupScrollListeners(); // 중복 등록 방지

  const isTranslationFile = (fileName: string) =>
    fileName.includes('/content/') || fileName.includes('\\content\\');

  const getTranslationEditors = () =>
    vscode.window.visibleTextEditors.filter(ed => isTranslationFile(ed.document.fileName));

  // 동기화 시작 시 현재 en 파일의 위치를 기준으로 모든 번역 파일 동기화
  const translationEditors = getTranslationEditors();
  if (translationEditors.length >= 2) {
    // en 파일 찾기 (경로에 /en/ 포함)
    const enEditor = translationEditors.find(editor => 
      editor.document.fileName.includes('/en/') || editor.document.fileName.includes('\\en\\')
    );
    
    if (enEditor && enEditor.visibleRanges.length > 0) {
      const currentTopLine = enEditor.visibleRanges[0].start.line;
      
      // en 파일 제외한 다른 번역 파일들을 같은 위치로 동기화
      translationEditors
        .filter(editor => editor !== enEditor)
        .forEach(editor => {
          const range = new vscode.Range(currentTopLine, 0, currentTopLine, 0);
          editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
        });
    }
  }

  // revealRange로 인해 다시 스스로를 트리거하지 않도록 방지
  const updatingEditors = new WeakSet<vscode.TextEditor>();
  // 이벤트 폭주 방지를 위한 가벼운 디바운스(에디터별)
  const debounceTimers = new WeakMap<vscode.TextEditor, NodeJS.Timeout>();

  const revealAtTop = (editor: vscode.TextEditor, targetTopLine: number) => {
    const safeLine = Math.max(0, Math.min(targetTopLine, editor.document.lineCount - 1));
    const range = new vscode.Range(safeLine, 0, safeLine, 0);
    editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
  };

  const onScroll = vscode.window.onDidChangeTextEditorVisibleRanges(e => {
    const editor = e.textEditor;
    if (!isTranslationFile(editor.document.fileName)) return;
    if (updatingEditors.has(editor)) return;

    const vr = e.visibleRanges[0];
    if (!vr) return;

    // 현재 에디터의 "맨 위 라인"
    const currentTop = vr.start.line;

    const applyToOthers = () => {
      const others = getTranslationEditors().filter(ed => ed !== editor);
      others.forEach(other => {
        updatingEditors.add(other);
        try {
          revealAtTop(other, currentTop);
        } finally {
          // 우리가 유발한 이벤트는 무시되도록 한 틱 뒤에 해제
          setTimeout(() => updatingEditors.delete(other), 0);
        }
      });
    };

    // 소프트 디바운스(기본 20ms): 너무 자주 튀는 것 방지
    const existing = debounceTimers.get(editor);
    if (existing) clearTimeout(existing);
    const t = setTimeout(applyToOthers, 20);
    debounceTimers.set(editor, t);
  });

  const onEditorsChanged = vscode.window.onDidChangeVisibleTextEditors(() => {
    const editors = getTranslationEditors();
    if (editors.length < 2) {
      vscode.window.showWarningMessage(
        '동기화할 번역 파일이 부족합니다. 원본과 번역 파일을 모두 열어주세요.'
      );
    }
  });

  disposables.push(onScroll, onEditorsChanged);
}

/**
 * 등록된 스크롤 동기화 리스너를 모두 해제한다.
 * - 기능 토글 OFF 시 호출
 */
export function cleanupScrollListeners() {
  disposables.forEach(d => d.dispose());
  disposables = [];
}
