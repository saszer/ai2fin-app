# 🔧 Fix Prisma Client for SQLite

## 🐛 **Current Issue**

The Prisma client was generated from **PostgreSQL schema**, but you're using **SQLite** for local dev. This causes validation errors.

**Error:**
```
Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

---

## ✅ **Quick Fix**

### **Step 1: Stop Backend Server**
Stop your backend server (Ctrl+C in the terminal running `npm start`)

### **Step 2: Regenerate Prisma Client from SQLite Schema**

```bash
cd ai2-core-app
npm run prisma:generate:sqlite
```

### **Step 3: Initialize SQLite Database (First Time Only)**

```bash
npm run prisma:push:sqlite
```

### **Step 4: Restart Backend Server**

```bash
npm start
```

---

## 🔄 **Alternative: Auto-Detection**

The `generate-prisma.js` script should auto-detect SQLite and use the right schema. Try:

```bash
cd ai2-core-app
npm run postinstall
```

This runs `generate-prisma.js` which should detect SQLite and use `schema.sqlite.prisma`.

---

## ✅ **After Fix**

You should see:
- ✅ No Prisma validation errors
- ✅ Database queries work
- ✅ User auto-creation works on login
- ✅ Console shows: `💡 Using SQLite for local development`

---

**Note:** If you see file lock errors, make sure the server is completely stopped before regenerating.
