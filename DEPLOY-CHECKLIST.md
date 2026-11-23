# 🚀 TVET e-ASSESS - Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## ✅ Pre-Deployment (Complete ✓)

- [x] Login page redesigned with new UI
- [x] Vercel configuration created (`vercel.json`)
- [x] Dependencies optimized for production
- [x] Environment variables documented
- [x] Build scripts configured
- [x] Tailwind CSS properly set up
- [x] TypeScript configuration verified
- [x] All documentation created:
  - [x] README.md
  - [x] QUICKSTART.md
  - [x] VERCEL-DEPLOY.md
  - [x] DEPLOYMENT.md
  - [x] CHANGELOG.md
  - [x] PROJECT-SUMMARY.md

## 📋 Your Deployment Steps

### Step 1: Supabase Setup (10 min)
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project
- [ ] Note down database password
- [ ] Wait for project initialization
- [ ] Go to SQL Editor
- [ ] Open `supabase-schema.sql` file
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run" to create tables
- [ ] Go to Settings → API
- [ ] Copy Project URL: `________________`
- [ ] Copy anon key: `________________`
- [ ] Go to Authentication → Providers
- [ ] Enable Email provider

### Step 2: Git Repository (5 min)
- [ ] Code is committed to Git
- [ ] Repository is on GitHub/GitLab/Bitbucket
- [ ] Repository is accessible
- [ ] All files are committed (check: `git status`)

### Step 3: Vercel Deployment (5 min)
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Click "Add New" → "Project"
- [ ] Connect your Git provider
- [ ] Select TVET e-ASSESS repository
- [ ] Click "Import"
- [ ] Framework should auto-detect as "Vite"
- [ ] Add Environment Variables:
  - [ ] `VITE_SUPABASE_URL` = (paste from Step 1)
  - [ ] `VITE_SUPABASE_ANON_KEY` = (paste from Step 1)
- [ ] Select "All Environments"
- [ ] Click "Deploy"
- [ ] Wait for build (1-2 minutes)
- [ ] Copy your Vercel URL: `________________`

### Step 4: Configure Supabase Site URL (2 min)
- [ ] Go back to Supabase project
- [ ] Navigate to Authentication → URL Configuration
- [ ] Set Site URL to your Vercel URL
- [ ] Add Vercel URL to Redirect URLs
- [ ] Click "Save"

### Step 5: Initial Platform Setup (3 min)
- [ ] Visit your Vercel URL
- [ ] Verify login page displays correctly
- [ ] Click "First-time setup? Create Super Admin account"
- [ ] Fill in admin details:
  - Name: `________________`
  - Email: `________________`
  - Password: `________________`
- [ ] Click "Create Super Admin & Enter Portal"
- [ ] Verify you're logged in
- [ ] Go to "Institution" menu
- [ ] Update institution details:
  - Institution Name: `________________`
  - Department: `________________`
  - Academic Year: `________________`
  - Current Term: `________________`
- [ ] Click "Save"

### Step 6: Testing (5 min)
- [ ] Log out and log back in
- [ ] Add a test user (Institution → Users)
- [ ] Log in as test user
- [ ] Verify role-based menus work
- [ ] Create a sample assessment
- [ ] Test navigation between pages
- [ ] Check responsive design on mobile

### Step 7: Optional - Custom Domain (10 min)
- [ ] Go to Vercel project → Settings → Domains
- [ ] Click "Add Domain"
- [ ] Enter your domain: `________________`
- [ ] Configure DNS with CNAME record:
  - Type: CNAME
  - Name: (your subdomain)
  - Value: cname.vercel-dns.com
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate is active
- [ ] Update Supabase Site URL to custom domain

## 🎉 Post-Deployment

### Verification
- [ ] Site is accessible at Vercel URL
- [ ] Login works properly
- [ ] All menus are visible
- [ ] No console errors (press F12 to check)
- [ ] Mobile view works
- [ ] Print function works
- [ ] Data persists after refresh

### Documentation
- [ ] Share access with team
- [ ] Document login credentials (securely!)
- [ ] Create user guide for staff
- [ ] Set up regular backups

### Monitoring
- [ ] Bookmark Vercel dashboard
- [ ] Bookmark Supabase dashboard
- [ ] Set up status monitoring (optional)
- [ ] Configure Vercel analytics (optional)

## 🔧 Troubleshooting

### Build Fails
- **Action:** Check environment variables are set
- **Action:** Review build logs in Vercel dashboard
- **Action:** Verify all files are committed to Git

### Login Doesn't Work
- **Action:** Verify Supabase Site URL is set
- **Action:** Check environment variables are correct
- **Action:** Clear browser cache and cookies

### Database Errors
- **Action:** Re-run `supabase-schema.sql` in SQL Editor
- **Action:** Check Supabase project is active
- **Action:** Verify RLS policies are enabled

### Need Help?
- [ ] Check QUICKSTART.md
- [ ] Review VERCEL-DEPLOY.md
- [ ] Read troubleshooting in DEPLOYMENT.md
- [ ] Check Vercel documentation
- [ ] Check Supabase documentation

## 📊 Success Criteria

Your deployment is complete when:
- ✅ Site loads without errors
- ✅ Login page shows new design
- ✅ Authentication works
- ✅ All 7 user roles function
- ✅ Data persists correctly
- ✅ Responsive on all devices

## 📝 Notes Section

Use this space for your own notes:

**Deployment Date:** ________________

**Vercel URL:** ________________

**Custom Domain:** ________________

**Admin Email:** ________________

**Supabase Project:** ________________

**Additional Notes:**
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________

## 🎯 Estimated Time

- **Total Time:** ~30-40 minutes
- **Supabase Setup:** 10 min
- **Vercel Deploy:** 5 min
- **Configuration:** 5 min
- **Testing:** 10 min
- **Documentation:** 10 min

## 🆘 Support

If you encounter issues:
1. ✅ Check this checklist again
2. ✅ Read QUICKSTART.md for quick solutions
3. ✅ Review VERCEL-DEPLOY.md for detailed steps
4. ✅ Check PROJECT-SUMMARY.md for overview
5. ✅ Consult Vercel/Supabase documentation

---

**You're all set! Start checking off items above! 🚀**

---

*TVET e-ASSESS Platform - Making CBET Assessment Digital*
