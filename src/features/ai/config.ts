import * as vscode from 'vscode';

export interface AIConfig {
  provider: 'openai' | 'claude' | 'gemini';
  model?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export class ConfigManager {
  private static readonly CONFIG_SECTION = 'kubelingoassist';
  private static readonly SECRET_KEYS = {
    OPENAI_API_KEY: 'openai.apiKey',
    CLAUDE_API_KEY: 'claude.apiKey', 
    GEMINI_API_KEY: 'gemini.apiKey'
  };

  constructor(private context: vscode.ExtensionContext) {}

  getAIConfig(): AIConfig {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_SECTION);
    
    return {
      provider: config.get<'openai' | 'claude' | 'gemini'>('ai.provider', 'openai'),
      model: config.get<string>('ai.model'),
      baseUrl: config.get<string>('ai.baseUrl'),
      maxTokens: config.get<number>('ai.maxTokens', 2000),
      temperature: config.get<number>('ai.temperature', 0.7)
    };
  }

  async getAPIKey(provider: string): Promise<string | undefined> {
    const secretKey = this.getSecretKey(provider);
    if (!secretKey) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    return await this.context.secrets.get(secretKey);
  }

  async setAPIKey(provider: string, apiKey: string): Promise<void> {
    const secretKey = this.getSecretKey(provider);
    if (!secretKey) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    await this.context.secrets.store(secretKey, apiKey);
  }

  async deleteAPIKey(provider: string): Promise<void> {
    const secretKey = this.getSecretKey(provider);
    if (!secretKey) {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

    await this.context.secrets.delete(secretKey);
  }

  private getSecretKey(provider: string): string | undefined {
    switch (provider) {
      case 'openai':
        return ConfigManager.SECRET_KEYS.OPENAI_API_KEY;
      case 'claude':
        return ConfigManager.SECRET_KEYS.CLAUDE_API_KEY;
      case 'gemini':
        return ConfigManager.SECRET_KEYS.GEMINI_API_KEY;
      default:
        return undefined;
    }
  }

  async hasAPIKey(provider: string): Promise<boolean> {
    try {
      const apiKey = await this.getAPIKey(provider);
      return !!apiKey;
    } catch {
      return false;
    }
  }
}