# 🤖 AI Local Logging Summary

## ✅ **Current Status: WORKING**

Your AI API logging is **already functioning** and capturing all OpenAI calls to the `/logs/` folder!

## 📊 **GPT Model Configuration**

**Current Model:** **GPT-4** ✅

**Where it's defined:**
- Environment Variable: `AI_MODEL=gpt-4` 
- Code Locations:
  - `ai2-core-app/src/lib/config.ts` (line 37)
  - `ai2-ai-modules/src/routes/ai-batch-optimized.ts` (line 20)

## 📁 **Log Files in `/logs/` Directory**

| File | Purpose | Content |
|------|---------|---------|
| **`api-requests.log`** | All AI API calls | OpenAI requests & responses with full details |
| **`api-errors.log`** | AI API errors | Error messages, stack traces, debugging info |
| **`api-performance.log`** | Performance metrics | Slow response times, token usage |

## 📝 **What's Being Logged**

**Every OpenAI API call includes:**
- ✅ **Request Details**: Full prompt, model (GPT-4), tokens, temperature
- ✅ **Response Data**: AI response content, tokens used, processing time
- ✅ **Error Information**: Stack traces if API calls fail
- ✅ **User Context**: User ID, transaction count, batch information
- ✅ **Server Metadata**: Hostname, worker ID, memory usage
- ✅ **Cost Tracking**: Estimated costs per API call

## 🔍 **Example Log Entry**

```json
{
  "timestamp": "2025-07-14T20:23:02.183Z",
  "sessionId": "session_1752524582181_x89v3blbd",
  "requestId": "req_1752524582183_e4dh76etw",
  "service": "TaxDeductionAIService",
  "method": "analyzeTaxDeductibility",
  "request": {
    "prompt": "Analyze this expense for tax deductibility...",
    "model": "gpt-4",
    "maxTokens": 1000,
    "temperature": 0.7
  },
  "response": {
    "content": "Analysis result...",
    "tokensUsed": 640,
    "processingTimeMs": 1505,
    "success": true
  },
  "metadata": {
    "userId": "tax-analysis",
    "transactionCount": 1,
    "costEstimate": 0.04
  }
}
```

## 📖 **How to Monitor AI API Calls**

### **1. View Recent API Calls**
```bash
# PowerShell
Get-Content logs/api-requests.log | Select-Object -Last 5

# Command Prompt  
tail -n 5 logs/api-requests.log

# Or just open the file in any text editor
```

### **2. Monitor in Real-Time**
```bash
# PowerShell
Get-Content logs/api-requests.log -Wait -Tail 10

# Or use the monitoring script
node monitor-ai-logs.js
```

### **3. Check for Errors**
```bash
# View AI API errors
Get-Content logs/api-errors.log | Select-Object -Last 3
```

### **4. Quick Status Check**
```bash
# Count total API calls
Get-Content logs/api-requests.log | Measure-Object -Line

# Check log file sizes
Get-ChildItem logs/*.log | Format-Table Name, Length, LastWriteTime
```

## 🧪 **Test AI Logging**

### **Start AI Services**
```bash
# Terminal 1: Start AI modules
cd ai2-ai-modules
npm start

# Terminal 2: Start core app  
cd ai2-core-app
npm start
```

### **Make Test API Calls**
```bash
# Test single transaction
node test-local-logging.js

# Or click "Analyze Bucket" in the UI
# Go to http://localhost:3000/bank-transactions
# Upload CSV and click "Analyze Bucket"
```

### **Watch Logs During Testing**
```bash
# Real-time monitoring
node monitor-ai-logs.js

# Or simple tail
Get-Content logs/api-requests.log -Wait -Tail 5
```

## 📊 **For 150 Transactions Analysis**

When you click "Analyze Bucket" with 150 transactions, you'll see:

**Expected Log Entries:**
- **~3-5 API calls** (batch optimized, not 150 individual calls)
- **Total cost logged**: ~$0.075 (vs $3.75 without optimization)
- **Processing time**: ~30-60 seconds
- **Token usage**: ~500-1500 tokens total

**Log Pattern:**
```
REQUEST  -> TaxDeductionAIService.analyzeTaxDeductibility
RESPONSE -> Success, 640 tokens, 1505ms
REQUEST  -> TransactionClassificationAIAgent.bulkClassifyTransactions  
RESPONSE -> Success, 890 tokens, 2300ms
```

## 🔧 **Configuration Files**

**Environment Variables** (`.env` file):
```bash
OPENAI_API_KEY=your-actual-openai-api-key-here
AI_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7
```

**Code Locations:**
- Main Logger: `ai2-ai-modules/src/services/APILogger.ts`
- Core Config: `ai2-core-app/src/lib/config.ts`

## ✅ **Verification Checklist**

- [x] **GPT-4 Model**: Configured and working
- [x] **Local Logging**: All AI calls logged to `/logs/` folder  
- [x] **Batch Optimization**: 98% cost reduction implemented
- [x] **Error Handling**: Comprehensive error logging
- [x] **Performance Tracking**: Slow calls identified
- [x] **Real-time Monitoring**: Scripts provided

## 🎯 **Summary**

You already have **comprehensive AI API logging** working! Every OpenAI API call is being captured in the `/logs/` folder with full details including:

- **Model Used**: GPT-4
- **API Calls**: All requests and responses  
- **Token Usage**: Detailed tracking
- **Costs**: Estimated per call
- **Performance**: Processing times
- **Errors**: Complete error logs

The system is optimized to make **3 batch calls instead of 150 individual calls** for your data bucket analysis, saving 98% on costs while logging everything for monitoring and debugging. 