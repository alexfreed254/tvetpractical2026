# TVET e-ASSESS - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account (or use local Supabase)
- Git (for version control)

### 2. Installation

The dependencies are already installed. If you need to reinstall:

```bash
npm install --legacy-peer-deps
```

### 3. Configure Supabase

#### Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Update Environment Variables

Edit `.env.local` and replace with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Run Database Schema

1. Open your Supabase project
2. Go to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run"

This will create:
- All database tables
- Row Level Security policies
- Automatic calculation triggers
- Indexes for performance

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test the System

#### Test 1: Create Assessment Paper
1. Click "Create Assessment"
2. Fill in the assessment details
3. Add observation checklist items
4. Add assessment tasks
5. See live preview on the right
6. Click "Save Assessment"

#### Test 2: Conduct Assessment
1. Click "Conduct Assessment"
2. Select a trainee (or use the sample data)
3. Award marks for each criterion
4. Add comments
5. See automatic calculation of totals and percentage
6. Click "Generate PDF"
7. PDF will download automatically

#### Test 3: View Reports
1. Click "View Reports"
2. See list of completed assessments
3. Click "View" to see details
4. Click "PDF" to download

## Project Structure

```
TVET@2026/
├── app/                          # Next.js App Router
│   ├── assessments/
│   │   ├── create/              # Assessment builder page
│   │   ├── execute/             # Digital assessment execution
│   │   ├── reports/             # Assessment reports
│   │   └── page.js              # Assessments list
│   ├── layout.js                # Root layout
│   ├── page.js                  # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── AssessmentBuilder.js     # Assessment creation form
│   └── AssessmentPreview.js     # Live A4 preview
├── lib/
│   ├── supabase.js              # Supabase client
│   └── pdfGenerator.js          # PDF generation utility
├── supabase-schema.sql          # Database schema
├── package.json                 # Dependencies
├── next.config.js               # Next.js configuration
├── .env.local                   # Environment variables (not in Git)
├── .gitignore                   # Git ignore rules
└── README.md                    # Main documentation
```

## Key Features Implemented

### ✅ Assessment Paper Builder
- Two-panel layout (builder + live preview)
- Institutional details configuration
- Observation checklist with sub-items
- Assessment tasks with hierarchical criteria
- Maximum marks configuration
- Real-time A4 preview

### ✅ Digital Assessment Execution
- Trainee selection
- Mark entry with validation
- Comment fields for each criterion
- Automatic subtotal calculation
- Grand total and percentage calculation
- Competency outcome determination
- Feedback sections
- PDF generation

### ✅ PDF Generation
- Professional A4 format
- Institutional header
- Four-column observation checklist
- Task sections with criteria
- Subtotals and grand total
- Percentage calculation
- Assessment outcome with checkboxes
- Feedback sections
- Signature fields
- Page numbering

### ✅ Database Schema
- Complete Supabase schema
- Row Level Security
- Automatic calculations
- Audit logging
- Version control

## Testing Checklist

Before deploying, test these scenarios:

- [ ] Create assessment with observation checklist
- [ ] Add multiple tasks with sub-items
- [ ] Preview assessment paper (should look like official format)
- [ ] Execute assessment and award marks
- [ ] Marks validation (cannot exceed maximum)
- [ ] Automatic calculation of totals
- [ ] Automatic determination of competency
- [ ] Generate PDF (should reproduce official format)
- [ ] PDF displays all marks and comments
- [ ] PDF shows correct grand total and percentage
- [ ] PDF shows competency outcome
- [ ] Save assessment to database
- [ ] View assessment reports
- [ ] Download PDF from reports

## Common Issues

### Issue: Supabase connection error
**Solution:** Check your `.env.local` file has correct credentials

### Issue: PDF not generating
**Solution:** Check browser console for errors. Ensure all marks are valid numbers.

### Issue: Calculations incorrect
**Solution:** Verify that parent items don't have marks when they have sub-items

### Issue: Preview not updating
**Solution:** Refresh the page or check if JavaScript is enabled

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - TVET e-ASSESS"
git remote add origin https://github.com/yourusername/tvet-e-assess.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click "Deploy"

### 3. Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Sample Data

For testing, you can use this sample assessment data:

**Institution:** Thika Technical Training Institute  
**Department:** Electrical & Electronics Engineering  
**Course:** Electrical Installation Level 4, 5 & 6  
**Unit Code:** ENG/CU/EI/CR/03/5/MA  
**Unit Name:** Install Security System  
**Assessment Type:** Practical Assessment  
**Assessment Number:** 1  
**Competency Threshold:** 50%

## Next Steps

1. Configure your Supabase project
2. Run the database schema
3. Test the assessment builder
4. Test the assessment execution
5. Test PDF generation
6. Add real user data
7. Deploy to Vercel

## Support

For questions or issues:
1. Check the README.md for detailed documentation
2. Review the database schema in supabase-schema.sql
3. Check component files for implementation details
4. Review the PDF generator in lib/pdfGenerator.js

## License

Proprietary - TVET e-ASSESS Assessment Management System

---

**System Ready for Testing and Deployment**
