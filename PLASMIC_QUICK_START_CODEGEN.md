# 🚀 Plasmic Codegen - Quick Start

## ✅ Setup Complete - Ready to Use!

Your app is now configured for **Codegen mode** (zero runtime fetching).

---

## 🎯 Quick Commands

### 1. Initialize (First Time Only)

```bash
cd ai2-core-app/client
npx plasmic init
```

**What you'll need:**
- Project ID (from Plasmic Studio URL)
- API Token (from "Code" button in Plasmic Studio)

### 2. Sync Components (Regular Use)

```bash
npx plasmic sync
```

**What it does:**
- Fetches designs from Plasmic
- Generates React components in `src/plasmic/`
- Creates static code (no runtime fetching!)

### 3. Use Generated Components

```typescript
import { PlasmicYourComponent } from './plasmic/your_component';

function MyPage() {
  return <PlasmicYourComponent />;
}
```

---

## 📋 Workflow

```
1. Design in Plasmic Studio
   ↓
2. Run: npx plasmic sync
   ↓
3. Import from ./plasmic/
   ↓
4. Commit generated code
```

---

## 🔒 Security

- ✅ **Users never contact Plasmic** - Zero runtime fetching
- ✅ **Static code only** - All components in your repo
- ✅ **Maximum privacy** - Perfect for financial apps

---

## 📚 Full Documentation

- **Setup Guide**: `PLASMIC_CODEGEN_SETUP_COMPLETE.md`
- **Migration Summary**: `PLASMIC_MIGRATION_SUMMARY.md`
- **Plasmic Docs**: https://docs.plasmic.app/learn/codegen

---

**Status:** ✅ Ready - Run `npx plasmic init` to start!
