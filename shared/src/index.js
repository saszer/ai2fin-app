"use strict";
// ========================================
// Main Shared Package Exports
// ========================================
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHARED_VERSION = exports.FeatureFlagManager = exports.featureFlags = void 0;
// Types
__exportStar(require("./types"), exports);
// Configuration & Feature Flags
__exportStar(require("./config/features"), exports);
var features_1 = require("./config/features");
Object.defineProperty(exports, "featureFlags", { enumerable: true, get: function () { return __importDefault(features_1).default; } });
// Utilities
__exportStar(require("./utils"), exports);
// Export feature flag manager class
var features_2 = require("./config/features");
Object.defineProperty(exports, "FeatureFlagManager", { enumerable: true, get: function () { return features_2.FeatureFlagManager; } });
// Version information
exports.SHARED_VERSION = '1.0.0';
//# sourceMappingURL=index.js.map