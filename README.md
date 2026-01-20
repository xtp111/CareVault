# CareVault

A medical information management system designed for patients with chronic conditions and their caregivers.

## Project Overview

CareVault is a full-stack medical document management application built with Next.js and Supabase. It helps caregivers efficiently manage care recipients' medical information, medication records, appointment reminders, and important documents.

### Core Features

- **Multi-User Management**: Support for both Caregiver and Patient roles
- **Care Recipient Management**: One caregiver can manage multiple care recipients
- **Medication Records**: Record and track medication information, dosages, and usage instructions
- **Appointment Reminders**: Manage medical appointments with recurring reminders
- **Document Storage**: Upload and manage important medical, legal, and financial documents
- **Emergency Summary**: Quickly generate emergency summaries with key medical information
- **Data Isolation**: Strict data permission control based on Row Level Security (RLS)

## Technology Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Programming Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Authentication
- **Storage**: Supabase Storage
- **Deployment**: Vercel

## Project Structure

```
caregiver_app_project/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard page
│   ├── patients/            # Patient list page
│   ├── calendar/            # Calendar view page
│   ├── login/               # Login page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── EmergencySummary.tsx # Emergency summary component
├── contexts/                # React Context
│   └── AuthContext.tsx      # Authentication context
├── hooks/                   # Custom hooks
│   └── usePermissions.ts    # Permission management hook
├── lib/                     # Utility libraries
│   ├── supabase.ts         # Supabase client
│   ├── supabase-service.ts # Database service layer
│   ├── permissions.ts      # Permission configuration
│   └── utils.ts            # Utility functions
├── types/                   # TypeScript type definitions
│   └── supabase.ts         # Database types
├── database/                # Database scripts
│   └── CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql
├── docs/                    # Documentation
│   ├── CareVault_Complete_Documentation.md
│   └── Deployment.md
└── package.json            # Project dependencies
```

## Quick Start

### Requirements

- Node.js 18+
- npm or yarn
- Supabase account

### Installation Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd caregiver_app_project
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Initialize database**

- Login to [Supabase Dashboard](https://supabase.com/dashboard)
- Go to SQL Editor
- Execute all contents from `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`
- Wait for execution to complete

5. **Create user and set role**

```sql
-- Execute in Supabase SQL Editor
-- After user registration, set role to caregiver
INSERT INTO users (id, role, full_name)
VALUES (
  'your-user-uuid',  -- Get from auth.users table
  'caregiver',
  'Your Name'
)
ON CONFLICT (id) DO UPDATE SET role = 'caregiver';
```

6. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:3000`

## Database Architecture

### Core Tables

- **users**: User basic information, linked to Supabase Auth
- **care_recipients**: Care recipient information (core entity)
- **medical_records**: Medical records (medications, conditions, doctors)
- **appointments**: Appointment reminders
- **documents**: Document management
- **emergency_contacts**: Emergency contacts

### Data Isolation

- Row Level Security (RLS) implements multi-user data isolation
- Each caregiver can only access their own care recipients' data
- Patient role has read-only permissions

## User Roles and Permissions

| Role | Permissions |
|------|-------------|
| **Caregiver** | Full CRUD permissions, can manage care recipients, medical records, appointments, documents |
| **Patient** | Read-only permissions, can view their own medical information |
| **Admin** | Reserved role, not yet implemented |

## Development Guide

### Available Scripts

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint checks
```

### Adding New Features

1. Define TypeScript types in `types/supabase.ts`
2. Add database service functions in `lib/supabase-service.ts`
3. Create custom hooks in `hooks/` (if needed)
4. Implement UI components in `components/`
5. Update database schema (if new tables are needed)

### Code Standards

- Use TypeScript for type checking
- Follow Next.js 14 App Router best practices
- Use Tailwind CSS for styling
- Use shadcn/ui design system for components

## Deployment

### Vercel Deployment (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deployment automatically available after completion

### Environment Variable Configuration

Ensure the following environment variables are set in Vercel Dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Maintenance

### Rebuild Database

To completely rebuild the database:

```bash
# Execute in Supabase SQL Editor
database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql
```

**Warning**: This operation will delete all existing data!

### Backup Data

It is recommended to regularly create database backups in Supabase Dashboard.

## Common Issues

### 1. Cannot see "Add Patient" button after login?

**Cause**: User role is `patient` (read-only)

**Solution**:
```sql
-- Execute in Supabase SQL Editor
UPDATE users SET role = 'caregiver' WHERE id = 'your-user-uuid';
```

### 2. Error "Failed to add patient" when adding patient?

**Possible causes**:
- Database schema not correctly initialized
- RLS policy configuration error
- User not registered in `users` table

**Solution**: Check browser console error messages, confirm database schema has been correctly executed

### 3. Document upload fails?

**Cause**: Storage bucket not created or permission configuration error

**Solution**: Ensure complete database initialization script has been executed

## Documentation

- **Complete Documentation**: See `docs/CareVault_Complete_Documentation.md`
- **Deployment Guide**: See `docs/Deployment.md`

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!

---

**Built with Next.js and Supabase**
