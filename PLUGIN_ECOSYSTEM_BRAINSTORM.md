# AI2 Plugin Ecosystem - Brainstorm & Design Document

## Executive Summary

**Goal**: Transform AI2 into an extensible financial platform with an open plugin ecosystem, enabling third-party developers to create specialized financial tools (e.g., home depreciation/rental tracking, vehicle management) while maintaining security, scalability, and performance.

**Current State**:
- Microservices architecture with 7 modules
- Custom rules system exists (basic extensibility)
- Vehicle/Trip models demonstrate extensibility pattern
- No plugin registration/discovery system
- No plugin marketplace
- No standardized plugin API

---

## Table of Contents

1. [Plugin System Architecture](#plugin-system-architecture)
2. [Plugin Categories & Examples](#plugin-categories--examples)
3. [Home Depreciation/Rental Plugin Deep Dive](#home-depreciationrental-plugin-deep-dive)
4. [Plugin Integration Flow](#plugin-integration-flow)
5. [Expense & Bill Flow Integration](#expense--bill-flow-integration)
6. [Implementation Plan](#implementation-plan)

---

## 1. Plugin System Architecture

### 1.1 Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     PLUGIN ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Plugin Registry │────────▶│  Plugin Discovery │        │
│  │                  │         │                  │        │
│  └──────────────────┘         └──────────────────┘        │
│           │                            │                   │
│           ▼                            ▼                   │
│  ┌──────────────────┐         ┌──────────────────┐        │
│  │  Plugin Store    │         │  Plugin Manager  │        │
│  │  (Marketplace)   │         │  (Runtime)       │        │
│  └──────────────────┘         └──────────────────┘        │
│           │                            │                   │
│           │                            ▼                   │
│           └──────────────▶  ┌──────────────────┐            │
│                             │   Plugin Hooks   │            │
│                             │   Event System   │            │
│                             └──────────────────┘            │
│                                      │                      │
│                                      ▼                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │         PLUGIN API SURFACE                        │   │
│  │  - Database access (tenant-scoped)                 │   │
│  │  - Expense/Bill manipulation                       │   │
│  │  - Tax deduction calculations                     │   │
│  │  - Notification triggers                          │   │
│  │  - AI enhancement hooks                           │   │
│  │  - Dashboard widgets                               │   │
│  └───────────────────────────────────────────────────┘   │
│                                      │                      │
│                                      ▼                      │
│                     ┌─────────────────────┐               │
│                     │  Core AI2 Platform  │               │
│                     │  - Expense/Bill     │               │
│                     │  - Tax System       │               │
│                     │  - AI Modules       │               │
│                     └─────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Plugin Architecture Layers

#### Layer 1: Plugin API (Surface Layer)
```typescript
interface PluginAPI {
  // Database Access (Scoped by userId/tenant)
  database: {
    query<T>(model: string, where: any): Promise<T[]>;
    create<T>(model: string, data: any): Promise<T>;
    update<T>(model: string, where: any, data: any): Promise<T>;
    delete(model: string, where: any): Promise<void>;
    transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;
  };

  // Expense/Bill Access
  expenses: {
    create(data: ExpenseInput): Promise<Expense>;
    update(id: string, data: Partial<ExpenseInput>): Promise<Expense>;
    findById(id: string): Promise<Expense>;
    findMany(filters: ExpenseFilters): Promise<Expense[]>;
  };

  bills: {
    create(data: BillInput): Promise<Bill>;
    update(id: string, data: Partial<BillInput>): Promise<Bill>;
    findById(id: string): Promise<Bill>;
    findMany(filters: BillFilters): Promise<Bill[]>;
  };

  // Tax System Integration
  tax: {
    calculateDeduction(expense: Expense): Promise<number>;
    analyzeTaxDeductibility(expense: Expense): Promise<TaxAnalysis>;
  };

  // Events & Hooks
  events: {
    on(event: string, handler: Function): void;
    emit(event: string, data: any): void;
    before(event: string, handler: Function): void;
    after(event: string, handler: Function): void;
  };

  // Notifications
  notifications: {
    send(notification: NotificationInput): Promise<void>;
  };

  // AI Integration
  ai: {
    classify(expense: Expense): Promise<AIClassification>;
    analyze(expense: Expense): Promise<AIAnalysis>;
  };

  // UI Components
  ui: {
    registerWidget(slot: string, component: React.Component): void;
    showModal(config: ModalConfig): Promise<any>;
  };

  // Configuration Storage
  config: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };
}
```

#### Layer 2: Plugin Manager (Runtime Layer)
```typescript
class PluginManager {
  private plugins: Map<string, Plugin>;
  private eventEmitter: EventEmitter;
  
  async registerPlugin(plugin: Plugin): Promise<void>;
  async unregisterPlugin(pluginId: string): Promise<void>;
  async executeHook(hook: string, data: any): Promise<any>;
  async listEnabledPlugins(): Promise<Plugin[]>;
  async getPlugin(pluginId: string): Promise<Plugin | null>;
}
```

#### Layer 3: Plugin Registry (Discovery Layer)
```typescript
class PluginRegistry {
  private store: PluginStore;
  
  async searchPlugins(query: string): Promise<Plugin[]>;
  async getPluginById(id: string): Promise<Plugin>;
  async installPlugin(pluginId: string, userId: string): Promise<void>;
  async uninstallPlugin(pluginId: string, userId: string): Promise<void>;
  async updatePlugin(pluginId: string): Promise<void>;
}
```

#### Layer 4: Plugin Hooks System (Event Layer)
```typescript
interface PluginHooks {
  // Expense Lifecycle
  'expense:beforeCreate': (data: ExpenseInput) => Promise<ExpenseInput>;
  'expense:afterCreate': (expense: Expense) => Promise<void>;
  'expense:beforeUpdate': (id: string, data: Partial<ExpenseInput>) => Promise<Partial<ExpenseInput>>;
  'expense:afterUpdate': (expense: Expense) => Promise<void>;
  'expense:beforeDelete': (id: string) => Promise<boolean>;
  'expense:afterDelete': (id: string) => Promise<void>;

  // Bill Lifecycle
  'bill:beforeCreate': (data: BillInput) => Promise<BillInput>;
  'bill:afterCreate': (bill: Bill) => Promise<void>;
  'bill:beforeUpdate': (id: string, data: Partial<BillInput>) => Promise<Partial<BillInput>>;
  'bill:afterUpdate': (bill: Bill) => Promise<void>;

  // Tax Calculation
  'tax:beforeCalculate': (expense: Expense) => Promise<void>;
  'tax:afterCalculate': (expense: Expense, deduction: number) => Promise<void>;
  'tax:deductibilityAnalysis': (expense: Expense) => Promise<TaxDeductionInfo>;

  // AI Processing
  'ai:beforeClassify': (expense: Expense) => Promise<void>;
  'ai:afterClassify': (expense: Expense, category: string) => Promise<void>;

  // Dashboard
  'dashboard:render': (slot: string) => Promise<React.ReactNode>;
}
```

### 1.3 Database Schema Extensions

```prisma
// New models for plugin system
model Plugin {
  id                  String   @id @default(cuid())
  name                String
  slug                String   @unique
  description         String
  version             String
  author              String
  repositoryUrl       String?
  iconUrl             String?
  screenshots         String[] // Array of URLs
  
  // Configuration
  manifestJson        String   // Plugin manifest (JSON schema)
  permissions         String[] // ['READ_EXPENSES', 'WRITE_EXPENSES', 'CALCULATE_TAX']
  
  // Plugin store metadata
  isOfficial          Boolean  @default(false)
  isVerified          Boolean  @default(false)
  downloads           Int      @default(0)
  rating              Float?   // Average rating
  price               Float?    // null = free
  trialDays           Int      @default(0)
  
  // Status
  status              String   @default("active") // 'active', 'deprecated', 'banned'
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  installations       UserPluginInstallation[]
  
  @@map("plugins")
}

model UserPluginInstallation {
  id                  String   @id @default(cuid())
  userId              String
  pluginId            String
  version             String   // Installed version
  
  // Configuration
  config              String?  // Plugin-specific config (JSON)
  isEnabled           Boolean  @default(true)
  
  // Billing
  subscriptionId      String?  // Link to subscription if paid
  installedAt         DateTime @default(now())
  lastUsedAt          DateTime?
  
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  plugin              Plugin   @relation(fields: [pluginId], references: [id], onDelete: Cascade)
  
  @@unique([userId, pluginId])
  @@index([userId])
  @@index([pluginId])
  @@map("user_plugin_installations")
}

model PluginData {
  id                  String   @id @default(cuid())
  installationId      String   // UserPluginInstallation.id
  key                 String
  value               String   // JSON string
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  installation        UserPluginInstallation @relation(fields: [installationId], references: [id], onDelete: Cascade)
  
  @@unique([installationId, key])
  @@index([installationId])
  @@map("plugin_data")
}

model PluginHook {
  id                  String   @id @default(cuid())
  pluginId            String
  hookName            String   // 'expense:afterCreate'
  handlerFunction     String   // Name of function in plugin
  
  createdAt           DateTime @default(now())
  
  plugin              Plugin   @relation(fields: [pluginId], references: [id], onDelete: Cascade)
  
  @@unique([pluginId, hookName, handlerFunction])
  @@index([hookName])
  @@map("plugin_hooks")
}

// Extend User model to include plugin installations
// (Add to existing User model in schema.prisma)
// User model additions:
//   pluginInstallations UserPluginInstallation[]
```

---

## 2. Plugin Categories & Examples

### 2.1 Property & Real Estate Plugins

#### Home Depreciation Plugin (Rental Property)
**Purpose**: Track rental property depreciation for tax deductions
**Category**: Tax Optimization
**Key Features**:
- Track property purchase price and depreciation schedule
- Calculate annual depreciation deductions
- Link property maintenance expenses
- Generate ATO-compliant depreciation schedules
- Track capital improvements vs. repairs

#### Rental Income Tracker
**Purpose**: Manage rental income and expenses
**Category**: Income & Expense Tracking
**Key Features**:
- Track rental income by property
- Link rental expenses to properties
- Calculate net rental income
- Track vacancy periods
- Generate rental reports for tax

#### Property Maintenance Scheduler
**Purpose**: Schedule and track property maintenance
**Category**: Asset Management
**Key Features**:
- Schedule recurring maintenance tasks
- Track maintenance costs by property
- Reminder notifications
- Maintenance history per property
- Depreciation vs repair classification

### 2.2 Business & Professional Plugins

#### Home Office Calculator
**Purpose**: Calculate home office deductions
**Category**: Tax Deductions
**Key Features**:
- Track workspace dimensions
- Calculate percentage-based deductions
- Link utilities and rent expenses
- Generate ATO-compliant reports
- Monthly/annual depreciation

#### Vehicle Logbook (Enhanced)
**Purpose**: Detailed vehicle expense tracking
**Category**: Business Expenses
**Key Features**:
- GPS-based trip tracking
- Automatic logbook generation
- Multiple vehicle support (already exists)
- Integrated with existing Vehicle/Trip models
- ATO-compliant reporting

#### Equipment & Asset Depreciation
**Purpose**: Track business equipment depreciation
**Category**: Asset Management
**Key Features**:
- Track asset purchases and depreciation schedules
- Link expenses to depreciating assets
- Multiple depreciation methods
- Annual depreciation summaries
- ATO integration

### 2.3 Industry-Specific Plugins

#### Construction/Contractor Expenses
**Purpose**: Specialized tracking for construction business
**Category**: Industry-Specific
**Key Features**:
- Material tracking by project
- Subcontractor payment tracking
- Equipment rental vs. purchase
- Project-based expense allocation
- ATO construction industry rules

#### Freelance/Gig Worker Tracker
**Purpose**: Track gig economy income and expenses
**Category**: Freelancer
**Key Features**:
- Multiple income source tracking
- Platform-specific expense categories
- Quarterly GST reporting
- Business vs personal ratio tracking
- Simplified tax prep

#### Medical Professional Expenses
**Purpose**: Track professional development and equipment
**Category**: Professional
**Key Features**:
- CPD/training expense tracking
- Medical equipment depreciation
- Professional registration costs
- Continuing education deductions
- Industry-specific tax rules

### 2.4 Data & Integration Plugins

#### Receipt OCR Enrichment
**Purpose**: Extract data from receipt images
**Category**: Data Enhancement
**Key Features**:
- OCR text extraction
- Merchant name identification
- Amount extraction with validation
- Category suggestion
- Auto-associate with bank transactions

#### Multi-Currency Handler
**Purpose**: Handle foreign currency transactions
**Category**: International
**Key Features**:
- Auto-convert to base currency
- Historical exchange rates
- Multiple currency accounts
- FX gain/loss calculation
- ATO reporting for foreign transactions

#### Crypto Tax Tracker
**Purpose**: Track cryptocurrency transactions
**Category**: Digital Assets
**Key Features**:
- Import from crypto exchanges
- Calculate capital gains/losses
- ATO-compliant reporting
- Multiple wallet support
- DeFi yield tracking

### 2.5 Reporting & Analytics Plugins

#### Advanced ATO Export
**Purpose**: Enhanced ATO reporting
**Category**: Tax Reporting
**Key Features**:
- myGov import format
- DataFile XML export
- Industry-specific schedules
- Claim summaries and documentation

#### Industry Benchmarking
**Purpose**: Compare expenses to industry averages
**Category**: Analytics
**Key Features**:
- Industry-specific benchmarks
- Expense ratio analysis
- Anomaly detection
- Peer comparison (anonymized)

---

## 3. Home Depreciation/Rental Plugin - Deep Dive

### 3.1 Plugin Definition

```typescript
const HomeDepreciationPlugin: Plugin = {
  id: 'home-depreciation',
  name: 'Rental Property Depreciation Tracker',
  version: '1.0.0',
  description: 'Track rental property depreciation and generate ATO-compliant schedules',
  
  permissions: [
    'READ_EXPENSES',
    'WRITE_EXPENSES',
    'CALCULATE_TAX',
    'READ_BILLS',
    'WRITE_BILLS'
  ],
  
  hooks: {
    'expense:afterCreate': 'handleExpense',
    'bill:afterCreate': 'handleBill',
    'dashboard:render': 'renderPropertyWidget'
  },
  
  manifest: {
    databaseTables: [
      { name: 'RentalProperty', schema: PropertySchema },
      { name: 'DepreciationSchedule', schema: DepreciationSchema },
      { name: 'PropertyMaintenance', schema: MaintenanceSchema }
    ],
    
    apiEndpoints: {
      '/properties': 'GET,POST',
      '/properties/:id/depreciation': 'GET',
      '/properties/:id/maintenance': 'GET,POST'
    },
    
    uiComponents: {
      'dashboard.properties': 'PropertyListWidget',
      'settings.rental': 'RentalSettingsPanel'
    }
  }
};
```

### 3.2 Data Model for Plugin

```typescript
// Plugin-specific data models
interface RentalProperty {
  id: string;
  userId: string;
  address: string;
  propertyType: 'apartment' | 'house' | 'townhouse' | 'land';
  
  // Purchase info
  purchaseDate: Date;
  purchasePrice: number;
  purchaseCosts: number; // Stamp duty, legal, etc.
  
  // Cost basis for depreciation
  buildingValue: number; // Depreciable amount
  landValue: number; // Non-depreciable
  depreciationMethod: 'diminishing' | 'prime_cost';
  usefulLife: number; // Years
  
  // Current status
  isRented: boolean;
  isActive: boolean;
  
  // Relationships
  depreciations: DepreciationSchedule[];
  maintenance: PropertyMaintenance[];
  income: RentalIncome[];
  expenses: Expense[]; // Linked expenses
  bills: Bill[]; // Linked bills
}

interface DepreciationSchedule {
  id: string;
  propertyId: string;
  taxYear: number;
  
  // Depreciation calculation
  openingBalance: number;
  depreciationRate: number;
  annualDepreciation: number;
  closingBalance: number;
  
  // ATO compliance
  division: '43' | '40'; // ATO division
  submitted: boolean;
  submissionDate?: Date;
  
  property: RentalProperty;
}

interface PropertyMaintenance {
  id: string;
  propertyId: string;
  
  // Maintenance info
  description: string;
  expenseId?: string; // Link to expense
  billOccurrenceId?: string; // Link to bill
  
  category: 'repair' | 'improvement' | 'maintenance';
  cost: number;
  date: Date;
  
  // Tax implications
  isDeductible: boolean;
  improvesValue: boolean; // Add to cost base
  
  property: RentalProperty;
  expense?: Expense;
  billOccurrence?: BillOccurrence;
}

interface RentalIncome {
  id: string;
  propertyId: string;
  description: string;
  amount: number;
  date: Date;
  
  // Can link to income transactions
  transactionId?: string;
  
  property: RentalProperty;
}
```

### 3.3 Plugin Implementation

```typescript
// Plugin handler functions
class HomeDepreciationPlugin {
  private api: PluginAPI;
  
  constructor(api: PluginAPI) {
    this.api = api;
  }
  
  // Hook: When expense is created, check if it's property-related
  async handleExpense(expense: Expense) {
    // Auto-categorize property expenses
    const property = await this.getPropertyByExpense(expense);
    
    if (property) {
      // Link expense to property
      await this.linkExpenseToProperty(expense.id, property.id);
      
      // Check if expense is improvement vs repair
      const category = this.categorizeMaintenance(expense);
      
      // Update cost base if capital improvement
      if (category === 'improvement') {
        await this.addToCostBase(property.id, expense.amount);
      }
      
      // Mark for depreciation analysis
      await this.scheduleDepreciationRecalculation(property.id);
    }
  }
  
  // Hook: When bill is created, check if it's property-related
  async handleBill(bill: Bill) {
    // Similar to expense handling
    const property = await this.getPropertyByBill(bill);
    
    if (property) {
      await this.linkBillToProperty(bill.id, property.id);
      await this.categorizeBill(bill);
    }
  }
  
  // Calculate depreciation for a property
  async calculateDepreciation(propertyId: string, taxYear: number): Promise<DepreciationSchedule> {
    const property = await this.getProperty(propertyId);
    
    const openingBalance = await this.getOpeningBalance(propertyId, taxYear);
    const rate = property.depreciationMethod === 'diminishing' 
      ? 200 / property.usefulLife 
      : 100 / property.usefulLife;
    
    const annualDepreciation = openingBalance * (rate / 100);
    const closingBalance = openingBalance - annualDepreciation;
    
    return {
      propertyId,
      taxYear,
      openingBalance,
      depreciationRate: rate,
      annualDepreciation,
      closingBalance,
      division: '40' // Division 40 for plant and equipment
    };
  }
  
  // Link expense to property (auto-detection based on patterns)
  async linkExpenseToProperty(expenseId: string, propertyId: string) {
    await this.api.database.create('PropertyExpense', {
      expenseId,
      propertyId,
      linkedAt: new Date()
    });
  }
  
  // Render dashboard widget
  async renderPropertyWidget(): Promise<React.ReactNode> {
    const properties = await this.api.database.query('RentalProperty', {
      userId: this.api.context.userId,
      isActive: true
    });
    
    return <PropertyListWidget properties={properties} />;
  }
}
```

### 3.4 Integration Points

#### Expense Flow Integration

```
User adds expense (e.g., "Property repairs $500")
         ↓
Core AI2: Creates Expense record
         ↓
Plugin Hook: 'expense:afterCreate'
         ↓
Plugin: Checks if expense relates to property
  - Pattern matching (keywords: "property", "rental", address)
  - Merchant matching (known property-related merchants)
  - User prompt for property link
         ↓
Plugin: Links to Property and creates PropertyMaintenance
         ↓
Plugin: Updates depreciation schedule
         ↓
Returns: Expense with property link
```

#### Bill Flow Integration

```
User adds bill (e.g., "Monthly property insurance $200/month")
         ↓
Core AI2: Creates Bill record
         ↓
Plugin Hook: 'bill:afterCreate'
         ↓
Plugin: Detects recurring property expense
  - If bill occurrence is linked to property, track it
  - Auto-link to rental property
         ↓
Plugin: Creates PropertyMaintenance with recurring flag
         ↓
Plugin: Calculates annual expense for depreciation
         ↓
Returns: Bill with property link
```

---

## 4. Plugin Integration Flow

### 4.1 User Journey

#### 4.1.1 Plugin Discovery & Installation

```typescript
// 1. User browses plugin store
GET /api/plugins/store?category=property

Response: {
  plugins: [
    {
      id: 'home-depreciation',
      name: 'Rental Property Depreciation',
      description: '...',
      price: 9.99,
      rating: 4.5,
      downloads: 1234
    }
  ]
}

// 2. User installs plugin
POST /api/plugins/install
{
  pluginId: 'home-depreciation'
}

// 3. Plugin installation flow
async function installPlugin(userId: string, pluginId: string) {
  // Check permissions
  const plugin = await getPlugin(pluginId);
  await validatePermissions(plugin.permissions);
  
  // Install dependencies
  await registerDatabaseTables(plugin.manifest.databaseTables);
  
  // Register hooks
  await registerPluginHooks(plugin.hooks);
  
  // Create installation record
  await createInstallation(userId, pluginId);
  
  // Grant API access (scoped to user)
  await createPluginAPIInstance(userId, pluginId);
}
```

#### 4.1.2 Plugin Usage Flow

```
User adds expense "Property repairs $500"
         ↓
Core Expense Creation:
  POST /api/expenses
         ↓
ExpenseService.create(expenseData)
         ↓
Event: 'expense:beforeCreate'
  - Plugins can modify data
  - Plugins can add validation
         ↓
Database: Create expense record
         ↓
Event: 'expense:afterCreate'
         ↓
PluginManager.executeHook('expense:afterCreate', expense)
         ↓
Registered plugins execute:
  - HomeDepreciationPlugin.handleExpense(expense)
    - Auto-link to property
    - Create maintenance record
    - Update depreciation schedule
  - Other plugins...
         ↓
Response to user with updated data
```

### 4.2 Plugin Development Flow

```typescript
// Plugin developer creates plugin

// 1. Define plugin structure
const MyPlugin = {
  id: 'my-plugin',
  manifest: { ... },
  hooks: { ... },
  init: async (api) => { ... }
};

// 2. Implement hooks
class MyPlugin {
  async init() {
    this.api.events.on('expense:afterCreate', this.handleExpense.bind(this));
  }
  
  async handleExpense(expense: Expense) {
    // Plugin logic
    const analysis = await this.analyze(expense);
    await this.api.database.create('MyPluginData', analysis);
  }
}

// 3. Register plugin with store
POST /api/plugins/register
{
  plugin: MyPlugin,
  author: 'John Doe',
  repositoryUrl: '...'
}

// 4. Plugin goes through review
// 5. Plugin appears in store
// 6. Users can install
```

---

## 5. Expense & Bill Flow Integration

### 5.1 Expense Flow with Plugin Hook Points

```typescript
// 1. EXPENSE CREATION FLOW
async function createExpense(userId: string, data: ExpenseInput) {
  // PRE-HOOK: Plugins can modify or validate
  const modifiedData = await executeHook('expense:beforeCreate', data);
  
  // Core creation
  const expense = await prisma.expense.create({
    data: {
      ...modifiedData,
      userId
    }
  });
  
  // POST-HOOK: Plugins can process
  await executeHook('expense:afterCreate', expense);
  
  return expense;
}

// 2. EXPENSE UPDATE FLOW
async function updateExpense(userId: string, id: string, data: Partial<ExpenseInput>) {
  // PRE-HOOK
  const modifiedData = await executeHook('expense:beforeUpdate', id, data);
  
  const expense = await prisma.expense.update({
    where: { id, userId },
    data: modifiedData
  });
  
  // POST-HOOK
  await executeHook('expense:afterUpdate', expense);
  
  return expense;
}

// 3. TAX CALCULATION WITH PLUGINS
async function calculateTax(userId: string, expenseId: string) {
  const expense = await getExpense(expenseId);
  
  // PRE-HOOK: Plugins can pre-analyze
  await executeHook('tax:beforeCalculate', expense);
  
  // Core tax calculation
  let taxDeduction = await calculateTaxDeduction(expense);
  
  // HOOK: Plugins can modify deduction
  taxDeduction = await executeHook('tax:deductibilityAnalysis', expense) || taxDeduction;
  
  // POST-HOOK
  await executeHook('tax:afterCalculate', expense, taxDeduction);
  
  return taxDeduction;
}
```

### 5.2 Bill Flow with Plugin Hook Points

```typescript
// 1. BILL CREATION FLOW
async function createBill(userId: string, data: BillInput) {
  // PRE-HOOK
  const modifiedData = await executeHook('bill:beforeCreate', data);
  
  const bill = await prisma.bill.create({
    data: {
      ...modifiedData,
      userId
    }
  });
  
  // POST-HOOK
  await executeHook('bill:afterCreate', bill);
  
  return bill;
}

// 2. BILL OCCURRENCE HANDLING
async function markBillPaid(occurrenceId: string, amount: number) {
  const occurrence = await prisma.billOccurrence.update({
    where: { id: occurrenceId },
    data: {
      isPaid: true,
      paidDate: new Date(),
      actualAmount: amount
    }
  });
  
  // Hook: Plugins can process payment
  await executeHook('bill:paid', occurrence);
  
  return occurrence;
}
```

### 5.3 Plugin Data Flow Example

```
User creates expense: "Water bill rental unit 1 - $150"
         ↓
Core creates Expense
         ↓
Plugin Hook triggered: 'expense:afterCreate'
         ↓
HomeDepreciationPlugin receives expense:
  1. Checks expense.description for keywords: "rental", "unit", "property"
  2. Searches for matching properties in user's account
  3. If found, links expense to property:
     - Creates PropertyMaintenance record
     - Links to Expense via expenseId
  4. Determines if expense is:
     - Repairs (fully deductible)
     - Maintenance (fully deductible)
     - Improvements (adds to cost base, depreciable)
  5. Updates property depreciation schedule if needed
         ↓
Response includes plugin-enriched data:
{
  expense: { ... },
  propertyLink: {
    propertyId: "abc123",
    propertyName: "123 Main St",
    maintenanceCategory: "repairs"
  },
  depreciationImpact: {
    deductibleAmount: 150,
    affectsDepreciationSchedule: false
  }
}
```

---

## 6. Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
1. **Database Schema Extensions**
   - Add Plugin, UserPluginInstallation, PluginData, PluginHook models
   - Migration scripts
   
2. **Plugin API Surface**
   - Define PluginAPI interface
   - Implement database access layer (tenant-scoped)
   - Implement expense/bill access
   - Implement event system
   
3. **Plugin Manager Core**
   - Plugin registration system
   - Hook execution engine
   - Plugin lifecycle management

### Phase 2: Hooks & Events (Weeks 3-4)
1. **Implement Core Hooks**
   - Expense lifecycle hooks (create, update, delete)
   - Bill lifecycle hooks
   - Tax calculation hooks
   
2. **Hook Execution Engine**
   - Async hook execution
   - Error handling and isolation
   - Performance monitoring
   
3. **Event System**
   - Event emitter implementation
   - Subscription management
   - Event logging

### Phase 3: First Plugin - Home Depreciation (Weeks 5-6)
1. **Plugin Development**
   - Create HomeDepreciationPlugin
   - Implement property data models
   - Implement depreciation calculations
   - Implement expense/bill linking
   
2. **UI Components**
   - Property management UI
   - Depreciation schedule display
   - Expense linking interface
   
3. **Testing**
   - Unit tests for plugin
   - Integration tests with core
   - End-to-end user testing

### Phase 4: Plugin Store & Marketplace (Weeks 7-8)
1. **Plugin Store**
   - Plugin listing API
   - Search and filtering
   - Ratings and reviews
   
2. **Installation System**
   - Install/uninstall flows
   - Permission management
   - Plugin updates
   
3. **Developer Portal**
   - Plugin registration
   - SDK and documentation
   - Testing tools

### Phase 5: Security & Performance (Weeks 9-10)
1. **Security Hardening**
   - Plugin sandboxing
   - Permission validation
   - Data isolation
   - Audit logging
   
2. **Performance Optimization**
   - Hook execution optimization
   - Database query optimization
   - Caching strategy
   
3. **Monitoring**
   - Plugin performance metrics
   - Error tracking
   - Usage analytics

### Phase 6: Additional Plugins & Polish (Weeks 11-12)
1. **Additional Plugins**
   - Home Office Calculator
   - Enhanced Vehicle Logbook
   - Industry-specific plugins
   
2. **Documentation**
   - Developer guide
   - User guide
   - API reference
   
3. **Launch Prep**
   - Beta testing
   - Marketing materials
   - Launch strategy

---

## Technical Considerations

### Security
- Plugin sandboxing: Isolate plugin code from core
- Permission system: Grant only necessary permissions
- Data validation: Validate all plugin inputs
- Audit trail: Log all plugin actions
- Rate limiting: Prevent plugin abuse

### Performance
- Async hook execution: Non-blocking plugin processing
- Database optimization: Efficient queries
- Caching: Cache plugin responses
- Lazy loading: Load plugins on-demand
- Resource limits: Limit plugin resource usage

### Scalability
- Multi-tenancy: Plugin data isolation per user
- Horizontal scaling: Plugin state management
- Database sharding: Separate plugin data
- CDN: Host plugin assets

### Compatibility
- API versioning: Maintain backward compatibility
- Migration system: Handle schema changes
- Fallback mechanisms: Core continues if plugin fails
- Testing framework: Automated plugin testing

---

## Success Metrics

1. **Developer Adoption**
   - Number of plugins in store
   - Active plugin developers
   - Plugin downloads

2. **User Engagement**
   - Plugins installed per user
   - Active plugin usage
   - User satisfaction scores

3. **Business Impact**
   - Revenue from paid plugins
   - User retention improvement
   - Market differentiation

4. **Technical Performance**
   - Plugin load time
   - Hook execution time
   - Error rates
   - System stability

---

## Questions for Discussion

1. **Monetization Strategy**
   - Should plugins be free or paid?
   - Revenue share model with plugin developers?
   - Premium vs free plugin tiers?

2. **Developer Ecosystem**
   - Open-source plugins or proprietary?
   - Plugin approval process?
   - Developer support model?

3. **Core vs Plugin Balance**
   - What features should be in core vs plugin?
   - How to avoid plugin fragmentation?
   - Backward compatibility strategy?

4. **Scope Limitation**
   - Which plugin categories to prioritize?
   - Limited to financial/tax plugins only?
   - Integration with external platforms?

---

## Conclusion

An open plugin ecosystem would transform AI2 from a financial tool into a platform, enabling:
- **Extensibility**: Users can customize for their needs
- **Innovation**: Community-driven features
- **Monetization**: Platform growth and sustainability
- **Specialization**: Industry-specific solutions
- **Scalability**: Modular architecture

The home depreciation plugin serves as an excellent proof of concept, demonstrating how plugins can enhance core expense and bill flows with specialized domain knowledge.

Next steps: Get stakeholder feedback, refine architecture, and begin Phase 1 implementation.














