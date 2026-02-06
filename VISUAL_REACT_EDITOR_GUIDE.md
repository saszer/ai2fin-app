# 🎨 Visual React Editor Guide - Edit Existing Components

## Your Requirements
- ✅ Import existing React components
- ✅ Edit them visually in a UI editor
- ✅ AI integration
- ✅ Minimal code breakage
- ✅ Works with Material-UI components

---

## 🏆 Top Recommendations

### 1. **Plasmic** ⭐ BEST FOR YOUR USE CASE

**Why it's perfect:**
- ✅ Register existing React components (including Material-UI)
- ✅ Visual drag-and-drop editor
- ✅ AI-powered features
- ✅ Code stays in your repo (no vendor lock-in)
- ✅ Free tier available
- ✅ Works with TypeScript/React

**How it works:**
1. Register your components in `plasmic-init.ts`
2. Components appear in visual editor
3. Edit visually, changes sync to your code
4. AI helps with styling and layout

**Setup:**
```bash
npm install @plasmicapp/react-web
```

**Register components:**
```typescript
// plasmic-init.ts
import { PLASMIC } from '@plasmicapp/react-web';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import Dashboard from './pages/Dashboard';

PLASMIC.registerComponent(Card, {
  name: 'Card',
  props: {
    children: 'slot',
    elevation: { type: 'number', defaultValue: 1 },
    sx: 'object',
  },
});

PLASMIC.registerComponent(Dashboard, {
  name: 'Dashboard',
  props: {
    // Define props your Dashboard accepts
  },
});
```

**Pros:**
- Most comprehensive for editing existing components
- Great AI features
- Free tier
- Active development

**Cons:**
- Learning curve
- Requires component registration

---

### 2. **Builder.io** ⭐ GOOD FOR CMS + COMPONENTS

**Why it works:**
- ✅ Register custom React components
- ✅ Visual editor
- ✅ AI-powered (Fusion AI)
- ✅ Figma import
- ✅ Headless CMS built-in

**How it works:**
1. Register components via Builder API
2. Use visual editor to compose pages
3. AI generates/refines code
4. Sync back to your codebase

**Setup:**
```bash
npm install @builder.io/react
```

**Register components:**
```typescript
// builder-registry.ts
import { builder } from '@builder.io/react';
import { Card, Typography } from '@mui/material';

builder.registerComponent(Card, {
  name: 'Card',
  inputs: [
    { name: 'elevation', type: 'number', defaultValue: 1 },
    { name: 'children', type: 'richText' },
  ],
});
```

**Pros:**
- Great for content-heavy apps
- Strong CMS features
- Good AI integration

**Cons:**
- More focused on content than pure component editing
- Pricing can get expensive

---

### 3. **UXPin Merge** ⭐ BEST FOR DESIGN SYSTEMS

**Why it works:**
- ✅ Import from Git repositories
- ✅ Visual editor
- ✅ Automatic prop recognition
- ✅ Works with Material-UI

**How it works:**
1. Connect your Git repo
2. Components auto-import
3. Edit visually
4. Export code or sync back

**Setup:**
- Connect via Git integration
- Auto-detects React components
- No manual registration needed

**Pros:**
- Automatic component detection
- Great for design systems
- Clean code export

**Cons:**
- More enterprise-focused
- Pricing can be expensive

---

### 4. **Storybook + Addons** (Development Tool)

**Why it's useful:**
- ✅ Live editing of components
- ✅ Visual testing
- ✅ Component documentation
- ✅ Free and open-source

**Setup:**
```bash
npx storybook@latest init
npm install storybook-addon-code-editor
```

**Use case:**
- Better for development/testing
- Not as visual/design-focused
- More developer-oriented

**Pros:**
- Free
- Great for component development
- Industry standard

**Cons:**
- Less "visual design" focused
- More for devs than designers

---

## 🎯 Recommendation Matrix

| Tool | Best For | AI Features | Component Import | Price |
|------|----------|------------|-----------------|-------|
| **Plasmic** | Visual editing existing components | ✅ Strong | ✅ Manual register | Free tier |
| **Builder.io** | CMS + component editing | ✅ Strong | ✅ Manual register | Paid |
| **UXPin Merge** | Design systems | ⚠️ Limited | ✅ Auto from Git | Paid |
| **Storybook** | Development/testing | ❌ None | ✅ Auto | Free |

---

## 🚀 Quick Start: Plasmic (Recommended)

### Step 1: Install

```bash
cd ai2-core-app/client
npm install @plasmicapp/react-web @plasmicapp/loader-nextjs
```

### Step 2: Create Host Page

Create `src/pages/plasmic-host.tsx`:

```typescript
import { PlasmicCanvasHost } from '@plasmicapp/react-web';

export default function PlasmicHost() {
  return <PlasmicCanvasHost />;
}
```

### Step 3: Register Components

Create `src/plasmic-init.ts`:

```typescript
import { PLASMIC } from '@plasmicapp/react-web';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
} from '@mui/material';

// Register Material-UI components
PLASMIC.registerComponent(Card, {
  name: 'MUICard',
  props: {
    children: 'slot',
    elevation: { type: 'number', defaultValue: 1 },
    sx: 'object',
  },
});

PLASMIC.registerComponent(Typography, {
  name: 'MUITypography',
  props: {
    children: 'slot',
    variant: {
      type: 'choice',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2'],
    },
    color: {
      type: 'choice',
      options: ['primary', 'secondary', 'textPrimary', 'textSecondary'],
    },
  },
});

PLASMIC.registerComponent(Box, {
  name: 'MUIBox',
  props: {
    children: 'slot',
    sx: 'object',
  },
});

PLASMIC.registerComponent(Grid, {
  name: 'MUIGrid',
  props: {
    children: 'slot',
    container: 'boolean',
    item: 'boolean',
    xs: 'number',
    sm: 'number',
    md: 'number',
    lg: 'number',
  },
});

// Register your custom pages
import Dashboard from './pages/Dashboard';
PLASMIC.registerComponent(Dashboard, {
  name: 'Dashboard',
  props: {
    // Add props your Dashboard accepts
  },
});
```

### Step 4: Initialize Plasmic

In your `App.tsx` or main entry:

```typescript
import { PlasmicCanvasHost } from '@plasmicapp/react-web';
import './plasmic-init';

// Add route for /plasmic-host
```

### Step 5: Start Using

1. Sign up at [plasmic.app](https://plasmic.app)
2. Create a project
3. Connect to your app (runs on `/plasmic-host`)
4. Start editing visually!

---

## 🎨 Workflow Comparison

### Plasmic Workflow:
```
1. Register components → 2. Edit visually → 3. AI assists → 4. Code syncs
```

### Builder.io Workflow:
```
1. Register components → 2. Build pages → 3. AI generates → 4. Export code
```

### UXPin Merge Workflow:
```
1. Connect Git → 2. Auto-import → 3. Edit visually → 4. Export code
```

---

## 💡 Pro Tips

### For Material-UI Components:
1. **Register commonly used components first:**
   - Card, CardContent
   - Typography
   - Box, Grid
   - Button, TextField
   - Dialog, Modal

2. **Use AI prompts:**
   - "Make this card dark mode"
   - "Add spacing between grid items"
   - "Center align this typography"

3. **Keep code in sync:**
   - Use Git for version control
   - Review generated code
   - Test components after visual edits

---

## 🔧 Integration with Your App

### Option A: Full Integration (Plasmic)
- Register all components
- Edit entire pages visually
- AI-powered styling
- Sync back to code

### Option B: Hybrid Approach
- Use Plasmic for new designs
- Keep existing code as-is
- Gradually migrate components
- Best of both worlds

### Option C: Component Library Only
- Register reusable components
- Design new pages visually
- Keep existing pages in code
- Incremental adoption

---

## 📊 Cost Comparison

| Tool | Free Tier | Paid Plans |
|------|-----------|------------|
| **Plasmic** | ✅ Yes (personal projects) | $29-99/mo |
| **Builder.io** | ⚠️ Limited | $99+/mo |
| **UXPin Merge** | ❌ No | $89+/mo |
| **Storybook** | ✅ Free | Free (open source) |

---

## 🎯 My Recommendation

**Start with Plasmic** because:
1. ✅ Best for editing existing components
2. ✅ Free tier to try
3. ✅ Strong AI features
4. ✅ Works with Material-UI
5. ✅ Code stays in your repo

**Then consider Builder.io** if you need:
- Headless CMS features
- Content management
- Marketing-focused pages

---

## 🚀 Next Steps

1. **Try Plasmic** (free tier):
   ```bash
   npm install @plasmicapp/react-web
   ```

2. **Register a few components** to test

3. **Create a test page** in Plasmic

4. **See if it fits your workflow**

5. **Scale up** if it works well

---

## 📝 Setup Script

I can create a setup script that:
- Installs Plasmic
- Creates host page
- Registers your Material-UI components
- Sets up basic configuration

Would you like me to create this?

---

**Last Updated:** 2026-01-24  
**Best Match:** Plasmic for visual editing existing React components with AI
