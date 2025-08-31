import React from 'react';
import { ControlButton, StatusBar } from '../ui';
import { KubelingoMode, KUBELINGO_MODES } from '../../types/modes';

interface TranslationControlSectionProps {
  isSyncScrollEnabled: boolean;
  isKubelingoEnabled: boolean;
  currentMode: KubelingoMode;
  onOpenTranslationFile: () => void;
  onOpenReviewFile: () => void;
  onToggleSyncScroll: () => void;
  onToggleKubelingo: () => void;
  onModeChange: (mode: KubelingoMode) => void;
}

export const TranslationControlSection: React.FC<TranslationControlSectionProps> = ({
  isSyncScrollEnabled,
  isKubelingoEnabled,
  currentMode,
  onOpenTranslationFile,
  onOpenReviewFile,
  onToggleSyncScroll,
  onToggleKubelingo,
  onModeChange
}) => {
  return (
    <>
      <StatusBar 
        kubelingoEnabled={isKubelingoEnabled}
        onToggleKubelingo={onToggleKubelingo}
      />
      {isKubelingoEnabled && 
          <div className="button-group">
            <select
              value={currentMode}
              onChange={(e) => onModeChange(e.target.value as KubelingoMode)}
              className={`mode-select enabled`}
              aria-label="Translation mode selector"
            >
              <option value={KUBELINGO_MODES.TRANSLATION}>번역 모드</option>
              <option value={KUBELINGO_MODES.REVIEW}>리뷰 모드</option>
            </select>
            
            <ControlButton
              variant="primary"
              onClick={currentMode === KUBELINGO_MODES.REVIEW ? onOpenReviewFile : onOpenTranslationFile}
              disabled={!isKubelingoEnabled}
              aria-label={currentMode === KUBELINGO_MODES.REVIEW ? 'Open review file' : 'Open translation file'}
            >
              {currentMode === KUBELINGO_MODES.REVIEW ? '📋 리뷰 파일 열기' : '🔄 번역 파일 열기'}
            </ControlButton>
            
            <ControlButton
              variant={isSyncScrollEnabled ? 'sync-enabled' : 'secondary'}
              onClick={onToggleSyncScroll}
              disabled={!isKubelingoEnabled}
              aria-label={isSyncScrollEnabled ? 'Disable sync scroll' : 'Enable sync scroll'}
            >
              {isSyncScrollEnabled ? '🔄 동기화 ON' : '🔄 동기화 OFF'}
            </ControlButton>
          </div>
      }
  
    </>
  );
};