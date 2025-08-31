import * as vscode from 'vscode';

// Import all separated test suites
import './translation-utils.test';
import './link-validator-basic.test';
import './link-validator-unit.test';
import './code-action-provider.test';
import './integration.test';
import './edge-cases.test';

suite('KubeLingoAssist Extension Test Suite', () => {
    vscode.window.showInformationMessage('Starting KubeLingoAssist extension tests...');
    
    // All individual test suites are automatically loaded via imports above
    // This main test suite serves as the entry point and orchestrator
    
    test('Test suite initialization', () => {
        // This test ensures the test suite loads correctly
        // Individual functionality tests are in their respective files
    });
});