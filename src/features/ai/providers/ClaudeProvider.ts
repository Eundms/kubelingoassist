import { IAIProvider, AIConfig } from '../interfaces/IAIProvider';
import { AITranslationRequest, AITranslationResponse, TranslationError } from '../types';
import fetch from 'node-fetch';
const axios = require('axios');

/**
 * Anthropic Claude 제공업체 구현
 */
export class ClaudeProvider implements IAIProvider {
  public readonly name = 'Claude (Anthropic)';
  public readonly identifier = 'claude';

  private readonly baseUrl: string;
  private readonly supportedModels = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];

  constructor(baseUrl = 'https://api.anthropic.com/v1') {
    this.baseUrl = baseUrl;
  }

  async translateText(request: AITranslationRequest, apiKey: string): Promise<AITranslationResponse> {
    try {
      // axios로 변경
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [
        {
          role: 'user',
          content: this.buildPrompt(request)
        }
          ]
        },
        {
          headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new TranslationError(
          `Claude API error: ${response.status} ${response.statusText}${errorData?.error?.message ? ` - ${errorData.error.message}` : ''}`,
          this.identifier,
          errorData
        );
      }

      const data = await response.json();
      
      return {
        translatedText: data.content[0].text,
        confidence: 0.95,
        usedModel: data.model,
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens
      };
    } catch (error) {
      if (error instanceof TranslationError) {
        throw error;
      }
      throw new TranslationError(
        `Failed to translate with Claude: ${error instanceof Error ? error.message : String(error)}`,
        this.identifier,
        error
      );
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getSupportedModels(): string[] {
    return [...this.supportedModels];
  }

  getDefaultConfig(): Partial<AIConfig> {
    return {
      model: 'claude-3-sonnet-20240229',
      maxTokens: 2000,
      temperature: 0.7
    };
  }

  private buildPrompt(request: AITranslationRequest): string {
    let prompt = `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact. Preserve markdown syntax and structure. Do not add explanations or notes, just provide the translation.\n\n`;
    
    if (request.context) {
      prompt += `Context: ${request.context}\n\n`;
    }
    
    if (request.sourceLanguage) {
      prompt += `Source language: ${request.sourceLanguage}\n`;
    }
    
    prompt += `Text to translate: ${request.sourceText}`;
    
    return prompt;
  }
}