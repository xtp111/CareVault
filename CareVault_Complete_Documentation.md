# CareVault - Complete Documentation

**Version:** 2.0  
**Generated:** 2025-01-20  
**Document Type:** Comprehensive Application Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Core Features](#3-core-features)
4. [User Authentication & Authorization](#4-user-authentication--authorization)
5. [Dashboard Interface](#5-dashboard-interface)
6. [Patient List Page](#6-patient-list-page)
7. [Calendar View](#7-calendar-view)
8. [Smart Input Features](#8-smart-input-features)
9. [Profile Management](#9-profile-management)
10. [Emergency Summary](#10-emergency-summary)
11. [Patient Read-Only Access](#11-patient-read-only-access)
12. [Database Architecture](#12-database-architecture)
13. [Security & Access Control](#13-security--access-control)
14. [UX/UI Design](#14-uxui-design)
15. [Development & Deployment](#15-development--deployment)
16. [Maintenance & Operations](#16-maintenance--operations)
17. [Troubleshooting Guide](#17-troubleshooting-guide)
18. [Version History](#18-version-history)

---

## 1. Project Overview

### 1.1 Introduction

CareVault is a comprehensive healthcare management application designed specifically for caregivers managing patients with chronic conditions, particularly dementia and Alzheimer's disease. The application provides a secure, user-friendly platform for tracking medical records, appointments, medications, and daily care activities.

### 1.2 Key Objectives

- **Centralized Care Management:** Single platform for all patient care information
- **Role-Based Access:** Separate interfaces for caregivers (full access) and patients (read-only)
- **Emergency Preparedness:** Quick access to critical patient information
- **Data Security:** Enterprise-grade security with Row Level Security (RLS)
- **Intuitive Interface:** Easy-to-use design for caregivers of all technical levels

### 1.3 Target Users

- **Primary Users:** Family caregivers managing elderly relatives with dementia
- **Secondary Users:** Professional caregivers managing multiple patients
- **Patient Users:** Care recipients who want to view their care information

---

## 2. Technology Stack

### 2.1 Frontend Technologies

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **PDF Generation:** jsPDF

### 2.2 Backend Technologies

- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Security:** Row Level Security (RLS) Policies

### 2.3 Deployment

- **Frontend Hosting:** Vercel
- **Backend Services:** Supabase Cloud
- **Version Control:** Git
- **CI/CD:** Vercel Auto-Deploy

---

## 3. Core Features

### 3.1 Feature Overview

CareVault provides eight major feature categories:

1. **User Authentication & Authorization** - Secure login with role-based access
2. **Patient Management** - Complete CRUD operations for patient records
3. **Medication Tracking** - Timeline visualization with smart autocomplete
4. **Appointment Scheduling** - Calendar view with urgency alerts
5. **Document Management** - Secure storage for medical, legal, and financial documents
6. **Care Logs** - Daily activity, symptom, and meal tracking
7. **Emergency Summary** - One-click PDF generation with critical information
8. **Search & Filter** - Real-time filtering across all data types

### 3.2 User Roles

#### Caregiver Role
- Full CRUD access to all patient data
- Can manage multiple patients
- Access to calendar and patient list views
- Can generate emergency summaries

#### Patient Role (Read-Only)
- View all personal care information
- Access to medications, appointments, and care logs
- Can download documents
- Can generate emergency summary
- Cannot create, edit, or delete any data

---

## 4. User Authentication & Authorization

### 4.1 Registration Process

#### Caregiver Registration
1. Navigate to `/login` page
2. Click "Don't have an account? Register"
3. Select role: "Caregiver"
4. Fill in required fields:
   - Email address
   - Password
   - Full Name
   - Phone Number (optional)
5. Click "Sign Up"
6. Verify email (if email confirmation enabled)
7. Login to access dashboard

#### Patient Registration
1. Navigate to `/login` page
2. Click "Don't have an account? Register"
3. Select role: "Patient (View Only)"
4. Fill in required fields:
   - Email address
   - Password
   - Full Name
   - Phone Number (optional)
   - **Caregiver Email** (REQUIRED - must match registered caregiver)
   - **Caregiver Name** (REQUIRED)
5. Click "Sign Up"
6. System automatically creates care_recipient link
7. Login to access read-only dashboard

**Important Notes:**
- Caregiver must register FIRST before patient can link to them
- Caregiver email must EXACTLY match the registered caregiver's email
- Patient-caregiver link is permanent and created during signup
- Database trigger automatically establishes the relationship

### 4.2 Login Process

1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard based on role:
   - Caregivers → Full dashboard with edit capabilities
   - Patients → Read-only dashboard

### 4.3 Security Features

- **Password Requirements:** Enforced by Supabase Auth
- **Session Management:** Automatic session handling via Supabase
- **Role Verification:** Checked on every page load
- **Protected Routes:** Automatic redirection for unauthorized access

---

## 5. Dashboard Interface

### 5.1 Header Navigation

The dashboard header provides quick access to key features:

**Left Section:**
- CareVault logo
- Portal type indicator (Caregiver Portal / Patient Portal Read-Only)

**Right Section:**
- **Emergency Summary Button:** Generate PDF with critical patient information
- **Patient Selector Dropdown:** (Caregivers only) Switch between multiple patients
- **Calendar Button:** Access full calendar view
- **All Patients Button:** (Caregivers only) View patient list
- **Add Patient Button:** (Caregivers only) Add new patient
- **Profile Button:** View user information
- **Logout Button:** Sign out of application

### 5.2 Data Overview Cards

Four statistics cards display at the top of the dashboard:

1. **Active Medications**
   - Blue icon with pill symbol
   - Shows count of current medications
   - Click to scroll to Medications section

2. **Upcoming Appointments**
   - Green icon with calendar symbol
   - Shows count of scheduled appointments
   - Click to scroll to Appointments section

3. **Care Logs**
   - Purple icon with heart symbol
   - Shows count of care log entries
   - Click to scroll to Care Logs section

4. **Documents**
   - Orange icon with file symbol
   - Shows count of stored documents
   - Click to scroll to Documents section

### 5.3 Urgent Appointments Alert

Displays appointments within the next 7 days with color-coded urgency:

**Urgency Levels:**
- **RED (URGENT):** Less than 24 hours remaining
- **YELLOW (SOON):** Less than 72 hours remaining
- **BLUE (UPCOMING):** Within 7 days

**Information Displayed:**
- Appointment title
- Date and time
- Time remaining (e.g., "2 days", "5 hours")
- Description
- Action buttons (caregivers only):
  - Mark as completed
  - Delete appointment

### 5.4 Patient Profile Card

**Basic Information:**
- Full name (first name + last name)
- Date of birth
- Edit and Delete buttons (caregivers only)

**Emergency Contact:**
- Contact name
- Phone number
- Relationship

**Medical Information:**
- Allergies
- Primary diagnosis
- Current medications overview

### 5.5 Medications Section

**Features:**
- Search box for filtering medications by name
- Timeline visualization with vertical line
- Chronological ordering (newest first)
- "Current" badge on most recent medication

**Each Medication Displays:**
- Medication name (with smart autocomplete)
- Dosage and frequency details
- Start date badge
- Instructions

**Actions (Caregivers Only):**
- Add new medication
- Delete medication

**Timeline Visualization:**
- Vertical blue line connecting all medications
- Dots marking each medication entry
- Top medication highlighted as "Current"

### 5.6 Appointments Section

**Features:**
- Search box for filtering by title or description
- Shows next 5 upcoming appointments
- Sorted chronologically

**Each Appointment Displays:**
- Title
- Date and time
- Location (if specified)
- Description

**Actions (Caregivers Only):**
- Add new appointment
- Mark as completed
- Delete appointment

### 5.7 Documents Section

**Features:**
- Upload documents with categorization
- File preview and download links
- Displays last 5 documents

**Document Categories:**
- Medical
- Legal
- Financial
- Identification

**Each Document Displays:**
- Document name
- Category badge
- Upload date
- Download/view link

**Actions (Caregivers Only):**
- Upload new document
- Delete document

**Patient Access:**
- Can view and download all documents
- Cannot upload or delete

### 5.8 Care Logs Section

**Features:**
- Full-width section at bottom of dashboard
- Chronological display (last 10 entries)
- Supports multiple log types

**Log Types:**
- Daily Activity
- Medication Administration
- Meal Tracking
- Symptom Observation
- Other Notes

**Each Log Entry Displays:**
- Log title
- Detailed notes/description
- Date recorded
- Type indicator

**Actions (Caregivers Only):**
- Add new care log
- Delete care log

---

## 6. Patient List Page

### 6.1 Overview

The `/patients` page provides caregivers with a grid view of all their patients. This page is accessible only to caregivers and displays patient cards with key information.

### 6.2 Layout

**Responsive Grid:**
- Mobile: 1 column
- Tablet (768px+): 2 columns
- Desktop (1024px+): 3 columns

### 6.3 Search & Filter Features

#### Search Functionality
- Real-time search as you type
- Searches across:
  - First name
  - Last name
  - Email address
- Clear button (X icon) to reset search

#### Filter Functionality
- Dropdown filter by diagnosis
- "All Diagnoses" option to show all patients
- "Clear Filters" button appears when filters are active

#### Filter Feedback
- Result counter: "Showing X of Y patients"
- Active search query display
- Active diagnosis filter display

### 6.4 Patient Cards

**Header:**
- Avatar icon placeholder
- Patient full name
- Date of birth

**Content:**
- Diagnosis badge (if available)
- Email address with icon
- Emergency contact phone number
- Emergency contact name

**Actions:**
- **View Details Button:** Navigate to patient's dashboard
- **Delete Button:** Remove patient (with confirmation dialog)

### 6.5 Empty States

**No Patients:**
- Message: "Add your first patient to get started"
- Prompt to use "Add Patient" button

**No Matching Results:**
- Message: "Try adjusting your search or filters"
- "Clear Filters" button to reset

---

## 7. Calendar View

### 7.1 Overview

The `/calendar` page provides a monthly calendar view of all appointments across all patients. This page is accessible only to caregivers.

### 7.2 Calendar Navigation

**Controls:**
- **Previous Month Button:** Navigate to previous month
- **Next Month Button:** Navigate to next month
- **Today Button:** Jump to current date
- Month and year display

### 7.3 Calendar Grid

**Layout:**
- 7-day week view (Sunday to Saturday)
- Week rows spanning the entire month
- Today's date highlighted in blue border

**Appointment Display:**
- Each day shows up to 3 appointments
- Appointment badges with time and title
- Green background for appointment indicators
- "+X more" indicator for additional appointments

### 7.4 Upcoming Appointments List

**Features:**
- Displays next 10 scheduled appointments
- Sorted chronologically
- Full appointment details

**Each Appointment Shows:**
- Title
- Date and time
- Location (if specified)
- Description

---

## 8. Smart Input Features

### 8.1 Diagnosis Autocomplete

**Purpose:** Help caregivers quickly select common diagnoses without typing full names.

**Common Diagnoses Database:**
- Alzheimer's Disease
- Dementia
- Parkinson's Disease
- Diabetes Type 2
- Hypertension
- Heart Failure
- COPD (Chronic Obstructive Pulmonary Disease)
- Arthritis
- Osteoporosis
- Depression

**How It Works:**
1. User begins typing in diagnosis field
2. System filters suggestions in real-time
3. Matching diagnoses appear in dropdown
4. Click to select from list
5. Can also type custom diagnosis

**Technical Details:**
- Case-insensitive matching
- Partial string matching
- 200ms delay before dropdown closes (allows click)

### 8.2 Medication Autocomplete

**Purpose:** Speed up medication entry with common medication names.

**Common Medications Database:**
- Aspirin
- Metformin
- Lisinopril
- Atorvastatin
- Levothyroxine
- Amlodipine
- Omeprazole
- Losartan
- Gabapentin
- Hydrochlorothiazide
- Sertraline
- Simvastatin
- Donepezil

**How It Works:**
1. User begins typing in medication name field
2. System filters suggestions as user types
3. Dropdown shows matching medications
4. Click to select
5. Can enter custom medication name

**Technical Details:**
- Real-time filtering
- Case-insensitive search
- Supports partial matches
- Dropdown auto-hides on blur with delay

### 8.3 Emergency Contact Relationship Dropdown

**Purpose:** Standardize relationship entries for consistency.

**Predefined Relationships:**
- Spouse
- Child
- Parent
- Sibling
- Friend
- Caregiver
- Other (allows custom entry)

**Benefits:**
- Data consistency
- Faster data entry
- Better reporting capabilities
- Standardized terminology

---

## 9. Profile Management

### 9.1 Profile Modal

Accessible via Profile button in header navigation.

### 9.2 User Information Section

**All Users See:**
- Avatar placeholder with user icon
- Full name
- Email address
- Role indicator (Caregiver / Patient Read-Only)
- Phone number (if provided)

### 9.3 Role-Specific Information

#### Caregiver Profile
- Number of patients being managed
- Account creation date
- Last login information (if tracked)

#### Patient Profile
- Care status: "You are receiving care through CareVault"
- Primary diagnosis (if available)
- Caregiver information:
  - Caregiver name (entered during registration)
  - Linked date

### 9.4 Profile Actions

- **Close Button:** Exit profile modal
- **Edit Profile:** (Future feature) Update personal information
- **Change Password:** (Future feature) Security settings

---

## 10. Emergency Summary

### 10.1 Purpose

The Emergency Summary provides a quick, printable PDF containing critical patient information for emergency situations.

### 10.2 Contents

**Patient Basic Information:**
- Full name
- Date of birth
- Emergency contact name and phone

**Medical Information:**
- Primary diagnosis
- Known allergies
- Current medications with dosages
- Recent appointments

### 10.3 Generation Process

1. Click "Emergency Summary" button in header
2. System compiles patient data
3. PDF is generated using jsPDF library
4. PDF automatically downloads to device
5. Can be printed or shared with emergency personnel

### 10.4 Use Cases

- Emergency room visits
- Ambulance calls
- New healthcare provider appointments
- Traveling with patient
- Caregiver handoffs

---

## 11. Patient Read-Only Access

### 11.1 Overview

Patients have comprehensive view-only access to their care information. This section details exactly what patients can and cannot access.

### 11.2 Registration Requirements

**Prerequisites:**
- Caregiver must register FIRST
- Patient needs caregiver's exact email address
- Patient needs caregiver's full name

**Registration Steps:**
1. Select "Patient (View Only)" role
2. Enter personal email and password
3. Enter caregiver's email (must match exactly)
4. Enter caregiver's name
5. Submit registration
6. Database trigger creates automatic linkage

### 11.3 What Patients CAN Access

#### Dashboard View
- ✓ All data overview cards
- ✓ Urgent appointments alert (view only)
- ✓ Complete patient profile
- ✓ All medications with timeline
- ✓ All appointments with details
- ✓ All documents (view and download)
- ✓ All care logs

#### Search Features
- ✓ Medication search and filter
- ✓ Appointment search and filter
- ✓ Real-time filtering

#### Profile Features
- ✓ View personal profile
- ✓ See caregiver information
- ✓ View role and permissions

#### PDF Generation
- ✓ Generate Emergency Summary PDF
- ✓ Download PDF to device

### 11.4 What Patients CANNOT Access

#### Restricted Pages
- ✗ `/patients` - Patient list page
- ✗ `/calendar` - Calendar view
- ✗ Automatically redirected to `/dashboard`

#### Hidden UI Elements
- ✗ "Add Patient" button
- ✗ "All Patients" button
- ✗ "Calendar" button
- ✗ Patient selector dropdown
- ✗ All "Add" buttons (medications, appointments, logs, documents)
- ✗ All "Edit" buttons
- ✗ All "Delete" buttons
- ✗ "Mark as Completed" buttons

#### Restricted Actions
- ✗ Create new records
- ✗ Modify existing records
- ✗ Delete any data
- ✗ Upload documents
- ✗ Change patient information
- ✗ Add medications or appointments

### 11.5 Visible Fields for Patients

#### Care Recipient Record
**Visible:**
- id, first_name, last_name
- patient_email (matches their login)
- date_of_birth
- diagnosis, allergies
- emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
- is_active, created_at

**Hidden:**
- caregiver_id (privacy)
- updated_at (internal)

#### Medications (Medical Records)
**Visible:**
- id, title (medication name)
- description (dosage, frequency)
- date (start date)
- type, is_active, created_at

**Hidden:**
- care_recipient_id (internal foreign key)
- updated_at (internal)

#### Appointments
**Visible:**
- id, title, description
- appointment_date, location
- doctor_name, status, notes
- created_at

**Hidden:**
- care_recipient_id (internal)
- updated_at (internal)

#### Documents
**Visible:**
- id, name, category
- file_url (can download)
- file_name, file_size
- description, created_at

**Hidden:**
- care_recipient_id (internal)
- updated_at (internal)

#### Care Logs
**Visible:**
- id, title, description
- date, type, created_at

**Hidden:**
- care_recipient_id (internal)
- is_active, updated_at (internal)

---

## 12. Database Architecture

### 12.1 Schema Overview

CareVault uses a PostgreSQL database hosted on Supabase with six main tables and supporting functions.

### 12.2 Tables

#### 12.2.1 users
**Purpose:** Store user account information for both caregivers and patients.

**Columns:**
- `id` - UUID (Primary Key, links to auth.users)
- `email` - String (Unique, not null)
- `full_name` - String
- `phone` - String (Optional)
- `role` - Enum (caregiver/patient)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `role` for filtering

#### 12.2.2 care_recipients
**Purpose:** Store patient information and link to caregivers.

**Columns:**
- `id` - UUID (Primary Key)
- `caregiver_id` - UUID (Foreign Key to users.id)
- `patient_email` - String (Optional, links to patient user)
- `first_name` - String (Not null)
- `last_name` - String (Not null)
- `date_of_birth` - Date
- `diagnosis` - String (Optional)
- `allergies` - String (Optional)
- `emergency_contact_name` - String
- `emergency_contact_phone` - String
- `emergency_contact_relationship` - String
- `is_active` - Boolean (Default true)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Primary key on `id`
- Index on `caregiver_id`
- Index on `patient_email`
- Composite index on (caregiver_id, is_active)

#### 12.2.3 medical_records
**Purpose:** Store medications, conditions, procedures, lab results, and vital signs.

**Columns:**
- `id` - UUID (Primary Key)
- `care_recipient_id` - UUID (Foreign Key to care_recipients.id)
- `type` - Enum (medication/condition/procedure/lab_result/vital_sign)
- `title` - String (Not null)
- `description` - Text
- `date` - Date
- `is_active` - Boolean (Default true)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Primary key on `id`
- Index on `care_recipient_id`
- Index on `type`
- Composite index on (care_recipient_id, type, date)

#### 12.2.4 appointments
**Purpose:** Store scheduled appointments and their details.

**Columns:**
- `id` - UUID (Primary Key)
- `care_recipient_id` - UUID (Foreign Key to care_recipients.id)
- `title` - String (Not null)
- `description` - Text
- `appointment_date` - Timestamp (Not null)
- `location` - String
- `doctor_name` - String
- `status` - Enum (scheduled/completed/cancelled/rescheduled)
- `notes` - Text
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Primary key on `id`
- Index on `care_recipient_id`
- Index on `appointment_date`
- Index on `status`
- Composite index on (care_recipient_id, appointment_date, status)

#### 12.2.5 documents
**Purpose:** Store references to uploaded documents in Supabase Storage.

**Columns:**
- `id` - UUID (Primary Key)
- `care_recipient_id` - UUID (Foreign Key to care_recipients.id)
- `name` - String (Not null)
- `category` - Enum (medical/legal/financial/identification)
- `file_url` - String (Supabase Storage URL)
- `file_name` - String
- `file_size` - Integer (bytes)
- `description` - Text
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Primary key on `id`
- Index on `care_recipient_id`
- Index on `category`

#### 12.2.6 emergency_contacts
**Purpose:** Store additional emergency contacts beyond primary contact.

**Columns:**
- `id` - UUID (Primary Key)
- `care_recipient_id` - UUID (Foreign Key to care_recipients.id)
- `name` - String (Not null)
- `relationship` - String
- `phone` - String (Not null)
- `email` - String
- `is_primary` - Boolean (Default false)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Indexes:**
- Primary key on `id`
- Index on `care_recipient_id`
- Index on `is_primary`

### 12.3 Database Functions

#### 12.3.1 handle_new_user()
**Purpose:** Automatically create user profile when new user signs up.

**Trigger:** AFTER INSERT on auth.users

**Actions:**
1. Extract user metadata (full_name, role, phone)
2. Insert record into public.users table
3. Set created_at and updated_at timestamps

#### 12.3.2 create_care_recipient_for_patient()
**Purpose:** Automatically link patient user to caregiver during registration.

**Trigger:** AFTER INSERT on public.users (when role = 'patient')

**Actions:**
1. Extract caregiver_email from user metadata
2. Find caregiver_id from users table
3. Create care_recipient record linking patient to caregiver
4. Set patient_email to user's email for RLS access

#### 12.3.3 sync_user_email()
**Purpose:** Keep patient_email synchronized when user changes email.

**Trigger:** AFTER UPDATE on auth.users

**Actions:**
1. Detect email change in auth.users
2. Update patient_email in care_recipients table
3. Maintain data consistency across tables

### 12.4 Database Triggers

1. **on_auth_user_created**
   - Trigger: AFTER INSERT ON auth.users
   - Function: handle_new_user()
   - Purpose: Create user profile

2. **on_patient_user_created**
   - Trigger: AFTER INSERT ON public.users
   - Function: create_care_recipient_for_patient()
   - Purpose: Link patient to caregiver

3. **on_user_email_updated**
   - Trigger: AFTER UPDATE ON auth.users
   - Function: sync_user_email()
   - Purpose: Sync email changes

---

## 13. Security & Access Control

### 13.1 Row Level Security (RLS) Overview

CareVault implements comprehensive Row Level Security at the database level, ensuring data isolation and access control even if UI restrictions are bypassed.

### 13.2 RLS Policies by Table

#### 13.2.1 care_recipients

**Caregiver Policies:**
- **SELECT:** WHERE caregiver_id = auth.uid()
- **INSERT:** With caregiver_id set to auth.uid()
- **UPDATE:** WHERE caregiver_id = auth.uid()
- **DELETE:** WHERE caregiver_id = auth.uid()

**Patient Policies:**
- **SELECT:** WHERE patient_email = auth.email()
- **INSERT:** NOT ALLOWED
- **UPDATE:** NOT ALLOWED
- **DELETE:** NOT ALLOWED

#### 13.2.2 medical_records

**Caregiver Policies:**
- **SELECT:** WHERE care_recipient.caregiver_id = auth.uid()
- **INSERT:** For care_recipients owned by caregiver
- **UPDATE:** For care_recipients owned by caregiver
- **DELETE:** For care_recipients owned by caregiver

**Patient Policies:**
- **SELECT:** WHERE care_recipient.patient_email = auth.email()
- **INSERT:** NOT ALLOWED
- **UPDATE:** NOT ALLOWED
- **DELETE:** NOT ALLOWED

#### 13.2.3 appointments

**Caregiver Policies:**
- **SELECT:** WHERE care_recipient.caregiver_id = auth.uid()
- **INSERT:** For care_recipients owned by caregiver
- **UPDATE:** For care_recipients owned by caregiver
- **DELETE:** For care_recipients owned by caregiver

**Patient Policies:**
- **SELECT:** WHERE care_recipient.patient_email = auth.email()
- **INSERT:** NOT ALLOWED
- **UPDATE:** NOT ALLOWED
- **DELETE:** NOT ALLOWED

#### 13.2.4 documents

**Caregiver Policies:**
- **SELECT:** WHERE care_recipient.caregiver_id = auth.uid()
- **INSERT:** For care_recipients owned by caregiver
- **UPDATE:** For care_recipients owned by caregiver
- **DELETE:** For care_recipients owned by caregiver

**Patient Policies:**
- **SELECT:** WHERE care_recipient.patient_email = auth.email()
- **INSERT:** NOT ALLOWED
- **UPDATE:** NOT ALLOWED
- **DELETE:** NOT ALLOWED

**Storage Policies:**
- Patients can READ files (download)
- Patients cannot WRITE or DELETE files

### 13.3 Security Guarantees

1. **Data Isolation:**
   - Caregivers only see their own patients' data
   - Patients only see data linked to their email
   - No cross-contamination of data

2. **Write Protection:**
   - All patient write operations blocked at database level
   - Even API manipulation cannot bypass RLS
   - Attempts to write result in permission errors

3. **Privacy Protection:**
   - Caregiver_id hidden from patient queries
   - Patients cannot see other patients' data
   - Email addresses are protected

4. **Immutable Configuration:**
   - All SECURITY DEFINER functions have immutable search_path
   - Prevents SQL injection attacks
   - Protects against privilege escalation

### 13.4 Authentication Security

**Password Requirements:**
- Minimum 8 characters (configurable in Supabase)
- Enforced by Supabase Auth
- Password reset via email

**Session Management:**
- JWT tokens with configurable expiration
- Automatic refresh handling
- Secure HTTP-only cookies (when configured)

**Email Verification:**
- Optional email confirmation on signup
- Prevents fake account creation
- Configurable in Supabase dashboard

---

## 14. UX/UI Design

### 14.1 Responsive Design

#### Breakpoints
- **Mobile:** < 768px (1 column layouts)
- **Tablet:** 768px - 1024px (2 column layouts)
- **Desktop:** > 1024px (3 column layouts)

#### Mobile Optimizations
- Touch-friendly button sizes (minimum 44x44px)
- Stacked layouts for easy scrolling
- Collapsible sections for space efficiency
- Bottom-aligned action buttons

#### Tablet Optimizations
- 2-column grid for patient cards
- Side-by-side form layouts
- Expanded data overview cards

#### Desktop Optimizations
- 3-column grid for patient cards
- Wider modals with side-by-side fields
- Expanded header with all navigation
- Sticky header for persistent navigation

### 14.2 Visual Hierarchy

#### Color Coding
- **Blue:** Medications and medical information
- **Green:** Appointments and scheduling
- **Purple:** Care logs and daily activities
- **Orange:** Documents and files

#### Urgency Indicators
- **Red:** Urgent (< 24 hours)
- **Yellow:** Soon (< 72 hours)
- **Blue:** Upcoming (< 7 days)

#### Icon System
- Lucide React icons for consistency
- Color-matched to section
- Meaningful visual representation

#### Typography
- Clear heading hierarchy (h1, h2, h3)
- Readable body text (16px base)
- Bold for emphasis
- Consistent spacing

### 14.3 Search & Filter UX

#### Real-Time Filtering
- No submit button needed
- Instant results as you type
- Smooth transitions

#### Clear Actions
- X icon for clearing search
- "Clear Filters" button when active
- Visual feedback on active filters

#### Result Feedback
- "Showing X of Y" counters
- Active search query display
- Empty state messages

#### Empty States
- Friendly guidance messages
- Clear next actions
- Illustrations (if applicable)

### 14.4 Form Design

#### Input Enhancements
- Autocomplete dropdowns
- Date/time pickers with defaults
- Required field indicators (*)
- Inline validation

#### Modal Overlays
- Focused data entry
- Dark overlay for context
- Close on Escape key
- Click outside to close

#### Button Placement
- Primary action on right
- Secondary/Cancel on left
- Consistent across all forms
- Clear visual hierarchy

### 14.5 Data Visualization

#### Timeline View
- Vertical line connecting entries
- Chronological ordering
- "Current" indicators
- Date badges

#### Calendar Grid
- Traditional month view
- Color-coded appointments
- "+X more" for overflow
- Today highlighting

#### Statistics Cards
- Large numbers for impact
- Color-coded icons
- Descriptive labels
- Clickable for navigation

---

## 15. Development & Deployment

### 15.1 Local Development Setup

#### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git version control
- Supabase account
- Code editor (VS Code recommended)

#### Installation Steps

**1. Clone Repository:**
```bash
git clone <repository-url>
cd caregiver_app_project
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Environment Configuration:**
```bash
# Copy example env file
cp .env.local.example .env.local

# Edit .env.local with your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**4. Start Development Server:**
```bash
npm run dev
```

Access application at `http://localhost:3000`

### 15.2 Database Setup

#### Create Supabase Project

1. Go to https://supabase.com
2. Create new project
3. Wait for database provisioning
4. Navigate to SQL Editor

#### Execute Schema Script

1. Open `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" to execute
5. Verify tables created successfully

#### Verify Setup

```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
```

### 15.3 Deployment to Vercel

#### Method 1: Git Integration (Recommended)

**1. Push to Git Repository:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

**2. Import to Vercel:**
1. Login to https://vercel.com
2. Click "New Project"
3. Import your Git repository
4. Vercel auto-detects Next.js configuration

**3. Configure Environment Variables:**
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Set for Production, Preview, and Development

**4. Deploy:**
- Click "Deploy"
- Wait for build to complete
- Access via provided URL

#### Method 2: Vercel CLI

**1. Install Vercel CLI:**
```bash
npm i -g vercel
```

**2. Login and Link:**
```bash
vercel login
vercel link
```

**3. Set Environment Variables:**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**4. Deploy:**
```bash
vercel --prod
```

### 15.4 Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://abc.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbGci... |

#### Security Notes
- Never commit `.env.local` to version control
- Use different keys for development and production
- Rotate keys periodically
- Store securely (password manager, secrets manager)

### 15.5 Build Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Production Build
npm run build            # Create optimized production build
npm run start            # Start production server

# Linting and Type Checking
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check

# Testing (if configured)
npm run test             # Run test suite
npm run test:coverage    # Run tests with coverage
```

### 15.6 Custom Domain Setup

#### Add Domain to Vercel

1. Go to Project → Settings → Domains
2. Add your domain name
3. Vercel provides DNS records

#### Configure DNS

**For Root Domain (example.com):**
- Type: A
- Name: @
- Value: 76.76.21.21

**For Subdomain (www.example.com):**
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

#### SSL Certificate

- Automatically provisioned by Vercel
- Usually active within minutes
- Auto-renews before expiration

---

## 16. Maintenance & Operations

### 16.1 Monitoring

#### Application Monitoring

**Vercel Analytics:**
- Page view tracking
- Load time metrics
- Error rate monitoring
- Access via Vercel dashboard

**Error Tracking:**
- Browser console errors
- API request failures
- Authentication issues
- Implement Sentry (optional)

#### Database Monitoring

**Supabase Dashboard:**
- Query performance
- Connection count
- Storage usage
- Active connections

**Key Metrics:**
- Response times
- Error rates
- Database size
- API calls

### 16.2 Backup Strategy

#### Database Backups

**Automatic Backups (Supabase):**
- Daily automatic backups
- 7-day retention (free tier)
- 30-day retention (pro tier)
- Point-in-time recovery (pro tier)

**Manual Backups:**
```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Or via pg_dump
pg_dump -h db.project.supabase.co -U postgres -d postgres > backup.sql
```

#### Code Backups

- Version control via Git
- Maintain remote repository
- Tag releases with semantic versioning
- Document deployment procedures

#### Document Backups

- Files stored in Supabase Storage
- Supabase handles automatic backups
- Consider additional cloud backup for critical files

### 16.3 Update Procedures

#### Dependency Updates

**Check for Updates:**
```bash
npm outdated
```

**Update Dependencies:**
```bash
# Update all to latest minor/patch versions
npm update

# Update specific package
npm install package-name@latest

# Update all to latest major versions (use caution)
npm install package-name@latest
```

**Testing After Updates:**
1. Run in development: `npm run dev`
2. Test all major features
3. Run build: `npm run build`
4. Deploy to preview environment
5. Test in production-like environment
6. Deploy to production

#### Application Updates

**Development Workflow:**
1. Create feature branch
2. Implement changes
3. Test locally
4. Create pull request
5. Review code
6. Merge to main
7. Automatic deployment via Vercel

**Rollback Procedure:**
1. In Vercel dashboard, go to Deployments
2. Find previous working deployment
3. Click three dots → Promote to Production
4. Confirm rollback

### 16.4 Scaling Considerations

#### Frontend Scaling

**Vercel Automatic Scaling:**
- Automatic serverless scaling
- Global CDN distribution
- No configuration needed
- Handles traffic spikes

#### Database Scaling

**Vertical Scaling (Supabase):**
- Upgrade to larger compute instance
- More CPU and RAM
- Higher connection limits

**Query Optimization:**
- Add indexes for frequent queries
- Optimize N+1 queries
- Use connection pooling
- Implement caching

#### Storage Scaling

**Supabase Storage:**
- Scales automatically
- Monitor storage usage
- Implement file size limits
- Archive old documents

### 16.5 Security Maintenance

#### Regular Security Tasks

**Weekly:**
- Review access logs
- Check for failed login attempts
- Monitor error rates

**Monthly:**
- Review user accounts
- Check RLS policies
- Update dependencies with security patches

**Quarterly:**
- Full security audit
- Review authentication settings
- Test backup restoration
- Update documentation

#### Security Best Practices

- Keep dependencies updated
- Use environment variables for secrets
- Implement rate limiting (via Supabase)
- Regular password policy reviews
- Monitor for suspicious activity

---

## 17. Troubleshooting Guide

### 17.1 Common Issues

#### Issue: Environment Variables Not Working

**Symptoms:**
- "Invalid API key" errors
- Can't connect to database
- Blank page on load

**Solutions:**
1. Verify variables are prefixed with `NEXT_PUBLIC_`
2. Check spelling and values in `.env.local`
3. Restart development server after changes
4. In production, check Vercel environment variables
5. Verify variables are set for correct environment (production/preview/development)

#### Issue: Patient Cannot See Any Data

**Symptoms:**
- "No Care Record Found" message
- Empty dashboard for patient
- Patient logged in successfully

**Solutions:**
1. Verify patient_email in care_recipients matches patient's login email
2. Check that caregiver has added patient with correct email
3. Verify RLS policies are enabled
4. Check database for care_recipient record:
```sql
SELECT * FROM care_recipients WHERE patient_email = 'patient@example.com';
```

#### Issue: "Add Patient" Button Not Working

**Symptoms:**
- Opens update form instead of add form
- Shows existing patient data in form
- Cannot add new patient

**Solutions:**
1. This was a known bug (now fixed)
2. Ensure selectedPatient state is cleared before opening form
3. Call resetPatientForm() before setShowPatientForm(true)
4. Update to latest version of dashboard code

#### Issue: Authentication Errors

**Symptoms:**
- Cannot login
- "Invalid credentials" errors
- Redirect loops

**Solutions:**
1. Verify Supabase URL and anon key are correct
2. Check that user exists in auth.users table
3. Verify email is confirmed (if confirmation required)
4. Check Supabase auth settings
5. Clear browser cache and cookies
6. Try incognito/private browsing mode

#### Issue: Database Connection Errors

**Symptoms:**
- "Failed to fetch" errors
- Timeout errors
- Empty data despite records existing

**Solutions:**
1. Verify Supabase project is active (not paused)
2. Check internet connection
3. Verify API keys are correct
4. Check Supabase status page
5. Review RLS policies (might be blocking queries)
6. Check browser console for detailed errors

### 17.2 Diagnostic Tools

#### Browser Developer Tools

**Console Tab:**
- View JavaScript errors
- Check API request/response
- Monitor authentication state

**Network Tab:**
- Inspect API calls
- Check request headers
- View response data
- Identify failed requests

**Application Tab:**
- Check localStorage
- Inspect cookies
- View session data

#### Database Diagnostics

**Check RLS Status:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Check Policies:**
```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Check User Data:**
```sql
-- Find user by email
SELECT * FROM auth.users WHERE email = 'user@example.com';

-- Check user's care recipients
SELECT cr.* 
FROM care_recipients cr
JOIN users u ON cr.caregiver_id = u.id
WHERE u.email = 'caregiver@example.com';
```

**Check Patient Access:**
```sql
-- Verify patient linkage
SELECT * FROM care_recipients WHERE patient_email = 'patient@example.com';

-- Check what patient can see (run as patient)
SELECT * FROM medical_records WHERE care_recipient_id IN (
  SELECT id FROM care_recipients WHERE patient_email = auth.email()
);
```

### 17.3 Performance Issues

#### Slow Page Load

**Possible Causes:**
- Large number of records
- Unoptimized queries
- Missing indexes
- Network latency

**Solutions:**
1. Implement pagination for large lists
2. Add database indexes:
```sql
CREATE INDEX idx_medical_records_care_recipient 
ON medical_records(care_recipient_id, date);

CREATE INDEX idx_appointments_date 
ON appointments(appointment_date);
```
3. Use lazy loading for images/documents
4. Optimize component re-renders
5. Implement data caching

#### Slow Database Queries

**Diagnosis:**
```sql
-- Enable query timing
EXPLAIN ANALYZE SELECT * FROM medical_records WHERE care_recipient_id = 'some-uuid';
```

**Solutions:**
1. Add appropriate indexes
2. Limit result sets with LIMIT
3. Use specific column selections instead of SELECT *
4. Implement pagination
5. Consider materialized views for complex queries

---

## 18. Version History

### Version 2.0 - Full Feature Release
**Release Date:** January 2025

**Major Features:**
- Complete patient management system
- Calendar and timeline views
- Smart input with autocomplete
- Search and filter throughout application
- Profile and logout on all pages
- Comprehensive documentation

**Improvements:**
- Responsive design optimizations
- Enhanced data visualization
- Improved navigation structure
- Better empty state handling
- Consolidated documentation

**Bug Fixes:**
- Fixed "Add Patient" button calling update instead of add
- Resolved patient dropdown visibility issues
- Fixed syntax errors in login page
- Added missing service layer methods

### Version 1.5 - Search & Filter Update
**Release Date:** December 2024

**New Features:**
- Patient list page with grid layout
- Search functionality for patients
- Medication search and filter
- Appointment search and filter
- Diagnosis filter dropdown
- Clear filters functionality

**Improvements:**
- Real-time filtering
- Result counters
- Empty state messages

### Version 1.0 - Initial Release
**Release Date:** November 2024

**Core Features:**
- User authentication with role-based access
- Basic dashboard with CRUD operations
- Care recipient architecture
- Emergency Summary PDF generation
- Row Level Security implementation
- Database schema with RLS policies

---

## Appendix A: File Structure

```
caregiver_app_project/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard interface
│   ├── patients/
│   │   └── page.tsx          # Patient list grid view
│   ├── calendar/
│   │   └── page.tsx          # Calendar view for appointments
│   ├── login/
│   │   └── page.tsx          # Authentication page
│   ├── test-registration/
│   │   └── page.tsx          # Registration testing page
│   └── layout.tsx            # Root layout with providers
│
├── components/
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── textarea.tsx
│   └── EmergencySummary.tsx  # PDF export component
│
├── contexts/
│   └── AuthContext.tsx       # Authentication context provider
│
├── hooks/
│   └── usePermissions.ts     # Role-based permission hooks
│
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   └── supabase-service.ts   # Service layer for data operations
│
├── types/
│   └── supabase.ts           # TypeScript type definitions
│
├── database/
│   ├── CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql  # Full schema
│   ├── RESTORE_CARE_RECIPIENTS_ARCHITECTURE.sql
│   ├── FIX_SECURITY_ISSUES.sql
│   └── FIX_UNIQUE_CONSTRAINT.sql
│
├── docs/
│   └── Deployment.md         # Deployment documentation
│
├── .env.local.example        # Example environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Appendix B: API Reference

### Supabase Service Methods

#### Care Recipients

```typescript
// Get all care recipients for a caregiver
getCareRecipientsByCaregiver(caregiverId: string): Promise<CareRecipient[]>

// Create new care recipient
createCareRecipient(data: CareRecipientInput): Promise<CareRecipient>

// Update care recipient
updateCareRecipient(id: string, data: Partial<CareRecipientInput>): Promise<void>

// Delete care recipient
deleteCareRecipient(id: string): Promise<void>
```

#### Medical Records

```typescript
// Get medical records by type
getMedicalRecords(careRecipientId: string, type?: string): Promise<MedicalRecord[]>

// Create medical record
createMedicalRecord(data: MedicalRecordInput): Promise<MedicalRecord>

// Delete medical record
deleteMedicalRecord(id: string): Promise<void>
```

#### Appointments

```typescript
// Get all appointments
getAllAppointments(): Promise<Appointment[]>

// Get appointments for care recipient
getAppointments(careRecipientId: string): Promise<Appointment[]>

// Create appointment
createAppointment(data: AppointmentInput): Promise<Appointment>

// Update appointment
updateAppointment(id: string, data: Partial<AppointmentInput>): Promise<void>

// Delete appointment
deleteAppointment(id: string): Promise<void>
```

#### Documents

```typescript
// Get documents
getDocuments(careRecipientId: string): Promise<Document[]>

// Upload document
uploadDocument(file: File, data: DocumentMetadata): Promise<Document>

// Delete document
deleteDocument(id: string): Promise<void>
```

---

## Appendix C: Keyboard Shortcuts

Currently, CareVault does not implement custom keyboard shortcuts. Standard browser shortcuts apply:

- **Ctrl/Cmd + F:** Find on page
- **Tab:** Navigate between form fields
- **Enter:** Submit form (when focus on input)
- **Escape:** Close modals
- **Ctrl/Cmd + P:** Print Emergency Summary

Future versions may include:
- Quick navigation shortcuts
- Search activation shortcut
- Patient switching shortcut

---

## Appendix D: Browser Compatibility

### Supported Browsers

- **Chrome:** Version 90+ ✓
- **Firefox:** Version 88+ ✓
- **Safari:** Version 14+ ✓
- **Edge:** Version 90+ ✓

### Mobile Browsers

- **iOS Safari:** Version 14+ ✓
- **Chrome Mobile:** Latest version ✓
- **Samsung Internet:** Latest version ✓

### Known Issues

- Internet Explorer not supported (use Edge instead)
- Some features may require JavaScript enabled
- Cookies must be enabled for authentication

---

## Appendix E: Contact & Support

### Documentation

- **Full Documentation:** This document
- **Deployment Guide:** See docs/Deployment.md
- **Features Guide:** See FEATURES.txt
- **Patient Access Guide:** See PATIENT_READ_ONLY_GUIDE.txt

### Technical Support

For technical issues:
1. Check Troubleshooting Guide (Section 17)
2. Review browser console for errors
3. Check Supabase project status
4. Contact project maintainers

### Contributing

To contribute to CareVault:
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request
5. Wait for code review

---

**End of Documentation**

*This document is maintained alongside the CareVault application and should be updated with each major release.*