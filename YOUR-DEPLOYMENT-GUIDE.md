# 🚀 YOUR DEPLOYMENT GUIDE - TVET e-ASSESS

**Your Supabase Project:** TVETPRACTICAL  
**Status:** ✅ Environment configured and ready to deploy!

---

## ✅ WHAT'S ALREADY DONE

- [x] ✅ Login page redesigned
- [x] ✅ Vercel configuration created
- [x] ✅ Dependencies optimized
- [x] ✅ Environment file created (`.env.local`)
- [x] ✅ Supabase credentials configured
- [x] ✅ All documentation written

---

## 📋 YOUR DEPLOYMENT CHECKLIST

### STEP 1: Set Up Supabase Database (10 minutes)

#### 1.1 Access Your Supabase Project
- [x] Project created: **TVETPRACTICAL**
- [x] Project URL: https://obdywglzitczllamzqpx.supabase.co
- [ ] Go to: https://app.supabase.com/project/obdywglzitczllamzqpx

#### 1.2 Run Database Schema
- [ ] Click **SQL Editor** in left sidebar
- [ ] Open file: `supabase-schema.sql` from your project
- [ ] Copy ALL contents (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click **Run** button
- [ ] Wait for "Success" message
- [ ] Verify tables created (check Tables tab)

#### 1.3 Enable Email Authentication
- [ ] Go to **Authentication** → **Providers**
- [ ] Find **Email** provider
- [ ] Toggle to **Enabled** (if not already)
- [ ] Click **Save**

---

### STEP 2: Prepare Git Repository (5 minutes)

#### 2.1 Initialize Git (if not done)
```bash
cd "C:\Users\user\Desktop\TVET@2026"
git init
git add .
git commit -m "Initial commit - TVET e-ASSESS Platform"
```

#### 2.2 Push to GitHub/GitLab/Bitbucket
Choose one:

**GitHub:**
```bash
# Create repository on github.com first, then:
git remote add origin https://github.com/YOUR-USERNAME/tvet-eassess.git
git branch -M main
git push -u origin main
```

**GitLab:**
```bash
# Create repository on gitlab.com first, then:
git remote add origin https://gitlab.com/YOUR-USERNAME/tvet-eassess.git
git branch -M main
git push -u origin main
```

**Bitbucket:**
```bash
# Create repository on bitbucket.org first, then:
git remote add origin https://YOUR-USERNAME@bitbucket.org/YOUR-USERNAME/tvet-eassess.git
git branch -M main
git push -u origin main
```

- [ ] Git repository created
- [ ] Code pushed to remote
- [ ] Repository URL: ____________________

---

### STEP 3: Deploy to Vercel (5 minutes)

#### 3.1 Import Project
- [ ] Go to: https://vercel.com/new
- [ ] Click **Import Git Repository**
- [ ] Select your TVET e-ASSESS repository
- [ ] Click **Import**

#### 3.2 Configure Build Settings
Vercel should auto-detect these (verify):
- [ ] Framework Preset: **Vite**
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm install`

#### 3.3 Add Environment Variables
Click **Environment Variables** and add:

**Variable 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://obdywglzitczllamzqpx.supabase.co`
- Environments: ✅ Production ✅ Preview ✅ Development

**Variable 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZHl3Z2x6aXRjemxsYW16cXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzOTU5ODQsImV4cCI6MjExMDk3MTk4NH0.p00WwXTM5mmkKPTO0nNTQhQkEwFWbWcKiVs6Qq8dz-s`
- Environments: ✅ Production ✅ Preview ✅ Development

- [ ] Environment variables added
- [ ] All environments selected

#### 3.4 Deploy
- [ ] Click **Deploy**
- [ ] Wait for build (1-2 minutes)
- [ ] Build successful ✅
- [ ] Copy your Vercel URL: ____________________

---

### STEP 4: Configure Supabase Site URL (2 minutes)

#### 4.1 Update Site URL
- [ ] Go to: https://app.supabase.com/project/obdywglzitczllamzqpx
- [ ] Navigate to **Authentication** → **URL Configuration**
- [ ] Set **Site URL** to your Vercel URL
- [ ] Example: `https://your-project.vercel.app`
- [ ] Click **Save**

#### 4.2 Add Redirect URLs
- [ ] In same section, add your Vercel URL to **Redirect URLs**
- [ ] Format: `https://your-project.vercel.app/**`
- [ ] Click **Save**

---

### STEP 5: Initial Platform Setup (5 minutes)

#### 5.1 Create Super Admin Account
- [ ] Visit your Vercel URL
- [ ] Verify login page loads correctly
- [ ] Click **"First-time setup? Create Super Admin account"**
- [ ] Fill in details:
  - Name: ____________________
  - Email: ____________________
  - Password: ____________________ (min 8 chars)
- [ ] Click **"Create Super Admin & Enter Portal"**
- [ ] Verify you're logged in ✅

#### 5.2 Configure Institution
- [ ] Click **"Institution"** in top menu
- [ ] Update institution details:
  - Institution Name: ____________________
  - Department: ____________________
  - Academic Year: ____________________
  - Current Term: ____________________
- [ ] Click **Save**
- [ ] Verify changes saved ✅

---

### STEP 6: Test Functionality (5 minutes)

#### 6.1 Test Authentication
- [ ] Log out
- [ ] Log back in with your admin credentials
- [ ] Verify login works ✅

#### 6.2 Test Navigation
- [ ] Click through all menu items
- [ ] Verify all pages load
- [ ] No console errors (press F12 to check)

#### 6.3 Add Test User
- [ ] Go to **Institution** → **Users** (if available)
- [ ] Add a test trainer account
- [ ] Verify user appears in list

#### 6.4 Test on Mobile
- [ ] Open site on mobile device
- [ ] Verify responsive design works
- [ ] Test login on mobile

---

## 🎉 DEPLOYMENT COMPLETE!

Congratulations! Your TVET e-ASSESS platform is now live!

### 📝 Record Your Details

**Deployment Information:**
- Vercel URL: ____________________
- Custom Domain (if added): ____________________
- Deployment Date: ____________________
- Admin Email: ____________________

**Supabase Details:**
- Project: TVETPRACTICAL
- URL: https://obdywglzitczllamzqpx.supabase.co
- Dashboard: https://app.supabase.com/project/obdywglzitczllamzqpx

---

## 🔧 Optional: Add Custom Domain

### If You Have a Domain:

#### In Vercel:
1. Go to your project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `assess.yourdomain.ac.ke` (or your preferred subdomain)
4. Follow DNS instructions

#### DNS Configuration:
Add this CNAME record in your domain provider:
- Type: `CNAME`
- Name: `assess` (or your subdomain)
- Value: `cname.vercel-dns.com`
- TTL: `3600` (or default)

#### Update Supabase:
1. Go to Supabase → Authentication → URL Configuration
2. Update Site URL to: `https://assess.yourdomain.ac.ke`
3. Update Redirect URLs to: `https://assess.yourdomain.ac.ke/**`

---

## 📚 Additional Resources

- **Full Documentation:** See all `.md` files in project
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Quick Help:** See QUICKSTART.md for troubleshooting

---

## 🆘 Troubleshooting

### Build Fails
- Check environment variables are spelled correctly
- Verify both variables are set for all environments
- Check build logs in Vercel dashboard

### Can't Login
- Verify Supabase Site URL is set to your Vercel URL
- Check that Email authentication is enabled
- Clear browser cache and try again

### Database Errors
- Re-run `supabase-schema.sql` in SQL Editor
- Verify tables were created (check Tables tab in Supabase)
- Check database connection in Supabase dashboard

---

## ✅ Success Checklist

Your deployment is successful when:
- [x] Site loads at Vercel URL
- [x] Login page displays correctly
- [x] Super admin account created
- [x] Can log in and out
- [x] Institution details configured
- [x] All pages accessible
- [x] No console errors
- [x] Mobile responsive works

---

## 🎯 Next Steps

Now that your platform is deployed:

1. **Add Users**
   - Create trainer accounts
   - Add verifier accounts
   - Register trainees

2. **Create Assessments**
   - Build assessment templates
   - Add grading criteria
   - Set up rubrics

3. **Start Grading**
   - Conduct practical assessments
   - Upload evidence
   - Generate mark sheets

4. **Train Staff**
   - Share login credentials securely
   - Provide user guides
   - Conduct training sessions

---

**🎉 CONGRATULATIONS! YOUR TVET e-ASSESS PLATFORM IS LIVE! 🎉**

---

**TVET e-ASSESS Platform**  
*Empowering CBET Through Digital Assessment*  
© 2024 All Rights Reserved
