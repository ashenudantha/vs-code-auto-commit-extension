import React, { useState, useEffect } from "react";
import {
  FileText,
  GitCommit,
  Clock,
  Play,
  Pause,
  Settings,
} from "lucide-react";

interface FileChange {
  id: string;
  filename: string;
  status: "modified" | "added" | "deleted";
  timestamp: Date;
  content: string;
}

interface Commit {
  id: string;
  message: string;
  timestamp: Date;
  files: FileChange[];
  hash: string;
}

export const FileMonitor: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [commitInterval, setCommitInterval] = useState(10); // renamed from 'interval'
  const [timeLeft, setTimeLeft] = useState(600);
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [autoCommitEnabled, setAutoCommitEnabled] = useState(true);

  const simulateFileChange = () => {
    const filenames = [
      "App.tsx",
      "index.css",
      "utils.ts",
      "components/Button.tsx",
      "hooks/useData.ts",
    ];
    const statuses: ("modified" | "added" | "deleted")[] = [
      "modified",
      "added",
      "deleted",
    ];

    const newChange: FileChange = {
      id: Date.now().toString(),
      filename: filenames[Math.floor(Math.random() * filenames.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(),
      content: `// Simulated changes at ${new Date().toLocaleTimeString()}`,
    };

    setFileChanges((prev) => {
      const existing = prev.find((f) => f.filename === newChange.filename);
      if (existing) {
        return prev.map((f) =>
          f.filename === newChange.filename ? newChange : f
        );
      }
      return [...prev, newChange];
    });
  };

  const performAutoCommit = () => {
    if (fileChanges.length === 0) return;

    const newCommit: Commit = {
      id: Date.now().toString(),
      message: `Auto-commit: ${fileChanges.length} file(s) changed`,
      timestamp: new Date(),
      files: [...fileChanges],
      hash: Math.random().toString(36).substring(2, 8),
    };

    setCommits((prev) => [newCommit, ...prev].slice(0, 10));
    setFileChanges([]);
  };

  useEffect(() => {
    let timer: number;

    if (isActive) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (autoCommitEnabled) {
              performAutoCommit();
            }
            return commitInterval * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, commitInterval, autoCommitEnabled, fileChanges]);

  useEffect(() => {
    let changeTimer: number;

    if (isActive) {
      changeTimer = window.setInterval(() => {
        if (Math.random() > 0.7) {
          simulateFileChange();
        }
      }, 2000);
    }

    return () => clearInterval(changeTimer);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "modified":
        return "text-yellow-600";
      case "added":
        return "text-green-600";
      case "deleted":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GitCommit className="w-6 h-6 text-blue-600" />
            Auto-Commit System Simulator
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isActive ? "Stop" : "Start"} Monitoring
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Settings</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commit Interval (minutes)
                </label>
                <input
                  type="number"
                  value={commitInterval}
                  onChange={(e) => {
                    const newInterval = parseInt(e.target.value);
                    setCommitInterval(newInterval);
                    setTimeLeft(newInterval * 60);
                  }}
                  className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                  max="60"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoCommit"
                  checked={autoCommitEnabled}
                  onChange={(e) => setAutoCommitEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="autoCommit" className="text-sm text-gray-700">
                  Enable auto-commit
                </label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Next Commit</h3>
            </div>
            <div className="text-2xl font-mono font-bold text-blue-600">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Status: {isActive ? "Active" : "Inactive"}
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">Pending Changes</h3>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {fileChanges.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">files modified</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Pending File Changes
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fileChanges.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending changes</p>
              ) : (
                fileChanges.map((change) => (
                  <div
                    key={change.id}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          change.status === "modified"
                            ? "bg-yellow-500"
                            : change.status === "added"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="font-mono text-sm">
                        {change.filename}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-medium ${getStatusColor(
                        change.status
                      )}`}
                    >
                      {change.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            {fileChanges.length > 0 && (
              <button
                onClick={performAutoCommit}
                className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Commit Now
              </button>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Recent Commits
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commits.length === 0 ? (
                <p className="text-gray-500 text-sm">No commits yet</p>
              ) : (
                commits.map((commit) => (
                  <div key={commit.id} className="p-3 bg-white rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-gray-500">
                        #{commit.hash}
                      </span>
                      <span className="text-xs text-gray-500">
                        {commit.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {commit.message}
                    </p>
                    <p className="text-xs text-gray-600">
                      {commit.files.length} file(s) changed
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">
          ⚠️ Important Considerations
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • Auto-committing every 10 minutes creates noisy commit history
          </li>
          <li>• May commit incomplete or broken code</li>
          <li>
            • Better alternatives: Save frequently, commit meaningful changes
            manually
          </li>
          <li>• Consider using VS Code's auto-save feature instead</li>
          <li>
            • For real implementation, you'd need a VS Code extension or
            external script
          </li>
        </ul>
      </div>
    </div>
  );
};
