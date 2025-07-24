import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'autoCommit.showStatus';
        this.statusBarItem.show();
    }

    public updateStatus(status: 'active' | 'inactive', timeLeft: number): void {
        if (status === 'active') {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            this.statusBarItem.text = `$(sync~spin) Auto-Commit: ${timeString}`;
            this.statusBarItem.tooltip = `Next auto-commit in ${timeString}. Click to view status.`;
            this.statusBarItem.backgroundColor = undefined;
        } else {
            this.statusBarItem.text = `$(circle-slash) Auto-Commit: Off`;
            this.statusBarItem.tooltip = 'Auto-commit is disabled. Click to view status.';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}