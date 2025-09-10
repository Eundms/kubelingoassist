import React from 'react';
import { ControlButton, StatusBar } from '../ui';
import { KubelingoMode, KUBELINGO_MODES } from '../../types/modes';
import { uiI18n } from '../../i18n';

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
              aria-label={uiI18n.t('accessibility.translationModeSelector')}
            >
              <option value={KUBELINGO_MODES.TRANSLATION}>{uiI18n.t('modes.translation')}</option>
              <option value={KUBELINGO_MODES.REVIEW}>{uiI18n.t('modes.review')}</option>
            </select>
            
            <ControlButton
              variant="primary"
              onClick={currentMode === KUBELINGO_MODES.REVIEW ? onOpenReviewFile : onOpenTranslationFile}
              disabled={!isKubelingoEnabled}
              aria-label={currentMode === KUBELINGO_MODES.REVIEW ? uiI18n.t('accessibility.openReviewFile') : uiI18n.t('accessibility.openTranslationFile')}
            >
              {currentMode === KUBELINGO_MODES.REVIEW ? uiI18n.t('buttons.openReviewFile') : uiI18n.t('buttons.openTranslationFile')}
            </ControlButton>
            
            <ControlButton
              variant={isSyncScrollEnabled ? 'sync-enabled' : 'secondary'}
              onClick={onToggleSyncScroll}
              disabled={!isKubelingoEnabled}
              aria-label={isSyncScrollEnabled ? uiI18n.t('accessibility.disableSyncScroll') : uiI18n.t('accessibility.enableSyncScroll')}
            >
              {isSyncScrollEnabled ? uiI18n.t('buttons.syncOn') : uiI18n.t('buttons.syncOff')}
            </ControlButton>
          </div>
      }
  
    </>
  );
};