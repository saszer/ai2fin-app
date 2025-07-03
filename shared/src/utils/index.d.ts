export declare const createAPIResponse: <T>(data: T, success?: boolean, error?: {
    code: string;
    message: string;
}) => {
    success: boolean;
    data: T;
    error: {
        code: string;
        message: string;
    };
    timestamp: Date;
    requestId: string;
};
export declare const generateRequestId: () => string;
export declare const formatCurrency: (amount: number, currency?: string, locale?: string) => string;
export declare const formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions, locale?: string) => string;
export declare const formatRelativeTime: (date: Date | string) => string;
export declare const formatPercentage: (value: number, decimals?: number) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidCurrency: (currency: string) => boolean;
export declare const isValidAmount: (amount: number) => boolean;
export declare const validateTransaction: (transaction: any) => {
    valid: boolean;
    errors: string[];
};
export declare const isValidDate: (date: any) => boolean;
export declare const sanitizeString: (str: string) => string;
export declare const slugify: (text: string) => string;
export declare const deepClone: <T>(obj: T) => T;
export declare const omit: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>;
export declare const pick: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>;
export declare const groupBy: <T>(array: T[], keyFn: (item: T) => string) => Record<string, T[]>;
export declare const sortBy: <T>(array: T[], keyFn: (item: T) => any, order?: "asc" | "desc") => T[];
export declare const uniqueBy: <T>(array: T[], keyFn: (item: T) => any) => T[];
export declare const fuzzySearch: (items: any[], query: string, searchFields: string[]) => any[];
export declare const getValue: (obj: any, path: string) => any;
export declare const roundTo: (number: number, decimals: number) => number;
export declare const clamp: (value: number, min: number, max: number) => number;
export declare const randomBetween: (min: number, max: number) => number;
export declare const delay: (ms: number) => Promise<void>;
export declare const retry: <T>(fn: () => Promise<T>, maxAttempts?: number, delayMs?: number) => Promise<T>;
export declare const timeout: <T>(promise: Promise<T>, ms: number) => Promise<T>;
export declare const hexToRgb: (hex: string) => {
    r: number;
    g: number;
    b: number;
} | null;
export declare const rgbToHex: (r: number, g: number, b: number) => string;
export declare const generateColorPalette: (baseColor: string, count?: number) => string[];
export declare const createError: (code: string, message: string, details?: Record<string, any>) => any;
export declare const isErrorWithCode: (error: any, code: string) => boolean;
export declare const safeLocalStorage: {
    get: (key: string, defaultValue?: any) => any;
    set: (key: string, value: any) => boolean;
    remove: (key: string) => boolean;
};
export declare const getEnvironment: () => "development" | "staging" | "production";
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const isStaging: () => boolean;
//# sourceMappingURL=index.d.ts.map