# ✅ Plasmic Codegen Setup Complete

## 🔒 Zero Runtime Fetching - Maximum Privacy

Your Plasmic setup has been **completely switched to Codegen mode**. This means:

- ✅ **Users NEVER contact Plasmic** - Zero runtime fetching
- ✅ **Static code only** - All components generated in your repo
- ✅ **Offline capable** - No external dependencies
- ✅ **Maximum privacy** - Perfect for financial apps

---

## ✅ What Was Changed

### 1. Removed Headless API Setup
- ❌ Deleted `src/plasmic-init.ts` (Headless API loader)
- ❌ Deleted `src/pages/PlasmicHost.tsx` (Runtime host page)
- ❌ Removed `/plasmic-host` route from App.tsx
- ❌ Removed all runtime fetching code

### 2. Installed Codegen Tools
- ✅ Installed `@plasmicapp/cli` (dev dependency)
- ✅ Created `plasmic.json` config file

### 3. Added Runtime Safeguards
- ✅ Created `src/plasmic-safeguards.ts`
- ✅ Monitors for accidental Headless API usage
- ✅ Warns in production if Headless packages detected

---

## 🚀 Next Steps: Initialize Codegen

### Step 1: Get Your Plasmic Credentials

1. Go to **[plasmic.app](https://plasmic.app)** and sign in
2. Open your project (or create a new one)
3. Get your **Project ID** from the URL:
   - URL: `https://studio.plasmic.app/projects/YOUR_PROJECT_ID`
   - Copy the `YOUR_PROJECT_ID` part
4. Get your **API Token**:
   - Click **"Code"** button in Plasmic Studio toolbar
   - Copy the **Public API Token**

### Step 2: Initialize Plasmic Codegen

```bash
cd ai2-core-app/client
npx plasmic init
```

This will:
- Ask for your Project ID
- Ask for your API Token
- Update `plasmic.json` with your credentials
- Set up the codegen workflow

### Step 3: Sync Your First Component

```bash
npx plasmic sync
```

This will:
- Fetch your designs from Plasmic
- Generate React components in `src/plasmic/`
- Create static code files (no runtime fetching!)

### Step 4: Use Generated Components

```typescript
// Import generated components (static code, no fetching!)
import { PlasmicYourComponent } from './plasmic/your_component';

function MyPage() {
  return <PlasmicYourComponent />;
}
```

---

## 📁 Generated Files Structure

After running `npx plasmic sync`, you'll have:

```
ai2-core-app/client/
├── src/
│   └── plasmic/              # Generated components (static code)
│       ├── plasmic__default_style.css
│       ├── plasmic__global.css
│       └── [your-components].tsx
└── plasmic.json              # Codegen config
```

**Important:** Generated files in `src/plasmic/` are static code - they never fetch from Plasmic at runtime!

---

## 🔒 Runtime Safeguards

### What's Protected:

1. **Production Monitoring**
   - Checks for accidental Headless API imports
   - Warns if `@plasmicapp/loader-react` is used
   - Prevents runtime fetching

2. **Development Warnings**
   - Alerts if Headless packages detected
   - Reminds to use Codegen workflow

### How It Works:

- `src/plasmic-safeguards.ts` is imported in `App.tsx`
- Monitors for Headless API usage
- Warns in console if violations detected
- No performance impact (checks only in dev)

---

## 🎨 Workflow: Design → Code

### 1. Design in Plasmic Studio

1. Go to **[studio.plasmic.app](https://studio.plasmic.app)**
2. Open your project
3. Design visually (drag Material-UI components)
4. Save your work

### 2. Sync to Code

```bash
cd ai2-core-app/client
npx plasmic sync
```

This generates static React code in `src/plasmic/`

### 3. Use in Your App

```typescript
import { PlasmicYourComponent } from './plasmic/your_component';

// Use it like any React component - it's static code!
<PlasmicYourComponent />
```

### 4. Commit Generated Code

```bash
git add src/plasmic/
git commit -m "Update Plasmic components"
```

**Note:** Generated code is part of your repo - users never contact Plasmic!

---

## 🆚 Codegen vs Headless API

| Feature | Codegen (Current) | Headless API (Removed) |
|---------|------------------|----------------------|
| **User fetches?** | ❌ Never | ✅ Yes (first load) |
| **Runtime dependency?** | ❌ No | ✅ Yes |
| **Offline capable?** | ✅ Yes | ❌ No |
| **Privacy** | ✅ Maximum | ⚠️ Users contact Plasmic |
| **Update workflow** | Manual sync | Auto (publish) |
| **Generated files?** | ✅ Yes (in repo) | ❌ No |

---

## 🔧 Configuration

### `plasmic.json` Settings:

```json
{
  "platform": "react",
  "codeLang": "ts",
  "scheme": "codegen",        // ← Codegen mode (no runtime fetching)
  "defaultPlasmicDir": "./src/plasmic",
  "srcDir": "src"
}
```

**Key Setting:** `"scheme": "codegen"` ensures zero runtime fetching.

---

## 📋 Common Commands

### Sync Components
```bash
npx plasmic sync
```

### Watch for Changes (Development)
```bash
npx plasmic sync --watch
```

### Sync Specific Component
```bash
npx plasmic sync --component YourComponent
```

### Check Status
```bash
npx plasmic sync --dry-run
```

---

## 🎯 Best Practices

### 1. Sync Regularly
- Run `npx plasmic sync` after designing in Plasmic Studio
- Commit generated code to your repo
- Generated code is part of your codebase

### 2. Review Generated Code
- Check `src/plasmic/` after syncing
- Generated code is readable and editable
- You can customize it if needed

### 3. Use Version Control
- Commit `src/plasmic/` to git
- Track changes to generated components
- Generated code is your source of truth

### 4. Development Workflow
```bash
# 1. Design in Plasmic Studio
# 2. Sync to code
npx plasmic sync

# 3. Review generated code
git diff src/plasmic/

# 4. Commit
git add src/plasmic/
git commit -m "Update Plasmic components"
```

---

## 🔒 Security & Privacy

### What's Protected:

- ✅ **Users never contact Plasmic** - Zero external calls
- ✅ **No runtime dependencies** - Static code only
- ✅ **Offline capable** - Works without internet
- ✅ **Full control** - Generated code in your repo

### What Plasmic Sees:

- ✅ **Only during sync** - When you run `npx plasmic sync`
- ✅ **Only design data** - Layout, styles, structure
- ❌ **NO user data** - Never sent to Plasmic
- ❌ **NO business logic** - Stays in your app

---

## 🐛 Troubleshooting

### "Command not found: plasmic"
```bash
# Make sure @plasmicapp/cli is installed
npm install @plasmicapp/cli --save-dev
```

### "Project not found"
- Check your Project ID in `plasmic.json`
- Verify API Token is correct
- Make sure you're signed in to Plasmic

### "No components to sync"
- Make sure you've created components in Plasmic Studio
- Check that components are published (if required)
- Verify project settings in Plasmic

### Generated code not updating
- Run `npx plasmic sync` again
- Check Plasmic Studio for changes
- Verify `plasmic.json` config

---

## 📚 Resources

- **Plasmic Docs**: https://docs.plasmic.app
- **Codegen Guide**: https://docs.plasmic.app/learn/codegen
- **CLI Reference**: https://docs.plasmic.app/learn/cli

---

## ✅ Summary

**Status:** ✅ Codegen mode active - Zero runtime fetching

**What Changed:**
- ❌ Removed Headless API (runtime fetching)
- ✅ Installed Codegen tools
- ✅ Added runtime safeguards
- ✅ Configured for static code generation

**Next Steps:**
1. Run `npx plasmic init` (if not done)
2. Run `npx plasmic sync` to generate components
3. Import and use generated components
4. Commit generated code to repo

**Privacy:** ✅ Maximum - Users never contact Plasmic!

---

**Setup completed:** 2026-01-24  
**Mode:** Codegen (zero runtime fetching)  
**Status:** ✅ Ready to sync components
