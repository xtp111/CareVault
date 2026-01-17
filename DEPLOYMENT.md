# CareConnect Deployment Guide

## Free Cloud Deployment with Supabase + Vercel

This guide will help you deploy your CareConnect app completely free using Supabase (database) and Vercel (application hosting).

---

## Step 1: Set Up Supabase (Database)

### 1.1 Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended)

### 1.2 Create a New Project
1. Click "New Project"
2. Choose your organization
3. Fill in:
   - **Name**: `careconnect` (or any name you like)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
4. Click "Create new project" (wait 2-3 minutes)

### 1.3 Create Database Tables
1. In your Supabase dashboard, click "SQL Editor"
2. Click "New query"
3. Copy and paste the content from `supabase-schema.sql`
4. Click "Run" to execute the SQL

### 1.4 Get Your API Keys
1. Go to "Settings" → "API"
2. Copy these two values:
   - **Project URL** (starts with https://)
   - **anon public** key (long string)
3. Save these for Step 2!

---

## Step 2: Deploy to Vercel (Application)

### 2.1 Push Code to GitHub
1. Create a new repository on [github.com](https://github.com)
2. In your project folder, run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2.2 Deploy with Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Configure your project:
   - **Framework Preset**: Next.js (auto-detected)
   - Click "Environment Variables"
   - Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL = your-project-url-from-step-1.4
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-from-step-1.4
```

6. Click "Deploy"
7. Wait 2-3 minutes for deployment to complete

### 2.3 Your App is Live! 🎉
- Vercel will give you a URL like: `https://your-app.vercel.app`
- Click it to see your deployed app!

---

## Step 3: Update Local Development

1. Create `.env.local` file in your project root
2. Add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Install dependencies and run locally:
```bash
npm install
npm run dev
```

---

## Step 4: Connect App to Database (Code Update)

Now you need to update your app to use Supabase instead of local state.

### Update `app/page.tsx`:

Replace the `useState` hooks with Supabase queries. Here's a quick example:

```typescript
// Add at the top
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

// Replace useState with useEffect to fetch from Supabase
useEffect(() => {
  async function fetchDocuments() {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setDocuments(data)
  }
  fetchDocuments()
}, [])

// Update handleAddDocument
const handleAddDocument = async () => {
  const newDoc = {
    name: 'New Document',
    category: 'medical',
    date: new Date().toISOString().split('T')[0],
  }
  const { data, error } = await supabase
    .from('documents')
    .insert([newDoc])
    .select()
  if (data) setDocuments([...documents, ...data])
}
```

After making these changes:
1. Commit and push to GitHub
2. Vercel will auto-deploy the update!

---

## Free Tier Limits

### Supabase Free Tier:
- ✅ 500MB database space
- ✅ 1GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

### Vercel Free Tier:
- ✅ 100GB bandwidth per month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Custom domains

**Perfect for a term project!**

---

## Troubleshooting

### Can't connect to Supabase?
- Check your `.env.local` file has correct values
- Restart your dev server (`npm run dev`)

### Vercel deployment failed?
- Make sure environment variables are set correctly
- Check build logs for errors

### Database not working?
- Verify SQL schema was executed in Supabase
- Check Row Level Security policies

---

## Next Steps (Optional)

1. **Custom Domain**: Add your own domain in Vercel settings
2. **Authentication**: Enable Supabase Auth for user login
3. **File Upload**: Use Supabase Storage for document files

Need help? Check:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
