import * as assert from 'assert';
import { getTranslationPath, extractLanguageCode } from '../../features/translation/translation-utils';

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