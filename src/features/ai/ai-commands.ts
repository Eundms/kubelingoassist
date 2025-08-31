import * as vscode from 'vscode';
import { ConfigManager } from './config';
import { AIService } from './ai-service';

export class AICommands {
  private configManager: ConfigManager;
  private aiService: AIService;

  constructor(private context: vscode.ExtensionContext) {
    this.configManager = new ConfigManager(context);
    this.aiService = new AIService(context);
  }

  async showAPIKeySetupDialog(): Promise<void> {
    const config = this.configManager.getAIConfig();
    const currentProvider = config.provider;

    const items = [
      {
        label: 'OpenAI',
        description: 'Set OpenAI API Key',
        provider: 'openai' as const
      },
      {
        label: 'Claude (Anthropic)',
        description: 'Set Claude API Key', 
        provider: 'claude' as const
      },
      {
        label: 'Gemini (Google)',
        description: 'Set Gemini API Key',
        provider: 'gemini' as const
      }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Current provider: ${currentProvider}. Select API provider to configure:`
    });

    if (selected) {
      await this.setAPIKey(selected.provider);
    }
  }

  async setAPIKey(provider: string): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
      prompt: `Enter your ${provider.toUpperCase()} API Key`,
      password: true,
      placeHolder: 'API Key will be stored securely in VS Code Secret Storage'
    });

    if (apiKey) {
      try {
        await this.configManager.setAPIKey(provider, apiKey);
        vscode.window.showInformationMessage(`${provider.toUpperCase()} API Key saved securely.`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to save API key: ${error}`);
      }
    }
  }

  async deleteAPIKey(provider: string): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `Delete ${provider.toUpperCase()} API Key?`,
      'Delete',
      'Cancel'
    );

    if (confirm === 'Delete') {
      try {
        await this.configManager.deleteAPIKey(provider);
        vscode.window.showInformationMessage(`${provider.toUpperCase()} API Key deleted.`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete API key: ${error}`);
      }
    }
  }

  async showAPIKeyStatus(): Promise<void> {
    const status = await this.aiService.checkAPIKeyStatus();
    const statusText = Object.entries(status)
      .map(([provider, hasKey]) => `${provider}: ${hasKey ? '✓ Configured' : '✗ Not configured'}`)
      .join('\n');

    vscode.window.showInformationMessage(
      `API Key Status:\n${statusText}`,
      'Configure API Keys'
    ).then(action => {
      if (action === 'Configure API Keys') {
        this.showAPIKeySetupDialog();
      }
    });
  }

  async translateSelectedText(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    
    if (!selectedText) {
      vscode.window.showErrorMessage('No text selected');
      return;
    }

    try {
      const config = this.configManager.getAIConfig();
      const hasKey = await this.configManager.hasAPIKey(config.provider);
      
      if (!hasKey) {
        const action = await vscode.window.showErrorMessage(
          `No API key configured for ${config.provider.toUpperCase()}`,
          'Configure API Key'
        );
        
        if (action === 'Configure API Key') {
          await this.setAPIKey(config.provider);
        }
        return;
      }

      const targetLanguage = await vscode.window.showInputBox({
        prompt: 'Enter target language (e.g., Korean, Japanese, Spanish)',
        value: 'Korean'
      });

      if (!targetLanguage) return;

      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Translating...',
        cancellable: false
      }, async () => {
        try {
          const response = await this.aiService.translateText({
            sourceText: selectedText,
            targetLanguage
          });

          await editor.edit(editBuilder => {
            editBuilder.replace(selection, response.translatedText);
          });

          vscode.window.showInformationMessage('Translation completed!');
        } catch (error) {
          vscode.window.showErrorMessage(`Translation failed: ${error}`);
        }
      });

    } catch (error) {
      vscode.window.showErrorMessage(`Failed to translate: ${error}`);
    }
  }

  registerCommands(): void {
    this.context.subscriptions.push(
      vscode.commands.registerCommand('kubelingoassist.configureAI', () => this.showAPIKeySetupDialog()),
      vscode.commands.registerCommand('kubelingoassist.showAPIKeyStatus', () => this.showAPIKeyStatus()),
      vscode.commands.registerCommand('kubelingoassist.translateSelected', () => this.translateSelectedText()),
      vscode.commands.registerCommand('kubelingoassist.setOpenAIKey', () => this.setAPIKey('openai')),
      vscode.commands.registerCommand('kubelingoassist.setClaudeKey', () => this.setAPIKey('claude')),
      vscode.commands.registerCommand('kubelingoassist.setGeminiKey', () => this.setAPIKey('gemini'))
    );
  }
}