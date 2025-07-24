import * as vscode from 'vscode';
import * as path from 'path';
import { simpleGit, SimpleGit, StatusResult } from 'simple-git';

export interface CommitResult {
    success: boolean;
    message?: string;
    error?: string;
    filesChanged?: number;
}

export class AutoCommitManager {
    private timer: NodeJS.Timeout | undefined;
    private git: SimpleGit | undefined;
    private workspaceRoot: string | undefined;
    private nextCommitTime: Date | undefined;
    private webviewPanel: vscode.WebviewPanel | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.initializeGit();
    }

    private initializeGit() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.workspaceRoot = workspaceFolders[0].uri.fsPath;
            this.git = simpleGit(this.workspaceRoot);
        }
    }

    public start(): void {
        if (!this.git || !this.workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found or Git not initialized');
            return;
        }

        this.stop(); // Stop any existing timer

        const config = vscode.workspace.getConfiguration('autoCommit');
        const interval = config.get<number>('interval', 10) * 60 * 1000; // Convert to milliseconds

        this.scheduleNextCommit(interval);
    }

    public stop(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
            this.nextCommitTime = undefined;
        }
    }

    public isActive(): boolean {
        return this.timer !== undefined;
    }

    public getTimeUntilNextCommit(): number {
        if (!this.nextCommitTime) {
            return 0;
        }
        return Math.max(0, this.nextCommitTime.getTime() - Date.now());
    }

    private scheduleNextCommit(interval: number): void {
        this.nextCommitTime = new Date(Date.now() + interval);
        
        this.timer = setTimeout(async () => {
            await this.performAutoCommit();
            // Schedule next commit
            this.scheduleNextCommit(interval);
        }, interval);
    }

    public async commitNow(): Promise<CommitResult> {
        return await this.performAutoCommit();
    }

    private async performAutoCommit(): Promise<CommitResult> {
        if (!this.git || !this.workspaceRoot) {
            return { success: false, error: 'Git not initialized' };
        }

        try {
            // Check if there are any changes
            const status: StatusResult = await this.git.status();
            const hasChanges = status.files.length > 0;

            if (!hasChanges) {
                return { success: true, message: 'No changes to commit' };
            }

            // Get configuration
            const config = vscode.workspace.getConfiguration('autoCommit');
            const includeUntracked = config.get<boolean>('includeUntracked', true);
            const excludePatterns = config.get<string[]>('excludePatterns', []);
            const messageTemplate = config.get<string>('commitMessage', 'Auto-commit: {timestamp}');

            // Filter files based on exclude patterns
            const filesToCommit = status.files.filter(file => {
                return !excludePatterns.some(pattern => {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(file.path);
                });
            });

            if (filesToCommit.length === 0) {
                return { success: true, message: 'No files to commit after filtering' };
            }

            // Add files to staging
            for (const file of filesToCommit) {
                if (file.index === '?' && !includeUntracked) {
                    continue; // Skip untracked files if not included
                }
                await this.git.add(file.path);
            }

            // Create commit message
            const timestamp = new Date().toLocaleString();
            const commitMessage = messageTemplate
                .replace('{timestamp}', timestamp)
                .replace('{files}', filesToCommit.length.toString());

            // Commit changes
            const commitResult = await this.git.commit(commitMessage);

            // Push to remote if enabled in config
            const pushAfterCommit = config.get<boolean>('pushAfterCommit', false);
            if (pushAfterCommit) {
                try {
                    await this.git.push();
                } catch (pushError) {
                    console.error('Push failed:', pushError);
                    return {
                        success: false,
                        error: `Push failed: ${pushError instanceof Error ? pushError.message : pushError}`
                    };
                }
            }


            // Update webview if open
            this.updateWebview();

            return {
                success: true,
                message: `Committed ${filesToCommit.length} file(s)`,
                filesChanged: filesToCommit.length
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }

    public updateConfiguration(): void {
        if (this.isActive()) {
            this.start(); // Restart with new configuration
        }
    }

    public showStatusPanel(): void {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }

        this.webviewPanel = vscode.window.createWebviewPanel(
            'autoCommitStatus',
            'Auto Commit Status',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });

        this.updateWebview();
    }

    private updateWebview(): void {
        if (!this.webviewPanel) {
            return;
        }

        const config = vscode.workspace.getConfiguration('autoCommit');
        const interval = config.get<number>('interval', 10);
        const timeLeft = Math.ceil(this.getTimeUntilNextCommit() / 1000);
        const isActive = this.isActive();

        this.webviewPanel.webview.html = this.getWebviewContent(isActive, interval, timeLeft);
    }

    private getWebviewContent(isActive: boolean, interval: number, timeLeft: number): string {
        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Auto Commit Status</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                        padding: 20px;
                        margin: 0;
                    }
                    .status-card {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                    }
                    .status-active {
                        border-left: 4px solid var(--vscode-charts-green);
                    }
                    .status-inactive {
                        border-left: 4px solid var(--vscode-charts-red);
                    }
                    .timer {
                        font-size: 2em;
                        font-weight: bold;
                        color: var(--vscode-charts-blue);
                        text-align: center;
                        margin: 20px 0;
                    }
                    .config-item {
                        margin: 10px 0;
                        padding: 10px;
                        background-color: var(--vscode-input-background);
                        border-radius: 4px;
                    }
                    .config-label {
                        font-weight: bold;
                        color: var(--vscode-charts-orange);
                    }
                    h1, h2 {
                        color: var(--vscode-charts-purple);
                    }
                </style>
            </head>
            <body>
                <h1>🔄 Auto Commit Status</h1>
                
                <div class="status-card ${isActive ? 'status-active' : 'status-inactive'}">
                    <h2>Current Status: ${isActive ? '✅ Active' : '❌ Inactive'}</h2>
                    ${isActive ? `
                        <div class="timer">${formatTime(timeLeft)}</div>
                        <p>Time until next auto-commit</p>
                    ` : `
                        <p>Auto-commit is currently stopped</p>
                    `}
                </div>

                <div class="status-card">
                    <h2>⚙️ Configuration</h2>
                    <div class="config-item">
                        <span class="config-label">Interval:</span> ${interval} minutes
                    </div>
                    <div class="config-item">
                        <span class="config-label">Workspace:</span> ${this.workspaceRoot || 'None'}
                    </div>
                </div>

                <div class="status-card">
                    <h2>⚠️ Important Notes</h2>
                    <ul>
                        <li>Auto-committing creates frequent commits in your Git history</li>
                        <li>Make sure your commit messages are meaningful</li>
                        <li>Consider the impact on your team's workflow</li>
                        <li>Use exclude patterns to avoid committing sensitive files</li>
                    </ul>
                </div>

                <script>
                    // Auto-refresh every second
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                </script>
            </body>
            </html>
        `;
    }
}