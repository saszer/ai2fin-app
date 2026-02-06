# 🔒 Plasmic Security & Privacy Analysis

## ⚠️ Important Security Considerations

### What Plasmic Can See/Store:

1. **Component Structure & Metadata** ✅ Visible to Plasmic
   - Component names, props, structure
   - Design layouts and styling
   - Visual composition data
   - **This is stored on Plasmic servers**

2. **Your Source Code** ⚠️ Partially Visible
   - Registered components are loaded into Plasmic Studio
   - Component structure/props are visible
   - **Business logic stays in your repo** (not sent to Plasmic)
   - Generated code is synced to your repo (you own it)

3. **User Data** ✅ NOT Sent to Plasmic
   - Transaction data, financial info, user data
   - API calls go directly to YOUR backend
   - Plasmic doesn't intercept data flows
   - **Your data stays private**

---

## 🔐 Security Measures Plasmic Has:

- ✅ **SOC 2 Type II** compliance
- ✅ **AES-256 encryption** for data at rest
- ✅ **TLS 1.2** for data in transit
- ✅ **Two-factor authentication**
- ✅ **Regular penetration testing**
- ✅ **Bug bounty program**
- ✅ **AWS/GCP hosting** (US data centers)

---

## ⚠️ Privacy Concerns for Financial Apps:

### What Gets Stored on Plasmic Servers:

1. **Design Metadata**
   - Component layouts
   - Visual designs
   - Styling information
   - Page structures

2. **Component Registration Info**
   - Component names (e.g., "Dashboard", "TransactionList")
   - Prop definitions
   - Component structure

3. **NOT Stored:**
   - Your actual business logic
   - User data
   - Financial transactions
   - API credentials (encrypted if used)
   - Database connections

---

## 🎯 Risk Assessment:

### Low Risk ✅
- **Visual designs** - Not sensitive
- **Component structure** - Generally safe
- **Styling** - Not sensitive

### Medium Risk ⚠️
- **Component names** - Could reveal feature names
- **Page structure** - Could reveal app architecture
- **Design patterns** - Could reveal business logic patterns

### High Risk ❌
- **User data** - NOT sent to Plasmic ✅
- **Financial data** - NOT sent to Plasmic ✅
- **API keys** - Encrypted if stored ✅
- **Source code** - Stays in your repo ✅

---

## 🛡️ Mitigation Strategies:

### Option 1: Use Plasmic Selectively
- Only register **non-sensitive** components
- Don't register pages with sensitive business logic
- Use for **UI components only** (buttons, cards, layouts)

### Option 2: Self-Hosted (Enterprise)
- Deploy Plasmic in your own infrastructure
- Keep everything on-premise
- **Contact Plasmic for enterprise pricing**

### Option 3: Use Alternative Tools
- **Builder.io** - Similar model, check their privacy
- **UXPin Merge** - Can work with Git only
- **Storybook** - Completely local, no cloud

### Option 4: Hybrid Approach
- Use Plasmic for **design system components only**
- Keep sensitive pages in code
- Register only Material-UI components
- Don't register your business logic components

---

## 📋 Recommendations for Financial Apps:

### ✅ Safe to Use:
- Material-UI components (Card, Button, Typography, etc.)
- Generic layout components
- Design system elements
- Non-sensitive UI components

### ⚠️ Use with Caution:
- Page-level components (Dashboard, Transactions, etc.)
- Components with business logic names
- Components that reveal app structure

### ❌ Avoid Registering:
- Components with sensitive business logic
- Components that handle financial data directly
- Components with API keys or secrets
- Authentication components

---

## 🔒 Best Practices:

1. **Minimal Registration**
   ```typescript
   // ✅ Safe: Register only UI components
   PLASMIC.registerComponent(Card, {...});
   PLASMIC.registerComponent(Button, {...});
   
   // ⚠️ Consider: Page components
   // PLASMIC.registerComponent(Dashboard, {...}); // Skip if sensitive
   ```

2. **Environment Separation**
   - Use Plasmic only in **development**
   - Don't connect production data
   - Use mock data in Plasmic

3. **Code Review**
   - Review all generated code
   - Don't auto-commit Plasmic changes
   - Manual review before merging

4. **Access Control**
   - Limit who has Plasmic access
   - Use separate Plasmic projects for sensitive work
   - Regular access audits

---

## 🆚 Comparison with Alternatives:

### Plasmic vs Builder.io
- **Similar privacy model** - Both store design metadata
- **Builder.io** - More CMS-focused, similar security
- **Both** - Enterprise self-hosted options available

### Plasmic vs UXPin Merge
- **UXPin** - Can work with Git only (more private)
- **UXPin** - Less cloud dependency
- **Both** - Store some metadata

### Plasmic vs Storybook
- **Storybook** - 100% local, no cloud
- **Storybook** - No design metadata stored externally
- **Storybook** - Best for privacy, but less visual editing

---

## 💡 My Recommendation:

### For Your Financial App:

**Option A: Conservative Approach** ⭐ Recommended
- Use Plasmic **only for Material-UI components**
- Don't register your business pages
- Use for design system work only
- Keep all business logic in code

**Option B: Self-Hosted** (If budget allows)
- Enterprise self-hosted Plasmic
- Everything stays on your infrastructure
- Maximum privacy and control

**Option C: Alternative Tool**
- Use **Storybook** for component development
- Use **UXPin Merge** (Git-based, more private)
- Skip visual editing for sensitive components

---

## ❓ Questions to Ask Plasmic:

1. **Data Retention**: How long is design metadata stored?
2. **Data Deletion**: Can you delete all data on request?
3. **Access Logs**: Who at Plasmic can access your projects?
4. **Compliance**: Do they meet financial industry standards?
5. **Self-Hosted Pricing**: What's the cost for on-premise?

---

## 🎯 Final Verdict:

### Is Plasmic Safe? **Mostly Yes, with Caveats:**

✅ **Safe for:**
- UI component design
- Design system work
- Non-sensitive layouts
- Material-UI components

⚠️ **Use Caution for:**
- Business logic components
- Page-level components
- Components revealing architecture

❌ **Not Recommended for:**
- Highly sensitive financial components
- Components with embedded secrets
- Production data handling

### For Maximum Security:
- Use **self-hosted** option (enterprise)
- Or use **Storybook** (100% local)
- Or use **UXPin Merge** (Git-based)

---

## 📞 Next Steps:

1. **Review Plasmic's Privacy Policy**: https://docs.plasmic.app/privacy/
2. **Contact Plasmic Enterprise**: Ask about self-hosted options
3. **Start Small**: Register only Material-UI components first
4. **Monitor**: Review what data is being sent
5. **Consider Alternatives**: Evaluate Storybook or UXPin Merge

---

**Last Updated:** 2026-01-24  
**Security Level:** Medium (with proper configuration)  
**Recommendation:** Use selectively, avoid registering sensitive components
