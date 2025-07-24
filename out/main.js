"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const client_1 = require("react-dom/client");
const App_1 = __importDefault(require("./App"));
require("./index.css");
const react_2 = __importDefault(require("react"));
(0, client_1.createRoot)(document.getElementById('root')).render(react_2.default.createElement(react_1.StrictMode, null,
    react_2.default.createElement(App_1.default, null)));
//# sourceMappingURL=main.js.map