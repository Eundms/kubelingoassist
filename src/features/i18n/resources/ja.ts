import { TranslationResource } from '../types';

export const ja: TranslationResource = {
  common: {
    ok: 'OK',
    cancel: 'キャンセル',
    create: '作成',
    overwrite: '上書き',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
  },

  commands: {
    openTranslationFile: '翻訳ファイルを開く',
    openReviewFile: 'レビューファイルを開く',
    toggleSyncScroll: 'スクロール同期の切り替え',
    toggleKubelingo: 'KubelingoAssistの切り替え',
    changeMode: 'モード変更',
    configureAI: 'AI設定の構成',
    showAPIKeyStatus: 'APIキーステータスの確認',
    translateSelected: '選択したテキストを翻訳',
  },

  messages: {
    kubelingoDisabled: 'KubelingoAssistが無効になっています。まず有効にしてください。',
    enableKubelingoFirst: 'まずKubelingoAssistを有効にしてください。',
    noActiveFile: 'アクティブなファイルがありません。',
    invalidFilePath: 'ファイルパスが無効です。',
    cannotFindTranslationPath: '翻訳ファイルのパスが見つかりません。この拡張機能はKubernetesドキュメントリポジトリの/content/en/または/content/{言語}/構造で動作します。',
    splitViewOpened: 'ファイルを分割表示で開きました。Cmd+Shift+Zでスクロール同期を有効にしてください。',
    syncScrollEnabled: '同期スクロールが有効になりました。',
    syncScrollDisabled: '同期スクロールが無効になりました。',
    kubelingoEnabled: 'KubelingoAssistが有効になりました。',
    kubelingoDisabledMsg: 'KubelingoAssistが無効になりました。',
    reviewModeEnabled: 'レビューモードが有効になりました。最近のコミットから変更されたファイルを確認できます。',
    translationModeEnabled: '翻訳モードが有効になりました。',
    translationFileNotExists: '翻訳ファイルが存在しません。新しく作成しますか？',
    createNewFile: '新しいファイルを作成しますか？',
    fileAlreadyExists: '翻訳ファイルがすでに存在します：{filename}\n上書きしますか？',
    fileCopied: 'ファイルをコピーしました。翻訳を開始してください！',
    fileCopyFailed: 'ファイルのコピーに失敗しました：{error}',
    originalFileNotFound: '元のファイルが見つかりません：{path}',
    gitUtilitiesNotAvailable: 'Gitユーティリティが利用できません',
    noRecentCommits: '最近のコミットが見つかりません',
    noTranslationFilesFound: '最近のコミットで翻訳ファイルが見つかりません。この拡張機能はcontent/{言語}構造を持つKubernetesドキュメントリポジトリで動作します。予想されるディレクトリ構造に翻訳されたMarkdownファイルをコミットしたことを確認してください。',
    openedForReview: 'レビューのために元の英語ファイルと一緒に{path}を開きました',
    failedToOpenReviewMode: 'レビューモードでファイルを開くのに失敗しました：{error}',
    failedToGetRecentCommits: '最近のコミットの取得に失敗しました：{error}',
    couldNotDetermineOriginalPath: '元の英語ファイルパスを特定できません',
    notKubernetesRepo: 'この拡張機能はKubernetesドキュメントリポジトリ（kubernetes/website）でのみ動作します。翻訳機能を使用するにはkubernetes/websiteリポジトリを開いてください。',
    kubernetesRepoOnly: 'この拡張機能はKubernetesドキュメントリポジトリ（kubernetes/website）でのみ動作します。レビューモードを使用するにはkubernetes/websiteリポジトリを開いてください。',
  },

  ui: {
    selectTargetLanguage: '翻訳対象の言語を選択してください',
    selectFileToReview: 'レビューする翻訳ファイルを選択してください',
    fileStatus: {
      modified: '変更済み',
      added: '追加',
      other: 'その他',
    },
    fromCommit: 'コミットから：{message}',
  },

  paths: {
    contentDirectory: '/content/',
    englishContent: '/content/en/',
    translationContent: '/content/{言語}/',
  },
};