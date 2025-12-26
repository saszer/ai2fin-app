# 🔧 Decoder Fix - Regex Syntax Error

**Date:** 2025-01-26  
**Error:** `Syntax error on regex: '^\[AUTH\]|authentication|auth.*failure|auth.*success'`

---

## 🚨 Problem

**Error from logs:**
```
wazuh-analysisd: ERROR: (1452): Syntax error on regex: '^\[AUTH\]|authentication|auth.*failure|auth.*success'
wazuh-analysisd: ERROR: (2107): Decoder configuration error: 'financial-app-auth'.
```

**Root Cause:**
- Wazuh `prematch` doesn't support complex regex with multiple alternatives (`|`)
- The pattern was too complex for Wazuh's decoder syntax

---

## ✅ Solution

**Simplified decoders to use JSON parsing:**
- Since our app sends JSON events via API, we use `JSON_Decoder` plugin
- `prematch` now just matches simple keywords
- Wazuh will parse the JSON structure automatically

**Changed:**
- ❌ Complex regex patterns with `|` alternatives
- ✅ Simple keyword matching + JSON decoder

---

## 📋 Updated Decoders

All decoders now:
1. Use simple `prematch` (keyword matching)
2. Use `JSON_Decoder` plugin (parses JSON from our API)
3. Define `order` for field extraction

**This matches how we send events from the app (JSON format)!**

---

## 🚀 Deploy

The decoder file has been fixed. Redeploy:

```bash
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**This should fix the decoder syntax error!** ✅

