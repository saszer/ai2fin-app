# 🚀 Plasmic - Next Steps Guide

## ✅ Current Status

**Setup Complete:**
- ✅ Packages installed (`@plasmicapp/cli`, `@plasmicapp/loader-react`, `@plasmicapp/host`)
- ✅ Components registered (`src/plasmic-components.tsx`)
- ✅ `/plasmic-host` route configured
- ✅ Codegen mode enabled
- ✅ Security safeguards in place
- ✅ Dev server should be running on `http://localhost:3000`

**What's Left:**
- ⚠️ Need to initialize Plasmic CLI with your credentials
- ⚠️ Need to connect Plasmic Studio to localhost
- ⚠️ Need to register components in Plasmic Studio

---

## 📋 Step-by-Step: What to Do Now

### **Step 1: Get Your Plasmic Credentials**

1. **Sign up / Log in to Plasmic:**
   - Go to: https://plasmic.app
   - Sign up (if new) or log in

2. **Create a Project:**
   - Click **"New Project"** or **"Create Project"**
   - Name it (e.g., "AI2 Financial App")
   - Choose **"React"** as platform
   - Click **"Create"**

3. **Get Your Project ID:**
   - Look at the URL: `https://studio.plasmic.app/projects/YOUR_PROJECT_ID`
   - Copy the `YOUR_PROJECT_ID` part (looks like: `abc123xyz`)

4. **Get Your API Token:**
   - In Plasmic Studio, click **"Code"** button (top toolbar)
   - Copy the **"Public API Token"** (looks like: `abc123xyz...`)

---

### **Step 2: Initialize Plasmic CLI**

Run this command in your client directory:

```bash
cd d:\embracingearthspace\ai2-core-app\client
npx plasmic init
```

**What it will ask:**
1. **Project ID:** Paste your Project ID from Step 1
2. **API Token:** Paste your API Token from Step 1
3. **Platform:** React (should auto-detect)
4. **Code language:** TypeScript (should auto-detect)
5. **Scheme:** Codegen (should auto-detect)

**This will:**
- Update `plasmic.json` with your credentials
- Set up the codegen workflow
- Configure the project

---

### **Step 3: Start Your Dev Server (If Not Running)**

```bash
cd d:\embracingearthspace\ai2-core-app\client
npm start
```

**Verify it's running:**
- Open: http://localhost:3000
- Should see your app
- Test: http://localhost:3000/plasmic-host (should show Plasmic Studio or error if not connected)

---

### **Step 4: Connect Plasmic Studio to Localhost**

1. **Open Plasmic Studio:**
   - Go to: https://studio.plasmic.app
   - Open your project

2. **Configure Host URL:**
   - Click **project menu** (top-left, your project name)
   - Select **"Configure project"** or **"Settings"**
   - Find **"Host URL"** or **"Development URL"** setting
   - Set to: `http://localhost:3000/plasmic-host`
   - Click **"Save"**

3. **Verify Connection:**
   - Plasmic will try to connect to your localhost
   - If successful, you'll see a connection indicator
   - If it fails, check:
     - Is `npm start` running?
     - Is app accessible at `http://localhost:3000`?
     - Is firewall blocking the connection?

---

### **Step 5: Register Components in Plasmic Studio**

1. **Open Code Components Panel:**
   - In Plasmic Studio, click **"Code Components"** (left sidebar)
   - Or go to: **"Components"** → **"Code Components"**

2. **Register from Localhost:**
   - Click **"Register"** button
   - Select **"From localhost"** or **"From running app"**
   - Plasmic will connect to `http://localhost:3000/plasmic-host`
   - It will discover components from `src/plasmic-components.tsx`

3. **Select Components to Register:**
   - You'll see a list of available components:
     - MUICard
     - MUITypography
     - MUIBox
     - MUIGrid
     - MUIButton
     - MUITextField
     - MUIPaper
     - MUIContainer
     - MUIStack
     - MUIChip
     - MUIAlert
   - Click **"Register"** for each component you want to use
   - Or select all and register at once

4. **Verify Registration:**
   - Registered components will appear in the **"Components"** panel
   - You can now drag them into your designs!

---

### **Step 6: Start Designing!**

1. **Create a New Page/Component:**
   - Click **"+"** or **"New Page"** in Plasmic Studio
   - Name it (e.g., "Dashboard Redesign")

2. **Drag Components:**
   - From the left panel, drag Material-UI components
   - Arrange them visually
   - Edit properties in the right panel

3. **Use AI Features:**
   - Try AI-powered styling suggestions
   - Use AI to generate layouts
   - Experiment with different designs

4. **Save Your Work:**
   - Click **"Save"** (Ctrl+S / Cmd+S)
   - Your designs are stored in Plasmic Studio

---

### **Step 7: Sync Designs to Code**

After designing, sync your designs to your codebase:

```bash
cd d:\embracingearthspace\ai2-core-app\client
npx plasmic sync
```

**This will:**
- Fetch your designs from Plasmic
- Generate React components in `src/plasmic/`
- Create static code files (no runtime fetching!)

**Generated Files:**
```
src/plasmic/
├── plasmic__default_style.css
├── plasmic__global.css
└── [your-components].tsx
```

---

### **Step 8: Use Generated Components**

Import and use the generated components in your app:

```typescript
// Example: Use a generated component
import { PlasmicYourComponent } from './plasmic/your_component';

function MyPage() {
  return <PlasmicYourComponent />;
}
```

---

## 🎯 Quick Start Checklist

- [ ] Sign up at https://plasmic.app
- [ ] Create a new project
- [ ] Get Project ID (from URL)
- [ ] Get API Token (from "Code" button)
- [ ] Run `npx plasmic init` (enter credentials)
- [ ] Start dev server: `npm start`
- [ ] Configure Host URL in Plasmic Studio: `http://localhost:3000/plasmic-host`
- [ ] Register components from localhost
- [ ] Start designing!
- [ ] Sync: `npx plasmic sync`

---

## 🔧 Troubleshooting

### **"Can't connect to localhost"**
- ✅ Make sure `npm start` is running
- ✅ Check app is at `http://localhost:3000`
- ✅ Verify Host URL in Plasmic Studio settings
- ✅ Check firewall/network settings

### **"No components found"**
- ✅ Make sure `src/plasmic-components.tsx` exists
- ✅ Verify components are registered in the file
- ✅ Check app is running and accessible
- ✅ Refresh Plasmic Studio

### **"Command not found: plasmic"**
- ✅ Make sure `@plasmicapp/cli` is installed
- ✅ Try: `npm install @plasmicapp/cli --save-dev`

### **"Project not found"**
- ✅ Check your Project ID in `plasmic.json`
- ✅ Verify API Token is correct
- ✅ Make sure you're signed in to Plasmic

---

## 📚 Helpful Resources

- **Plasmic Docs**: https://docs.plasmic.app
- **Codegen Guide**: https://docs.plasmic.app/learn/codegen-guide
- **Component Registration**: https://docs.plasmic.app/learn/registering-code-components
- **Quick Start**: https://docs.plasmic.app/learn/react-quickstart

---

## 🎨 What You Can Do Now

1. **Edit Existing Components Visually:**
   - Register your Dashboard, Transactions, etc. (if you want)
   - Edit them visually in Plasmic Studio
   - Sync changes back to code

2. **Create New Designs:**
   - Design new pages/components
   - Use Material-UI components
   - Generate static code

3. **Use AI Features:**
   - AI-powered styling
   - Layout suggestions
   - Component recommendations

---

## ⚠️ Important Reminders

### **Security (Codegen Mode):**
- ✅ Components are static code (no runtime fetching)
- ✅ Users never contact Plasmic
- ✅ `/plasmic-host` route disabled in production
- ✅ Only generic UI components registered (safe)

### **Workflow:**
1. Design in Plasmic Studio (cloud)
2. Run `npx plasmic sync` (generates static code)
3. Use generated components in your app
4. Commit generated code to git

---

## 🚀 Ready to Start!

**Next Action:** Run `npx plasmic init` and enter your credentials!

Then follow the steps above to connect Plasmic Studio and start designing.

---

**Last Updated:** 2026-01-24  
**Status:** ✅ Ready to initialize and use!
