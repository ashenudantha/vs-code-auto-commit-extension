import * as vscode from 'vscode';
import { AutoCommitManager } from './autoCommitManager';
import { StatusBarManager } from './statusBarManager';

let autoCommitManager: AutoCommitManager;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Commit extension is now active!');

    // Initialize managers
    autoCommitManager = new AutoCommitManager(context);
    statusBarManager = new StatusBarManager();

    // Register commands
    const startCommand = vscode.commands.registerCommand('autoCommit.start', () => {
        autoCommitManager.start();
        statusBarManager.updateStatus('active', autoCommitManager.getTimeUntilNextCommit());
        vscode.window.showInformationMessage('Auto Commit started!');
    });

    const stopCommand = vscode.commands.registerCommand('autoCommit.stop', () => {
        autoCommitManager.stop();
        statusBarManager.updateStatus('inactive', 0);
        vscode.window.showInformationMessage('Auto Commit stopped!');
    });

    const commitNowCommand = vscode.commands.registerCommand('autoCommit.commitNow', async () => {
        const result = await autoCommitManager.commitNow();
        if (result.success) {
            vscode.window.showInformationMessage(`Committed: ${result.message}`);
        } else {
            vscode.window.showErrorMessage(`Commit failed: ${result.error}`);
        }
    });

    const showStatusCommand = vscode.commands.registerCommand('autoCommit.showStatus', () => {
        autoCommitManager.showStatusPanel();
    });

    // Register configuration change listener
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('autoCommit')) {
            autoCommitManager.updateConfiguration();
        }
    });

    // Update status bar periodically
    const statusUpdateInterval = setInterval(() => {
        if (autoCommitManager.isActive()) {
            statusBarManager.updateStatus('active', autoCommitManager.getTimeUntilNextCommit());
        }
    }, 1000);

    // Add to subscriptions
    context.subscriptions.push(
        startCommand,
        stopCommand,
        commitNowCommand,
        showStatusCommand,
        configChangeListener,
        statusBarManager,
        { dispose: () => clearInterval(statusUpdateInterval) }
    );

    // Auto-start if enabled in configuration
    const config = vscode.workspace.getConfiguration('autoCommit');
    if (config.get<boolean>('enabled', false)) {
        autoCommitManager.start();
        statusBarManager.updateStatus('active', autoCommitManager.getTimeUntilNextCommit());
    } else {
        statusBarManager.updateStatus('inactive', 0);
    }
}

export function deactivate() {
    if (autoCommitManager) {
        autoCommitManager.stop();
    }
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}