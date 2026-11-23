# 🔑 Vercel Environment Variables Setup

## Your Supabase Project Details

**Project Name:** TVETPRACTICAL  
**Project URL:** https://obdywglzitczllamzqpx.supabase.co  
**Database Password:** oblAGlviphgU8QTA

---

## 📋 Environment Variables for Vercel

When deploying to Vercel, add these **2 environment variables**:

### 1. VITE_SUPABASE_URL
```
https://obdywglzitczllamzqpx.supabase.co
```

### 2. VITE_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHl3Z2x6aXRjemxsYW16cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTU5ODQsImV4cCI6MjExMDk3MTk4NH0.p00WwXTM5mmkKPTO0nNTQhQkEwFWbWcKiVs6Qq8dz-s
```

---

## 🚀 How to Add in Vercel Dashboard

### Step-by-Step:

1. **Go to Vercel Dashboard**
   - Navigate to your project: https://vercel.com/dashboard

2. **Open Project Settings**
   - Click on your TVET e-ASSESS project
   - Go to **Settings** tab

3. **Navigate to Environment Variables**
   - In the left sidebar, click **Environment Variables**

4. **Add First Variable**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://obdywglzitczllamzqpx.supabase.co`
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

5. **Add Second Variable**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHl3Z2x6aXRjemxsYW16cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTU5ODQsImV4cCI6MjExMDk3MTk4NH0.p00WwXTM5mmkKPTO0nNTQhQkEwFWbWcKiVs6Qq8dz-s`
   - Select: ✅ Production ✅ Preview ✅ Development
   - Click **Save**

6. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger automatic deployment

---

## 🖥️ Command Line Setup (Alternative)

If you prefer using Vercel CLI:

```bash
# Add first variable
vercel env add VITE_SUPABASE_URL
# When prompted, paste: https://obdywglzitczllamzqpx.supabase.co

# Add second variable
vercel env add VITE_SUPABASE_ANON_KEY
# When prompted, paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHl3Z2x6aXRjemxsYW16cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTU5ODQsImV4cCI6MjExMDk3MTk4NH0.p00WwXTM5mmkKPTO0nNTQhQkEwFWbWcKiVs6Qq8dz-s

# Deploy to production
vercel --prod
```

---

## 📝 Supabase Configuration Checklist

Before deploying, verify these in your Supabase dashboard:

### 1. Database Schema Applied
- [ ] Go to SQL Editor in Supabase
- [ ] Run the contents of `supabase-schema.sql`
- [ ] Verify tables are created

### 2. Email Authentication Enabled
- [ ] Go to Authentication → Providers
- [ ] Ensure **Email** provider is enabled
- [ ] Configure email templates (optional)

### 3. Site URL Configuration (After Vercel Deployment)
- [ ] Go to Authentication → URL Configuration
- [ ] Add your Vercel URL to **Site URL**
- [ ] Add your Vercel URL to **Redirect URLs**
- [ ] Example: `https://your-project.vercel.app`

---

## 🔒 Security Notes

### ✅ Safe to Use (Public Keys)
- **VITE_SUPABASE_URL** - Public project URL
- **VITE_SUPABASE_ANON_KEY** - Public anon key (Row Level Security protects your data)

### ⚠️ Keep Private (Do NOT add to Vercel for client-side app)
- **SUPABASE_SERVICE_ROLE_KEY** - Admin access key (keep this secure!)
- **DATABASE_URL** - Direct database connection string

> **Note:** For a static Vercel deployment, you only need the two VITE_ variables. The service role key and database URL are for server-side operations only.

---

## ✅ Verification

After adding environment variables and deploying:

1. **Check Build Logs**
   - Go to your Vercel deployment
   - Check that build succeeded without errors

2. **Visit Your Site**
   - Open your Vercel URL
   - Login page should load correctly

3. **Test Authentication**
   - Try the "First-Run Admin Setup"
   - Create a super admin account
   - Verify you can log in

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- ✅ Verify environment variables are spelled exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Check there are no extra spaces in the values
- ✅ Ensure variables are set for all environments
- ✅ Redeploy after adding variables

### "Authentication error"
- ✅ Verify Supabase Site URL is set to your Vercel URL
- ✅ Check that Email provider is enabled in Supabase
- ✅ Ensure database schema has been run

### "Build fails"
- ✅ Check build logs in Vercel dashboard
- ✅ Verify package.json and dependencies are correct
- ✅ Try clearing Vercel build cache and redeploying

---

## 📋 Quick Reference Card

**For Copy-Paste into Vercel:**

| Variable Name | Value |
|---------------|-------|
| `VITE_SUPABASE_URL` | `https://obdywglzitczllamzqpx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHl3Z2x6aXRjemxsYW16cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTU5ODQsImV4cCI6MjExMDk3MTk4NH0.p00WwXTM5mmkKPTO0nNTQhQkEwFWbWcKiVs6Qq8dz-s` |

---

## 🎉 You're All Set!

Once you've added these environment variables to Vercel:
1. Your app will connect to your Supabase database
2. Authentication will work correctly
3. All features will be functional

**Next Step:** Follow the [QUICKSTART.md](./QUICKSTART.md) guide to complete your deployment!

---

**TVET e-ASSESS Platform**  
*Digital Practical Assessment for CBET*
