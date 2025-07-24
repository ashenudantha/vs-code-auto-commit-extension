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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const autoCommitManager_1 = require("./autoCommitManager");
const statusBarManager_1 = require("./statusBarManager");
let autoCommitManager;
let statusBarManager;
function activate(context) {
    console.log('Auto Commit extension is now active!');
    // Initialize managers
    autoCommitManager = new autoCommitManager_1.AutoCommitManager(context);
    statusBarManager = new statusBarManager_1.StatusBarManager();
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
        }
        else {
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
    context.subscriptions.push(startCommand, stopCommand, commitNowCommand, showStatusCommand, configChangeListener, statusBarManager, { dispose: () => clearInterval(statusUpdateInterval) });
    // Auto-start if enabled in configuration
    const config = vscode.workspace.getConfiguration('autoCommit');
    if (config.get('enabled', false)) {
        autoCommitManager.start();
        statusBarManager.updateStatus('active', autoCommitManager.getTimeUntilNextCommit());
    }
    else {
        statusBarManager.updateStatus('inactive', 0);
    }
}
exports.activate = activate;
function deactivate() {
    if (autoCommitManager) {
        autoCommitManager.stop();
    }
    if (statusBarManager) {
        statusBarManager.dispose();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map