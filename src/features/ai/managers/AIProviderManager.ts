// import { IAIProvider, IAIProviderManager } from '../interfaces/IAIProvider';
// import { OpenAIProvider } from '../providers/OpenAIProvider';
// import { ClaudeProvider } from '../providers/ClaudeProvider';
// import { ConfigurationError } from '../types';

// /**
//  * AI 제공업체들을 관리하는 매니저 클래스
//  */
// export class AIProviderManager implements IAIProviderManager {
//   private providers = new Map<string, IAIProvider>();

//   constructor() {
//     this.initializeDefaultProviders();
//   }

//   /**
//    * 기본 제공업체들을 초기화
//    */
//   private initializeDefaultProviders(): void {
//     this.registerProvider(new OpenAIProvider());
//     this.registerProvider(new ClaudeProvider());
//   }

//   /**
//    * 제공업체 등록
//    */
//   registerProvider(provider: IAIProvider): void {
//     if (this.providers.has(provider.identifier)) {
//       throw new ConfigurationError(`Provider ${provider.identifier} is already registered`);
//     }
    
//     this.providers.set(provider.identifier, provider);
//   }

//   /**
//    * 제공업체 반환
//    */
//   getProvider(identifier: string): IAIProvider | null {
//     return this.providers.get(identifier) || null;
//   }

//   /**
//    * 모든 제공업체 목록 반환
//    */
//   getAllProviders(): IAIProvider[] {
//     return Array.from(this.providers.values());
//   }

//   /**
//    * 제공업체 지원 여부 확인
//    */
//   isSupported(identifier: string): boolean {
//     return this.providers.has(identifier);
//   }

//   /**
//    * 제공업체 정보 목록 반환 (UI용)
//    */
//   getProviderInfoList(): Array<{ identifier: string; name: string; description: string }> {
//     return this.getAllProviders().map(provider => ({
//       identifier: provider.identifier,
//       name: provider.name,
//       description: `Configure ${provider.name} API Key`
//     }));
//   }

//   /**
//    * 제공업체 등록 해제
//    */
//   unregisterProvider(identifier: string): boolean {
//     return this.providers.delete(identifier);
//   }

//   /**
//    * 모든 제공업체 지우기
//    */
//   clear(): void {
//     this.providers.clear();
//   }

//   /**
//    * 등록된 제공업체 수 반환
//    */
//   getProviderCount(): number {
//     return this.providers.size;
//   }
// }