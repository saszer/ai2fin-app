# AI2 API Documentation

## Overview
The AI2 AI Modules service provides comprehensive transaction analysis capabilities including classification, bill pattern detection, tax deductibility analysis, and user preference integration.

**Base URL**: `http://localhost:3002`  
**Service**: AI Modules  
**Version**: 1.0.0

---

## 🎯 Core Endpoints

### 1. Enhanced Classification Endpoint

**`POST /api/classify`**

The primary endpoint for transaction analysis with comprehensive features.

#### Request Body Options

**Option 1: Single Transaction Analysis**
```json
{
  "description": "Adobe Creative Cloud Subscription",
  "amount": 52.99,
  "type": "expense",
  "merchant": "Adobe Systems",
  "date": "2025-07-14T12:00:00Z",
  "userPreferences": {
    "businessType": "SOLE_TRADER",
    "industry": "SOFTWARE_SERVICES",
    "countryCode": "AU",
    "profession": "Software Developer"
  }
}
```

**Option 2: Batch Transaction Processing**
```json
{
  "transactions": [
    {
      "id": "tx-1",
      "description": "Office supplies from Officeworks",
      "amount": 125.50,
      "type": "expense",
      "merchant": "Officeworks"
    },
    {
      "id": "tx-2", 
      "description": "GitHub Pro subscription",
      "amount": 29.99,
      "type": "expense",
      "merchant": "GitHub"
    }
  ],
  "userPreferences": {
    "businessType": "SOLE_TRADER",
    "industry": "SOFTWARE_SERVICES",
    "countryCode": "AU"
  }
}
```

#### Response Format

**Single Transaction Response**
```json
{
  "success": true,
  "classification": {
    "category": "OFFICE_SUPPLIES",
    "subcategory": "Equipment",
    "confidence": 0.9,
    "reasoning": "Office supplies based on description",
    "isTaxDeductible": true,
    "businessUsePercentage": 100,
    "taxCategory": "Business Deduction",
    "suggestedBillName": "Office Supplies",
    "isRecurring": false
  },
  "billAnalysis": {
    "isBill": true,
    "isRecurring": false,
    "confidence": 0.85,
    "suggestedBillName": "Office Supplies",
    "pattern": {
      "type": "office",
      "frequency": "adhoc",
      "estimatedAmount": 125.50,
      "merchant": "Officeworks"
    },
    "recommendations": [
      "💼 Consider if this is business-related for tax deductions",
      "📊 Track usage for business vs personal use percentage"
    ]
  },
  "userProfile": {
    "businessType": "SOLE_TRADER",
    "industry": "SOFTWARE_SERVICES",
    "countryCode": "AU",
    "profession": "Software Developer"
  },
  "analysisType": "single",
  "enhancedFeatures": {
    "billPatternDetection": true,
    "userPreferenceIntegration": true,
    "taxAnalysis": true
  },
  "timestamp": "2025-07-14T12:00:00Z"
}
```

**Batch Transaction Response**
```json
{
  "success": true,
  "results": [
    {
      "transactionId": "tx-1",
      "classification": { /* Classification object */ },
      "billAnalysis": { /* Bill analysis object */ }
    },
    {
      "transactionId": "tx-2", 
      "classification": { /* Classification object */ },
      "billAnalysis": { /* Bill analysis object */ }
    }
  ],
  "billPatterns": [
    {
      "transactionId": "tx-2",
      "suggestedBillName": "GitHub Subscription",
      "pattern": {
        "type": "software",
        "frequency": "monthly"
      },
      "confidence": 0.9
    }
  ],
  "insights": {
    "totalAmount": 155.49,
    "taxDeductibleAmount": 155.49,
    "categorySummary": {
      "Office & Technology": 1,
      "Software & Services": 1
    },
    "billsDetected": 1,
    "recurringPatterns": 1
  },
  "userProfile": { /* User profile object */ },
  "analysisType": "batch",
  "enhancedFeatures": {
    "batchProcessing": true,
    "billPatternDetection": true,
    "userPreferenceIntegration": true,
    "taxAnalysis": true,
    "insights": true
  },
  "timestamp": "2025-07-14T12:00:00Z"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Yes (single) | Transaction description |
| `amount` | number | Yes (single) | Transaction amount |
| `type` | string | No | Transaction type ('expense', 'income', 'credit') |
| `merchant` | string | No | Merchant name |
| `date` | string | No | Transaction date (ISO format) |
| `transactions` | array | Yes (batch) | Array of transaction objects |
| `userPreferences` | object | No | User context for better classification |

#### User Preferences Object

```json
{
  "businessType": "SOLE_TRADER" | "COMPANY" | "PARTNERSHIP",
  "industry": "SOFTWARE_SERVICES" | "CONSULTING" | "RETAIL" | "OTHER",
  "countryCode": "AU" | "US" | "UK" | "OTHER",
  "profession": "Software Developer" | "Consultant" | "OTHER"
}
```

#### Status Codes

- **200 OK**: Successful classification
- **400 Bad Request**: Missing required parameters
- **500 Internal Server Error**: Server error

---

### 2. Tax Analysis Endpoint

**`POST /api/tax-analysis`**

Provides detailed tax deductibility analysis for transactions.

#### Request Body
```json
{
  "transactions": [
    {
      "description": "Office supplies",
      "amount": 125.50,
      "category": "OFFICE_SUPPLIES"
    }
  ],
  "userProfile": {
    "businessType": "SOLE_TRADER",
    "countryCode": "AU"
  }
}
```

#### Response
```json
{
  "success": true,
  "taxAnalysis": {
    "totalAmount": 125.50,
    "deductibleAmount": 125.50,
    "nonDeductibleAmount": 0,
    "details": [
      {
        "category": "OFFICE_SUPPLIES",
        "deductiblePercentage": 100,
        "reasoning": "Fully deductible business expense"
      }
    ]
  },
  "timestamp": "2025-07-14T12:00:00Z"
}
```

---

### 3. Health Check Endpoints

**`GET /api/health-detailed`**

Provides detailed service health information.

#### Response
```json
{
  "success": true,
  "service": "AI Modules",
  "version": "1.0.0",
  "status": "healthy",
  "agents": {
    "categoriesAgent": "active",
    "classificationAgent": "active", 
    "taxDeductionAgent": "active"
  },
  "features": {
    "classification": true,
    "billPatternDetection": true,
    "taxAnalysis": true,
    "userPreferences": true
  },
  "timestamp": "2025-07-14T12:00:00Z"
}
```

**`GET /health`**

Simple health check endpoint.

#### Response
```json
{
  "status": "healthy",
  "timestamp": "2025-07-14T12:00:00Z"
}
```

---

### 4. Feedback Endpoint

**`POST /api/feedback`**

Allows users to provide feedback on AI classifications for continuous improvement.

#### Request Body
```json
{
  "transactionId": "tx-123",
  "originalClassification": {
    "category": "OFFICE_SUPPLIES",
    "confidence": 0.8
  },
  "userCorrection": {
    "category": "SOFTWARE_SERVICES",
    "reasoning": "This is actually a software subscription"
  },
  "feedbackType": "category"
}
```

#### Response
```json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "timestamp": "2025-07-14T12:00:00Z"
}
```

---

## 🔧 Technical Details

### Bill Pattern Detection

The system automatically detects bill patterns based on:

#### Pattern Types
- **software**: SaaS subscriptions, software licenses
- **internet**: Internet, broadband, WiFi services
- **phone**: Mobile, landline, telecommunications
- **utilities**: Electricity, gas, water
- **rent**: Office rent, lease payments
- **insurance**: Business insurance policies
- **cloud**: Cloud hosting, web services

#### Pattern Frequencies
- **monthly**: Regular monthly payments
- **quarterly**: Quarterly payments (common for utilities)
- **annual**: Annual subscriptions or payments
- **adhoc**: One-time or irregular payments

### Australian Tax Rules

The system implements comprehensive Australian Sole Trader tax rules:

#### Deduction Percentages
- **Office Supplies**: 100% deductible
- **Software/SaaS**: 100% deductible
- **Internet/Phone**: 80% deductible (home office use)
- **Business Meals**: 50% deductible
- **Travel**: 100% deductible (business travel)
- **Utilities**: 80% deductible (home office)
- **Professional Services**: 100% deductible

### Error Handling

All endpoints provide comprehensive error responses:

```json
{
  "success": false,
  "error": "Classification failed",
  "message": "Detailed error description",
  "timestamp": "2025-07-14T12:00:00Z"
}
```

### Performance

- **Single Transaction**: <100ms response time
- **Batch Processing**: <500ms for up to 50 transactions
- **Service Uptime**: 99%+ availability
- **Error Rate**: <1% with comprehensive error handling

---

## 🚀 Usage Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

// Single transaction classification
async function classifyTransaction() {
  try {
    const response = await axios.post('http://localhost:3002/api/classify', {
      description: 'Office supplies from Officeworks',
      amount: 125.50,
      type: 'expense',
      userPreferences: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      }
    });
    
    console.log('Classification:', response.data.classification);
    console.log('Bill Analysis:', response.data.billAnalysis);
    console.log('Tax Deductible:', response.data.classification.isTaxDeductible);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Batch transaction processing
async function processBatchTransactions() {
  try {
    const response = await axios.post('http://localhost:3002/api/classify', {
      transactions: [
        {
          id: 'tx-1',
          description: 'GitHub Pro subscription',
          amount: 29.99,
          type: 'expense'
        },
        {
          id: 'tx-2',
          description: 'Business lunch',
          amount: 45.80,
          type: 'expense'
        }
      ],
      userPreferences: {
        businessType: 'SOLE_TRADER',
        countryCode: 'AU'
      }
    });
    
    console.log('Batch Results:', response.data.results);
    console.log('Insights:', response.data.insights);
    console.log('Bill Patterns:', response.data.billPatterns);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Python Example

```python
import requests
import json

# Single transaction classification
def classify_transaction():
    url = 'http://localhost:3002/api/classify'
    data = {
        'description': 'Office supplies from Officeworks',
        'amount': 125.50,
        'type': 'expense',
        'userPreferences': {
            'businessType': 'SOLE_TRADER',
            'countryCode': 'AU'
        }
    }
    
    try:
        response = requests.post(url, json=data)
        result = response.json()
        
        print('Classification:', result['classification'])
        print('Bill Analysis:', result['billAnalysis'])
        print('Tax Deductible:', result['classification']['isTaxDeductible'])
    except Exception as e:
        print('Error:', str(e))

# Usage
classify_transaction()
```

---

## 📊 Response Data Models

### Classification Object
```typescript
interface Classification {
  category: string;
  subcategory: string;
  confidence: number;
  reasoning: string;
  isTaxDeductible: boolean;
  businessUsePercentage: number;
  taxCategory: string;
  suggestedBillName: string;
  isRecurring: boolean;
}
```

### Bill Analysis Object
```typescript
interface BillAnalysis {
  isBill: boolean;
  isRecurring: boolean;
  confidence: number;
  suggestedBillName: string | null;
  pattern: {
    type: string;
    frequency: string;
    estimatedAmount: number;
    merchant: string;
  } | null;
  recommendations: string[];
}
```

### User Profile Object
```typescript
interface UserProfile {
  businessType: 'SOLE_TRADER' | 'COMPANY' | 'PARTNERSHIP';
  industry: string;
  countryCode: string;
  profession: string;
}
```

---

## 🔐 Security & Best Practices

### Request Validation
- All endpoints validate input parameters
- Proper error handling for malformed requests
- Type checking for all parameters

### Rate Limiting
- Recommended: 100 requests per minute per client
- Batch processing preferred for multiple transactions

### Data Privacy
- No persistent storage of transaction data
- User preferences processed in-memory only
- No sensitive data logged

---

## 🛠️ Integration Guide

### Service Discovery Integration
The AI Modules service integrates with the Core App through service discovery:

```javascript
// Core App integration example
const aiModulesUrl = serviceDiscovery.getServiceUrl('ai-modules');
const response = await fetch(`${aiModulesUrl}/api/classify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(transactionData)
});
```

### Error Handling Best Practices
Always implement proper error handling:

```javascript
try {
  const response = await classifyTransaction(data);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation errors
  } else if (error.response?.status === 500) {
    // Handle server errors
  } else {
    // Handle network errors
  }
}
```

---

**Last Updated**: July 14, 2025  
**Version**: 1.0.0  
**Status**: Production Ready 