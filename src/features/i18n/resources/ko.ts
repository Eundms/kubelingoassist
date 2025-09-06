import { TranslationResource } from '../types';

export const ko: TranslationResource = {
  common: {
    ok: '확인',
    cancel: '취소',
    create: '생성',
    overwrite: '덮어쓰기',
    loading: '로딩 중...',
    error: '오류',
    success: '성공',
  },

  commands: {
    openTranslationFile: '번역 파일 열기',
    openReviewFile: '리뷰 파일 열기',
    toggleSyncScroll: '스크롤 동기화 토글',
    toggleKubelingo: 'KubelingoAssist 토글',
    changeMode: '모드 변경',
    configureAI: 'AI 설정 구성',
    showAPIKeyStatus: 'API 키 상태 확인',
    translateSelected: '선택한 텍스트 번역',
  },

  messages: {
    kubelingoDisabled: 'KubelingoAssist가 비활성화되었습니다. 먼저 활성화해주세요.',
    enableKubelingoFirst: 'KubelingoAssist를 먼저 활성화해주세요.',
    noActiveFile: '활성화된 파일이 없습니다.',
    invalidFilePath: '파일 경로가 유효하지 않습니다.',
    cannotFindTranslationPath: '번역 파일 경로를 찾을 수 없습니다. 이 확장 프로그램은 Kubernetes 문서 저장소의 /content/en/ 또는 /content/{언어}/ 구조에서 작동합니다.',
    splitViewOpened: 'Split view로 파일을 열었습니다. Cmd+Shift+Z로 스크롤 동기화를 활성화하세요.',
    syncScrollEnabled: '동기화 스크롤이 활성화되었습니다.',
    syncScrollDisabled: '동기화 스크롤이 비활성화되었습니다.',
    kubelingoEnabled: 'KubelingoAssist가 활성화되었습니다.',
    kubelingoDisabledMsg: 'KubelingoAssist가 비활성화되었습니다.',
    reviewModeEnabled: '리뷰 모드가 활성화되었습니다. 이제 최근 커밋의 변경된 파일을 볼 수 있습니다.',
    translationModeEnabled: '번역 모드가 활성화되었습니다.',
    translationFileNotExists: '번역 파일이 존재하지 않습니다. 새로 생성하시겠습니까?',
    createNewFile: '새 파일을 생성하시겠습니까?',
    fileAlreadyExists: '번역 파일이 이미 존재합니다: {filename}\n덮어쓰시겠습니까?',
    fileCopied: '파일을 복사했습니다. 번역을 시작하세요!',
    fileCopyFailed: '파일 복사 실패: {error}',
    originalFileNotFound: '원본 파일이 존재하지 않습니다: {path}',
    gitUtilitiesNotAvailable: 'Git 유틸리티를 사용할 수 없습니다',
    noRecentCommits: '최근 커밋을 찾을 수 없습니다',
    noTranslationFilesFound: '최근 커밋에서 번역 파일을 찾을 수 없습니다. 이 확장 프로그램은 content/{언어} 구조를 가진 Kubernetes 문서 저장소에서 작동합니다. 예상된 디렉터리 구조에 번역된 마크다운 파일을 커밋했는지 확인하세요.',
    openedForReview: '리뷰를 위해 원본 영어 파일과 함께 {path}를 열었습니다',
    failedToOpenReviewMode: '리뷰 모드로 파일을 여는데 실패했습니다: {error}',
    failedToGetRecentCommits: '최근 커밋을 가져오는데 실패했습니다: {error}',
    couldNotDetermineOriginalPath: '원본 영어 파일 경로를 확인할 수 없습니다',
    notKubernetesRepo: '이 확장 프로그램은 Kubernetes 문서 저장소(kubernetes/website)에서만 작동합니다. 번역 기능을 사용하려면 kubernetes/website 저장소를 열어주세요.',
    kubernetesRepoOnly: '이 확장 프로그램은 Kubernetes 문서 저장소(kubernetes/website)에서만 작동합니다. 리뷰 모드를 사용하려면 kubernetes/website 저장소를 열어주세요.',
  },

  ui: {
    selectTargetLanguage: '번역할 대상 언어를 선택하세요',
    selectFileToReview: '리뷰할 번역 파일을 선택하세요',
    fileStatus: {
      modified: '수정됨',
      added: '추가됨',
      other: '기타',
    },
    fromCommit: '커밋에서: {message}',
  },

  paths: {
    contentDirectory: '/content/',
    englishContent: '/content/en/',
    translationContent: '/content/{언어}/',
  },
};