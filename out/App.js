"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const FileMonitor_1 = require("./components/FileMonitor");
function App() {
    return (react_1.default.createElement("div", { className: "min-h-screen bg-gray-100" },
        react_1.default.createElement(FileMonitor_1.FileMonitor, null)));
}
exports.default = App;
//# sourceMappingURL=App.js.map