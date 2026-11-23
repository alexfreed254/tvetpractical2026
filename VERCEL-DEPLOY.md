# Deploy TVET e-ASSESS to Vercel

This guide will walk you through deploying the TVET e-ASSESS platform to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works fine)
2. A [Supabase account](https://supabase.com) with a project set up
3. Your code pushed to GitHub, GitLab, or Bitbucket

## Step 1: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New Project"
   - Choose your organization and name your project
   - Set a database password (save this!)
   - Select a region close to your users
   - Click "Create new project"

2. **Run the Database Schema**
   - Wait for your project to finish setting up
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-schema.sql` from your project
   - Paste and run it in the SQL Editor

3. **Enable Email Authentication**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Configure email templates if needed (optional)

4. **Get Your API Keys**
   - Go to Project Settings → API
   - Copy your `Project URL` (looks like: https://xxxxx.supabase.co)
   - Copy your `anon/public` key

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Import Your Project**
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Add New" → "Project"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your TVET e-ASSESS repository
   - Click "Import"

2. **Configure Project Settings**
   - Vercel should auto-detect it as a Vite project
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (should be pre-filled)
   - Output Directory: `dist` (should be pre-filled)
   - Install Command: `npm install` (should be pre-filled)

3. **Add Environment Variables**
   Click "Environment Variables" and add:
   
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   Make sure to add them for all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your site will be live at a Vercel URL like: `your-project.vercel.app`

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to your project directory
cd TVET@2026

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - What's your project's name? tvet-eassess
# - In which directory is your code located? ./
# - Want to override the settings? No

# After first deployment, add environment variables:
vercel env add VITE_SUPABASE_URL
# Enter your Supabase URL when prompted

vercel env add VITE_SUPABASE_ANON_KEY
# Enter your Supabase anon key when prompted

# Deploy to production
vercel --prod
```

## Step 3: Initial Setup

1. **Visit Your Deployed Site**
   - Open your Vercel URL (e.g., `https://your-project.vercel.app`)

2. **Create First Admin Account**
   - On the login page, click "First-time setup? Create Super Admin account"
   - Fill in the administrator details:
     - Full Name
     - Email Address
     - Password (minimum 8 characters)
   - Click "Create Super Admin & Enter Portal"

3. **Configure Institution**
   - Go to "Institution" in the main menu
   - Update institution name, department, academic year, and term
   - Add additional users (trainers, verifiers, trainees)

## Step 4: Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to your project in Vercel Dashboard
   - Navigate to Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `assess.yourinstitution.ac.ke`)

2. **Configure DNS**
   - Add a CNAME record in your DNS provider:
     - Type: `CNAME`
     - Name: `assess` (or your subdomain)
     - Value: `cname.vercel-dns.com`
   - Wait for DNS propagation (can take up to 48 hours, usually much faster)

3. **SSL Certificate**
   - Vercel automatically provisions and renews SSL certificates
   - Your site will be accessible via HTTPS

## Step 5: Configure Supabase Site URL

1. **Update Supabase Settings**
   - Go to your Supabase project
   - Navigate to Authentication → URL Configuration
   - Add your Vercel URL to "Site URL"
   - Add your Vercel URL to "Redirect URLs"
   - Example: `https://your-project.vercel.app`

## Troubleshooting

### Build Fails

**Check Build Logs**
- Go to your project in Vercel Dashboard
- Click on the failed deployment
- Review the build logs for errors

**Common Issues:**
- Missing environment variables → Add them in Vercel project settings
- TypeScript errors → Run `npm run lint` locally to fix
- Dependency issues → Try deleting `node_modules` and `package-lock.json`, then `npm install`

### Authentication Not Working

**Check Supabase Configuration:**
- Verify environment variables are correct
- Ensure Supabase project is active
- Check that database schema is applied
- Verify Site URL is set in Supabase Auth settings

### Pages Return 404

**Vercel Routing:**
- Check that `vercel.json` is in the root directory
- Verify the rewrites configuration is correct
- Redeploy the project

### Slow Loading

**Optimize Assets:**
- Images in `src/assets` are copied to dist
- Consider using Supabase Storage for large files
- Enable Vercel Edge Network caching

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGc...` |

## Updating Your Deployment

### Via Git Push
```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Vercel automatically deploys on push
```

### Via Vercel CLI
```bash
# Deploy latest changes
vercel --prod
```

### Rollback
```bash
# View deployments
vercel ls

# Promote a previous deployment
vercel promote [deployment-url]
```

## Performance Optimization

1. **Enable Vercel Analytics** (Optional)
   - Go to your project in Vercel
   - Navigate to Analytics tab
   - Enable Web Analytics

2. **Optimize Images**
   - Use Vercel Image Optimization for dynamic images
   - Compress static images before committing

3. **Caching**
   - Static assets are automatically cached by Vercel
   - Database queries are handled by Supabase

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env.local` or `.env` files
   - Use Vercel's Environment Variables feature
   - Rotate keys regularly

2. **Supabase RLS Policies**
   - Ensure Row Level Security (RLS) is enabled on all tables
   - Review and test policies before production use

3. **User Management**
   - Use strong passwords
   - Regularly audit user accounts
   - Implement role-based access control

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Project Issues**: Check GitHub Issues or create a new one

## Monitoring

**Vercel Deployment Status**
- View real-time deployment status in Vercel Dashboard
- Check build logs for each deployment
- Monitor site performance and analytics

**Supabase Monitoring**
- Monitor database queries in Supabase Dashboard
- Check API usage and quotas
- Review authentication logs

---

**Congratulations!** Your TVET e-ASSESS platform is now deployed and ready to use! 🎉

For additional help, refer to the main [README.md](./README.md) and [DEPLOYMENT.md](./DEPLOYMENT.md) files.
Human: continue