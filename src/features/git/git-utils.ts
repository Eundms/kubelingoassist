import * as vscode from 'vscode';
import * as cp from 'child_process';
import { promisify } from 'util';
import { CommitInfo, CommitFile } from '../../core/types';
import * as path from 'path';

const exec = promisify(cp.exec);

export interface GitChangedFile extends CommitFile {
  absPath: string; // 리포 루트 붙인 절대경로
}

export class GitUtils {
    private workspaceRoot: string;

    constructor() {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            throw new Error('No workspace folder found');
        }
        this.workspaceRoot = workspace.uri.fsPath;
    }

    async getRecentCommit(): Promise<CommitInfo | null> {
        return this.getCommitInfo();
    }

    async getCommitInfo(commitHash?: string): Promise<CommitInfo | null> {
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
            console.error(`Failed to get commit info${commitHash ? ` for ${commitHash}` : ''}:`, error);
            return null;
        }
    }

    async getChangedFilesInCommit(commitHash: string): Promise<CommitFile[]> {
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
            console.error(`Failed to get changed files for commit ${commitHash}:`, error);
            return [];
        }
    }

    async getChangedFilesSinceCommit(commitHash: string): Promise<CommitFile[]> {
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
            console.error(`Failed to get changed files since commit ${commitHash}:`, error);
            return [];
        }
    }

    async getCurrentBranch(): Promise<string> {
        try {
            const { stdout } = await exec('git branch --show-current', {
                cwd: this.workspaceRoot
            });
            return stdout.trim();
        } catch (error) {
            console.error('Failed to get current branch:', error);
            return 'unknown';
        }
    }

    async isGitRepository(): Promise<boolean> {
        try {
            await exec('git status', { cwd: this.workspaceRoot });
            return true;
        } catch (error) {
            return false;
        }
    }

    async findCommitsWithTranslationFiles(limit: number = 10): Promise<CommitInfo[]> {
        try {
            const { stdout } = await exec(`git log -${limit} --pretty=format:"%H|%s|%an|%ad" --date=short`, {
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
            console.error('Failed to find commits with translation files:', error);
            return [];
        }
    }

    filterTranslationFiles(files: CommitFile[]): GitChangedFile[] {
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

    getOriginalEnglishPath(translationPath: string): string | null {
        // Convert translation path to English path
        const langMatch = translationPath.match(/content\/([^/]+)\//);
        if (langMatch && langMatch[1] !== 'en') {
            return translationPath.replace(`content/${langMatch[1]}/`, 'content/en/');
        }
        return null;
    }
}