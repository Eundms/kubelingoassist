// import { IAIProvider, AIConfig } from '../interfaces/IAIProvider';
// import { AITranslationRequest, AITranslationResponse, TranslationError } from '../types';

// /**
//  * OpenAI GPT 제공업체 구현
//  */
// export class OpenAIProvider implements IAIProvider {
//   public readonly name = 'OpenAI';
//   public readonly identifier = 'openai';

//   private readonly baseUrl: string;
//   private readonly supportedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];

//   constructor(baseUrl = 'https://api.openai.com/v1') {
//     this.baseUrl = baseUrl;
//   }

//   async translateText(request: AITranslationRequest, apiKey: string): Promise<AITranslationResponse> {
//     try {
//       const response = await fetch(`${this.baseUrl}/chat/completions`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${apiKey}`
//         },
//         body: JSON.stringify({
//           model: 'gpt-4',
//           messages: [
//             {
//               role: 'system',
//               content: this.buildSystemPrompt(request.targetLanguage)
//             },
//             {
//               role: 'user',
//               content: this.buildUserPrompt(request)
//             }
//           ],
//           max_tokens: 2000,
//           temperature: 0.7
//         })
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => null);
//         throw new TranslationError(
//           `OpenAI API error: ${response.status} ${response.statusText}${errorData?.error?.message ? ` - ${errorData.error.message}` : ''}`,
//           this.identifier,
//           errorData
//         );
//       }

//       const data = await response.json();
      
//       return {
//         translatedText: data.choices[0].message.content,
//         confidence: 0.95,
//         usedModel: data.model,
//         tokensUsed: data.usage?.total_tokens
//       };
//     } catch (error) {
//       if (error instanceof TranslationError) {
//         throw error;
//       }
//       throw new TranslationError(
//         `Failed to translate with OpenAI: ${error instanceof Error ? error.message : String(error)}`,
//         this.identifier,
//         error
//       );
//     }
//   }

//   async validateApiKey(apiKey: string): Promise<boolean> {
//     try {
//       const response = await fetch(`${this.baseUrl}/models`, {
//         headers: {
//           'Authorization': `Bearer ${apiKey}`
//         }
//       });
//       return response.ok;
//     } catch {
//       return false;
//     }
//   }

//   getSupportedModels(): string[] {
//     return [...this.supportedModels];
//   }

//   getDefaultConfig(): Partial<AIConfig> {
//     return {
//       model: 'gpt-4',
//       maxTokens: 2000,
//       temperature: 0.7
//     };
//   }

//   private buildSystemPrompt(targetLanguage: string): string {
//     return `You are a professional translator specializing in Kubernetes documentation. 
// Translate the following text to ${targetLanguage}. 
// Maintain technical accuracy and keep code blocks, links, and formatting intact.
// Preserve markdown syntax and structure.
// Do not add explanations or notes, just provide the translation.`;
//   }

//   private buildUserPrompt(request: AITranslationRequest): string {
//     let prompt = '';
    
//     if (request.context) {
//       prompt += `Context: ${request.context}\n\n`;
//     }
    
//     if (request.sourceLanguage) {
//       prompt += `Source language: ${request.sourceLanguage}\n`;
//     }
    
//     prompt += `Text to translate: ${request.sourceText}`;
    
//     return prompt;
//   }
// }