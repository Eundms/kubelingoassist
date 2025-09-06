// import * as vscode from 'vscode';
// import { ConfigManager, AIConfig } from './config';

// // Global fetch for Node.js environment
// declare const fetch: any;

// /**
//  * AI 번역 요청을 위한 인터페이스입니다.
//  */
// export interface AITranslationRequest {
//   /** 번역할 원본 텍스트 */
//   sourceText: string;
//   /** 번역 대상 언어 (예: 'Korean', 'Japanese') */
//   targetLanguage: string;
//   /** 번역에 도움이 되는 추가 컨텍스트 정보 (선택사항) */
//   context?: string;
// }

// /**
//  * AI 번역 응답을 위한 인터페이스입니다.
//  */
// export interface AITranslationResponse {
//   /** 번역된 텍스트 */
//   translatedText: string;
//   /** 번역의 신뢰도 (0-1 범위, 선택사항) */
//   confidence?: number;
//   /** 대안 번역 제안들 (선택사항) */
//   suggestions?: string[];
// }

// /**
//  * 다양한 AI 제공업체를 통한 번역 서비스를 관리하는 클래스입니다.
//  * OpenAI GPT, Anthropic Claude, Google Gemini를 지원합니다.
//  */
// export class AIService {
//   private configManager: ConfigManager;

//   /**
//    * AIService 인스턴스를 생성합니다.
//    * 
//    * @param context - VS Code 확장 프로그램 컨텍스트
//    */
//   constructor(private context: vscode.ExtensionContext) {
//     this.configManager = new ConfigManager(context);
//   }

//   /**
//    * 구성된 AI 제공업체를 사용하여 텍스트를 번역합니다.
//    * 설정에 따라 OpenAI, Claude, 또는 Gemini를 자동으로 선택합니다.
//    * 
//    * @param request - 번역 요청 정보
//    * @returns 번역 결과를 포함한 응답 객체
//    * 
//    * @throws API 키가 설정되지 않은 경우
//    * @throws 지원하지 않는 AI 제공업체인 경우
//    * @throws API 호출 실패시
//    * 
//    * @example
//    * ```typescript
//    * const response = await aiService.translateText({
//    *   sourceText: 'Hello, world!',
//    *   targetLanguage: 'Korean',
//    *   context: 'Kubernetes documentation greeting'
//    * });
//    * console.log(response.translatedText); // '안녕하세요, 세계!'
//    * ```
//    */
//   async translateText(request: AITranslationRequest): Promise<AITranslationResponse> {
//     const config = this.configManager.getAIConfig();
//     const apiKey = await this.configManager.getAPIKey(config.provider);

//     if (!apiKey) {
//       throw new Error(`API key not found for ${config.provider}. Please configure your API key first.`);
//     }

//     switch (config.provider) {
//       case 'openai':
//         return this.translateWithOpenAI(request, config, apiKey);
//       case 'claude':
//         return this.translateWithClaude(request, config, apiKey);
//       case 'gemini':
//         return this.translateWithGemini(request, config, apiKey);
//       default:
//         throw new Error(`Unsupported AI provider: ${config.provider}`);
//     }
//   }

//   /**
//    * OpenAI GPT API를 사용하여 텍스트를 번역합니다.
//    * 
//    * @param request - 번역 요청 정보
//    * @param config - AI 설정 정보
//    * @param apiKey - OpenAI API 키
//    * @returns OpenAI API를 통한 번역 결과
//    * 
//    * @throws OpenAI API 호출 실패시 HTTP 에러
//    * 
//    * @private
//    */
//   private async translateWithOpenAI(
//     request: AITranslationRequest, 
//     config: AIConfig, 
//     apiKey: string
//   ): Promise<AITranslationResponse> {
//     const response = await fetch(config.baseUrl || 'https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${apiKey}`
//       },
//       body: JSON.stringify({
//         model: config.model || 'gpt-4',
//         messages: [
//           {
//             role: 'system',
//             content: `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact.`
//           },
//           {
//             role: 'user',
//             content: request.context ? 
//               `Context: ${request.context}\n\nText to translate: ${request.sourceText}` : 
//               request.sourceText
//           }
//         ],
//         max_tokens: config.maxTokens,
//         temperature: config.temperature
//       })
//     });

//     if (!response.ok) {
//       throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();
//     return {
//       translatedText: data.choices[0].message.content,
//       confidence: 0.95
//     };
//   }

//   /**
//    * Anthropic Claude API를 사용하여 텍스트를 번역합니다.
//    * 
//    * @param request - 번역 요청 정보
//    * @param config - AI 설정 정보
//    * @param apiKey - Claude API 키
//    * @returns Claude API를 통한 번역 결과
//    * 
//    * @throws Claude API 호출 실패시 HTTP 에러
//    * 
//    * @private
//    */
//   private async translateWithClaude(
//     request: AITranslationRequest, 
//     config: AIConfig, 
//     apiKey: string
//   ): Promise<AITranslationResponse> {
//     const response = await fetch(config.baseUrl || 'https://api.anthropic.com/v1/messages', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': apiKey,
//         'anthropic-version': '2023-06-01'
//       },
//       body: JSON.stringify({
//         model: config.model || 'claude-3-sonnet-20240229',
//         max_tokens: config.maxTokens,
//         messages: [
//           {
//             role: 'user',
//             content: `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact.

// ${request.context ? `Context: ${request.context}\n\n` : ''}Text to translate: ${request.sourceText}`
//           }
//         ]
//       })
//     });

//     if (!response.ok) {
//       throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();
//     return {
//       translatedText: data.content[0].text,
//       confidence: 0.95
//     };
//   }

//   /**
//    * Google Gemini API를 사용하여 텍스트를 번역합니다.
//    * 
//    * @param request - 번역 요청 정보
//    * @param config - AI 설정 정보
//    * @param apiKey - Gemini API 키
//    * @returns Gemini API를 통한 번역 결과
//    * 
//    * @throws Gemini API 호출 실패시 HTTP 에러
//    * 
//    * @private
//    */
//   private async translateWithGemini(
//     request: AITranslationRequest, 
//     config: AIConfig, 
//     apiKey: string
//   ): Promise<AITranslationResponse> {
//     const response = await fetch(
//       `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models'}/${config.model || 'gemini-pro'}:generateContent?key=${apiKey}`,
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 {
//                   text: `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact.

// ${request.context ? `Context: ${request.context}\n\n` : ''}Text to translate: ${request.sourceText}`
//                 }
//               ]
//             }
//           ],
//           generationConfig: {
//             maxOutputTokens: config.maxTokens,
//             temperature: config.temperature
//           }
//         })
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
//     }

//     const data = await response.json();
//     return {
//       translatedText: data.candidates[0].content.parts[0].text,
//       confidence: 0.95
//     };
//   }

//   /**
//    * 모든 지원되는 AI 제공업체의 API 키 설정 상태를 확인합니다.
//    * 
//    * @returns 각 제공업체별 API 키 설정 여부를 나타내는 객체
//    * 
//    * @example
//    * ```typescript
//    * const status = await aiService.checkAPIKeyStatus();
//    * // Returns: { openai: true, claude: false, gemini: true }
//    * 
//    * if (status.openai) {
//    *   console.log('OpenAI API 키가 설정되어 있습니다.');
//    * }
//    * ```
//    */
//   async checkAPIKeyStatus(): Promise<{ [provider: string]: boolean }> {
//     return {
//       openai: await this.configManager.hasAPIKey('openai'),
//       claude: await this.configManager.hasAPIKey('claude'),
//       gemini: await this.configManager.hasAPIKey('gemini')
//     };
//   }
// }