# 🎨 Pencil Design Tool - Integration Guide

## Research Summary

After researching Pencil.dev documentation, **there is no direct "import" feature** to bring existing React components into Pencil. Pencil is primarily a **design-to-code** tool (designs → code), not a **code-to-design** tool.

However, you can still use Pencil to design your app pages using these approaches:

---

## ✅ Solution: Design Specs Generated

I've created a script that analyzes your React pages and generates design specs. These specs are now in the `pencil-specs/` folder.

### Generated Files:
- **33 design specs** for all your pages
- **Master index** at `pencil-specs/index.json`
- Individual specs like `Dashboard.json`, `AllTransactions.json`, etc.

---

## 📋 How to Use Pencil with Your App

### Method 1: Use Generated Specs (Recommended)

1. **Open the spec file** for the page you want to design:
   ```bash
   # Example: View Dashboard spec
   cat pencil-specs/Dashboard.json
   ```

2. **In Pencil:**
   - Click **"+ New .pen file"**
   - Name it (e.g., `dashboard-design.pen`)
   - Create a Frame matching your viewport (e.g., 1920x1080 or 1440x900)

3. **Follow the spec recommendations:**
   - Use Grid Layout (if spec says "Grid Layout")
   - Add Card components (if spec says "usesCards: true")
   - Match Material-UI spacing (8px grid system)

4. **Reference your actual component:**
   - Open `ai2-core-app/client/src/pages/Dashboard.tsx` in another tab
   - Use it as a reference while designing

### Method 2: Screenshot Reference

1. **Run your app locally:**
   ```bash
   cd ai2-core-app/client
   npm start
   ```

2. **Take screenshots** of each page:
   - Dashboard
   - All Transactions
   - Bills
   - Expenses
   - etc.

3. **In Pencil:**
   - Create a new Frame
   - Import the screenshot as a reference image
   - Design on top of it or use it as a guide

### Method 3: Manual Component Recreation

1. **Study your React component structure:**
   - Open the page file (e.g., `Dashboard.tsx`)
   - Note the layout structure (Grid, Box, Card, etc.)
   - Identify key sections

2. **Recreate in Pencil:**
   - Create Frames for each major section
   - Use Pencil's component library to match Material-UI components
   - Apply your app's color scheme

---

## 🎯 Key Pages to Design

Based on your app structure, prioritize these pages:

### High Priority:
- ✅ **Dashboard** (`Dashboard.tsx`) - Main landing page
- ✅ **All Transactions** (`AllTransactions.tsx`) - Core feature
- ✅ **Bills** (`Bills.tsx`) - Bill management
- ✅ **Expenses** (`Expenses.tsx`) - Expense tracking
- ✅ **InsightPlus** (`InsightPlus.tsx`) - Analytics dashboard

### Medium Priority:
- Tax (`Tax.tsx`)
- Categories (`Categories.tsx`)
- Connectors (`Connectors.tsx`)
- Custom Rules (`CustomRules.tsx`)

### Auth Pages:
- Login (`Login.tsx`)
- Register (`Register.tsx`)
- Forgot Password (`ForgotPassword.tsx`)

---

## 🛠️ Design Specs Structure

Each spec file contains:

```json
{
  "name": "ComponentName",
  "description": "Design spec for PageName",
  "components": ["List", "of", "MUI", "components"],
  "layout": {
    "type": "Grid Layout" | "Flex Layout",
    "usesCards": true/false,
    "usesBox": true/false,
    "usesTypography": true/false
  },
  "recommendations": [
    "Create a Frame with dimensions matching your viewport",
    "Use Grid system for layout",
    "Add Card components for content sections",
    "Match Material-UI spacing (8px grid)",
    "Use theme colors from your app"
  ],
  "filePath": "path/to/component.tsx"
}
```

---

## 🎨 Design Tips for Your App

### Color Scheme
Your app uses a dark theme with:
- Primary: `#1a1a1a` (dark slate)
- Background: `#f8fafc` (light) / `#0f172a` (dark)
- Accent: Blue tones (`#3b82f6`, `#60a5fa`)

### Layout Patterns
- **Grid Layout**: Dashboard, Bills, Categories, Tax
- **Flex Layout**: All Transactions, Expenses, Login/Register

### Component Patterns
- **Cards**: Used extensively for content sections
- **Typography**: Material-UI Typography component
- **Box**: Container component for layout
- **Grid**: Material-UI Grid for responsive layouts

---

## 🔄 Regenerating Specs

If you update your components, regenerate the specs:

```bash
node scripts/generate-pencil-specs.js
```

This will update all spec files in `pencil-specs/` folder.

---

## 📚 Pencil Workflow

1. **Design Phase** (Pencil):
   - Create `.pen` files for each page
   - Design UI components and layouts
   - Use generated specs as reference

2. **Code Generation** (Pencil):
   - Pencil can generate React code from designs
   - Compare with your existing code
   - Merge improvements

3. **Iteration**:
   - Update designs based on code feedback
   - Refine components
   - Maintain design system consistency

---

## 🚀 Quick Start

1. **View available pages:**
   ```bash
   cat pencil-specs/index.json
   ```

2. **Pick a page to design:**
   ```bash
   cat pencil-specs/Dashboard.json
   ```

3. **Open Pencil in Cursor:**
   - Click "+ New .pen file"
   - Name it `dashboard-design.pen`

4. **Start designing:**
   - Create a Frame (1920x1080 or your viewport size)
   - Follow the spec recommendations
   - Reference the actual React component file

---

## 💡 Pro Tips

1. **Use Pencil's component library** - It has Material-UI-like components
2. **Match spacing** - Use 8px grid system (Material-UI standard)
3. **Keep it modular** - Design reusable components
4. **Test responsiveness** - Design for multiple viewport sizes
5. **Document colors** - Create a color palette frame in Pencil

---

## ❓ Troubleshooting

**Q: Can I import my React components directly?**  
A: No, Pencil doesn't support direct React component import. Use the generated specs and manual recreation.

**Q: How do I match my app's styling?**  
A: Reference your theme files (`themes/globalTheme.ts`) and apply colors/spacing manually in Pencil.

**Q: Can Pencil generate code that matches my existing code?**  
A: Pencil generates code, but you'll need to adapt it to match your existing patterns and architecture.

---

## 📝 Next Steps

1. ✅ Design specs generated - **DONE**
2. ⏭️ Open Pencil and create your first design file
3. ⏭️ Start with Dashboard (most important page)
4. ⏭️ Use specs as reference while designing
5. ⏭️ Iterate and refine designs

---

**Generated by:** `scripts/generate-pencil-specs.js`  
**Last Updated:** 2026-01-24  
**Total Pages Analyzed:** 33
