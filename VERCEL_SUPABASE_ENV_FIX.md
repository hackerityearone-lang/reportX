# 🔧 Fix Vercel Login Error - Missing Supabase Environment Variables

## Error Details

```
Error: Missing Supabase environment variables. 
Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY 
in your .env.local file.
```

**Location:** Login page on deployed app
**Cause:** Environment variables not configured in Vercel

---

## Root Cause

The app needs two Supabase environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

These are set in `.env.local` locally, but **Vercel deployment needs them configured in project settings**.

---

## Solution: Add Environment Variables to Vercel

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** tab
5. Copy these two values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Example:**
```
Project URL: https://xxxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### Step 2: Add to Vercel Project

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click your **reportX** project
3. Click **Settings** tab at the top
4. Click **Environment Variables** in left sidebar
5. Click **Add New** button
6. For each variable, enter:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** Your project URL from Supabase
   - **Select environments:** Production, Preview, Development
   - Click **Save**

7. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Screenshot Reference:**
```
Settings → Environment Variables → Add New
┌─────────────────────────────────┐
│ Name: NEXT_PUBLIC_SUPABASE_URL  │
│ Value: https://xxx.supabase.co  │
│ ☑ Production                     │
│ ☑ Preview                        │
│ ☑ Development                    │
│ [Add] [Cancel]                   │
└─────────────────────────────────┘
```

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Add another
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy
vercel --prod
```

---

### Step 3: Redeploy Your App

After adding environment variables:

**Option A: Automatic (Recommended)**
- Vercel auto-redeploys when you push to GitHub
- Git push triggers new deployment with env vars

**Option B: Manual Redeploy**
1. Go to Vercel Dashboard
2. Select your project
3. Click **Deployments**
4. Find latest deployment
5. Click **Redeploy** button

**Option C: Via CLI**
```bash
vercel --prod
```

---

### Step 4: Verify Deployment

1. Wait for deployment to complete (2-5 minutes)
2. Go to your Vercel project URL
3. Try to login
4. Should work now! ✅

---

## Environment Variables Reference

### What Each Variable Does

**NEXT_PUBLIC_SUPABASE_URL**
- Your Supabase project endpoint
- Starts with `https://`
- Example: `https://abcdefg123456.supabase.co`
- Used for connecting to Supabase API

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Anonymous API key for client-side operations
- Long string starting with `eyJ...`
- Used for authentication and data access
- Safe to expose (public key)

---

## Troubleshooting

### Still Getting Error After Adding Variables?

1. **Clear Browser Cache**
   ```
   Ctrl+Shift+Delete (Windows/Linux)
   Cmd+Shift+Delete (Mac)
   ```

2. **Wait for Deployment**
   - New deployments take 2-5 minutes
   - Check Vercel Deployments tab

3. **Verify Variables Added**
   - Go to Vercel Settings → Environment Variables
   - Confirm both variables exist
   - Check spelling exactly matches

4. **Redeploy Manually**
   ```bash
   vercel --prod
   ```

5. **Check Production vs Preview**
   - Make sure variables set to "Production"
   - Not just "Preview" or "Development"

---

## Step-by-Step Video Guide

### In Supabase:
1. Dashboard → Select Project → Settings
2. API tab → Copy URL
3. API tab → Copy anon key
4. Keep values copied

### In Vercel:
1. Dashboard → Select Project → Settings
2. Environment Variables → Add New
3. Name: `NEXT_PUBLIC_SUPABASE_URL`
4. Value: (paste URL from Supabase)
5. Check Production, Preview, Development
6. Save
7. Repeat for anon key
8. Go to Deployments → Redeploy

---

## Expected Result

After setup:

✅ **Login Page Works**
- Can enter email/password
- Can click Sign Up
- Can click Sign In
- No more "Missing environment variables" error

✅ **Authentication Works**
- Can create new account
- Can login with credentials
- Can access dashboard
- Can see products, reports, etc.

---

## Security Notes

⚠️ **Important:**
- `NEXT_PUBLIC_SUPABASE_URL` - Safe to expose (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose (public key only)
- Never share your database password
- Never expose service role key in frontend

---

## Verify Configuration

### Check if Variables Exist (via Browser Console)

```javascript
// Open browser console (F12)
// Type this to check:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

Should show your values, not `undefined`.

---

## Common Mistakes

❌ **Mistake 1:** Variables only in `.env.local`
- `.env.local` only works locally
- Must also add to Vercel project settings
- ✅ **Fix:** Add to Vercel Settings → Environment Variables

❌ **Mistake 2:** Wrong environment selected
- Only set for "Preview"
- Need "Production" for live site
- ✅ **Fix:** Check Production checkbox

❌ **Mistake 3:** Typo in variable name
- `NEXT_PUBLIC_SUPABASE_URL` (correct)
- `NEXT_PUBLIC_SUPABASEURL` (wrong)
- ✅ **Fix:** Copy exact name from above

❌ **Mistake 4:** Didn't redeploy
- Added variables but didn't redeploy
- Need new deployment to use new env vars
- ✅ **Fix:** Click Redeploy button

---

## After Variables Are Added

### Local Development (.env.local)
Already done - you should have:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Vercel Deployment (Settings)
Now add the same variables in:
```
Vercel → Project → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### GitHub (Keep Secret! ⚠️)
- Don't push `.env.local` to GitHub
- `.env.local` is in `.gitignore`
- Variables stored safely in Vercel only

---

## Summary

**What to do:**
1. Get Supabase URL and key from Supabase Dashboard
2. Add to Vercel project settings
3. Check all environments (Production, Preview, Development)
4. Redeploy project
5. Wait 2-5 minutes
6. Try logging in

**Result:**
✅ Login works
✅ No more environment variable errors
✅ Can access full app on Vercel

**Time:** ~5 minutes total

---

## Support

If still having issues:

1. **Check Vercel Logs**
   - Vercel Dashboard → Project → Deployments → Select Deployment → Logs
   - Look for any errors

2. **Check Supabase Credentials**
   - Visit Supabase Dashboard
   - Make sure project is active
   - Credentials are current

3. **Clear Everything**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear browser cache
   - Try incognito window

4. **Redeploy from Scratch**
   ```bash
   git push origin main  # If using GitHub
   # Or manual redeploy in Vercel
   ```

---

**Status: Ready to Fix** 🚀

Follow these steps to add Supabase environment variables to Vercel and login will work!

