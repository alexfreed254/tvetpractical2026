# TVET e-ASSESS - Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- A [Vercel](https://vercel.com) account
- A [Supabase](https://supabase.com) project (for authentication and database)
- Git repository (GitHub, GitLab, or Bitbucket)

### Quick Deploy

#### Option 1: Deploy via Vercel Dashboard
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import your Git repository
5. Vercel will auto-detect the framework and configuration
6. Add your environment variables (see below)
7. Click "Deploy"

#### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Environment Variables

Add these environment variables in your Vercel project settings:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To add environment variables:
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its value
4. Redeploy the project

### Supabase Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   ```bash
   # Use the Supabase SQL Editor or CLI to run:
   cat supabase-schema.sql
   ```

3. **Configure Authentication**
   - Go to Authentication → Settings in Supabase Dashboard
   - Configure email authentication or other providers
   - Set up email templates if needed

### Post-Deployment

1. **Initial Admin Setup**
   - Visit your deployed URL
   - Use the "First-Run Admin Setup" to create the super administrator account
   - This creates the first user in Supabase Auth

2. **Add Additional Users**
   - Super Admin and HOD can provision users within the portal
   - Or manually add users via Supabase Dashboard → Authentication → Users

### Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS records as instructed

### Build Configuration

The project is configured with:
- **Build Command**: `tsc && vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Dev Command**: `vite`

These are defined in `vercel.json` and `package.json`.

### Troubleshooting

**Build Fails**
- Check that all environment variables are set
- Verify TypeScript compilation passes: `npm run lint`
- Check build logs in Vercel Dashboard

**Authentication Issues**
- Verify Supabase environment variables are correct
- Check Supabase project is active
- Ensure database schema is applied

**404 on Routes**
- The `vercel.json` rewrites configuration handles SPA routing
- If issues persist, check the rewrites configuration

### Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Production Build Test

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Features

- **Role-Based Access Control**: 7 user roles (Super Admin, HOD, Trainer, Internal Verifier, External Verifier, Trainee, Management)
- **Assessment Builder**: Create and manage CBET practical assessments
- **Digital Grading**: Real-time marking and evidence upload
- **Mark Sheets**: Automated calculation and reporting
- **Print-Ready Papers**: Generate official A4 assessment papers
- **Project Export**: Download complete project as ZIP

## 🔒 Security

- Supabase Authentication for secure login
- Row Level Security (RLS) policies in database
- Role-based permissions system
- Secure credential management

## 📄 License

See LICENSE file for details.

## 🆘 Support

For issues or questions:
1. Check the application logs in Vercel Dashboard
2. Review Supabase project logs
3. Verify all environment variables are set correctly

---

**TVET e-ASSESS** - Digital Practical Assessment Platform for Competency-Based Education & Training
