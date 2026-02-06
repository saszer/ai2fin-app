# 🎨 Start Plasmic Studio with Components

## 🚀 Quick Start (5 minutes)

### Step 1: Initialize Plasmic Project

```bash
cd ai2-core-app/client
npx plasmic init
```

**What you'll need:**
- Project ID (from Plasmic Studio URL)
- API Token (from "Code" button in Plasmic Studio)

**If you don't have credentials yet:**
1. Go to **[plasmic.app](https://plasmic.app)** and sign up
2. Create a new project
3. Get Project ID from URL: `https://studio.plasmic.app/projects/YOUR_PROJECT_ID`
4. Get API Token: Click "Code" button → Copy Public API Token

### Step 2: Open Plasmic Studio

1. Go to **[studio.plasmic.app](https://studio.plasmic.app)**
2. Sign in
3. Open your project

### Step 3: Register Material-UI Components

In Plasmic Studio:

1. **Click "Code Components"** in the left sidebar
2. **Click "Register"** button
3. **Select "From file"** or **"From npm package"**

**Option A: Register from file (Recommended)**
- Point to: `src/plasmic-components.tsx`
- Plasmic will discover all exported components

**Option B: Register from npm**
- Package: `@mui/material`
- Components: Card, Typography, Box, Grid, Button, etc.

**Option C: Register manually**
- Click "Register" → "Custom component"
- Import path: `@mui/material/Card`
- Component name: `Card`
- Repeat for each component

### Step 4: Start Designing!

Once components are registered:
- ✅ Drag Material-UI components from left panel
- ✅ Edit properties in right panel
- ✅ Use AI to style components
- ✅ Design visually!

### Step 5: Sync to Code

```bash
npx plasmic sync
```

This generates static React components in `src/plasmic/`

---

## 📋 Available Components

All these Material-UI components are ready to register:

### Layout Components:
- ✅ **Box** - Container with flexible styling
- ✅ **Grid** - Responsive grid system
- ✅ **Container** - Page container
- ✅ **Stack** - Flex container
- ✅ **Paper** - Paper surface

### Content Components:
- ✅ **Card** - Card container
- ✅ **CardContent** - Card content wrapper
- ✅ **CardActions** - Card actions area
- ✅ **Typography** - Text components (h1-h6, body, etc.)

### Input Components:
- ✅ **TextField** - Input field
- ✅ **Button** - Buttons (contained, outlined, text)
- ✅ **IconButton** - Icon button

### Feedback Components:
- ✅ **Alert** - Alert messages
- ✅ **LinearProgress** - Linear progress bar
- ✅ **CircularProgress** - Circular progress
- ✅ **Skeleton** - Loading skeleton

### Dialog Components:
- ✅ **Dialog** - Modal dialog
- ✅ **DialogTitle** - Dialog title
- ✅ **DialogContent** - Dialog content
- ✅ **DialogActions** - Dialog actions

### Other:
- ✅ **Chip** - Chip/badge component
- ✅ **Divider** - Divider line

---

## 🎯 Registration Methods

### Method 1: Auto-Discovery (Easiest)

1. In Plasmic Studio, go to **"Code Components"**
2. Click **"Register"** → **"From file"**
3. Select: `src/plasmic-components.tsx`
4. Plasmic discovers all exported components automatically!

### Method 2: Manual Registration

For each component:

1. Click **"Register"** → **"Custom component"**
2. **Import path**: `@mui/material/Card` (or component name)
3. **Component name**: `Card`
4. **Props**: Define in Plasmic Studio UI
5. Click **"Register"**

### Method 3: NPM Package Registration

1. Click **"Register"** → **"From npm package"**
2. **Package**: `@mui/material`
3. **Components**: Select which ones to register
4. Click **"Register"**

---

## 🔧 Component Registration Details

### Example: Register Card Component

**In Plasmic Studio:**
1. Go to "Code Components"
2. Click "Register" → "Custom component"
3. Fill in:
   - **Import path**: `@mui/material/Card`
   - **Component name**: `Card`
   - **Display name**: `Material-UI Card`
   - **Props**:
     - `children`: slot
     - `elevation`: number (default: 1)
     - `sx`: object
4. Click "Register"

**Result:**
- Card appears in component panel
- Can drag onto canvas
- Can edit props visually

---

## 📁 File Structure

```
ai2-core-app/client/
├── src/
│   ├── plasmic-components.tsx    # Component exports (for registration)
│   └── plasmic/                  # Generated components (after sync)
│       └── [your-components].tsx
└── plasmic.json                  # Plasmic config
```

---

## 🎨 Using Registered Components

### In Plasmic Studio:

1. **Drag component** from left panel onto canvas
2. **Edit properties** in right panel:
   - Change text, colors, spacing
   - Adjust layout
   - Style with AI
3. **Save** your design
4. **Sync to code**: `npx plasmic sync`

### In Your App:

```typescript
// After syncing, import generated components:
import { PlasmicYourComponent } from './plasmic/your_component';

function MyPage() {
  return <PlasmicYourComponent />;
}
```

---

## 🐛 Troubleshooting

### "No components found"
- Make sure `src/plasmic-components.tsx` exists
- Check that components are exported
- Verify import paths are correct

### "Component not appearing in Studio"
- Refresh Plasmic Studio
- Check component registration status
- Verify Project ID and API Token

### "Can't register component"
- Check import path is correct
- Verify component is exported
- Make sure Material-UI is installed

---

## ✅ Quick Checklist

- [ ] Run `npx plasmic init` (with credentials)
- [ ] Open Plasmic Studio
- [ ] Register Material-UI components
- [ ] Start designing!
- [ ] Run `npx plasmic sync` to generate code

---

**Ready to start?** Run `npx plasmic init` and open Plasmic Studio! 🎨
