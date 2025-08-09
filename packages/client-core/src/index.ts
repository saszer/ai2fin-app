// Client-core: shared client logic for web and mobile
// This file consolidates the API service, caching, and compatibility helpers.

// Production-ready API service with enhanced environment configuration
const getApiBaseUrl = (): string => {
  if ((globalThis as any).REACT_APP_API_URL) return (globalThis as any).REACT_APP_API_URL;
  if (typeof process !== 'undefined' && (process as any).env?.REACT_APP_API_URL) return (process as any).env.REACT_APP_API_URL;

  // Browser-only heuristics
  if (typeof window !== 'undefined') {
    if ((process as any).env?.NODE_ENV === 'production') {
      if ((process as any).env?.REACT_APP_API_SAME_ORIGIN === 'true') return window.location.origin;
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return 'http://localhost:3001';
      return `${protocol}//api.${hostname}`;
    }
    return 'http://localhost:3001';
  }

  // Non-browser default (RN/node)
  return (process as any).env?.AI2_API_URL || 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();
const DEBUG_API = (process as any).env?.REACT_APP_DEBUG_API === 'true';

interface CacheEntry { data: any; timestamp: number; }

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();
  constructor(private cacheDuration: number = 30000) {}
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }
  set(key: string, data: any): void { this.cache.set(key, { data, timestamp: Date.now() }); }
  clear(): void { this.cache.clear(); }
  delete(key: string): void { this.cache.delete(key); }
}

class ApiService {
  private defaultHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  private cache: SimpleCache = new SimpleCache();
  constructor(public baseURL: string = API_BASE_URL) {}

  private getAuthHeaders(): Record<string, string> {
    try {
      if (typeof localStorage !== 'undefined') {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
      }
    } catch {}
    return {};
  }

  private async enhancedFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.defaultHeaders, ...this.getAuthHeaders(), ...(options.headers || {}) } as any;
    if (DEBUG_API) console.log(`API ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${response.status} ${response.statusText} → ${text.slice(0, 300)}`);
    }
    return response;
  }

  async get<T>(endpoint: string): Promise<T> {
    const key = `GET:${endpoint}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const res = await this.enhancedFetch(endpoint, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    this.cache.set(key, data);
    return data;
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const res = await this.enhancedFetch(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || body.error || res.statusText);
    }
    this.invalidateRelatedCaches(endpoint);
    return res.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const res = await this.enhancedFetch(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    this.invalidateRelatedCaches(endpoint);
    return res.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const res = await this.enhancedFetch(endpoint, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    this.invalidateRelatedCaches(endpoint);
    return res.json();
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = { ...this.getAuthHeaders() } as any;
    const res = await fetch(url, { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) throw new Error(`Expected JSON but received ${contentType}`);
    return res.json();
  }

  private invalidateRelatedCaches(endpoint: string): void {
    this.cache.delete(`GET:${endpoint}`);
    if (endpoint.includes('/transactions')) {
      this.cache.delete('GET:/api/bank/transactions');
      this.cache.delete('GET:/api/transactions');
    } else if (endpoint.includes('/categories')) {
      this.cache.delete('GET:/api/bank/categories');
      this.cache.delete('GET:/api/categories');
    } else if (endpoint.includes('/bills')) {
      this.cache.delete('GET:/api/bills/patterns');
      this.cache.delete('GET:/api/bank/transactions');
      this.cache.delete('GET:/api/transactions');
    } else if (endpoint.includes('/csv-uploads')) {
      this.cache.delete('GET:/api/bank/csv-uploads');
    }
  }

  clearCache(): void { this.cache.clear(); }
}

// Singleton
const apiService = new ApiService();

export default apiService;

export const api = {
  get: async <T>(endpoint: string) => ({ data: await apiService.get<T>(endpoint), status: 200, statusText: 'OK', headers: {}, config: {} }),
  post: async <T>(endpoint: string, payload?: any) => ({ data: await apiService.post<T>(endpoint, payload), status: 200, statusText: 'OK', headers: {}, config: {} }),
  put: async <T>(endpoint: string, payload?: any) => ({ data: await apiService.put<T>(endpoint, payload), status: 200, statusText: 'OK', headers: {}, config: {} }),
  delete: async <T>(endpoint: string) => ({ data: await apiService.delete<T>(endpoint), status: 200, statusText: 'OK', headers: {}, config: {} }),
  clearCache: () => apiService.clearCache(),
  defaults: { baseURL: API_BASE_URL, headers: { common: {} as any } }
};

export const uploadApi = {
  post: async <T>(endpoint: string, formData: FormData) => ({ data: await apiService.upload<T>(endpoint, formData), status: 200, statusText: 'OK', headers: {}, config: {} })
};

export const featureTestApi = {
  get: async <T>(endpoint: string) => ({ data: await apiService.get<T>(endpoint), status: 200, statusText: 'OK', headers: {}, config: {} }),
  post: async <T>(endpoint: string, payload?: any) => ({ data: await apiService.post<T>(endpoint, payload), status: 200, statusText: 'OK', headers: {}, config: {} }),
  defaults: { baseURL: API_BASE_URL }
};

export const fetchSubscriptionPlans = async () => {
  const subscriptionApiUrl = (process as any).env?.REACT_APP_SUBSCRIPTION_API_URL || (process as any).env?.SUBSCRIPTION_API_URL || 'http://localhost:3010';
  const response = await fetch(`${subscriptionApiUrl}/api/subscription/pricing`);
  const data = await response.json();
  return data.plans;
};

export const checkAuthState = () => {
  try {
    const localStorageToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const apiDefaultsAuth = (api as any).defaults.headers.common['Authorization'];
    return { hasLocalStorageToken: !!localStorageToken, hasApiDefaultsAuth: !!apiDefaultsAuth, tokensMatch: localStorageToken && apiDefaultsAuth === `Bearer ${localStorageToken}` };
  } catch {
    return { hasLocalStorageToken: false, hasApiDefaultsAuth: false, tokensMatch: false };
  }
};


