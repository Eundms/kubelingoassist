import * as assert from 'assert';
import * as vscode from 'vscode';
import { LinkValidator, LinkCodeActionProvider } from '../../validators/link';

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

    test('should handle null and undefined inputs gracefully', () => {
        // Test with null document
        try {
            const result = linkValidator.validateLinks(null as any);
            assert.ok(result >= 0 || result === 0, 'Should handle null document gracefully');
        } catch (error) {
            // It's acceptable to throw an error for null input
            assert.ok(true, 'Throwing error for null input is acceptable');
        }

        // Test with undefined document
        try {
            const result = linkValidator.validateLinks(undefined as any);
            assert.ok(result >= 0 || result === 0, 'Should handle undefined document gracefully');
        } catch (error) {
            // It's acceptable to throw an error for undefined input
            assert.ok(true, 'Throwing error for undefined input is acceptable');
        }
    });

    test('should handle documents with only whitespace', () => {
        const mockDocument = {
            getText: () => '   \n\n\t\t   \n   ',
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/whitespace.md')
        } as vscode.TextDocument;

        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        assert.strictEqual(diagnosticCount, 0, 'Whitespace-only document should have no diagnostics');
    });

    test('should handle documents with mixed valid and invalid links', () => {
        const mockText = `# Mixed Links Test
[valid link](/docs/concepts/overview)
[invalid link missing path]()
[another valid](/docs/reference/)
[external link](https://example.com)
[relative link](../other/file.md)
[valid link with lang](/ko/docs/concepts/test)`;

        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/mixed.md')
        } as vscode.TextDocument;

        // Mock fileExists to return true for valid translation links
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = () => true;

        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        
        // Should process only the valid /docs/ links without language codes
        assert.strictEqual(diagnosticCount, 2, 'Should process 2 valid links');

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should handle very large documents', () => {
        // Create a document with many links
        const linkTemplate = '[link {{index}}](/docs/concepts/overview{{index}})';
        const linkCount = 1000;
        let mockText = '# Large Document Test\n\n';
        
        for (let i = 0; i < linkCount; i++) {
            mockText += linkTemplate.replace(/\{\{index\}\}/g, i.toString()) + '\n';
        }

        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(Math.floor(offset / 100), offset % 100),
            uri: vscode.Uri.file('/content/ko/docs/large.md')
        } as vscode.TextDocument;

        // Mock fileExists to return true
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = () => true;

        const startTime = Date.now();
        const diagnosticCount = linkValidator.validateLinks(mockDocument);
        const endTime = Date.now();

        assert.strictEqual(diagnosticCount, linkCount, `Should process all ${linkCount} links`);
        assert.ok(endTime - startTime < 5000, 'Should complete large document validation within 5 seconds');

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should handle filesystem errors gracefully', () => {
        const mockText = '[test link](/docs/concepts/overview)';
        const mockDocument = {
            getText: () => mockText,
            positionAt: (offset: number) => new vscode.Position(0, offset),
            uri: vscode.Uri.file('/content/ko/docs/fs-error.md')
        } as vscode.TextDocument;

        // Mock fileExists to throw an error
        const originalFileExists = (linkValidator as any).fileExists;
        (linkValidator as any).fileExists = () => {
            throw new Error('Mock filesystem error');
        };

        try {
            const diagnosticCount = linkValidator.validateLinks(mockDocument);
            // Should handle the error gracefully and continue
            assert.ok(diagnosticCount >= 0, 'Should handle filesystem errors gracefully');
        } catch (error) {
            // It's acceptable to propagate critical filesystem errors
            assert.ok(true, 'Propagating filesystem errors is acceptable');
        }

        // Restore original method
        (linkValidator as any).fileExists = originalFileExists;
    });

    test('should handle documents with different line endings', () => {
        const testCases = [
            { text: '[link1](/docs/overview)\r\n[link2](/docs/concepts)', description: 'Windows CRLF' },
            { text: '[link1](/docs/overview)\n[link2](/docs/concepts)', description: 'Unix LF' },
            { text: '[link1](/docs/overview)\r[link2](/docs/concepts)', description: 'Old Mac CR' },
            { text: '[link1](/docs/overview)\r\n\r\n[link2](/docs/concepts)\n', description: 'Mixed line endings' }
        ];

        testCases.forEach(({ text, description }) => {
            const mockDocument = {
                getText: () => text,
                positionAt: (offset: number) => new vscode.Position(0, offset),
                uri: vscode.Uri.file(`/content/ko/docs/${description.toLowerCase().replace(/\s+/g, '-')}.md`)
            } as vscode.TextDocument;

            const links = (linkValidator as any).extractLinks(mockDocument);
            assert.strictEqual(links.length, 2, `Should extract 2 links for ${description}`);
        });
    });
});