# 🚀 Plasmic Quick Start Guide

## What is Plasmic?

Plasmic is a **visual React editor** that lets you:
- ✅ Edit existing React components visually
- ✅ Register Material-UI components
- ✅ Use AI to help with styling
- ✅ Keep code in your repo (no vendor lock-in)
- ✅ Free tier available

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Run Setup Script

```bash
node scripts/setup-plasmic.js
```

This will:
- Install Plasmic packages
- Create `plasmic-init.ts` with Material-UI components registered
- Create `PlasmicHost.tsx` page
- Set up environment variables

### Step 2: Sign Up & Get Token

1. Go to [plasmic.app](https://plasmic.app)
2. Sign up (free tier available)
3. Create a new project
4. Get your **Project ID** and **API Token** from project settings

### Step 3: Add Environment Variables

Add to `ai2-core-app/client/.env`:

```env
PLASMIC_PROJECT_ID=your-project-id
PLASMIC_PROJECT_API_TOKEN=your-api-token
```

### Step 4: Import Plasmic Init

Add to `ai2-core-app/client/src/App.tsx` (at the top):

```typescript
import './plasmic-init'; // Register components for Plasmic
```

### Step 5: Add Route

Add to your public routes in `App.tsx`:

```typescript
<Route path="/plasmic-host" element={<PlasmicHost />} />
```

Or import it:

```typescript
const PlasmicHost = lazy(() => import('./pages/PlasmicHost'));
```

### Step 6: Start Editing!

1. Start your dev server: `npm start`
2. Visit: `http://localhost:3000/plasmic-host`
3. Start editing your components visually! 🎨

---

## 🎨 What You Can Do

### Register Your Components

Edit `src/plasmic-init.ts` to register your custom components:

```typescript
import Dashboard from './pages/Dashboard';

PLASMIC.registerComponent(Dashboard, {
  name: 'Dashboard',
  props: {
    // Define props your Dashboard accepts
  },
});
```

### Use Material-UI Components

All Material-UI components are already registered:
- Card, CardContent
- Typography
- Box, Grid
- Button, TextField
- And more!

### AI-Powered Editing

- Ask AI to style components
- Generate layouts
- Refine designs
- Get suggestions

---

## 📚 Full Documentation

See `VISUAL_REACT_EDITOR_GUIDE.md` for:
- Detailed comparison of tools
- Advanced setup
- Best practices
- Troubleshooting

---

## 💡 Pro Tips

1. **Start Small**: Register a few components first
2. **Test Locally**: Make sure everything works before deploying
3. **Use AI**: Let Plasmic's AI help with styling
4. **Keep Code Clean**: Review generated code before committing

---

## ❓ Troubleshooting

**Q: Components not showing in Plasmic?**  
A: Make sure you've imported `plasmic-init.ts` in your App.tsx

**Q: Can't connect to Plasmic?**  
A: Check your environment variables are set correctly

**Q: Styles not applying?**  
A: Make sure Material-UI theme is loaded in your app

---

**Ready to start?** Run `node scripts/setup-plasmic.js` now! 🚀
