--
-- CareVault Database Schema
-- Complete schema for the CareVault application
--

-- Extension required for UUID generation
create extension if not exists "uuid-ossp";

-- Create documents table
create table if not exists documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('legal', 'medical', 'financial', 'identification')),
  file_url text,
  file_name text,
  file_size integer,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create medical_records table
create table if not exists medical_records (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('doctors', 'medications', 'conditions')),
  name text not null,
  details text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create appointments table
create table if not exists appointments (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  appointment_date timestamp with time zone not null,
  remind_before_minutes integer default 30,
  repeat_interval text check (repeat_interval in ('none', 'daily', 'weekly', 'monthly', 'yearly')) default 'none',
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create emergency_contacts table
create table if not exists emergency_contacts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  relationship text,
  phone text,
  email text,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create users table (for future authentication)
create table if not exists users (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  role text default 'user' check (role in ('user', 'caregiver', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_documents_category on documents(category);
create index if not exists idx_documents_created_at on documents(created_at desc);
create index if not exists idx_medical_records_type on medical_records(type);
create index if not exists idx_medical_records_created_at on medical_records(created_at desc);
create index if not exists idx_appointments_date on appointments(appointment_date);
create index if not exists idx_appointments_completed on appointments(is_completed);
create index if not exists idx_users_role on users(role);

-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Enable Row Level Security on all tables
alter table documents enable row level security;
alter table medical_records enable row level security;
alter table appointments enable row level security;
alter table emergency_contacts enable row level security;
alter table users enable row level security;

-- RLS Policies
-- For development purposes (full access), but should be restricted in production
create policy "Allow all operations for all users" on documents
  for all using (true) with check (true);
  
create policy "Allow all operations for all users" on medical_records
  for all using (true) with check (true);
  
create policy "Allow all operations for all users" on appointments
  for all using (true) with check (true);
  
create policy "Allow all operations for all users" on emergency_contacts
  for all using (true) with check (true);

-- Storage policies for documents bucket
create policy "Allow public read access" on storage.objects
  for select using (bucket_id = 'documents');
  
create policy "Allow public insert access" on storage.objects
  for insert with check (bucket_id = 'documents');
  
create policy "Allow public update access" on storage.objects
  for update using (bucket_id = 'documents');
  
create policy "Allow public delete access" on storage.objects
  for delete using (bucket_id = 'documents');