# Auto Commit VS Code Extension

Automatically commit your code changes to Git every 10 minutes (configurable).

## Features

- 🔄 **Automatic Commits**: Commits your changes at configurable intervals
- ⏱️ **Customizable Timing**: Set commit intervals from 1-60 minutes
- 📊 **Status Monitoring**: Real-time status bar showing time until next commit
- 🎯 **Smart Filtering**: Exclude specific files/patterns from auto-commits
- 📝 **Custom Messages**: Configurable commit message templates
- 🖥️ **Status Panel**: Detailed status view with configuration info

## Commands

- `Auto Commit: Start` - Start the auto-commit timer
- `Auto Commit: Stop` - Stop the auto-commit timer
- `Auto Commit: Commit Now` - Perform an immediate commit
- `Auto Commit: Show Status` - Open the status panel

## Configuration

Access these settings via VS Code Settings (search for "Auto Commit"):

- `autoCommit.enabled`: Enable/disable auto-commit on startup
- `autoCommit.interval`: Commit interval in minutes (1-60, default: 10)
- `autoCommit.commitMessage`: Message template (use `{timestamp}` and `{files}`)
- `autoCommit.includeUntracked`: Include untracked files in commits
- `autoCommit.excludePatterns`: File patterns to exclude from commits

## Usage

1. Open a workspace with a Git repository
2. Use Command Palette (`Ctrl+Shift+P`) and run "Auto Commit: Start"
3. The status bar will show the countdown timer
4. Click the status bar item to view detailed status

## Important Considerations

⚠️ **Before using this extension, consider:**

- Auto-committing creates frequent commits in your Git history
- May commit incomplete or broken code
- Can create noise in team repositories
- Better for personal projects or specific workflows

## Installation

1. Package the extension: `vsce package`
2. Install the `.vsix` file in VS Code
3. Or publish to VS Code Marketplace

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## Requirements

- VS Code 1.74.0 or higher
- Git repository in workspace
- Node.js for development

## License

MIT License - feel free to modify and distribute.