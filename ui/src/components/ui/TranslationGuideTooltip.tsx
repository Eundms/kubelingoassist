import React from 'react';

export const TranslationGuideTooltip: React.FC = () => {
  return (
    <div className="translation-guide-tooltip">
      <span className="tooltip-trigger">ℹ️</span>
      <div className="tooltip-content">
        <div className="tooltip-title">번역 용어 참조</div>
        <ol>
          <li>쿠버네티스 한글화팀 용어집</li>
        </ol>
      </div>
    </div>
  );
};