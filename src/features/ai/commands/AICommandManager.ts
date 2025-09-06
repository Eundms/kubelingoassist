// import * as vscode from 'vscode';
// import { AITranslationService } from '../services/AITranslationService';
// import { i18n } from '../../../core/i18n';

// /**
//  * AI 관련 VS Code 명령들을 관리하는 클래스
//  */
// export class AICommandManager {
//   private readonly translationService: AITranslationService;

//   constructor(private context: vscode.ExtensionContext) {
//     this.translationService = new AITranslationService(context);
//   }

//   /**
//    * API 키 설정 대화상자 표시
//    */
//   async showAPIKeySetupDialog(): Promise<void> {
//     const config = this.translationService.getConfigManager().getAIConfig();
//     const currentProvider = config.provider;

//     const items = this.translationService.getProviderInfoList().map(provider => ({
//       label: provider.name,
//       description: provider.description,
//       provider: provider.identifier
//     }));

//     const selected = await vscode.window.showQuickPick(items, {
//       placeHolder: i18n.t('ai.provider.select', currentProvider)
//     });

//     if (selected) {
//       await this.setAPIKey(selected.provider);
//     }
//   }

//   /**
//    * API 키 설정
//    */
//   async setAPIKey(provider: string): Promise<void> {
//     const apiKey = await vscode.window.showInputBox({
//       prompt: `Enter your ${provider.toUpperCase()} API Key`,
//       password: true,
//       placeHolder: 'API Key will be stored securely in VS Code Secret Storage'
//     });

//     if (apiKey) {
//       try {
//         await this.translationService.getConfigManager().setAPIKey(provider, apiKey);
//         vscode.window.showInformationMessage(
//           i18n.t('ai.apiKey.saved', provider.toUpperCase())
//         );
//       } catch (error) {
//         vscode.window.showErrorMessage(
//           i18n.t('ai.apiKey.failed', String(error))
//         );
//       }
//     }
//   }

//   /**
//    * API 키 삭제
//    */
//   async deleteAPIKey(provider: string): Promise<void> {
//     const confirm = await vscode.window.showWarningMessage(
//       `Delete ${provider.toUpperCase()} API Key?`,
//       'Delete',
//       'Cancel'
//     );

//     if (confirm === 'Delete') {
//       try {
//         await this.translationService.getConfigManager().deleteAPIKey(provider);
//         vscode.window.showInformationMessage(
//           i18n.t('ai.apiKey.deleted', provider.toUpperCase())
//         );
//       } catch (error) {
//         vscode.window.showErrorMessage(
//           i18n.t('ai.apiKey.failed', String(error))
//         );
//       }
//     }
//   }

//   /**
//    * API 키 상태 표시
//    */
//   async showAPIKeyStatus(): Promise<void> {
//     const status = await this.translationService.checkAPIKeyStatus();
//     const statusText = Object.entries(status)
//       .map(([provider, keyStatus]) => 
//         `${provider}: ${keyStatus.configured ? i18n.t('ai.apiKey.configured') : i18n.t('ai.apiKey.notConfigured')}`
//       )
//       .join('\n');

//     const action = await vscode.window.showInformationMessage(
//       i18n.t('ai.apiKey.status', statusText),
//       i18n.t('ai.apiKey.configure')
//     );

//     if (action === i18n.t('ai.apiKey.configure')) {
//       await this.showAPIKeySetupDialog();
//     }
//   }

//   /**
//    * 선택된 텍스트 번역
//    */
//   async translateSelectedText(): Promise<void> {
//     const editor = vscode.window.activeTextEditor;
//     if (!editor) {
//       vscode.window.showErrorMessage(i18n.t('ai.translation.noEditor'));
//       return;
//     }

//     const selection = editor.selection;
//     const selectedText = editor.document.getText(selection);
    
//     if (!selectedText) {
//       vscode.window.showErrorMessage(i18n.t('ai.translation.noText'));
//       return;
//     }

//     try {
//       const config = this.translationService.getConfigManager().getAIConfig();
//       const hasKey = await this.translationService.getConfigManager().hasAPIKey(config.provider);
      
//       if (!hasKey) {
//         const action = await vscode.window.showErrorMessage(
//           i18n.t('ai.apiKey.notFound', config.provider.toUpperCase()),
//           i18n.t('ai.apiKey.configure')
//         );
        
//         if (action === i18n.t('ai.apiKey.configure')) {
//           await this.setAPIKey(config.provider);
//         }
//         return;
//       }

//       const targetLanguage = await vscode.window.showInputBox({
//         prompt: i18n.t('ai.translation.selectLanguage'),
//         value: 'Korean'
//       });

//       if (!targetLanguage) return;

//       await vscode.window.withProgress({
//         location: vscode.ProgressLocation.Notification,
//         title: i18n.t('ai.translation.translating'),
//         cancellable: false
//       }, async () => {
//         try {
//           const response = await this.translationService.translateText({
//             sourceText: selectedText,
//             targetLanguage,
//             context: this.getDocumentContext(editor)
//           });

//           await editor.edit(editBuilder => {
//             editBuilder.replace(selection, response.translatedText);
//           });

//           vscode.window.showInformationMessage(i18n.t('ai.translation.completed'));
//         } catch (error) {
//           vscode.window.showErrorMessage(
//             i18n.t('ai.translation.failed', String(error))
//           );
//         }
//       });

//     } catch (error) {
//       vscode.window.showErrorMessage(
//         i18n.t('ai.translation.failed', String(error))
//       );
//     }
//   }

//   /**
//    * 번역 통계 표시
//    */
//   async showTranslationStats(): Promise<void> {
//     const stats = this.translationService.getTranslationStats();
//     const successRate = stats.totalTranslations > 0 
//       ? ((stats.successfulTranslations / stats.totalTranslations) * 100).toFixed(1)
//       : '0';

//     const message = `Translation Statistics:
// Total translations: ${stats.totalTranslations}
// Successful: ${stats.successfulTranslations}
// Failed: ${stats.failedTranslations}
// Success rate: ${successRate}%
// Tokens used: ${stats.totalTokensUsed}
// Last translation: ${stats.lastTranslation?.toLocaleString() || 'Never'}`;

//     const action = await vscode.window.showInformationMessage(
//       message,
//       'Reset Stats'
//     );

//     if (action === 'Reset Stats') {
//       this.translationService.resetStats();
//       vscode.window.showInformationMessage('Translation stats reset.');
//     }
//   }

//   /**
//    * 모든 명령 등록
//    */
//   registerCommands(): void {
//     const commands = [
//       vscode.commands.registerCommand('kubelingoassist.configureAI', () => this.showAPIKeySetupDialog()),
//       vscode.commands.registerCommand('kubelingoassist.showAPIKeyStatus', () => this.showAPIKeyStatus()),
//       vscode.commands.registerCommand('kubelingoassist.translateSelected', () => this.translateSelectedText()),
//       vscode.commands.registerCommand('kubelingoassist.showTranslationStats', () => this.showTranslationStats()),
//       vscode.commands.registerCommand('kubelingoassist.setOpenAIKey', () => this.setAPIKey('openai')),
//       vscode.commands.registerCommand('kubelingoassist.setClaudeKey', () => this.setAPIKey('claude')),
//       vscode.commands.registerCommand('kubelingoassist.setGeminiKey', () => this.setAPIKey('gemini'))
//     ];

//     this.context.subscriptions.push(...commands);
//   }

//   /**
//    * 문서 컨텍스트 추출
//    */
//   private getDocumentContext(editor: vscode.TextEditor): string {
//     const document = editor.document;
//     const fileName = document.fileName;
    
//     if (fileName.includes('kubernetes') || fileName.includes('k8s')) {
//       return 'Kubernetes documentation';
//     }
    
//     if (document.languageId === 'markdown') {
//       return 'Technical documentation (Markdown)';
//     }
    
//     return 'Technical documentation';
//   }

//   /**
//    * 번역 서비스 반환
//    */
//   getTranslationService(): AITranslationService {
//     return this.translationService;
//   }

//   /**
//    * 리소스 해제
//    */
//   dispose(): void {
//     this.translationService.dispose();
//   }
// }