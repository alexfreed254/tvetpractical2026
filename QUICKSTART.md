# TVET e-ASSESS - Quick Start Guide

Get your TVET e-ASSESS platform up and running in minutes!

## 🚀 Fast Track to Deployment

### 1. Prerequisites (5 minutes)
- [ ] Create a [Vercel account](https://vercel.com/signup) (free)
- [ ] Create a [Supabase account](https://supabase.com) (free)
- [ ] Have your code in a Git repository (GitHub, GitLab, or Bitbucket)

### 2. Set Up Supabase (10 minutes)

#### Create Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Name it (e.g., "tvet-eassess")
4. Set a strong database password
5. Choose your region
6. Click **"Create new project"**

#### Run Database Schema
1. Wait for project to finish setup (~2 minutes)
2. Go to **SQL Editor** in left sidebar
3. Open `supabase-schema.sql` from your project
4. Copy all contents
5. Paste into SQL Editor
6. Click **"Run"**

#### Get API Credentials
1. Go to **Project Settings → API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### 3. Deploy to Vercel (5 minutes)

#### Import Project
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New" → "Project"**
3. Select your Git repository
4. Click **"Import"**

#### Configure
1. Framework Preset: **Vite** (auto-detected)
2. Click **"Environment Variables"**
3. Add these two variables:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc...your-key...
   ```
4. Click **"Deploy"**

#### Wait for Build
- Build takes ~1-2 minutes
- You'll get a URL like: `your-project.vercel.app`

### 4. Initial Setup (2 minutes)

#### Create Admin Account
1. Visit your Vercel URL
2. On login page, click **"First-time setup? Create Super Admin account"**
3. Fill in:
   - Your full name
   - Your email address
   - Password (min 8 characters)
4. Click **"Create Super Admin & Enter Portal"**

#### Configure Institution
1. Go to **"Institution"** in top menu
2. Update:
   - Institution name
   - Department name
   - Academic year
   - Current term
3. Click **"Save"**

### 5. Start Using! 🎉

You're ready to:
- ✅ Add trainers and trainees
- ✅ Create assessments
- ✅ Conduct grading sessions
- ✅ Generate reports

---

## 📱 Local Development Setup

Want to run locally first?

```bash
# 1. Clone repository
git clone <your-repo-url>
cd TVET@2026

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
nano .env.local  # or use any text editor

# 4. Start development server
npm run dev

# 5. Open in browser
# http://localhost:5173
```

---

## 🔧 Troubleshooting

### Build Fails on Vercel
- **Check environment variables are set correctly**
- **Verify they're added for all environments (Production, Preview, Development)**
- Redeploy from Vercel dashboard

### Can't Login After Deployment
- **Check Supabase Site URL:**
  1. Go to Supabase project
  2. Authentication → URL Configuration
  3. Add your Vercel URL to "Site URL" and "Redirect URLs"
  4. Try logging in again

### Database Schema Error
- **Re-run the schema:**
  1. Open SQL Editor in Supabase
  2. Paste contents of `supabase-schema.sql`
  3. Click "Run"
  4. Refresh your app

### Still Having Issues?
1. Check the full [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md) guide
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. See [README.md](./README.md) for more details

---

## 📚 Next Steps

Once you're up and running:

1. **Add Users**
   - Go to Institution → Users
   - Add trainers, verifiers, and trainees
   - Or use Supabase Dashboard → Authentication → Users

2. **Create Assessments**
   - Go to Assessments
   - Click "Create New Assessment"
   - Add criteria and grading rubrics

3. **Conduct Grading**
   - Go to Assess (trainers only)
   - Select assessment and trainee
   - Mark each criterion
   - Save scores

4. **View Reports**
   - Go to Marksheets
   - View individual results
   - Generate class reports
   - Print or export

5. **Verify Results**
   - Internal Verifiers check marks
   - External Verifiers audit
   - Release results to trainees

---

## 🎯 Key Features

- **7 User Roles** with granular permissions
- **Digital Grading** with evidence upload
- **Automated Calculations** for scores
- **Print-Ready Papers** in A4 format
- **Verification Workflow** for quality assurance
- **Institutional Reports** and analytics

---

## 🆘 Get Help

- **Documentation:** See all `.md` files in project root
- **Vercel Support:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Support:** [supabase.com/docs](https://supabase.com/docs)

---

**Total Setup Time:** ~20-25 minutes

**Result:** Fully functional TVET assessment platform! 🎓

---

Made with ❤️ for TVET Institutions
