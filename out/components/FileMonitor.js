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
exports.FileMonitor = void 0;
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const FileMonitor = () => {
    const [isActive, setIsActive] = (0, react_1.useState)(false);
    const [commitInterval, setCommitInterval] = (0, react_1.useState)(10); // renamed from 'interval'
    const [timeLeft, setTimeLeft] = (0, react_1.useState)(600);
    const [fileChanges, setFileChanges] = (0, react_1.useState)([]);
    const [commits, setCommits] = (0, react_1.useState)([]);
    const [autoCommitEnabled, setAutoCommitEnabled] = (0, react_1.useState)(true);
    const simulateFileChange = () => {
        const filenames = [
            "App.tsx",
            "index.css",
            "utils.ts",
            "components/Button.tsx",
            "hooks/useData.ts",
        ];
        const statuses = [
            "modified",
            "added",
            "deleted",
        ];
        const newChange = {
            id: Date.now().toString(),
            filename: filenames[Math.floor(Math.random() * filenames.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            timestamp: new Date(),
            content: `// Simulated changes at ${new Date().toLocaleTimeString()}`,
        };
        setFileChanges((prev) => {
            const existing = prev.find((f) => f.filename === newChange.filename);
            if (existing) {
                return prev.map((f) => f.filename === newChange.filename ? newChange : f);
            }
            return [...prev, newChange];
        });
    };
    const performAutoCommit = () => {
        if (fileChanges.length === 0)
            return;
        const newCommit = {
            id: Date.now().toString(),
            message: `Auto-commit: ${fileChanges.length} file(s) changed`,
            timestamp: new Date(),
            files: [...fileChanges],
            hash: Math.random().toString(36).substring(2, 8),
        };
        setCommits((prev) => [newCommit, ...prev].slice(0, 10));
        setFileChanges([]);
    };
    (0, react_1.useEffect)(() => {
        let timer;
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
    (0, react_1.useEffect)(() => {
        let changeTimer;
        if (isActive) {
            changeTimer = window.setInterval(() => {
                if (Math.random() > 0.7) {
                    simulateFileChange();
                }
            }, 2000);
        }
        return () => clearInterval(changeTimer);
    }, [isActive]);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };
    const getStatusColor = (status) => {
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
    return (react_1.default.createElement("div", { className: "max-w-4xl mx-auto p-6 space-y-6" },
        react_1.default.createElement("div", { className: "bg-white rounded-lg shadow-lg p-6" },
            react_1.default.createElement("div", { className: "flex items-center justify-between mb-6" },
                react_1.default.createElement("h1", { className: "text-2xl font-bold text-gray-800 flex items-center gap-2" },
                    react_1.default.createElement(lucide_react_1.GitCommit, { className: "w-6 h-6 text-blue-600" }),
                    "Auto-Commit System Simulator"),
                react_1.default.createElement("div", { className: "flex items-center gap-4" },
                    react_1.default.createElement("button", { onClick: () => setIsActive(!isActive), className: `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"}` },
                        isActive ? (react_1.default.createElement(lucide_react_1.Pause, { className: "w-4 h-4" })) : (react_1.default.createElement(lucide_react_1.Play, { className: "w-4 h-4" })),
                        isActive ? "Stop" : "Start",
                        " Monitoring"))),
            react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6" },
                react_1.default.createElement("div", { className: "bg-gray-50 rounded-lg p-4" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2 mb-2" },
                        react_1.default.createElement(lucide_react_1.Settings, { className: "w-5 h-5 text-gray-600" }),
                        react_1.default.createElement("h3", { className: "font-semibold text-gray-800" }, "Settings")),
                    react_1.default.createElement("div", { className: "space-y-3" },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Commit Interval (minutes)"),
                            react_1.default.createElement("input", { type: "number", value: commitInterval, onChange: (e) => {
                                    const newInterval = parseInt(e.target.value);
                                    setCommitInterval(newInterval);
                                    setTimeLeft(newInterval * 60);
                                }, className: "w-full px-3 py-1 border border-gray-300 rounded text-sm", min: "1", max: "60" })),
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement("input", { type: "checkbox", id: "autoCommit", checked: autoCommitEnabled, onChange: (e) => setAutoCommitEnabled(e.target.checked), className: "rounded" }),
                            react_1.default.createElement("label", { htmlFor: "autoCommit", className: "text-sm text-gray-700" }, "Enable auto-commit")))),
                react_1.default.createElement("div", { className: "bg-blue-50 rounded-lg p-4" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2 mb-2" },
                        react_1.default.createElement(lucide_react_1.Clock, { className: "w-5 h-5 text-blue-600" }),
                        react_1.default.createElement("h3", { className: "font-semibold text-gray-800" }, "Next Commit")),
                    react_1.default.createElement("div", { className: "text-2xl font-mono font-bold text-blue-600" }, formatTime(timeLeft)),
                    react_1.default.createElement("div", { className: "text-sm text-gray-600 mt-1" },
                        "Status: ",
                        isActive ? "Active" : "Inactive")),
                react_1.default.createElement("div", { className: "bg-orange-50 rounded-lg p-4" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2 mb-2" },
                        react_1.default.createElement(lucide_react_1.FileText, { className: "w-5 h-5 text-orange-600" }),
                        react_1.default.createElement("h3", { className: "font-semibold text-gray-800" }, "Pending Changes")),
                    react_1.default.createElement("div", { className: "text-2xl font-bold text-orange-600" }, fileChanges.length),
                    react_1.default.createElement("div", { className: "text-sm text-gray-600 mt-1" }, "files modified"))),
            react_1.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6" },
                react_1.default.createElement("div", { className: "bg-gray-50 rounded-lg p-4" },
                    react_1.default.createElement("h3", { className: "font-semibold text-gray-800 mb-3 flex items-center gap-2" },
                        react_1.default.createElement(lucide_react_1.FileText, { className: "w-4 h-4" }),
                        "Pending File Changes"),
                    react_1.default.createElement("div", { className: "space-y-2 max-h-64 overflow-y-auto" }, fileChanges.length === 0 ? (react_1.default.createElement("p", { className: "text-gray-500 text-sm" }, "No pending changes")) : (fileChanges.map((change) => (react_1.default.createElement("div", { key: change.id, className: "flex items-center justify-between p-2 bg-white rounded border" },
                        react_1.default.createElement("div", { className: "flex items-center gap-2" },
                            react_1.default.createElement("div", { className: `w-2 h-2 rounded-full ${change.status === "modified"
                                    ? "bg-yellow-500"
                                    : change.status === "added"
                                        ? "bg-green-500"
                                        : "bg-red-500"}` }),
                            react_1.default.createElement("span", { className: "font-mono text-sm" }, change.filename)),
                        react_1.default.createElement("span", { className: `text-xs font-medium ${getStatusColor(change.status)}` }, change.status)))))),
                    fileChanges.length > 0 && (react_1.default.createElement("button", { onClick: performAutoCommit, className: "w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm font-medium" }, "Commit Now"))),
                react_1.default.createElement("div", { className: "bg-gray-50 rounded-lg p-4" },
                    react_1.default.createElement("h3", { className: "font-semibold text-gray-800 mb-3 flex items-center gap-2" },
                        react_1.default.createElement(lucide_react_1.GitCommit, { className: "w-4 h-4" }),
                        "Recent Commits"),
                    react_1.default.createElement("div", { className: "space-y-2 max-h-64 overflow-y-auto" }, commits.length === 0 ? (react_1.default.createElement("p", { className: "text-gray-500 text-sm" }, "No commits yet")) : (commits.map((commit) => (react_1.default.createElement("div", { key: commit.id, className: "p-3 bg-white rounded border" },
                        react_1.default.createElement("div", { className: "flex items-center justify-between mb-1" },
                            react_1.default.createElement("span", { className: "font-mono text-xs text-gray-500" },
                                "#",
                                commit.hash),
                            react_1.default.createElement("span", { className: "text-xs text-gray-500" }, commit.timestamp.toLocaleTimeString())),
                        react_1.default.createElement("p", { className: "text-sm font-medium text-gray-800 mb-1" }, commit.message),
                        react_1.default.createElement("p", { className: "text-xs text-gray-600" },
                            commit.files.length,
                            " file(s) changed"))))))))),
        react_1.default.createElement("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4" },
            react_1.default.createElement("h3", { className: "font-semibold text-yellow-800 mb-2" }, "\u26A0\uFE0F Important Considerations"),
            react_1.default.createElement("ul", { className: "text-sm text-yellow-700 space-y-1" },
                react_1.default.createElement("li", null, "\u2022 Auto-committing every 10 minutes creates noisy commit history"),
                react_1.default.createElement("li", null, "\u2022 May commit incomplete or broken code"),
                react_1.default.createElement("li", null, "\u2022 Better alternatives: Save frequently, commit meaningful changes manually"),
                react_1.default.createElement("li", null, "\u2022 Consider using VS Code's auto-save feature instead"),
                react_1.default.createElement("li", null, "\u2022 For real implementation, you'd need a VS Code extension or external script")))));
};
exports.FileMonitor = FileMonitor;
//# sourceMappingURL=FileMonitor.js.map