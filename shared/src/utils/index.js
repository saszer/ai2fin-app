"use strict";
// ========================================
// API Utilities
// ========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStaging = exports.isProduction = exports.isDevelopment = exports.getEnvironment = exports.safeLocalStorage = exports.isErrorWithCode = exports.createError = exports.generateColorPalette = exports.rgbToHex = exports.hexToRgb = exports.timeout = exports.retry = exports.delay = exports.randomBetween = exports.clamp = exports.roundTo = exports.getValue = exports.fuzzySearch = exports.uniqueBy = exports.sortBy = exports.groupBy = exports.pick = exports.omit = exports.deepClone = exports.slugify = exports.sanitizeString = exports.isValidDate = exports.validateTransaction = exports.isValidAmount = exports.isValidCurrency = exports.isValidEmail = exports.formatPercentage = exports.formatRelativeTime = exports.formatDate = exports.formatCurrency = exports.generateRequestId = exports.createAPIResponse = void 0;
const createAPIResponse = (data, success = true, error) => ({
    success,
    data: success ? data : undefined,
    error: error || undefined,
    timestamp: new Date(),
    requestId: (0, exports.generateRequestId)(),
});
exports.createAPIResponse = createAPIResponse;
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
exports.generateRequestId = generateRequestId;
// ========================================
// Formatting Utilities
// ========================================
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const formatDate = (date, options = {}, locale = 'en-US') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    }).format(dateObj);
};
exports.formatDate = formatDate;
const formatRelativeTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'just now';
    if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return (0, exports.formatDate)(dateObj);
};
exports.formatRelativeTime = formatRelativeTime;
const formatPercentage = (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
};
exports.formatPercentage = formatPercentage;
// ========================================
// Validation Utilities  
// ========================================
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidCurrency = (currency) => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'CNY'];
    return validCurrencies.includes(currency.toUpperCase());
};
exports.isValidCurrency = isValidCurrency;
const isValidAmount = (amount) => {
    return !isNaN(amount) && isFinite(amount) && amount !== null;
};
exports.isValidAmount = isValidAmount;
const validateTransaction = (transaction) => {
    const errors = [];
    if (!transaction.amount || !(0, exports.isValidAmount)(transaction.amount)) {
        errors.push('Invalid amount');
    }
    if (!transaction.description || transaction.description.trim().length === 0) {
        errors.push('Description is required');
    }
    if (!transaction.date || !(0, exports.isValidDate)(transaction.date)) {
        errors.push('Invalid date');
    }
    if (transaction.currency && !(0, exports.isValidCurrency)(transaction.currency)) {
        errors.push('Invalid currency');
    }
    return {
        valid: errors.length === 0,
        errors
    };
};
exports.validateTransaction = validateTransaction;
const isValidDate = (date) => {
    if (!date)
        return false;
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
};
exports.isValidDate = isValidDate;
// ========================================
// Data Transformation Utilities
// ========================================
const sanitizeString = (str) => {
    return str.trim().replace(/[<>]/g, '');
};
exports.sanitizeString = sanitizeString;
const slugify = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepClone = deepClone;
const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
};
exports.omit = omit;
const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (key in obj)
            result[key] = obj[key];
    });
    return result;
};
exports.pick = pick;
// ========================================
// Array Utilities
// ========================================
const groupBy = (array, keyFn) => {
    return array.reduce((groups, item) => {
        const key = keyFn(item);
        groups[key] = groups[key] || [];
        groups[key].push(item);
        return groups;
    }, {});
};
exports.groupBy = groupBy;
const sortBy = (array, keyFn, order = 'asc') => {
    return [...array].sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        if (aVal < bVal)
            return order === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
};
exports.sortBy = sortBy;
const uniqueBy = (array, keyFn) => {
    const seen = new Set();
    return array.filter(item => {
        const key = keyFn(item);
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
};
exports.uniqueBy = uniqueBy;
// ========================================
// Search & Filter Utilities
// ========================================
const fuzzySearch = (items, query, searchFields) => {
    if (!query)
        return items;
    const lowerQuery = query.toLowerCase();
    return items.filter(item => searchFields.some(field => (0, exports.getValue)(item, field)?.toString().toLowerCase().includes(lowerQuery)));
};
exports.fuzzySearch = fuzzySearch;
const getValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};
exports.getValue = getValue;
// ========================================
// Number Utilities
// ========================================
const roundTo = (number, decimals) => {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
};
exports.roundTo = roundTo;
const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};
exports.clamp = clamp;
const randomBetween = (min, max) => {
    return Math.random() * (max - min) + min;
};
exports.randomBetween = randomBetween;
// ========================================
// Async Utilities
// ========================================
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.delay = delay;
const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxAttempts) {
                await (0, exports.delay)(delayMs * attempt);
            }
        }
    }
    throw lastError;
};
exports.retry = retry;
const timeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms))
    ]);
};
exports.timeout = timeout;
// ========================================
// Color & Theme Utilities
// ========================================
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3] ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};
exports.hexToRgb = hexToRgb;
const rgbToHex = (r, g, b) => {
    return `#${[r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
};
exports.rgbToHex = rgbToHex;
const generateColorPalette = (baseColor, count = 5) => {
    const rgb = (0, exports.hexToRgb)(baseColor);
    if (!rgb)
        return [baseColor];
    const colors = [];
    for (let i = 0; i < count; i++) {
        const factor = 0.2 + (i * 0.6) / (count - 1);
        colors.push((0, exports.rgbToHex)(Math.round(rgb.r * factor), Math.round(rgb.g * factor), Math.round(rgb.b * factor)));
    }
    return colors;
};
exports.generateColorPalette = generateColorPalette;
// ========================================
// Error Utilities
// ========================================
const createError = (code, message, details) => {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    return error;
};
exports.createError = createError;
const isErrorWithCode = (error, code) => {
    return error && error.code === code;
};
exports.isErrorWithCode = isErrorWithCode;
// ========================================
// Local Storage Utilities
// ========================================
exports.safeLocalStorage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        }
        catch {
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        }
        catch {
            return false;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        }
        catch {
            return false;
        }
    }
};
// ========================================
// Environment Utilities
// ========================================
const getEnvironment = () => {
    return process.env.NODE_ENV || 'development';
};
exports.getEnvironment = getEnvironment;
const isDevelopment = () => (0, exports.getEnvironment)() === 'development';
exports.isDevelopment = isDevelopment;
const isProduction = () => (0, exports.getEnvironment)() === 'production';
exports.isProduction = isProduction;
const isStaging = () => (0, exports.getEnvironment)() === 'staging';
exports.isStaging = isStaging;
//# sourceMappingURL=index.js.map