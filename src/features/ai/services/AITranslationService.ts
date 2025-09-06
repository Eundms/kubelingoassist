// import * as vscode from 'vscode';
// import { AIProviderManager } from '../managers/AIProviderManager';
// import { AIConfigManager } from '../managers/AIConfigManager';
// import { 
//   AITranslationRequest, 
//   AITranslationResponse, 
//   TranslationStats, 
//   APIKeyError, 
//   TranslationError,
//   APIKeyStatus
// } from '../types';
// import { i18n } from '../../../core/i18n';

// /**
//  * AI 번역 서비스를 관리하는 클래스
//  * 다양한 AI 제공업체를 통한 번역 기능을 제공합니다.
//  */
// export class AITranslationService {
//   private readonly providerManager: AIProviderManager;
//   private readonly configManager: AIConfigManager;
//   private translationStats: TranslationStats;

//   constructor(private context: vscode.ExtensionContext) {
//     this.providerManager = new AIProviderManager();
//     this.configManager = new AIConfigManager(context);
//     this.translationStats = this.initializeStats();
//   }

//   /**
//    * 텍스트 번역
//    */
//   async translateText(request: AITranslationRequest): Promise<AITranslationResponse> {
//     const config = this.configManager.getAIConfig();
//     const provider = this.providerManager.getProvider(config.provider);
    
//     if (!provider) {
//       throw new TranslationError(
//         i18n.t('ai.provider.unsupported', config.provider),
//         config.provider
//       );
//     }

//     const apiKey = await this.configManager.getAPIKey(config.provider);
//     if (!apiKey) {
//       throw new APIKeyError(
//         i18n.t('ai.apiKey.notFound', config.provider.toUpperCase()),
//         config.provider
//       );
//     }

//     try {
//       const startTime = Date.now();
//       const response = await provider.translateText(request, apiKey);
//       const endTime = Date.now();

//       // 통계 업데이트
//       this.updateStats(true, response.tokensUsed || 0, endTime - startTime);

//       return response;
//     } catch (error) {
//       // 통계 업데이트
//       this.updateStats(false, 0, 0);

//       if (error instanceof TranslationError) {
//         throw error;
//       }

//       throw new TranslationError(
//         i18n.t('ai.translation.failed', String(error)),
//         config.provider,
//         error
//       );
//     }
//   }

//   /**
//    * API 키 상태 확인
//    */
//   async checkAPIKeyStatus(): Promise<Record<string, APIKeyStatus>> {
//     return await this.configManager.getAllAPIKeyStatus();
//   }

//   /**
//    * API 키 유효성 검증
//    */
//   async validateAPIKey(provider: string): Promise<boolean> {
//     const providerInstance = this.providerManager.getProvider(provider);
//     if (!providerInstance) {
//       return false;
//     }

//     try {
//       const apiKey = await this.configManager.getAPIKey(provider);
//       if (!apiKey) {
//         return false;
//       }

//       return await providerInstance.validateApiKey(apiKey);
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * 지원되는 모델 목록 반환
//    */
//   getSupportedModels(provider?: string): string[] {
//     if (provider) {
//       const providerInstance = this.providerManager.getProvider(provider);
//       return providerInstance?.getSupportedModels() || [];
//     }

//     // 모든 제공업체의 모델 목록
//     const allModels: string[] = [];
//     this.providerManager.getAllProviders().forEach(p => {
//       allModels.push(...p.getSupportedModels());
//     });
    
//     return [...new Set(allModels)]; // 중복 제거
//   }

//   /**
//    * 제공업체 정보 목록 반환
//    */
//   getProviderInfoList() {
//     return this.providerManager.getProviderInfoList();
//   }

//   /**
//    * 번역 통계 반환
//    */
//   getTranslationStats(): TranslationStats {
//     return { ...this.translationStats };
//   }

//   /**
//    * 통계 초기화
//    */
//   resetStats(): void {
//     this.translationStats = this.initializeStats();
//     this.saveStats();
//   }

//   /**
//    * 설정 관리자 반환
//    */
//   getConfigManager(): AIConfigManager {
//     return this.configManager;
//   }

//   /**
//    * 제공업체 관리자 반환
//    */
//   getProviderManager(): AIProviderManager {
//     return this.providerManager;
//   }

//   /**
//    * 리소스 해제
//    */
//   dispose(): void {
//     this.configManager.dispose();
//     this.saveStats();
//   }

//   /**
//    * 통계 초기화
//    */
//   private initializeStats(): TranslationStats {
//     const saved = this.context.globalState.get<TranslationStats>('ai.translationStats');
//     return saved || {
//       totalTranslations: 0,
//       successfulTranslations: 0,
//       failedTranslations: 0,
//       totalTokensUsed: 0
//     };
//   }

//   /**
//    * 통계 업데이트
//    */
//   private updateStats(success: boolean, tokensUsed: number, duration: number): void {
//     this.translationStats.totalTranslations++;
    
//     if (success) {
//       this.translationStats.successfulTranslations++;
//       this.translationStats.totalTokensUsed += tokensUsed;
//       this.translationStats.lastTranslation = new Date();
//     } else {
//       this.translationStats.failedTranslations++;
//     }

//     this.saveStats();
//   }

//   /**
//    * 통계 저장
//    */
//   private saveStats(): void {
//     this.context.globalState.update('ai.translationStats', this.translationStats);
//   }
// }