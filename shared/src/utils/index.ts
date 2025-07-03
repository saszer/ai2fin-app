// ========================================
// API Utilities
// ========================================

export const createAPIResponse = <T>(
  data: T, 
  success: boolean = true, 
  error?: { code: string; message: string }
) => ({
  success,
  data: success ? data : undefined,
  error: error || undefined,
  timestamp: new Date(),
  requestId: generateRequestId(),
});

export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ========================================
// Formatting Utilities
// ========================================

export const formatCurrency = (
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (
  date: Date | string, 
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en-US'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateObj);
};

export const formatPercentage = (
  value: number, 
  decimals: number = 1
): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// ========================================
// Validation Utilities  
// ========================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCurrency = (currency: string): boolean => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'CNY'];
  return validCurrencies.includes(currency.toUpperCase());
};

export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && isFinite(amount) && amount !== null;
};

export const validateTransaction = (transaction: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!transaction.amount || !isValidAmount(transaction.amount)) {
    errors.push('Invalid amount');
  }

  if (!transaction.description || transaction.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Invalid date');
  }

  if (transaction.currency && !isValidCurrency(transaction.currency)) {
    errors.push('Invalid currency');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

// ========================================
// Data Transformation Utilities
// ========================================

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T, 
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T, 
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
};

// ========================================
// Array Utilities
// ========================================

export const groupBy = <T>(
  array: T[], 
  keyFn: (item: T) => string
): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(
  array: T[], 
  keyFn: (item: T) => any, 
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const uniqueBy = <T>(
  array: T[], 
  keyFn: (item: T) => any
): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ========================================
// Search & Filter Utilities
// ========================================

export const fuzzySearch = (
  items: any[], 
  query: string, 
  searchFields: string[]
): any[] => {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item => 
    searchFields.some(field => 
      getValue(item, field)?.toString().toLowerCase().includes(lowerQuery)
    )
  );
};

export const getValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// ========================================
// Number Utilities
// ========================================

export const roundTo = (number: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(number * factor) / factor;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

// ========================================
// Async Utilities
// ========================================

export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async <T>(
  fn: () => Promise<T>, 
  maxAttempts: number = 3, 
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }
  
  throw lastError!;
};

export const timeout = <T>(
  promise: Promise<T>, 
  ms: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    )
  ]);
};

// ========================================
// Color & Theme Utilities
// ========================================

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result && result[1] && result[2] && result[3] ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
};

export const generateColorPalette = (baseColor: string, count: number = 5): string[] => {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];

  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 0.2 + (i * 0.6) / (count - 1);
    colors.push(rgbToHex(
      Math.round(rgb.r * factor),
      Math.round(rgb.g * factor), 
      Math.round(rgb.b * factor)
    ));
  }
  return colors;
};

// ========================================
// Error Utilities
// ========================================

export const createError = (
  code: string, 
  message: string, 
  details?: Record<string, any>
) => {
  const error = new Error(message) as any;
  error.code = code;
  error.details = details;
  return error;
};

export const isErrorWithCode = (error: any, code: string): boolean => {
  return error && error.code === code;
};

// ========================================
// Local Storage Utilities
// ========================================

export const safeLocalStorage = {
  get: (key: string, defaultValue: any = null): any => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// ========================================
// Environment Utilities
// ========================================

export const getEnvironment = (): 'development' | 'staging' | 'production' => {
  return (process.env.NODE_ENV as any) || 'development';
};

export const isDevelopment = (): boolean => getEnvironment() === 'development';
export const isProduction = (): boolean => getEnvironment() === 'production';
export const isStaging = (): boolean => getEnvironment() === 'staging'; 