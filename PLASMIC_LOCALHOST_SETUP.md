# 🖥️ Plasmic Studio - Localhost Connection

## ✅ Yes! Plasmic Studio Can Connect to Localhost

Plasmic Studio can connect to your **running localhost app** to discover and register components live!

---

## 🚀 Setup Localhost Connection

### Step 1: Start Your Dev Server

```bash
cd ai2-core-app/client
npm start
```

Your app should be running at: `http://localhost:3000`

### Step 2: Configure Plasmic Studio

1. **Open Plasmic Studio**: https://studio.plasmic.app
2. **Open your project**
3. **Click project menu** (top-left, project name)
4. **Select "Configure project"** or **"Settings"**
5. **Find "Host URL"** or **"Development URL"** setting
6. **Set to**: `http://localhost:3000`
7. **Save**

### Step 3: Register Components from Localhost

1. **In Plasmic Studio**, go to **"Code Components"** (left sidebar)
2. **Click "Register"** button
3. **Select "From localhost"** or **"From running app"**
4. Plasmic will connect to `http://localhost:3000`
5. **Discover components** from your running app!

---

## 🎯 Two Ways to Register Components

### Method 1: From Localhost (Live Discovery)

**When to use:**
- ✅ Your app is running on localhost
- ✅ Components are exported in `src/plasmic-components.tsx`
- ✅ Want live component discovery

**Steps:**
1. Start dev server: `npm start`
2. Open Plasmic Studio
3. Configure host URL: `http://localhost:3000`
4. Register → "From localhost"
5. Plasmic discovers components automatically!

### Method 2: From File (Static)

**When to use:**
- ✅ Components are in `src/plasmic-components.tsx`
- ✅ Don't need live connection
- ✅ Want to register manually

**Steps:**
1. In Plasmic Studio, go to "Code Components"
2. Click "Register" → "From file"
3. Point to: `src/plasmic-components.tsx`
4. Plasmic reads file and discovers components

---

## 🔧 Configuration Details

### Plasmic Studio Settings:

**Host URL**: `http://localhost:3000`

This tells Plasmic Studio:
- Where your app is running
- Where to discover components
- Where to preview designs

### Your App Setup:

**File**: `src/plasmic-components.tsx`
- Exports all Material-UI components
- Plasmic can discover these when connected to localhost

---

## 📋 Complete Workflow

### 1. Start Local Dev Server

```bash
cd ai2-core-app/client
npm start
```

**App runs at**: `http://localhost:3000`

### 2. Configure Plasmic Studio

1. Open: https://studio.plasmic.app
2. Open your project
3. Settings → Host URL: `http://localhost:3000`
4. Save

### 3. Register Components

**Option A: From Localhost (Recommended)**
1. Go to "Code Components"
2. Click "Register" → "From localhost"
3. Plasmic connects to `http://localhost:3000`
4. Discovers components from `src/plasmic-components.tsx`
5. Click "Register" for each component

**Option B: From File**
1. Go to "Code Components"
2. Click "Register" → "From file"
3. Select: `src/plasmic-components.tsx`
4. Plasmic reads file and shows components

### 4. Start Designing!

- Drag components from left panel
- Edit properties visually
- Use AI to style
- Save designs

### 5. Sync to Code

```bash
npx plasmic sync
```

Generates static components in `src/plasmic/`

---

## 🎨 What You Can Do with Localhost Connection

### Live Component Discovery:
- ✅ Plasmic reads your running app
- ✅ Discovers exported components
- ✅ Shows component props automatically
- ✅ Updates when you change code

### Live Preview:
- ✅ See designs in your actual app
- ✅ Test with real data
- ✅ Preview Material-UI theme
- ✅ See actual styling

### Component Registration:
- ✅ Register components from running app
- ✅ Auto-discover props
- ✅ See component structure
- ✅ Test components before registering

---

## 🔍 Troubleshooting

### "Can't connect to localhost"
- ✅ Make sure `npm start` is running
- ✅ Check app is at `http://localhost:3000`
- ✅ Verify Host URL in Plasmic Studio settings
- ✅ Check firewall/network settings

### "No components found"
- ✅ Make sure `src/plasmic-components.tsx` exists
- ✅ Verify components are exported
- ✅ Check app is running and accessible
- ✅ Refresh Plasmic Studio

### "Connection timeout"
- ✅ Check dev server is running
- ✅ Verify port 3000 is not blocked
- ✅ Try refreshing Plasmic Studio
- ✅ Check browser console for errors

---

## 📊 Comparison: Localhost vs File

| Feature | Localhost Connection | File Registration |
|---------|---------------------|-------------------|
| **Live discovery** | ✅ Yes | ❌ No |
| **Auto-update** | ✅ Yes | ❌ No |
| **Requires running app** | ✅ Yes | ❌ No |
| **Easier setup** | ⚠️ More steps | ✅ Simpler |
| **Better for development** | ✅ Yes | ⚠️ Static |

---

## ✅ Quick Start Checklist

- [ ] Start dev server: `npm start`
- [ ] Open Plasmic Studio
- [ ] Configure Host URL: `http://localhost:3000`
- [ ] Register components from localhost
- [ ] Start designing!
- [ ] Sync: `npx plasmic sync`

---

**Yes, it's a localhost thing!** 🖥️

Connect Plasmic Studio to `http://localhost:3000` and register components from your running app!
