import * as assert from 'assert';
import * as vscode from 'vscode';
import { LinkValidator, LinkCodeActionProvider } from '../../validators/link';

suite('Integration Tests', () => {
    let linkValidator: LinkValidator;
    let codeActionProvider: LinkCodeActionProvider;
    
    setup(() => {
        linkValidator = new LinkValidator();
        codeActionProvider = new LinkCodeActionProvider();
    });
    
    teardown(() => {
        linkValidator.dispose();
        codeActionProvider.dispose();
    });

    test('should work end-to-end: validation to code action', () => {
        const mockText = `# Integration Test
This is a [test link](/docs/concepts/overview) that needs fixing.
This [already fixed link](/ko/docs/concepts/overview) should be ignored.`;

        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(Math.floor(offset / 50), offset % 50),
            uri: vscode.Uri.file('/content/ko/docs/integration-test.md')
        } as vscode.TextDocument;

        // Mock fileExists to return true for testing
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = (path: string) => path.includes('ko/docs/concepts/overview.md');

        // Step 1: Validate and get diagnostics
        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        assert.strictEqual(diagnosticCount, 1, 'Should find one diagnostic');

        const diagnostics = linkValidator.getDiagnostics().get(mockDocument.uri) || [];
        assert.strictEqual(diagnostics.length, 1, 'Should have one diagnostic in collection');

        // Step 2: Create code action from diagnostic
        const diagnostic = diagnostics[0];
        const mockContext = {
            diagnostics: [diagnostic],
            triggerKind: 1,
            only: undefined
        } as vscode.CodeActionContext;

        const actions = codeActionProvider.provideCodeActions(
            mockDocument,
            diagnostic.range,
            mockContext,
            { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) } as any
        );

        assert.strictEqual(actions.length, 1, 'Should provide one code action');
        
        const action = actions[0];
        assert.ok(action.edit, 'Code action should have edit');
        assert.ok(action.edit.has(mockDocument.uri), 'Edit should target correct document');
        
        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should handle multiple documents simultaneously', () => {
        const documents = [
            {
                getText: () => '[link1](/docs/concepts/overview1)',
                positionAt: (offset: number) => new vscode.Position(0, offset),
                uri: vscode.Uri.file('/content/ko/docs/doc1.md')
            },
            {
                getText: () => '[link2](/docs/concepts/overview2)',
                positionAt: (offset: number) => new vscode.Position(0, offset),
                uri: vscode.Uri.file('/content/ja/docs/doc2.md')
            },
            {
                getText: () => '[link3](/docs/concepts/overview3)',
                positionAt: (offset: number) => new vscode.Position(0, offset),
                uri: vscode.Uri.file('/content/zh-cn/docs/doc3.md')
            }
        ] as vscode.TextDocument[];

        // Mock file existence for all documents
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = () => true;

        // Validate all documents
        const diagnosticCounts = documents.map(doc => linkValidator.validateLinks(doc));
        
        // Verify all validations completed
        diagnosticCounts.forEach((count, index) => {
            assert.strictEqual(count, 1, `Document ${index + 1} should have 1 diagnostic`);
        });

        // Verify diagnostics are stored separately
        documents.forEach((doc, index) => {
            const diagnostics = linkValidator.getDiagnostics().get(doc.uri);
            assert.ok(diagnostics, `Document ${index + 1} should have diagnostics`);
            assert.strictEqual(diagnostics!.length, 1, `Document ${index + 1} should have 1 diagnostic`);
        });

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should integrate with VS Code diagnostic collection', () => {
        const mockText = '[test link](/docs/concepts/overview)';
        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/test.md')
        } as vscode.TextDocument;

        // Mock file existence
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = () => true;

        // Validate document
        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        assert.strictEqual(diagnosticCount, 1, 'Should generate diagnostic');

        // Verify diagnostic collection has the diagnostic
        const diagnostics = linkValidator.getDiagnostics().get(mockDocument.uri);
        assert.ok(diagnostics, 'Should have diagnostics in collection');
        assert.strictEqual(diagnostics!.length, 1, 'Should have one diagnostic');

        const diagnostic = diagnostics![0];
        assert.strictEqual(diagnostic.source, 'KubeLingoAssist', 'Diagnostic should have correct source');
        assert.strictEqual(diagnostic.code, 'missing-language-path', 'Diagnostic should have correct code');

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });
});

suite('Edge Cases and Error Handling', () => {
    let linkValidator: LinkValidator;
    let codeActionProvider: LinkCodeActionProvider;
    
    setup(() => {
        linkValidator = new LinkValidator();
        codeActionProvider = new LinkCodeActionProvider();
    });
    
    teardown(() => {
        linkValidator.dispose();
        codeActionProvider.dispose();
    });

    test('should handle empty document gracefully', () => {
        const mockDocument = {
            getText: () => '',
            positionAt: (offset: number) => new vscode.Position(0, 0),
            uri: vscode.Uri.file('/content/ko/docs/empty.md')
        } as vscode.TextDocument;

        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        assert.strictEqual(diagnosticCount, 0, 'Empty document should have no diagnostics');
    });

    test('should handle document with malformed links', () => {
        const mockText = `# Malformed Links Test
This is a [broken link(/docs/concepts/overview) - missing closing bracket
This is another [broken](/docs/concepts incomplete - missing closing paren
This is a ]wrong bracket[(/docs/concepts/overview) - wrong bracket order
This is a [valid link](/docs/concepts/overview) - should work
Another [valid link too](/docs/reference/guide) - should also work`;

        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/malformed.md')
        } as vscode.TextDocument;

        // Mock fileExists to return true
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = () => true;

        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        assert.strictEqual(diagnosticCount, 3, 'Should find three valid links (including the malformed one that was partially matched)');

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should handle very long file paths', () => {
        const longPath = '/content/ko/docs/' + 'very-long-path-segment/'.repeat(20) + 'final-file.md';
        const mockDocument = {
            getText: () => '[long path link](/docs/very-long/path)',
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file(longPath)
        } as vscode.TextDocument;

        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        // Should not crash, result depends on fileExists mock
        assert.ok(diagnosticCount >= 0, 'Should handle long paths without crashing');
    });

    test('should handle special characters in links', () => {
        const mockText = `# Special Characters Test
[link with spaces](/docs/concepts/overview with spaces)
[link with unicode](/docs/concepts/개념-설명)
[link with numbers](/docs/v1.2.3/api-reference)
[link with dashes](/docs/multi-word-concept/sub-topic)
[link with underscores](/docs/some_file_name/another_file)`;

        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/special-chars.md')
        } as vscode.TextDocument;

        const links = (linkValidator as any).extractLinks(mockDocument);
        assert.strictEqual(links.length, 5, 'Should extract all links with special characters');
        
        // Verify some special character handling
        assert.ok(links.some((link: any) => link.path.includes('overview with spaces')));
        assert.ok(links.some((link: any) => link.path.includes('개념-설명')));
        assert.ok(links.some((link: any) => link.path.includes('v1.2.3')));
    });

    test('should handle concurrent validation calls', () => {
        const mockDocument1 = {
            getText: () => '[link1](/docs/concepts/overview1)',
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/doc1.md')
        } as vscode.TextDocument;

        const mockDocument2 = {
            getText: () => '[link2](/docs/concepts/overview2)',
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ja/docs/doc2.md')
        } as vscode.TextDocument;

        // Simulate concurrent calls
        const count1 = linkValidator.validateLinks(mockDocument1);
        const count2 = linkValidator.validateLinks(mockDocument2);

        assert.ok(count1 >= 0, 'First validation should complete successfully');
        assert.ok(count2 >= 0, 'Second validation should complete successfully');
        
        // Verify diagnostics are stored separately
        const diag1 = linkValidator.getDiagnostics().get(mockDocument1.uri);
        const diag2 = linkValidator.getDiagnostics().get(mockDocument2.uri);
        
        assert.ok(diag1 !== diag2, 'Diagnostics should be stored separately per document');
    });

    test('should handle non-translation files correctly', () => {
        const testCases = [
            '/content/en/docs/concepts/overview.md',  // English file
            '/other/path/file.md',                    // Non-content path
            '/content/invalid.md',                    // Invalid content structure
            '/README.md'                              // Root file
        ];

        testCases.forEach(filePath => {
            const mockDocument = {
                getText: () => '[test link](/docs/concepts/overview)',
                positionAt: (offset: number) => new vscode.Position(0, offset),
                uri: vscode.Uri.file(filePath)
            } as vscode.TextDocument;

            const diagnosticCount = linkValidator.validateLinks(mockDocument);
            assert.strictEqual(diagnosticCount, 0, `Non-translation file should have 0 diagnostics: ${filePath}`);
        });
    });

    test('should handle code action provider errors gracefully', () => {
        const mockDocument = {
            getText: (range: vscode.Range) => {
                throw new Error('Mock error in getText');
            },
            uri: vscode.Uri.file('/content/ko/docs/error.md')
        } as any;

        const mockDiagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 10),
            'Test diagnostic',
            vscode.DiagnosticSeverity.Warning
        );
        mockDiagnostic.source = 'KubeLingoAssist';
        mockDiagnostic.code = 'missing-language-path';

        const action = (codeActionProvider as any).createFixLanguagePathAction(mockDocument, mockDiagnostic);
        assert.strictEqual(action, undefined, 'Should return undefined when error occurs');
    });

    test('should validate regex patterns correctly', () => {
        const testCases = [
            { text: '[test](/docs/overview)', shouldMatch: true },
            { text: '[test](/docs/overview/)', shouldMatch: true },
            { text: '[test](/docs/overview.md)', shouldMatch: true },
            { text: '[test](/docs/sub/path/file)', shouldMatch: true },
            { text: '[test](/ko/docs/overview)', shouldMatch: false },  // Has language code
            { text: '[test](https://example.com)', shouldMatch: false },  // External link
            { text: '[test](/other/path)', shouldMatch: false },          // Not /docs/
            { text: 'plain text', shouldMatch: false },                   // No link
            { text: '[test]', shouldMatch: false },                       // No URL
            { text: '(/docs/overview)', shouldMatch: false }               // No link text
        ];

        testCases.forEach(({ text, shouldMatch }) => {
            // Create new regex for each test to avoid global state issues
            const LINK_REGEX = /\[([^\]]*)\]\(\/docs\/([^)]*)\)/;
            const matches = LINK_REGEX.test(text);
            assert.strictEqual(matches, shouldMatch, `Regex test failed for: "${text}"`);
        });
    });

    test('should handle specific common-labels link case', () => {
        const mockText = '[일반적으로 사용하는 레이블](/docs/concepts/overview/working-with-objects/common-labels/)이며';
        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/test.md')
        } as vscode.TextDocument;

        // Mock fileExists to return true for common-labels
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = (path: string) => {
            console.log('Checking file:', path);
            return path.includes('common-labels');
        };

        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        console.log('Diagnostic count for common-labels:', diagnosticCount);
        
        const diagnostics = linkValidator.getDiagnostics().get(mockDocument.uri) || [];
        console.log('Diagnostics found:', diagnostics.length);
        diagnostics.forEach(d => console.log('Diagnostic message:', d.message));
        
        assert.strictEqual(diagnosticCount, 1, 'Should find one diagnostic for common-labels link');

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should debug real path issues', () => {
        // Test with realistic paths
        const realWebsitePath = '/Users/eundms/Ossa/website/content/ko/docs/test.md';
        const extensionPath = '/Users/eundms/Ossa/k8s-translation-helper/test.md';
        
        console.log('Testing isTranslationFile with real paths:');
        console.log('Website path:', realWebsitePath, '-> isTranslation:', (linkValidator as any).isTranslationFile(realWebsitePath));
        console.log('Extension path:', extensionPath, '-> isTranslation:', (linkValidator as any).isTranslationFile(extensionPath));
        
        // Test getExpectedTranslationPath logic
        const linkPath = 'concepts/overview/working-with-objects/common-labels/';
        const language = 'ko';
        
        console.log('Testing getExpectedTranslationPath:');
        const expectedPath = (linkValidator as any).getExpectedTranslationPath(realWebsitePath, linkPath, language);
        console.log('Expected path:', expectedPath);
        
        // Check if the actual file exists
        const fs = require('fs');
        if (expectedPath) {
            const exists = fs.existsSync(expectedPath);
            console.log('File actually exists:', exists);
        }
    });
});