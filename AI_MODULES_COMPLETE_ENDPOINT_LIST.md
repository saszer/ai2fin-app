# 🤖 AI Modules - Complete Endpoint List

## 🏥 **Health & Status Endpoints**

### **Main Health Check**
- `GET /health` - Basic health check
- `GET /health-detailed` - Detailed health check with configuration status

### **Test Endpoint**
- `GET /test` - Simple test endpoint to verify routes are working

---

## 🎯 **Core AI Classification Endpoints**

### **Main Classification (RECOMMENDED)**
- `POST /classify` - **✅ THIS IS THE ONE YOU WANT!**
  - **Purpose**: Phase 1 cache check + Phase 2 real OpenAI calls
  - **Format**: Single transaction or batch processing
  - **Features**: Real AI, caching, mock mode support

### **Simple Classification (Pattern Matching)**
- `POST /api/simple/analyze` - ❌ **Pattern matching (avoid this)**
  - **Purpose**: Rule-based pattern matching (not real AI)
  - **Used by**: Old system (now updated to use `/classify`)

---

## 🚀 **Optimized Batch Processing**
*Mounted at: `/api/optimized`*

- `POST /api/optimized/analyze-single` - Single transaction with cost optimization
- `POST /api/optimized/analyze-batch` - Batch processing with optimization
- `GET /api/optimized/cost-analysis` - Cost analysis and savings report
- `GET /api/optimized/pattern-analysis` - Pattern analysis insights
- `POST /api/optimized/reset-stats` - Reset optimization statistics
- `POST /api/optimized/batch-analyze` - Alternative batch analysis
- `POST /api/optimized/test-optimization` - Test optimization algorithms

---

## 🧠 **Advanced AI Services**

### **Tax Analysis**
- `POST /tax-analysis` - AI tax deductibility analysis

### **Insights & Intelligence**
- `GET /insights` - AI-generated business insights

### **Learning System**
- `POST /feedback` - Submit feedback for AI learning
- `POST /orchestrate` - Multi-agent AI orchestration

### **Categories Management**
- `GET /categories` - Get available categories

---

## 🔧 **Enhanced Classification**
*File: `ai-enhanced-classification.ts`*

- `POST /classify-enhanced` - Enhanced AI classification with advanced features

---

## 📊 **Logging & Analytics**
*Mounted at: `/api/logs` (currently disabled)*

- `GET /api/logs/dashboard` - Logging dashboard
- `GET /api/logs/search` - Search logs
- `GET /api/logs/detail/:requestId` - Get specific log details
- `GET /api/logs/analytics` - Log analytics
- `GET /api/logs/export` - Export logs
- `POST /api/logs/clean` - Clean old logs
- `GET /api/logs/live` - Live log streaming

---

## 🆔 **User-Specific Endpoints**

### **Dynamic User Routes**
- `POST /:userId/analyze` - User-specific analysis endpoint
  - **Example**: `POST /cmd30zpi3000kp9iwwcj0w66b/analyze`
  - **Purpose**: Per-user AI analysis with user context

---

## 🎯 **Current System Architecture**

### **✅ What Your Core App Uses:**
```
Backend calls: http://localhost:3002/api/classify
│
├── Single Transaction: analysisType: 'single'
├── Batch Processing: analysisType: 'batch'
│
└── Response Modes:
    ├── Mock Mode (no OpenAI key): source: 'mock'
    ├── Real AI Mode (with OpenAI key): source: 'ai_plus'  
    └── Cache Hits: source: 'cache'
```

### **🔧 Service Discovery Integration:**
Your core app's service discovery automatically detects when AI modules are available and routes requests accordingly.

---

## 📋 **Endpoint Summary by Function**

### **🏆 Primary Endpoints (Most Important)**
1. `POST /classify` - **Main AI endpoint** (cache + real AI)
2. `GET /health` - Health check for service discovery
3. `POST /feedback` - Learning and improvement

### **🚀 Performance Optimized**
1. `POST /api/optimized/analyze-batch` - Bulk processing
2. `POST /api/optimized/analyze-single` - Single with cost optimization
3. `GET /api/optimized/cost-analysis` - Cost tracking

### **🧠 Advanced AI**
1. `POST /tax-analysis` - Tax intelligence
2. `GET /insights` - Business intelligence
3. `POST /orchestrate` - Multi-agent workflows

### **🔧 Utility & Monitoring**
1. `GET /test` - Basic functionality test
2. `GET /health-detailed` - Comprehensive status
3. `POST /:userId/analyze` - User-specific processing

---

## 🎯 **Recommended Usage**

### **For Your Core App:**
- **Primary**: `POST /classify` (already implemented ✅)
- **Health**: `GET /health` (for service discovery)
- **Learning**: `POST /feedback` (for AI improvement)

### **For Advanced Features:**
- **Optimization**: `/api/optimized/*` endpoints
- **Analytics**: `/api/logs/*` endpoints (when enabled)
- **Tax Intelligence**: `POST /tax-analysis`

---

## 🚀 **Service Status**

**✅ Currently Running**: AI Modules on port 3002
**✅ Core Integration**: Backend updated to use `/classify` 
**✅ Architecture**: Phase 1 (cache) + Phase 2 (OpenAI) ready
**⚙️ Mode**: Mock mode (configure OpenAI API key for real AI)

**Your system is now using the correct AI endpoint architecture!** 🎉 