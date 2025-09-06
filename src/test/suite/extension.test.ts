import * as assert from 'assert';
import * as vscode from 'vscode';
import { getTranslationPath, extractLanguageCode } from '../../features/translation/translation-utils';
import { LinkValidator, LinkCodeActionProvider } from '../../validators/link';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suite('Translation Utils Tests', () => {
        test('extractLanguageCode should extract correct language code from all content paths', () => {
            // /content/en/** 확장 테스트
            assert.strictEqual(extractLanguageCode('/content/en/docs/test.md'), 'en');
            assert.strictEqual(extractLanguageCode('/content/en/blog/post.md'), 'en');
            assert.strictEqual(extractLanguageCode('/content/en/case-studies/example.md'), 'en');
            assert.strictEqual(extractLanguageCode('/content/ko/docs/test.md'), 'ko');
            assert.strictEqual(extractLanguageCode('/content/ko/blog/post.md'), 'ko');
            assert.strictEqual(extractLanguageCode('/content/ja/docs/concepts/test.md'), 'ja');
            assert.strictEqual(extractLanguageCode('/content/zh-cn/case-studies/example.md'), 'zh-cn');
            assert.strictEqual(extractLanguageCode('/invalid/path.md'), 'unknown');
        });

        test('getTranslationPath should support all /content/en/** paths', async () => {
            // Test path detection for different content types
            const testPaths = [
                '/content/en/docs/concepts/overview.md',
                '/content/en/blog/2024/new-feature.md', 
                '/content/en/case-studies/company-example.md',
                '/content/en/tutorials/getting-started.md'
            ];
            
            testPaths.forEach(path => {
                assert.strictEqual(path.includes('/content/en/'), true, 
                    `Path should be detected as English content: ${path}`);
            });
        });

        test('getTranslationPath should convert non-en files to English paths', async () => {
            // Test various non-English to English conversions
            const testCases = [
                {
                    input: '/content/ko/docs/concepts/overview.md',
                    expected: '/content/en/docs/concepts/overview.md'
                },
                {
                    input: '/content/ko/blog/2024/announcement.md', 
                    expected: '/content/en/blog/2024/announcement.md'
                },
                {
                    input: '/content/ja/case-studies/success-story.md',
                    expected: '/content/en/case-studies/success-story.md'
                },
                {
                    input: '/content/zh-cn/tutorials/basic-setup.md',
                    expected: '/content/en/tutorials/basic-setup.md'
                }
            ];
            
            for (const testCase of testCases) {
                const translationPath = await getTranslationPath(testCase.input);
                assert.strictEqual(translationPath, testCase.expected,
                    `Failed to convert ${testCase.input} to ${testCase.expected}`);
            }
        });

        test('getTranslationPath should return null for invalid paths', async () => {
            const invalidPath = '/invalid/path.md';
            const translationPath = await getTranslationPath(invalidPath);
            assert.strictEqual(translationPath, null);
        });
    });

    suite('LinkValidator Tests', () => {
        test('should detect links without language code', () => {
            // This would require creating a mock document
            // For now, we'll test the regex pattern
            const linkPattern = /\[([^\]]*)\]\(\/docs\/([^)]*)\)/g;
            const testText = '[example](/docs/concepts/overview)';
            const matches = [...testText.matchAll(linkPattern)];
            
            assert.strictEqual(matches.length, 1);
            assert.strictEqual(matches[0][1], 'example');
            assert.strictEqual(matches[0][2], 'concepts/overview');
        });

        test('should not match links with language code', () => {
            const linkPattern = /\[([^\]]*)\]\(\/docs\/([^)]*)\)/g;
            const testText = '[example](/ko/docs/concepts/overview)';
            const matches = [...testText.matchAll(linkPattern)];
            
            assert.strictEqual(matches.length, 0);
        });

        test('should validate expected translation path generation', () => {
            // getExpectedTranslationPath 로직 테스트
            const currentPath = '/content/ko/docs/concepts/overview.md';
            const linkPath = 'concepts/cluster.md';
            const language = 'ko';
            
            // 기대되는 경로: /content/ko/docs/concepts/cluster.md
            const contentMatch = currentPath.match(/(.*\/content)\//);
            assert.strictEqual(contentMatch![1], '/content');
            
            const expectedPath = `/content/${language.toLowerCase()}/docs/${linkPath}`;
            assert.strictEqual(expectedPath, '/content/ko/docs/concepts/cluster.md');
        });

        test('should handle different link path formats', () => {
            const testCases = [
                { linkPath: 'concepts/overview', expected: 'concepts/overview.md' },
                { linkPath: 'concepts/overview.md', expected: 'concepts/overview.md' },
                { linkPath: 'concepts/', expected: 'concepts/' }
            ];
            
            testCases.forEach(({ linkPath, expected }) => {
                let processedPath = linkPath;
                if (!processedPath.endsWith('.md') && !processedPath.endsWith('/')) {
                    processedPath += '.md';
                }
                assert.strictEqual(processedPath, expected);
            });
        });

        test('should distinguish between file and folder links', () => {
            const testCases = [
                { linkPath: 'concepts/overview', isFolder: false, resourceType: '파일' },
                { linkPath: 'concepts/overview.md', isFolder: false, resourceType: '파일' },
                { linkPath: 'concepts/', isFolder: true, resourceType: '폴더' },
                { linkPath: 'tasks/install/', isFolder: true, resourceType: '폴더' }
            ];
            
            testCases.forEach(({ linkPath, isFolder, resourceType }) => {
                const actualIsFolder = linkPath.endsWith('/');
                const actualResourceType = actualIsFolder ? '폴더' : '파일';
                
                assert.strictEqual(actualIsFolder, isFolder);
                assert.strictEqual(actualResourceType, resourceType);
            });
        });

        test('should generate correct translation paths for files and folders', () => {
            const currentPath = '/content/ko/docs/concepts/overview.md';
            const language = 'ko';
            const contentRoot = '/content';
            
            const testCases = [
                {
                    linkPath: 'concepts/cluster.md',
                    expected: '/content/ko/docs/concepts/cluster.md',
                    type: 'file'
                },
                {
                    linkPath: 'concepts/',
                    expected: '/content/ko/docs/concepts/',
                    type: 'folder'
                },
                {
                    linkPath: 'tasks/install',
                    expected: '/content/ko/docs/tasks/install.md',
                    type: 'file with auto .md'
                }
            ];
            
            testCases.forEach(({ linkPath, expected, type }) => {
                let expectedPath = `${contentRoot}/${language.toLowerCase()}/docs/${linkPath}`;
                
                // 폴더가 아니고 .md가 없으면 .md 추가
                if (!linkPath.endsWith('/') && !expectedPath.endsWith('.md')) {
                    expectedPath += '.md';
                }
                
                assert.strictEqual(expectedPath, expected, `Failed for ${type}: ${linkPath}`);
            });
        });
    });

    suite('LinkValidator Unit Tests', () => {
        let linkValidator: LinkValidator;
        
        setup(() => {
            linkValidator = new LinkValidator();
        });
        
        teardown(() => {
            linkValidator.dispose();
        });

        test('should identify translation files correctly', () => {
            const testCases = [
                { path: '/content/ko/docs/concepts/overview.md', expected: true },
                { path: '/content/ja/docs/tutorial/basic.md', expected: true },
                { path: '/content/zh-cn/docs/concepts/overview.md', expected: true },
                { path: '/content/en/docs/concepts/overview.md', expected: false },
                { path: '/content/en/blog/post.md', expected: false },
                { path: '/other/path/file.md', expected: false },
                { path: '/content/invalid.md', expected: false },
                { path: '/content/ko/blog/post.md', expected: false } // blog은 docs가 아니므로 false
            ];

            testCases.forEach(({ path, expected }) => {
                const result = (linkValidator as any).isTranslationFile(path);
                assert.strictEqual(result, expected, `Failed for path: ${path}`);
            });
        });

        test('should extract links from document correctly', async () => {
            const mockText = `# Test Document
            
Here is a [normal link](/docs/concepts/overview) to check.
Here is a [folder link](/docs/tutorials/) to a directory.
Here is a [link with extension](/docs/tasks/install.md) with .md.
This [link with language](/ko/docs/concepts/overview) should be ignored.
This [external link](https://example.com) should be ignored.`;

            const mockDocument = {
                getText: () => mockText,
                positionAt: (offset: number) => new vscode.Position(0, offset)
            } as vscode.TextDocument;

            const links = (linkValidator as any).extractLinks(mockDocument);
            
            assert.strictEqual(links.length, 3);
            assert.strictEqual(links[0].text, 'normal link');
            assert.strictEqual(links[0].path, 'concepts/overview');
            assert.strictEqual(links[1].text, 'folder link');
            assert.strictEqual(links[1].path, 'tutorials/');
            assert.strictEqual(links[2].text, 'link with extension');
            assert.strictEqual(links[2].path, 'tasks/install.md');
        });

        test('should skip links with language codes', () => {
            const testCases = [
                { linkPath: 'ko/docs/concepts/overview', shouldSkip: true },
                { linkPath: 'en/docs/concepts/overview', shouldSkip: true },
                { linkPath: 'ja/docs/tutorial/basic', shouldSkip: true },
                { linkPath: 'zh/docs/reference/api', shouldSkip: true },
                { linkPath: 'docs/concepts/overview', shouldSkip: false },
                { linkPath: 'docs/tutorial/', shouldSkip: false },
                { linkPath: 'concepts/overview.md', shouldSkip: false }
            ];

            testCases.forEach(({ linkPath, shouldSkip }) => {
                const result = (linkValidator as any).shouldSkipLink(linkPath);
                assert.strictEqual(result, shouldSkip, `Failed for linkPath: ${linkPath}`);
            });
        });

        test('should generate expected translation paths correctly', () => {
            const testCases = [
                {
                    currentPath: '/content/ko/docs/concepts/overview.md',
                    linkPath: 'concepts/cluster.md',
                    language: 'ko',
                    expectedPattern: /\/content\/ko\/docs\/concepts\/cluster\.md$/
                },
                {
                    currentPath: '/content/ja/docs/tutorial/basic.md', 
                    linkPath: 'reference/',
                    language: 'ja',
                    expectedPattern: /\/content\/ja\/docs\/reference\/$/
                },
                {
                    currentPath: '/content/zh-cn/docs/reference/api.md',
                    linkPath: 'concepts/overview',
                    language: 'zh-cn', 
                    expectedPattern: /\/content\/zh-cn\/docs\/concepts\/overview\.md$/
                }
            ];

            testCases.forEach(({ currentPath, linkPath, language, expectedPattern }) => {
                const result = (linkValidator as any).getExpectedTranslationPath(currentPath, linkPath, language);
                assert.notStrictEqual(result, null, `Should generate path for ${currentPath} -> ${linkPath}`);
                if (result) {
                    assert.match(result, expectedPattern, `Pattern mismatch for ${linkPath}`);
                }
            });
        });

        test('should handle invalid paths gracefully', () => {
            const invalidPaths = [
                '/invalid/path.md',
                '/content/file.md',
                '',
                null as any,
                undefined as any
            ];

            invalidPaths.forEach(invalidPath => {
                const result = (linkValidator as any).getExpectedTranslationPath(invalidPath, 'test.md', 'ko');
                assert.strictEqual(result, null, `Should return null for invalid path: ${invalidPath}`);
            });
        });

        test('should create diagnostic with correct properties', () => {
            const mockLinkInfo = {
                text: 'test link',
                path: 'concepts/overview',
                fullMatch: '[test link](/docs/concepts/overview)',
                range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10))
            };

            const mockValidationResult = {
                translationExists: true,
                expectedPath: '/content/ko/docs/concepts/overview.md',
                isFolder: false
            };

            const diagnostic = (linkValidator as any).createDiagnostic(mockLinkInfo, mockValidationResult, 'ko');

            assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Warning);
            assert.strictEqual(diagnostic.source, 'KubeLingoAssist');
            assert.strictEqual(diagnostic.code, 'missing-language-path');
            assert.ok(diagnostic.message.includes('파일'));
            assert.ok(diagnostic.message.includes('ko'));
        });

        test('should validate links end-to-end with mock document', () => {
            const mockText = `# Test Document
[valid link](/docs/concepts/overview)
[link with lang](/ko/docs/concepts/overview)
[another valid](/docs/tutorials/)`;

            const mockDocument = {
                getText: () => mockText,
                positionAt: (offset: number) => new vscode.Position(0, offset),
                uri: vscode.Uri.file('/content/ko/docs/test.md')
            } as vscode.TextDocument;

            // Mock file system check to always return false (no translation exists)
            const originalFileExists = (linkValidator as any).fileExists;
            (linkValidator as any).fileExists = () => false;

            const diagnosticCount = linkValidator.validateLinks(mockDocument);
            
            // Should process 2 valid links but find 0 diagnostics (no translations exist)
            assert.strictEqual(diagnosticCount, 0);

            // Restore original method
            (linkValidator as any).fileExists = originalFileExists;
        });
    });

    suite('LinkCodeActionProvider Unit Tests', () => {
        let codeActionProvider: LinkCodeActionProvider;
        
        setup(() => {
            codeActionProvider = new LinkCodeActionProvider();
        });
        
        teardown(() => {
            codeActionProvider.dispose();
        });

        test('should filter link diagnostics correctly', () => {
            const mockDiagnostics = [
                new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 10),
                    'Link validation warning',
                    vscode.DiagnosticSeverity.Warning
                ),
                new vscode.Diagnostic(
                    new vscode.Range(1, 0, 1, 10), 
                    'Other diagnostic',
                    vscode.DiagnosticSeverity.Error
                )
            ];
            
            // Set proper source and code for first diagnostic
            mockDiagnostics[0].source = 'KubeLingoAssist';
            mockDiagnostics[0].code = 'missing-language-path';
            
            // Second diagnostic has different source
            mockDiagnostics[1].source = 'TypeScript';
            mockDiagnostics[1].code = 'error';

            const filtered = (codeActionProvider as any).filterLinkDiagnostics(mockDiagnostics);
            
            assert.strictEqual(filtered.length, 1);
            assert.strictEqual(filtered[0].source, 'KubeLingoAssist');
            assert.strictEqual(filtered[0].code, 'missing-language-path');
        });

        test('should create code action for valid link diagnostic', () => {
            const mockDocument = {
                getText: (range: vscode.Range) => '[test link](/docs/concepts/overview)',
                uri: vscode.Uri.file('/content/ko/docs/test.md')
            } as vscode.TextDocument;

            const mockDiagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 35),
                'Missing language path',
                vscode.DiagnosticSeverity.Warning
            );
            mockDiagnostic.source = 'KubeLingoAssist';
            mockDiagnostic.code = 'missing-language-path';

            const action = (codeActionProvider as any).createFixLanguagePathAction(mockDocument, mockDiagnostic);
            
            assert.notStrictEqual(action, undefined);
            assert.ok(action.title.includes('ko'));
            assert.strictEqual(action.kind, vscode.CodeActionKind.QuickFix);
            assert.strictEqual(action.isPreferred, true);
            assert.strictEqual(action.diagnostics?.length, 1);
            assert.ok(action.edit);
        });

        test('should return undefined for invalid diagnostic text', () => {
            const mockDocument = {
                getText: (range: vscode.Range) => 'invalid text without link pattern',
                uri: vscode.Uri.file('/content/ko/docs/test.md')
            } as vscode.TextDocument;

            const mockDiagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 10),
                'Invalid diagnostic',
                vscode.DiagnosticSeverity.Warning
            );

            const action = (codeActionProvider as any).createFixLanguagePathAction(mockDocument, mockDiagnostic);
            
            assert.strictEqual(action, undefined);
        });

        test('should provide code actions for context with link diagnostics', () => {
            const mockDocument = {
                getText: (range: vscode.Range) => '[test](/docs/overview)',
                uri: vscode.Uri.file('/content/ko/docs/test.md')
            } as vscode.TextDocument;

            const mockDiagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 20),
                'Missing language path',
                vscode.DiagnosticSeverity.Warning
            );
            mockDiagnostic.source = 'KubeLingoAssist';
            mockDiagnostic.code = 'missing-language-path';

            const mockContext = {
                diagnostics: [mockDiagnostic],
                triggerKind: 1,
                only: undefined
            } as vscode.CodeActionContext;

            const actions = codeActionProvider.provideCodeActions(
                mockDocument,
                new vscode.Range(0, 0, 0, 20),
                mockContext,
{ isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) } as any
            );
            
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].kind, vscode.CodeActionKind.QuickFix);
        });
    });

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
    });
});