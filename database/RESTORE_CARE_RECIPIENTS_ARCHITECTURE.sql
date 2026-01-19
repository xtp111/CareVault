-- =====================================================================
-- CareVault Database Restore - Care Recipients Architecture
-- =====================================================================
-- This script restores the care_recipients relationship model where:
-- - Caregivers can create and manage care_recipients (patients under their care)
-- - Each medical record, appointment, document is linked to a care_recipient
-- - Patients can only view their own care_recipient data
-- =====================================================================

-- =====================================================================
-- STEP 1: Complete database cleanup
-- =====================================================================

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_care_recipient_on_patient_registration ON public.users;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS sync_user_email() CASCADE;
DROP FUNCTION IF EXISTS create_care_recipient_for_patient() CASCADE;

-- Drop all tables (cascade delete all dependencies)
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.care_recipients CASCADE;
DROP TABLE IF EXISTS public.user_relationships CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop all enum types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;
DROP TYPE IF EXISTS medical_record_type CASCADE;
DROP TYPE IF EXISTS medication_frequency CASCADE;

-- =====================================================================
-- STEP 2: Create enum types
-- =====================================================================

CREATE TYPE user_role AS ENUM ('caregiver', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE document_category AS ENUM ('medical', 'insurance', 'legal', 'personal', 'financial', 'identification');
CREATE TYPE medical_record_type AS ENUM ('medication', 'condition', 'procedure', 'lab_result', 'vital_sign');
CREATE TYPE medication_frequency AS ENUM ('daily', 'weekly', 'monthly', 'as_needed');

-- =====================================================================
-- STEP 3: Create table structures
-- =====================================================================

-- Users table - caregiver and patient roles
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'caregiver',
  -- Fields for Patient registration to record caregiver info
  pending_caregiver_email TEXT,
  pending_caregiver_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles - caregiver (manages care) or patient (views own data)';
COMMENT ON COLUMN public.users.role IS 'caregiver: can create/manage care_recipients; patient: view only their own data';

-- Care Recipients table - patients under caregiver's care
CREATE TABLE public.care_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_email TEXT, -- Optional: link to patient user account
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  diagnosis TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_email) -- Prevent duplicate associations
);

COMMENT ON TABLE public.care_recipients IS 'Patients under caregiver care - created and managed by caregivers';
COMMENT ON COLUMN public.care_recipients.patient_email IS 'Optional link to patient user account';

-- Medical Records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  type medical_record_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  medication_name TEXT,
  medication_dosage TEXT,
  medication_frequency medication_frequency,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medical_records IS 'Medical records linked to care_recipients';

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  doctor_name TEXT,
  status appointment_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.appointments IS 'Appointments linked to care_recipients';

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category document_category NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'Documents linked to care_recipients';

-- Emergency Contacts table
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.emergency_contacts IS 'Emergency contacts for care_recipients';

-- =====================================================================
-- STEP 4: Create indexes for query optimization
-- =====================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_care_recipients_caregiver ON public.care_recipients(caregiver_id);
CREATE INDEX idx_care_recipients_patient_email ON public.care_recipients(patient_email);
CREATE INDEX idx_care_recipients_active ON public.care_recipients(is_active);
CREATE INDEX idx_medical_records_care_recipient ON public.medical_records(care_recipient_id);
CREATE INDEX idx_medical_records_type ON public.medical_records(type);
CREATE INDEX idx_medical_records_date ON public.medical_records(date);
CREATE INDEX idx_medical_records_active ON public.medical_records(is_active);
CREATE INDEX idx_appointments_care_recipient ON public.appointments(care_recipient_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_documents_care_recipient ON public.documents(care_recipient_id);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_emergency_contacts_care_recipient ON public.emergency_contacts(care_recipient_id);

-- =====================================================================
-- STEP 5: Create trigger functions
-- =====================================================================

-- Function 1: Auto-sync auth.users to public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Parse role from metadata with safe type conversion
  BEGIN
    user_role_value := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'caregiver'; -- Default to caregiver if conversion fails
  END;
  
  INSERT INTO public.users (id, email, full_name, phone, role, pending_caregiver_email, pending_caregiver_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    NEW.raw_user_meta_data->>'phone',
    user_role_value,
    NEW.raw_user_meta_data->>'pending_caregiver_email',
    NEW.raw_user_meta_data->>'pending_caregiver_name'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Auto-syncs new auth.users to public.users';

-- Function 2: Sync email updates
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_user_email() IS 'Syncs email changes from auth.users to public.users';

-- Function 3: Auto-create care_recipient after Patient registration
CREATE OR REPLACE FUNCTION create_care_recipient_for_patient()
RETURNS TRIGGER AS $$
DECLARE
  caregiver_user_id UUID;
  first_name_part TEXT;
  last_name_part TEXT;
BEGIN
  -- Only trigger for patient role with pending_caregiver_email
  IF NEW.role = 'patient' AND NEW.pending_caregiver_email IS NOT NULL THEN
    -- Find caregiver's user_id
    SELECT id INTO caregiver_user_id
    FROM public.users
    WHERE email = NEW.pending_caregiver_email
      AND role = 'caregiver';
    
    -- If caregiver found, create care_recipient association
    IF caregiver_user_id IS NOT NULL THEN
      -- Parse full_name into first and last name
      first_name_part := COALESCE(SPLIT_PART(NEW.full_name, ' ', 1), 'Unknown');
      last_name_part := COALESCE(NULLIF(SPLIT_PART(NEW.full_name, ' ', 2), ''), '');
      
      INSERT INTO public.care_recipients (
        caregiver_id,
        patient_email,
        first_name,
        last_name,
        date_of_birth,
        is_active
      )
      VALUES (
        caregiver_user_id,
        NEW.email,
        first_name_part,
        last_name_part,
        CURRENT_DATE, -- Default to today, should be updated later
        TRUE
      );
      
      -- Clear pending fields
      UPDATE public.users
      SET pending_caregiver_email = NULL,
          pending_caregiver_name = NULL,
          updated_at = NOW()
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_care_recipient_for_patient: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_care_recipient_for_patient() IS 'Auto-creates care_recipient when patient registers';

-- =====================================================================
-- STEP 6: Create triggers
-- =====================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER sync_user_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_user_email();

CREATE TRIGGER create_care_recipient_on_patient_registration
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_care_recipient_for_patient();

-- =====================================================================
-- STEP 7: Configure Row Level Security (RLS)
-- =====================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Users table RLS policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Care Recipients table RLS policies
CREATE POLICY "Caregivers can view their care recipients"
  ON public.care_recipients FOR SELECT
  USING (
    caregiver_id = auth.uid()
  );

CREATE POLICY "Patients can view their own care recipient records"
  ON public.care_recipients FOR SELECT
  USING (
    patient_email IN (
      SELECT email FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Caregivers can insert care recipients"
  ON public.care_recipients FOR INSERT
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can update their care recipients"
  ON public.care_recipients FOR UPDATE
  USING (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can delete their care recipients"
  ON public.care_recipients FOR DELETE
  USING (caregiver_id = auth.uid());

-- Medical Records table RLS policies
CREATE POLICY "Caregivers can manage medical records for their care recipients"
  ON public.medical_records FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view medical records for their records"
  ON public.medical_records FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Appointments table RLS policies
CREATE POLICY "Caregivers can manage appointments for their care recipients"
  ON public.appointments FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view appointments for their records"
  ON public.appointments FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Documents table RLS policies
CREATE POLICY "Caregivers can manage documents for their care recipients"
  ON public.documents FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view documents for their records"
  ON public.documents FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Emergency Contacts table RLS policies
CREATE POLICY "Caregivers can manage emergency contacts for their care recipients"
  ON public.emergency_contacts FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view emergency contacts for their records"
  ON public.emergency_contacts FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================================
-- STEP 8: Grant permissions
-- =====================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================================
-- Complete
-- =====================================================================
--
-- ✅ Care Recipients Architecture Restored!
--
-- Core Design:
-- - Caregiver: Create and manage care_recipients (patients under their care)
-- - Each care_recipient linked to one caregiver
-- - Medical records, appointments, documents, emergency contacts linked to care_recipients
-- - Patient: Can only view their own care_recipient data (via patient_email link)
--
-- Table Structure:
-- - users (caregiver/patient)
-- - care_recipients (patients under care, linked to caregiver)
-- - medical_records (linked to care_recipients)
-- - appointments (linked to care_recipients)
-- - documents (linked to care_recipients)
-- - emergency_contacts (linked to care_recipients)
--
-- RLS Permissions:
-- - Caregiver: Full CRUD on their care_recipients and all linked data
-- - Patient: Read-only access to their own care_recipient data
--
-- Next Steps:
-- 1. Execute this script in Supabase SQL Editor
-- 2. Test Caregiver registration → should be able to add care_recipients
-- 3. Test Patient registration → should see their own care_recipient data only
--
-- =====================================================================
