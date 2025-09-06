// import * as vscode from 'vscode';
// import { AIConfig } from '../interfaces/IAIProvider';
// import { APIKeyError, ConfigurationError, APIKeyStatus } from '../types';

// /**
//  * AI 설정 및 API 키 관리를 담당하는 클래스
//  */
// export class AIConfigManager {
//   private static readonly CONFIG_SECTION = 'kubelingoassist';
//   private static readonly SECRET_KEYS = {
//     OPENAI_API_KEY: 'openai.apiKey',
//     CLAUDE_API_KEY: 'claude.apiKey', 
//     GEMINI_API_KEY: 'gemini.apiKey'
//   } as const;

//   private readonly keyStatusCache = new Map<string, APIKeyStatus>();

//   constructor(private context: vscode.ExtensionContext) {}

//   /**
//    * AI 설정 반환
//    */
//   getAIConfig(): AIConfig {
//     const config = vscode.workspace.getConfiguration(AIConfigManager.CONFIG_SECTION);
    
//     return {
//       provider: config.get<string>('ai.provider', 'openai'),
//       model: config.get<string>('ai.model'),
//       baseUrl: config.get<string>('ai.baseUrl'),
//       maxTokens: config.get<number>('ai.maxTokens', 2000),
//       temperature: config.get<number>('ai.temperature', 0.7)
//     };
//   }

//   /**
//    * AI 설정 업데이트
//    */
//   async updateAIConfig(config: Partial<AIConfig>): Promise<void> {
//     const workspaceConfig = vscode.workspace.getConfiguration(AIConfigManager.CONFIG_SECTION);
    
//     const updates: Array<Promise<void>> = [];
    
//     if (config.provider) {
//       updates.push(workspaceConfig.update('ai.provider', config.provider, vscode.ConfigurationTarget.Global));
//     }
//     if (config.model) {
//       updates.push(workspaceConfig.update('ai.model', config.model, vscode.ConfigurationTarget.Global));
//     }
//     if (config.baseUrl) {
//       updates.push(workspaceConfig.update('ai.baseUrl', config.baseUrl, vscode.ConfigurationTarget.Global));
//     }
//     if (config.maxTokens) {
//       updates.push(workspaceConfig.update('ai.maxTokens', config.maxTokens, vscode.ConfigurationTarget.Global));
//     }
//     if (config.temperature !== undefined) {
//       updates.push(workspaceConfig.update('ai.temperature', config.temperature, vscode.ConfigurationTarget.Global));
//     }

//     await Promise.all(updates);
//   }

//   /**
//    * API 키 반환
//    */
//   async getAPIKey(provider: string): Promise<string | undefined> {
//     const secretKey = this.getSecretKey(provider);
//     if (!secretKey) {
//       throw new ConfigurationError(`Unsupported AI provider: ${provider}`);
//     }

//     try {
//       return await this.context.secrets.get(secretKey);
//     } catch (error) {
//       throw new APIKeyError(`Failed to retrieve API key for ${provider}`, provider);
//     }
//   }

//   /**
//    * API 키 설정
//    */
//   async setAPIKey(provider: string, apiKey: string): Promise<void> {
//     const secretKey = this.getSecretKey(provider);
//     if (!secretKey) {
//       throw new ConfigurationError(`Unsupported AI provider: ${provider}`);
//     }

//     if (!apiKey || apiKey.trim().length === 0) {
//       throw new APIKeyError('API key cannot be empty', provider);
//     }

//     try {
//       await this.context.secrets.store(secretKey, apiKey.trim());
//       // 캐시 무효화
//       this.keyStatusCache.delete(provider);
//     } catch (error) {
//       throw new APIKeyError(`Failed to store API key for ${provider}`, provider);
//     }
//   }

//   /**
//    * API 키 삭제
//    */
//   async deleteAPIKey(provider: string): Promise<void> {
//     const secretKey = this.getSecretKey(provider);
//     if (!secretKey) {
//       throw new ConfigurationError(`Unsupported AI provider: ${provider}`);
//     }

//     try {
//       await this.context.secrets.delete(secretKey);
//       // 캐시 무효화
//       this.keyStatusCache.delete(provider);
//     } catch (error) {
//       throw new APIKeyError(`Failed to delete API key for ${provider}`, provider);
//     }
//   }

//   /**
//    * API 키 존재 여부 확인
//    */
//   async hasAPIKey(provider: string): Promise<boolean> {
//     try {
//       const apiKey = await this.getAPIKey(provider);
//       return Boolean(apiKey && apiKey.length > 0);
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * API 키 상태 확인 (캐시 포함)
//    */
//   async getAPIKeyStatus(provider: string, forceRefresh = false): Promise<APIKeyStatus> {
//     const cacheKey = provider;
    
//     // 캐시된 상태 확인 (5분 이내)
//     if (!forceRefresh && this.keyStatusCache.has(cacheKey)) {
//       const cached = this.keyStatusCache.get(cacheKey)!;
//       const age = Date.now() - (cached.lastChecked?.getTime() || 0);
//       if (age < 5 * 60 * 1000) { // 5분
//         return cached;
//       }
//     }

//     const status: APIKeyStatus = {
//       configured: false,
//       lastChecked: new Date()
//     };

//     try {
//       status.configured = await this.hasAPIKey(provider);
      
//       if (status.configured) {
//         status.valid = true; // 실제 검증은 제공업체별로 구현
//       }
//     } catch (error) {
//       status.error = error instanceof Error ? error.message : String(error);
//     }

//     // 캐시 업데이트
//     this.keyStatusCache.set(cacheKey, status);
    
//     return status;
//   }

//   /**
//    * 모든 제공업체의 API 키 상태 확인
//    */
//   async getAllAPIKeyStatus(): Promise<Record<string, APIKeyStatus>> {
//     const providers = ['openai', 'claude', 'gemini'];
//     const results: Record<string, APIKeyStatus> = {};

//     await Promise.all(
//       providers.map(async (provider) => {
//         results[provider] = await this.getAPIKeyStatus(provider);
//       })
//     );

//     return results;
//   }

//   /**
//    * 시크릿 키 반환
//    */
//   private getSecretKey(provider: string): string | undefined {
//     switch (provider.toLowerCase()) {
//       case 'openai':
//         return AIConfigManager.SECRET_KEYS.OPENAI_API_KEY;
//       case 'claude':
//         return AIConfigManager.SECRET_KEYS.CLAUDE_API_KEY;
//       case 'gemini':
//         return AIConfigManager.SECRET_KEYS.GEMINI_API_KEY;
//       default:
//         return undefined;
//     }
//   }

//   /**
//    * 지원되는 제공업체 목록 반환
//    */
//   getSupportedProviders(): string[] {
//     return Object.keys(AIConfigManager.SECRET_KEYS).map(key => 
//       key.replace('_API_KEY', '').toLowerCase()
//     );
//   }

//   /**
//    * 설정 유효성 검사
//    */
//   validateConfig(config: Partial<AIConfig>): string[] {
//     const errors: string[] = [];

//     if (config.provider && !this.getSupportedProviders().includes(config.provider)) {
//       errors.push(`Unsupported provider: ${config.provider}`);
//     }

//     if (config.maxTokens !== undefined) {
//       if (typeof config.maxTokens !== 'number' || config.maxTokens < 1 || config.maxTokens > 32000) {
//         errors.push('maxTokens must be a number between 1 and 32000');
//       }
//     }

//     if (config.temperature !== undefined) {
//       if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 2) {
//         errors.push('temperature must be a number between 0 and 2');
//       }
//     }

//     if (config.baseUrl && !this.isValidUrl(config.baseUrl)) {
//       errors.push('baseUrl must be a valid URL');
//     }

//     return errors;
//   }

//   /**
//    * URL 유효성 검사
//    */
//   private isValidUrl(url: string): boolean {
//     try {
//       new URL(url);
//       return true;
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * 캐시 초기화
//    */
//   clearCache(): void {
//     this.keyStatusCache.clear();
//   }

//   /**
//    * 리소스 해제
//    */
//   dispose(): void {
//     this.clearCache();
//   }
// }