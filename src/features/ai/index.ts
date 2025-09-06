// // AI feature barrel exports
// import * as vscode from 'vscode';

// export * from './types';
// export * from './interfaces/IAIProvider';

// // Providers
// export * from './providers/OpenAIProvider';
// export * from './providers/ClaudeProvider';

// // Managers
// export * from './managers/AIProviderManager';
// export * from './managers/AIConfigManager';

// // Services
// export * from './services/AITranslationService';

// // Commands
// export * from './commands/AICommandManager';

// // Legacy exports for backward compatibility
// export { AIService } from './ai-service/AIService';
// // export { AICommands } from './AICommands';
// export { ConfigManager } from './config/ConfigManager';

// import { AICommandManager } from './commands/AICommandManager';
// import { AITranslationService } from './services/AITranslationService';
// import { AIProviderManager } from './managers/AIProviderManager';
// import { AIConfigManager } from './managers/AIConfigManager';

// /**
//  * AI 기능 관련 모든 매니저를 통합하는 팩토리 클래스
//  */
// export class AIManagerFactory {
//   private static commandManager: AICommandManager | null = null;
//   private static translationService: AITranslationService | null = null;
//   private static providerManager: AIProviderManager | null = null;
//   private static configManager: AIConfigManager | null = null;

//   /**
//    * AICommandManager 싱글톤 인스턴스 반환
//    */
//   public static getCommandManager(context: vscode.ExtensionContext): AICommandManager {
//     if (!this.commandManager) {
//       this.commandManager = new AICommandManager(context);
//     }
//     return this.commandManager;
//   }

//   /**
//    * AITranslationService 싱글톤 인스턴스 반환
//    */
//   public static getTranslationService(context: vscode.ExtensionContext): AITranslationService {
//     if (!this.translationService) {
//       this.translationService = new AITranslationService(context);
//     }
//     return this.translationService;
//   }

//   /**
//    * AIProviderManager 싱글톤 인스턴스 반환
//    */
//   public static getProviderManager(): AIProviderManager {
//     if (!this.providerManager) {
//       this.providerManager = new AIProviderManager();
//     }
//     return this.providerManager;
//   }

//   /**
//    * AIConfigManager 싱글톤 인스턴스 반환
//    */
//   public static getConfigManager(context: vscode.ExtensionContext): AIConfigManager {
//     if (!this.configManager) {
//       this.configManager = new AIConfigManager(context);
//     }
//     return this.configManager;
//   }

//   /**
//    * 모든 매니저 인스턴스를 새로 생성
//    */
//   public static createNew(context: vscode.ExtensionContext): {
//     commandManager: AICommandManager;
//     translationService: AITranslationService;
//     providerManager: AIProviderManager;
//     configManager: AIConfigManager;
//   } {
//     return {
//       commandManager: new AICommandManager(context),
//       translationService: new AITranslationService(context),
//       providerManager: new AIProviderManager(),
//       configManager: new AIConfigManager(context)
//     };
//   }

//   /**
//    * 싱글톤 인스턴스들을 초기화
//    */
//   public static reset(): void {
//     if (this.commandManager) {
//       this.commandManager.dispose();
//     }
//     if (this.translationService) {
//       this.translationService.dispose();
//     }
//     if (this.configManager) {
//       this.configManager.dispose();
//     }
    
//     this.commandManager = null;
//     this.translationService = null;
//     this.providerManager = null;
//     this.configManager = null;
//   }
// }