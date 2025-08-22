import React from 'react';
import { ControlButton, StatusBar } from '../ui';

interface ControlSectionProps {
  syncScrollEnabled: boolean;
  onOpenTranslation: () => void;
  onToggleSyncScroll: () => void;
}

export const ControlSection: React.FC<ControlSectionProps> = ({
  syncScrollEnabled,
  onOpenTranslation,
  onToggleSyncScroll
}) => {
  return (
    <>
      <StatusBar />
      
      <div className="button-group">
        <ControlButton
          variant="primary"
          onClick={onOpenTranslation}
        >
          🔄 번역 파일 열기
        </ControlButton>
        
        <ControlButton
          variant={syncScrollEnabled ? 'sync-enabled' : 'secondary'}
          onClick={onToggleSyncScroll}
        >
          {syncScrollEnabled ? '🔄 동기화 ON' : '🔄 동기화 OFF'}
        </ControlButton>
      </div>
    </>
  );
};