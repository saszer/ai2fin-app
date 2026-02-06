# 🔑 How to Find Plasmic Credentials

## ⚠️ Important: "Publish" is NOT for Credentials!

The **"Publish"** dialog you see is for:
- Deploying your design
- Exporting code to GitHub
- Publishing to hosting platforms

**It is NOT where you find your Project ID and API Token!**

---

## ✅ Where to Find Credentials

### 1. **Project ID** - From URL

**Easiest method:**

1. Look at your browser's **address bar**
2. The URL will look like:
   ```
   https://studio.plasmic.app/projects/YOUR_PROJECT_ID
   ```
3. Copy the part after `/projects/` - that's your **Project ID**

**Example:**
- URL: `https://studio.plasmic.app/projects/abc123xyz456`
- Project ID: `abc123xyz456`

---

### 2. **API Token** - From Code Button

**Steps:**

1. **Look at the top toolbar** in Plasmic Studio
2. Find the **"Code"** button (usually top-right)
3. **Click "Code"** button
4. A panel will open showing your **Public API Token**
5. Copy the token value

**Alternative:** If you don't see "Code" button:
- Look for **Settings** (⚙️ gear icon)
- Go to **Settings → API** or **Settings → Tokens**
- Find **"Public API Token"**

---

### 3. **Both from Settings** (Alternative)

1. Click **Settings** icon (⚙️)** - usually top-right or left sidebar
2. Look for:
   - **"Project ID"** section
   - **"API Token"** or **"Public API Token"** section
3. Copy both values

---

## 📝 What You Need

You need **TWO values**:

1. **Project ID**: 
   - Format: `abc123xyz456` (alphanumeric string)
   - Found in: URL or Settings

2. **API Token**:
   - Format: `token_abc123...` or similar
   - Found in: "Code" button or Settings

---

## 🎯 Quick Visual Guide

```
Plasmic Studio Interface:
┌─────────────────────────────────────┐
│  [Logo]  [Code] [Settings] [Publish]  ← Top Toolbar
├─────────────────────────────────────┤
│                                     │
│         Your Design Canvas          │
│                                     │
└─────────────────────────────────────┘

✅ Click "Code" → See API Token
✅ Check URL → See Project ID
❌ "Publish" → NOT for credentials!
```

---

## 🔧 Add to Your .env File

Once you have both values, add them to `ai2-core-app/client/.env`:

```env
PLASMIC_PROJECT_ID=abc123xyz456
PLASMIC_PROJECT_API_TOKEN=token_abc123...
```

**Important:**
- No spaces around the `=` sign
- No quotes needed
- Replace with your actual values

---

## ❓ Still Can't Find It?

### Check These Locations:

1. **Top Toolbar:**
   - Look for "Code" button
   - Look for Settings (⚙️) icon

2. **Left Sidebar:**
   - Settings menu
   - Project settings

3. **URL Bar:**
   - Project ID is always in the URL

4. **Help Menu:**
   - Some versions have "Help" → "API Credentials"

### If Still Stuck:

1. **Check Plasmic Docs**: https://docs.plasmic.app/learn/react-quickstart
2. **Contact Support**: support@plasmic.app
3. **Try creating a new project** - credentials are shown during setup

---

## 🎯 Summary

- ✅ **Project ID**: In URL (`/projects/YOUR_ID`)
- ✅ **API Token**: Click "Code" button in toolbar
- ❌ **NOT in Publish**: That's for deploying designs
- ✅ **Add to .env**: Both values needed for connection

---

**Last Updated:** 2026-01-24  
**Status:** Credentials are in Code button and URL, NOT in Publish dialog!
