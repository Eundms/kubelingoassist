import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    
    test('Extension should be present', () => {
        // Basic test to ensure the extension is loaded
        // More specific tests are now in separate files:
        // - translation-utils.test.ts: Translation utilities tests
        // - link-validator.test.ts: Link validation and code action tests  
        // - integration.test.ts: Integration tests and edge cases
        
        // This test just ensures the extension test suite runs
        // All detailed functionality tests have been moved to dedicated files
    });
});