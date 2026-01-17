# CareVault - Caregiver Documentation App

A secure web application for caregivers to manage medical documents and emergency information for chronic condition patients.

## Features

- 📄 **Document Management** - Organize legal, medical, financial, and identification documents
- 💊 **Medical Records** - Track doctors, medications, and medical conditions
- 🚨 **Emergency Summary** - Generate quick-reference emergency information
- 🔒 **Secure Storage** - Database-backed storage with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + Authentication)
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd caregiver_app_project
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and anon key
   - Create a `.env.local` file based on `.env.local.example`
   - Add your Supabase credentials

4. Run the database migrations (see Database Setup below)

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Database Setup

Create the following tables in your Supabase project:

### Documents Table
```sql
create table documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Medical Records Table
```sql
create table medical_records (
  id uuid default uuid_generate_v4() primary key,
  type text not null,
  name text not null,
  details text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy!

Your app will be live at `https://your-app.vercel.app`

## Project Structure

```
caregiver_app_project/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   ├── utils.ts
│   └── supabase.ts
├── public/
│   └── images/
├── .env.local.example
├── package.json
└── README.md
```

## License

MIT
