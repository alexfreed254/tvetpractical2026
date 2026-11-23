# TVET e-ASSESS

**Digital Practical Assessment Platform for Competency-Based Education & Training**

A comprehensive web-based platform for managing CBET (Competency-Based Education and Training) practical assessments, grading, verification, and reporting for TVET institutions.

![TVET e-ASSESS Platform](https://ai.google.dev/static/site-assets/images/share-ais-513315318.png)

## 🎯 Overview

TVET e-ASSESS is a full-featured assessment management system designed specifically for Technical and Vocational Education and Training institutions. It streamlines the entire assessment workflow from authoring to grading, verification, and results publication.

### Key Features

- **🔐 Role-Based Access Control** - 7 distinct user roles with granular permissions
- **📝 Assessment Builder** - Create and manage practical assessments with detailed criteria
- **✅ Digital Grading** - Real-time marking interface with evidence upload
- **📊 Automated Mark Sheets** - Automatic calculation and report generation
- **🖨️ Print-Ready Papers** - Generate official A4 assessment papers
- **📦 Project Export** - Download complete project repository as ZIP
- **🔄 Verification Workflow** - Internal and external verification queues
- **📈 Analytics Dashboard** - Institutional pass rates and cohort trends

## 👥 User Roles

1. **Super Administrator** - Institution setup, user provisioning, system policies
2. **Head of Department (HOD)** - Department structures, trainer allocation, staff provisioning
3. **Trainer** - Assessment authoring, grading, evidence upload
4. **Internal Verifier** - Mark verification, corrections, result release
5. **External Verifier** - Read-only audit access
6. **Trainee** - Personal portfolio and results view
7. **Management** - Institutional reports and analytics

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd TVET@2026
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the database schema from `supabase-schema.sql`
   - Enable Email authentication

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:5173`

## 📦 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Quick Deploy Steps:**

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🏗️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Animations**: Motion
- **Backend**: Supabase (Auth + PostgreSQL)
- **State Management**: Zustand
- **File Export**: JSZip

## 📂 Project Structure

```
TVET@2026/
├── src/
│   ├── components/        # React components
│   │   ├── LoginView.tsx
│   │   ├── AdminModuleView.tsx
│   │   ├── AssessmentBuilderView.tsx
│   │   ├── DigitalAssessmentView.tsx
│   │   └── ...
│   ├── lib/              # Utilities and helpers
│   │   ├── supabase/     # Supabase client config
│   │   ├── calculations.ts
│   │   └── zipExporter.ts
│   ├── store/            # State management
│   │   └── useAssessmentStore.tsx
│   ├── types/            # TypeScript types
│   │   └── tvet.ts
│   ├── data/             # Seed data
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── supabase-schema.sql   # Database schema
├── vercel.json          # Vercel configuration
├── package.json
└── README.md
```

## 🔧 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Type check with TypeScript
```

## 🔒 Security

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) policies
- **Role-Based Permissions**: Granular access control per feature
- **Secure API**: Environment variables for sensitive data

## 📋 Initial Setup

1. **First Login**: Use "First-Run Admin Setup" to create the super administrator
2. **Add Institution Details**: Configure institution name, department, academic year
3. **Create Users**: Add trainers, verifiers, trainees via the admin panel
4. **Build Assessments**: Create assessment templates and criteria
5. **Conduct Assessments**: Grade trainees using digital checklists
6. **Verify & Release**: Complete verification workflow and publish results

## 🎓 Use Cases

- Technical Training Institutes
- Vocational Education Centers
- TVET Colleges
- Apprenticeship Programs
- Skills Development Centers

## 📄 Database Schema

The platform uses PostgreSQL via Supabase with the following main tables:

- `institution` - Institution configuration
- `users` - User accounts and roles
- `assessments` - Assessment templates
- `assessment_sessions` - Grading sessions
- `trainee_scores` - Individual marks
- `verification_queue` - Verification workflow

See `supabase-schema.sql` for the complete schema.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues, questions, or feature requests:

1. Check existing [GitHub Issues](../../issues)
2. Review the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
3. Consult Supabase and Vercel documentation

## 🙏 Acknowledgments

- Built for TVET institutions to streamline practical assessment workflows
- Designed for CBET compliance and standardization
- Supports Kenya's education digitization initiatives

---

**TVET e-ASSESS** | Empowering competency-based education through technology

Made with ❤️ for TVET Institutions

