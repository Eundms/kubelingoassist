import * as vscode from 'vscode';
import * as cp from 'child_process';
import { promisify } from 'util';
import { CommitInfo, CommitFile } from '../../core/types';
import * as path from 'path';
import { i18n } from '../../core/i18n';

const exec = promisify(cp.exec);

export interface IGitRepository {
  getCurrentBranch(): Promise<string>;
  getRecentCommit(): Promise<CommitInfo | null>;
  getCommitInfo(commitHash?: string): Promise<CommitInfo | null>;
  isGitRepository(): Promise<boolean>;
  isKubernetesWebsiteRepository(): Promise<boolean>;
}

export interface GitUtilsConfig {
  workspaceRoot?: string;
  defaultCommitLimit?: number;
}

export class GitError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'GitError';
  }
}

export interface GitChangedFile extends CommitFile {
  absPath: string; // 리포 루트 붙인 절대경로
}

export class GitUtils implements IGitRepository {
    private workspaceRoot: string;

    private config: GitUtilsConfig;

    constructor(config?: GitUtilsConfig) {
        this.config = { defaultCommitLimit: 10, ...config };
        this.workspaceRoot = this.config.workspaceRoot || this.findGitRepository();
    }

    private findGitRepository(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new GitError('No workspace folder found');
        }

        // Try each workspace folder to find one with a git repository
        for (const workspace of workspaceFolders) {
            try {
                cp.execSync('git status', { 
                    cwd: workspace.uri.fsPath, 
                    stdio: 'ignore' 
                });
                return workspace.uri.fsPath;
            } catch (error) {
                // Continue to next workspace folder
                continue;
            }
        }

        // If no git repository found, fall back to first workspace folder
        // and let the git commands fail with proper error messages
        return workspaceFolders[0].uri.fsPath;
    }

    public async getRecentCommit(): Promise<CommitInfo | null> {
        return this.getCommitInfo();
    }

    public async getCommitInfo(commitHash?: string): Promise<CommitInfo | null> {
        try {
            const command = commitHash 
                ? `git show --pretty=format:"%H|%s|%an|%ad" --date=short ${commitHash}`
                : 'git log -1 --pretty=format:"%H|%s|%an|%ad" --date=short';
            
            const { stdout } = await exec(command, {
                cwd: this.workspaceRoot
            });

            if (!stdout.trim()) {
                return null;
            }

            const lines = stdout.split('\n');
            const [hash, message, author, date] = lines[0].split('|');
            const files = await this.getChangedFilesInCommit(hash);

            return {
                hash,
                message,
                author,
                date,
                files
            };
        } catch (error) {
            console.error(i18n.t('git.commitInfoFailed', String(error)));
            throw new GitError(i18n.t('git.commitInfoFailed', String(error)), error);
        }
    }

    public async getChangedFilesInCommit(commitHash: string): Promise<CommitFile[]> {
        try {
            const { stdout } = await exec(`git show --name-status --pretty= ${commitHash}`, {
                cwd: this.workspaceRoot
            });

            const lines = stdout.split('\n').filter(line => line.trim());
            const files: CommitFile[] = [];

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) {
                    continue;
                }

                const parts = trimmedLine.split('\t');
                if (parts.length >= 2) {
                    const status = parts[0].charAt(0) as 'M' | 'A' | 'D' | 'R' | 'C';
                    const path = parts[1];
                    const originalPath = parts[2]; // for renamed files

                    files.push({
                        path,
                        status,
                        originalPath
                    });
                }
            }

            return files;
        } catch (error) {
            console.error(i18n.t('git.diffFailed', String(error)));
            return [];
        }
    }

    public async getChangedFilesSinceCommit(commitHash: string): Promise<CommitFile[]> {
        try {
            const { stdout } = await exec(`git diff --name-status ${commitHash}..HEAD`, {
                cwd: this.workspaceRoot
            });

            const lines = stdout.split('\n').filter(line => line.trim());
            const files: CommitFile[] = [];

            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length >= 2) {
                    const status = parts[0].charAt(0) as 'M' | 'A' | 'D' | 'R' | 'C';
                    const path = parts[1];
                    const originalPath = parts[2];

                    files.push({
                        path,
                        status,
                        originalPath
                    });
                }
            }

            return files;
        } catch (error) {
            console.error(i18n.t('git.diffFailed', String(error)));
            return [];
        }
    }

    public async getCurrentBranch(): Promise<string> {
        try {
            const { stdout } = await exec('git branch --show-current', {
                cwd: this.workspaceRoot
            });
            return stdout.trim();
        } catch (error) {
            console.error('Failed to get current branch:', error);
            throw new GitError('Failed to get current branch', error);
        }
    }

    public async isGitRepository(): Promise<boolean> {
        try {
            await exec('git status', { cwd: this.workspaceRoot });
            return true;
        } catch (error) {
            return false;
        }
    }

    public async isKubernetesWebsiteRepository(): Promise<boolean> {
        try {
            // Method 1: Check git remote URL
            const { stdout: remoteUrl } = await exec('git remote get-url origin', { 
                cwd: this.workspaceRoot 
            });
            
            if (remoteUrl.includes('kubernetes/website')) {
                return true;
            }

            // Method 2: Check for distinctive files
            const fs = require('fs').promises;
            const distinctiveFiles = [
                'hugo.toml',
                'netlify.toml',
                'api-ref-assets',
                'update-imported-docs'
            ];

            for (const file of distinctiveFiles) {
                try {
                    await fs.access(path.join(this.workspaceRoot, file));
                    return true;
                } catch {
                    continue;
                }
            }

            // Method 3: Check content directory structure
            try {
                const contentDir = path.join(this.workspaceRoot, 'content');
                await fs.access(contentDir);
                
                // Check for multiple language directories
                const contentItems = await fs.readdir(contentDir);
                const langDirs = contentItems.filter((item: string) => 
                    item.length === 2 || item === 'en' || item === 'zh-cn' || item === 'pt-br'
                );
                
                if (langDirs.length >= 2) {
                    return true;
                }
            } catch {
                // Continue to next check
            }

            // Method 4: Check package.json for kubernetes-related dependencies
            try {
                const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                
                if (packageJson.name && packageJson.name.includes('kubernetes')) {
                    return true;
                }
                
                const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
                if (dependencies['@docsy/hugo-base'] || dependencies['hugo-extended']) {
                    return true;
                }
            } catch {
                // Continue
            }

            return false;
        } catch (error) {
            console.error('Error checking if repository is kubernetes/website:', error);
            return false;
        }
    }

    public async findCommitsWithTranslationFiles(limit?: number): Promise<CommitInfo[]> {
        const commitLimit = limit || this.config.defaultCommitLimit || 10;
        try {
            const { stdout } = await exec(`git log -${commitLimit} --pretty=format:"%H|%s|%an|%ad" --date=short`, {
                cwd: this.workspaceRoot
            });

            if (!stdout.trim()) {
                return [];
            }

            const commits: CommitInfo[] = [];
            const lines = stdout.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const [hash, message, author, date] = line.split('|');
                const files = await this.getChangedFilesInCommit(hash);

                if (files.length > 0) {
                    commits.push({
                        hash,
                        message,
                        author,
                        date,
                        files: files
                    });
                }
            }

            return commits;
        } catch (error) {
            console.error(i18n.t('git.commitInfoFailed', String(error)));
            return [];
        }
    }

    public filterTranslationFiles(files: CommitFile[]): GitChangedFile[] {
        const translationFiles = files.filter(file => {
            // Filter for markdown files in translation directories (not English)
            const isMarkdown = file.path.endsWith('.md');

            return isMarkdown;
        }).map(file => ({
            ...file,
            absPath: path.join(this.workspaceRoot, file.path.split('/').join(path.sep))
        }));

        // If no translation files found, check if this might be a development setup
        return translationFiles
    }

    public getOriginalEnglishPath(translationPath: string): string | null {
        // Convert translation path to English path
        const langMatch = translationPath.match(/content\/([^/]+)\//);
        if (langMatch && langMatch[1] !== 'en') {
            return translationPath.replace(`content/${langMatch[1]}/`, 'content/en/');
        }
        return null;
    }

    /**
     * 리소스 해제
     */
    public dispose(): void {
        // 현재는 해제할 리소스가 없지만, 향후 확장을 위해 메서드 제공
    }

    /**
     * 작업 디렉터리 반환
     */
    public getWorkspaceRoot(): string {
        return this.workspaceRoot;
    }
}

/**
 * GitUtils 팩토리 클래스
 */
export class GitUtilsFactory {
    /**
     * GitUtils 인스턴스 생성
     */
    public static create(config?: GitUtilsConfig): GitUtils {
        return new GitUtils(config);
    }

    /**
     * 현재 워크스페이스에서 GitUtils 인스턴스 생성
     */
    public static createFromWorkspace(): GitUtils {
        return new GitUtils();
    }

    /**
     * 특정 경로에서 GitUtils 인스턴스 생성
     */
    public static createFromPath(workspaceRoot: string): GitUtils {
        return new GitUtils({ workspaceRoot });
    }
}