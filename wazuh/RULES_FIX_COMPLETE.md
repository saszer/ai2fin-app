# 🔧 Wazuh Rules Fix - Complete Audit

**Date:** 2025-01-26  
**Issue:** Rules with `frequency`/`timeframe` must use `if_matched_sid` or `if_matched_group`

---

## 🚨 Problem Found

**Error:**
```
ERROR: Invalid use of frequency/context options. Missing if_matched on rule '100003'.
```

**Root Cause:**
- Rules with `frequency` and `timeframe` are **correlation rules**
- They MUST use `if_matched_sid` or `if_matched_group` (not `if_sid` or `match`)
- Correlation rules detect multiple occurrences of another rule

---

## ✅ Fixes Applied

### **Rule 100003** ✅
- **Before:** Had `frequency`/`timeframe` with `if_sid` (WRONG)
- **After:** Split into:
  - Rule 100003: Base rule (no frequency)
  - Rule 100011: Correlation rule with `if_matched_sid>100003`

### **Rule 100005** ✅
- **Before:** Had `frequency`/`timeframe` with `if_sid` (WRONG)
- **After:** Split into:
  - Rule 100005: Base rule (no frequency)
  - Rule 100012: Correlation rule with `if_matched_sid>100005`

### **Rule 100006** ✅
- **Before:** Had `frequency`/`timeframe` with `match` (WRONG)
- **After:** Split into:
  - Rule 100006: Base rule (no frequency)
  - Rule 100013: Correlation rule with `if_matched_sid>100006`

### **Rule 100008** ✅
- **Before:** Had `frequency`/`timeframe` with `match` (WRONG)
- **After:** Split into:
  - Rule 100008: Base rule (no frequency)
  - Rule 100014: Correlation rule with `if_matched_sid>100008`

---

## 📋 Wazuh Rule Syntax

### **Base Rule (No Frequency):**
```xml
<rule id="100003" level="11">
  <if_sid>5716</if_sid>
  <match>connector|bank.*connection</match>
  <description>Bank connector activity detected</description>
  <group>financial_app,connector</group>
</rule>
```

### **Correlation Rule (With Frequency):**
```xml
<rule id="100011" level="12" frequency="10" timeframe="300">
  <if_matched_sid>100003</if_matched_sid>
  <description>Unusual bank connector activity detected (multiple events)</description>
  <group>financial_app,connector,anomaly</group>
</rule>
```

**Key Points:**
- ✅ Base rule: Uses `if_sid` or `match`
- ✅ Correlation rule: Uses `if_matched_sid` (references base rule)
- ✅ Correlation rule: Has `frequency` and `timeframe` attributes

---

## ✅ All Rules Now Valid

**Rules with frequency (all fixed):**
- ✅ Rule 100002: Uses `if_matched_group` (correct)
- ✅ Rule 100011: Uses `if_matched_sid>100003` (fixed)
- ✅ Rule 100012: Uses `if_matched_sid>100005` (fixed)
- ✅ Rule 100013: Uses `if_matched_sid>100006` (fixed)
- ✅ Rule 100014: Uses `if_matched_sid>100008` (fixed)
- ✅ Rule 100039: Uses `if_matched_sid>100032` (correct)
- ✅ Rule 100040: Uses `if_matched_sid>100035` (correct)

---

## 🚀 Ready to Deploy

All rules are now syntactically correct. Redeploy:

```bash
cd D:\embracingearthspace\wazuh
fly deploy -a ai2-wazuh
```

**Expected Result:**
- ✅ No rule syntax errors
- ✅ Wazuh starts successfully
- ✅ API listens on port 55000
- ✅ Health checks pass

---

## 📊 Summary

**Issues Fixed:**
- ✅ Rule 100003: Split into base + correlation
- ✅ Rule 100005: Split into base + correlation
- ✅ Rule 100006: Split into base + correlation
- ✅ Rule 100008: Split into base + correlation

**All rules now follow Wazuh syntax correctly!** ✅

