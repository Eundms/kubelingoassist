import * as vscode from 'vscode';
import { ConfigManager, AIConfig } from './config';

// Global fetch for Node.js environment
declare const fetch: any;

export interface AITranslationRequest {
  sourceText: string;
  targetLanguage: string;
  context?: string;
}

export interface AITranslationResponse {
  translatedText: string;
  confidence?: number;
  suggestions?: string[];
}

export class AIService {
  private configManager: ConfigManager;

  constructor(private context: vscode.ExtensionContext) {
    this.configManager = new ConfigManager(context);
  }

  async translateText(request: AITranslationRequest): Promise<AITranslationResponse> {
    const config = this.configManager.getAIConfig();
    const apiKey = await this.configManager.getAPIKey(config.provider);

    if (!apiKey) {
      throw new Error(`API key not found for ${config.provider}. Please configure your API key first.`);
    }

    switch (config.provider) {
      case 'openai':
        return this.translateWithOpenAI(request, config, apiKey);
      case 'claude':
        return this.translateWithClaude(request, config, apiKey);
      case 'gemini':
        return this.translateWithGemini(request, config, apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  private async translateWithOpenAI(
    request: AITranslationRequest, 
    config: AIConfig, 
    apiKey: string
  ): Promise<AITranslationResponse> {
    const response = await fetch(config.baseUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact.`
          },
          {
            role: 'user',
            content: request.context ? 
              `Context: ${request.context}\n\nText to translate: ${request.sourceText}` : 
              request.sourceText
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      translatedText: data.choices[0].message.content,
      confidence: 0.95
    };
  }

  private async translateWithClaude(
    request: AITranslationRequest, 
    config: AIConfig, 
    apiKey: string
  ): Promise<AITranslationResponse> {
    const response = await fetch(config.baseUrl || 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens,
        messages: [
          {
            role: 'user',
            content: `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact.

${request.context ? `Context: ${request.context}\n\n` : ''}Text to translate: ${request.sourceText}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      translatedText: data.content[0].text,
      confidence: 0.95
    };
  }

  private async translateWithGemini(
    request: AITranslationRequest, 
    config: AIConfig, 
    apiKey: string
  ): Promise<AITranslationResponse> {
    const response = await fetch(
      `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models'}/${config.model || 'gemini-pro'}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a professional translator specializing in Kubernetes documentation. Translate the following text to ${request.targetLanguage}. Maintain technical accuracy and keep code blocks, links, and formatting intact.

${request.context ? `Context: ${request.context}\n\n` : ''}Text to translate: ${request.sourceText}`
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      translatedText: data.candidates[0].content.parts[0].text,
      confidence: 0.95
    };
  }

  async checkAPIKeyStatus(): Promise<{ [provider: string]: boolean }> {
    return {
      openai: await this.configManager.hasAPIKey('openai'),
      claude: await this.configManager.hasAPIKey('claude'),
      gemini: await this.configManager.hasAPIKey('gemini')
    };
  }
}