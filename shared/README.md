# 🔧 AI2 Shared - Common Utilities & Types

## Overview

The AI2 Shared package provides common utilities, types, configurations, and constants used across all AI2 platform services. It ensures consistency, type safety, and maintainability across the entire enterprise platform.

## Features

### 📝 Type Definitions
- **Core Types**: User, Transaction, Category, and other domain types
- **API Types**: Request/response interfaces for all services
- **Configuration Types**: Environment and feature flag types
- **Utility Types**: Common TypeScript utility types

### ⚙️ Configuration Management
- **Feature Flags**: Centralized feature toggle system
- **Environment Config**: Service configuration management
- **Constants**: Platform-wide constants and enums
- **Validation**: Input validation schemas

### 🛠️ Utility Functions
- **Date Utilities**: Date formatting and manipulation
- **Validation**: Input validation helpers
- **Formatting**: Data formatting utilities
- **Crypto**: Security and encryption utilities

### 🎨 UI Components
- **Common Components**: Reusable React components
- **Styling**: Shared CSS and theme definitions
- **Icons**: Icon library and components
- **Layout**: Common layout components

## Quick Start

### Prerequisites
- Node.js 18+
- TypeScript 5+

### Installation
```bash
cd shared
npm install
npm run build
```

### Development
```bash
npm run dev
```

### Usage in Other Packages
```typescript
import { User, Transaction, FeatureFlags } from '@ai2/shared';
import { formatCurrency, validateEmail } from '@ai2/shared/utils';
```

## Package Structure

```
src/
├── types/
│   ├── index.ts              # Main type exports
│   ├── user.ts               # User-related types
│   ├── transaction.ts        # Transaction types
│   ├── api.ts                # API interfaces
│   └── config.ts             # Configuration types
├── config/
│   ├── features.ts           # Feature flag definitions
│   ├── constants.ts          # Platform constants
│   └── validation.ts         # Validation schemas
├── utils/
│   ├── index.ts              # Utility exports
│   ├── date.ts               # Date utilities
│   ├── format.ts             # Formatting utilities
│   ├── validation.ts         # Validation helpers
│   └── crypto.ts             # Security utilities
├── components/
│   ├── index.ts              # Component exports
│   ├── Button.tsx            # Common button component
│   ├── Modal.tsx             # Modal component
│   └── Loading.tsx           # Loading component
└── index.ts                  # Main package exports
```

## Type Definitions

### Core Types
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  subscription: SubscriptionTier;
  preferences: UserPreferences;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: Category;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
}
```

### API Types
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

## Feature Flags

### Configuration
```typescript
export const FEATURE_FLAGS = {
  ENABLE_AI: process.env.ENABLE_AI === 'true',
  ENABLE_SUBSCRIPTION: process.env.ENABLE_SUBSCRIPTION === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_CONNECTORS: process.env.ENABLE_CONNECTORS === 'true',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS === 'true',
} as const;
```

### Usage
```typescript
import { FEATURE_FLAGS } from '@ai2/shared';

if (FEATURE_FLAGS.ENABLE_AI) {
  // AI features enabled
}
```

## Utility Functions

### Date Utilities
```typescript
export const formatDate = (date: Date, format: DateFormat): string;
export const parseDate = (dateString: string): Date;
export const isToday = (date: Date): boolean;
export const getDateRange = (start: Date, end: Date): Date[];
```

### Formatting Utilities
```typescript
export const formatCurrency = (amount: number, currency: string): string;
export const formatPercentage = (value: number): string;
export const formatNumber = (value: number): string;
```

### Validation Utilities
```typescript
export const validateEmail = (email: string): boolean;
export const validatePassword = (password: string): ValidationResult;
export const validateTransaction = (transaction: Partial<Transaction>): ValidationResult;
```

## Constants

### Business Constants
```typescript
export const SUBSCRIPTION_TIERS = {
  CORE: 'core',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
} as const;

export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  AUD: 'AUD',
} as const;
```

## Development

### Adding New Types
1. Create type definition in appropriate file
2. Export from types/index.ts
3. Update main index.ts export
4. Add JSDoc documentation

### Adding New Utilities
1. Create utility function in appropriate file
2. Export from utils/index.ts
3. Add unit tests
4. Update documentation

### Adding New Components
1. Create component in components/ directory
2. Export from components/index.ts
3. Add TypeScript definitions
4. Include usage examples

## Testing

### Unit Tests
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

### Build
```bash
npm run build
```

## Versioning

This package follows semantic versioning:
- **Major**: Breaking changes in types or APIs
- **Minor**: New features or utilities
- **Patch**: Bug fixes and improvements

## License

Proprietary - AI2 Enterprise Platform

---

*The foundation of consistency • Type-safe development • Shared across the platform* 