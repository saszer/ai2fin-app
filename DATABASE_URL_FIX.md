# 🔧 DATABASE_URL Configuration Fix - Local Development

## 🐛 **Issue: Prisma Database Connection Error**

**Error:**
```
Invalid `prisma.$queryRaw()` invocation:
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `postgres://`.
```

**Root Cause:**
- The **default** Prisma schema is **PostgreSQL** (`schema.prisma`). The generated client **only** accepts `postgresql://` or `postgres://` URLs.
- If `DATABASE_URL` is set to a SQLite URL (`file:./dev.db` or `file:./aifin.db`) or any non-postgres value, you get this error.
- **Fix:** Use a PostgreSQL URL for this app, or use the SQLite schema and generate the client from it (see below).

**Current behavior (`src/lib/prisma.ts`):**
- `DATABASE_URL` is **normalized** at load: only `postgresql://` or `postgres://` are accepted. Empty/unset in dev → default `postgresql://postgres:password@localhost:5432/aifin`. SQLite (`file:...` or `*.db`) → clear error with instructions. Any other value in production → error; in dev → same default.
- All app code should use the singleton from `lib/prisma` so they get the normalized URL; direct `new PrismaClient()` elsewhere can still read raw env and trigger this error.

---

## ✅ **Fix Applied**

### **1. Allow SQLite for Local Development**

**File:** `ai2-core-app/src/lib/prisma.ts`

**Changes:**
- ✅ Allows SQLite URLs in development (defaults to `file:./aifin.db` if not set)
- ✅ Production still requires PostgreSQL (unchanged)
- ✅ Clear error messages for schema mismatches

### **2. Auto-Detect Schema for Prisma Generation**

**File:** `ai2-core-app/scripts/generate-prisma.js`

**Changes:**
- ✅ Automatically uses `schema.sqlite.prisma` when DATABASE_URL is SQLite
- ✅ Uses `schema.postgresql.prisma` for PostgreSQL URLs
- ✅ Production always uses PostgreSQL schema

---

## 🔧 **How to Fix for Local Development**

### **Option A: Use PostgreSQL (recommended for this app)**

Set `DATABASE_URL` in `ai2-core-app/.env` to a Postgres URL, e.g.:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/aifin"
```

If `DATABASE_URL` is **unset** in development, the app now defaults to `postgresql://postgres:password@localhost:5432/aifin` (you must have Postgres running locally).

### **Option B: Use SQLite for Local Dev**

**Steps:**
1. **Generate Prisma client from SQLite schema** (required before using `file:` URL):
   ```bash
   cd ai2-core-app
   npm run prisma:generate:sqlite
   ```
   (Or run `node scripts/generate-prisma.js` so it auto-detects SQLite and uses the right schema.)

2. **Set DATABASE_URL in `.env` to SQLite:**
   ```env
   DATABASE_URL="file:./aifin.db"
   ```

3. **Initialize SQLite database (if needed):**
   ```bash
   npm run prisma:push:sqlite
   ```

4. **Restart backend server:**
   ```bash
   npm start
   ```

**✅ That's it!** Local dev will now use SQLite. If you see "URL must start with postgresql://" again, the client was regenerated from the Postgres schema—run step 1 again.

---

### **Production (Unchanged)**

Production continues to use PostgreSQL - no changes needed:
- Uses `schema.postgresql.prisma`
- Requires PostgreSQL `DATABASE_URL`
- All production code unchanged ✅

---

## 🔍 **Verification**

### **Check Current DATABASE_URL:**

```bash
# In ai2-core-app directory
echo $DATABASE_URL
# Or on Windows:
echo %DATABASE_URL%
```

**Expected:** Should start with `postgresql://` or `postgres://`

**If missing or invalid:**
- Set it in `.env` file
- Restart the server

---

## 📝 **Quick Fix Steps for Local Dev**

1. **Set DATABASE_URL to SQLite (or leave unset):**
   ```bash
   cd ai2-core-app
   # In .env file:
   DATABASE_URL="file:./aifin.db"
   ```
   Or just leave it unset - defaults to SQLite automatically.

2. **Generate Prisma client from SQLite schema:**
   ```bash
   npm run prisma:generate:sqlite
   ```

3. **Initialize database (first time only):**
   ```bash
   npm run prisma:push:sqlite
   ```

4. **Restart backend server:**
   ```bash
   npm start
   ```

5. **Verify connection:**
   - Check console for: `💡 Using SQLite for local development`
   - Check console for: `🔍 Database Configuration: { type: 'SQLite' }`
   - No more Prisma validation errors

---

## 🎯 **Common Issues**

### **Issue 1: Schema Mismatch (SQLite URL with PostgreSQL Client)**
**Symptom:** `URL must start with postgresql://` error when using SQLite
**Fix:** Generate Prisma client from SQLite schema:
```bash
npm run prisma:generate:sqlite
```

### **Issue 2: DATABASE_URL Not Set (Local Dev)**
**Symptom:** Works fine - defaults to `file:./aifin.db` automatically
**Fix:** No action needed, or explicitly set `DATABASE_URL="file:./aifin.db"`

### **Issue 3: Production Requires PostgreSQL**
**Symptom:** `Production requires PostgreSQL` error
**Fix:** Set `DATABASE_URL` to PostgreSQL connection string in production

---

## ✅ **Expected Behavior After Fix (Local Dev)**

**Console Output:**
```
💡 DATABASE_URL not set - using SQLite for local development: file:./aifin.db
💡 Using SQLite for local development
   Note: If Prisma validation errors occur, generate client from SQLite schema:
   Run: npm run prisma:generate:sqlite
🔍 Database Configuration: {
  url: 'file:./aifin.db',
  type: 'SQLite',
  environment: 'development',
  isNeonDB: false,
  poolOptimized: false
}
```

**No Errors:**
- ✅ No Prisma validation errors
- ✅ Database queries work
- ✅ Authentication works
- ✅ User registration works
- ✅ Local SQLite database created automatically

---

**Last Updated:** 2026-01-25  
**Status:** Fixed for local dev - SQLite now works automatically

---

## 🔄 **Switching Between SQLite and PostgreSQL (Local Dev)**

### **Use SQLite:**
```bash
# Set in .env (or leave unset)
DATABASE_URL="file:./aifin.db"

# Generate client from SQLite schema
npm run prisma:generate:sqlite

# Initialize database
npm run prisma:push:sqlite
```

### **Use PostgreSQL (Local):**
```bash
# Set in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai2fin"

# Generate client from PostgreSQL schema
npm run prisma:generate:postgresql

# Or use default (auto-detects)
npm run postinstall
```
