"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCommitManager = void 0;
const vscode = __importStar(require("vscode"));
const simple_git_1 = require("simple-git");
class AutoCommitManager {
    constructor(context) {
        this.context = context;
        this.initializeGit();
    }
    initializeGit() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            this.workspaceRoot = workspaceFolders[0].uri.fsPath;
            this.git = (0, simple_git_1.simpleGit)(this.workspaceRoot);
        }
    }
    start() {
        if (!this.git || !this.workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found or Git not initialized');
            return;
        }
        this.stop(); // Stop any existing timer
        const config = vscode.workspace.getConfiguration('autoCommit');
        const interval = config.get('interval', 1) * 60 * 1000; // Convert to milliseconds
        this.scheduleNextCommit(interval);
    }
    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
            this.nextCommitTime = undefined;
        }
    }
    isActive() {
        return this.timer !== undefined;
    }
    getTimeUntilNextCommit() {
        if (!this.nextCommitTime) {
            return 0;
        }
        return Math.max(0, this.nextCommitTime.getTime() - Date.now());
    }
    scheduleNextCommit(interval) {
        this.nextCommitTime = new Date(Date.now() + interval);
        this.timer = setTimeout(async () => {
            await this.performAutoCommit();
            // Schedule next commit
            this.scheduleNextCommit(interval);
        }, interval);
    }
    async commitNow() {
        return await this.performAutoCommit();
    }
    async performAutoCommit() {
        if (!this.git || !this.workspaceRoot) {
            return { success: false, error: 'Git not initialized' };
        }
        try {
            // Check for changes
            const status = await this.git.status();
            const hasChanges = status.files.length > 0;
            if (!hasChanges) {
                return { success: true, message: 'No changes to commit' };
            }
            const config = vscode.workspace.getConfiguration('autoCommit');
            const includeUntracked = config.get('includeUntracked', true);
            const excludePatterns = config.get('excludePatterns', []);
            const messageTemplate = config.get('commitMessage', 'Auto-commit: {timestamp}');
            // Filter files to commit
            const filesToCommit = status.files.filter(file => {
                return !excludePatterns.some(pattern => {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(file.path);
                });
            });
            if (filesToCommit.length === 0) {
                return { success: true, message: 'No files to commit after filtering' };
            }
            // Stage files
            for (const file of filesToCommit) {
                if (file.index === '?' && !includeUntracked) {
                    continue; // skip untracked if not included
                }
                await this.git.add(file.path);
            }
            // If untracked files are included but no files staged yet, add all
            if (includeUntracked && filesToCommit.some(f => f.index === '?')) {
                await this.git.add('.');
            }
            // Commit message with timestamp
            const timestamp = new Date().toLocaleString();
            const commitMessage = messageTemplate
                .replace('{timestamp}', timestamp)
                .replace('{files}', filesToCommit.length.toString());
            // Commit
            const commitResult = await this.git.commit(commitMessage);
            console.log(`✅ Committed ${filesToCommit.length} files`, commitResult);
            // Push if enabled
            const pushAfterCommit = config.get('pushAfterCommit', false);
            if (pushAfterCommit) {
                console.log('🔄 pushAfterCommit is enabled');
                try {
                    // Fetch remotes and current branch
                    const remotes = await this.git.getRemotes(true);
                    console.log('📡 Available remotes:', remotes);
                    if (!remotes.length) {
                        return {
                            success: false,
                            error: 'No Git remote found. Add a remote to enable push.'
                        };
                    }
                    const branchSummary = await this.git.branchLocal();
                    const currentBranch = branchSummary.current || 'main';
                    console.log(`🚀 Current branch detected: ${currentBranch}`);
                    await this.git.fetch();
                    // Push to origin/currentBranch
                    await this.git.push('origin', currentBranch);
                    console.log('✅ Git push successful');
                    vscode.window.showInformationMessage('Auto-commit and push complete.');
                }
                catch (pushError) {
                    console.error('❌ Git push failed:', pushError);
                    vscode.window.showErrorMessage(`Push failed: ${pushError instanceof Error ? pushError.message : String(pushError)}`);
                    return {
                        success: false,
                        error: pushError instanceof Error ? pushError.message : String(pushError)
                    };
                }
            }
            this.updateWebview();
            return {
                success: true,
                message: `Committed ${filesToCommit.length} file(s)`,
                filesChanged: filesToCommit.length
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: errorMessage };
        }
    }
    updateConfiguration() {
        if (this.isActive()) {
            this.start(); // Restart with new configuration
        }
    }
    showStatusPanel() {
        if (this.webviewPanel) {
            this.webviewPanel.reveal();
            return;
        }
        this.webviewPanel = vscode.window.createWebviewPanel('autoCommitStatus', 'Auto Commit Status', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.webviewPanel.onDidDispose(() => {
            this.webviewPanel = undefined;
        });
        this.updateWebview();
    }
    updateWebview() {
        if (!this.webviewPanel) {
            return;
        }
        const config = vscode.workspace.getConfiguration('autoCommit');
        const interval = config.get('interval', 10);
        const timeLeft = Math.ceil(this.getTimeUntilNextCommit() / 1000);
        const isActive = this.isActive();
        this.webviewPanel.webview.html = this.getWebviewContent(isActive, interval, timeLeft);
    }
    getWebviewContent(isActive, interval, timeLeft) {
        const formatTime = (seconds) => {
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
exports.AutoCommitManager = AutoCommitManager;
//# sourceMappingURL=autoCommitManager.js.map