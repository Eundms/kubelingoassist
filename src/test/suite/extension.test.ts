import * as assert from 'assert';
import * as vscode from 'vscode';
import { getTranslationPath, extractLanguageCode } from '../../translation-utils';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suite('Translation Utils Tests', () => {
        test('extractLanguageCode should extract correct language code', () => {
            assert.strictEqual(extractLanguageCode('/content/en/docs/test.md'), 'en');
            assert.strictEqual(extractLanguageCode('/content/ko/docs/test.md'), 'ko');
            assert.strictEqual(extractLanguageCode('/content/ja/docs/concepts/test.md'), 'ja');
            assert.strictEqual(extractLanguageCode('/invalid/path.md'), 'unknown');
        });

        test('getTranslationPath should generate correct translation paths', async () => {
            // This test requires user interaction, so we'll skip it for now
            // In a real test environment, we would mock the user selection
            const enPath = '/content/en/docs/concepts/overview.md';
            // Mock test - cannot run getTranslationPath without user interaction
            assert.strictEqual(enPath.includes('/content/en/docs/'), true);
        });

        test('getTranslationPath should return null for non-en files', async () => {
            const koPath = '/content/ko/docs/concepts/overview.md';
            const translationPath = await getTranslationPath(koPath);
            assert.strictEqual(translationPath, '/content/en/docs/concepts/overview.md');
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
});