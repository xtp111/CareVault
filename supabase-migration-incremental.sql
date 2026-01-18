--
-- CareVault Incremental Database Migration Script
-- Preserves existing data and adds new functionality via ALTER TABLE
-- Suitable for production environments with valuable data
--

-- ==========================================
-- Step 1: Create care_recipients table (if not exists)
-- ==========================================
CREATE TABLE IF NOT EXISTS care_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  date_of_birth date,
  relationship text,
  photo_url text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Step 2: Insert default care recipient
-- ==========================================
DO $$
DECLARE
  default_recipient_id uuid;
  recipient_exists boolean;
BEGIN
  -- Check if any care recipients exist
  SELECT EXISTS (SELECT 1 FROM care_recipients LIMIT 1) INTO recipient_exists;
  
  IF NOT recipient_exists THEN
    -- Insert default care recipient
    INSERT INTO care_recipients (name, relationship, notes, is_active)
    VALUES ('Default Care Recipient', 'Primary', 'Auto-created default recipient. You can modify or add more.', true)
    RETURNING id INTO default_recipient_id;
    
    RAISE NOTICE '✓ Step 2: Created default care recipient (ID: %)', default_recipient_id;
  ELSE
    -- Use first existing care recipient as default
    SELECT id INTO default_recipient_id FROM care_recipients ORDER BY created_at LIMIT 1;
    RAISE NOTICE '✓ Step 2: Using existing care recipient (ID: %)', default_recipient_id;
  END IF;
  
  -- Store default ID in temp table for subsequent steps
  CREATE TEMP TABLE IF NOT EXISTS migration_temp (default_recipient_id uuid);
  DELETE FROM migration_temp;
  INSERT INTO migration_temp VALUES (default_recipient_id);
END $$;

-- ==========================================
-- Step 3: Add care_recipient_id to documents table
-- ==========================================
DO $$
DECLARE
  v_default_recipient_id uuid;
  column_exists boolean;
BEGIN
  -- Get default care recipient ID
  SELECT default_recipient_id INTO v_default_recipient_id FROM migration_temp LIMIT 1;
  
  -- Check if column already exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'care_recipient_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    -- Add column (initially nullable)
    ALTER TABLE documents ADD COLUMN care_recipient_id uuid;
    RAISE NOTICE '  → Added care_recipient_id column to documents table';
    
    -- Link all existing records to default care recipient
    UPDATE documents SET care_recipient_id = v_default_recipient_id WHERE care_recipient_id IS NULL;
    RAISE NOTICE '  → Linked %s existing documents to default care recipient', (SELECT COUNT(*) FROM documents);
    
    -- Set as NOT NULL
    ALTER TABLE documents ALTER COLUMN care_recipient_id SET NOT NULL;
    
    -- Add foreign key constraint
    ALTER TABLE documents ADD CONSTRAINT fk_documents_recipient 
      FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id) ON DELETE CASCADE;
    RAISE NOTICE '  → Added foreign key constraint';
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_documents_recipient ON documents(care_recipient_id);
    RAISE NOTICE '  → Created index';
  ELSE
    RAISE NOTICE '✓ Step 3: documents.care_recipient_id column already exists, skipping';
  END IF;
END $$;

-- ==========================================
-- Step 4: Add care_recipient_id to medical_records table
-- ==========================================
DO $$
DECLARE
  v_default_recipient_id uuid;
  column_exists boolean;
BEGIN
  SELECT default_recipient_id INTO v_default_recipient_id FROM migration_temp LIMIT 1;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'care_recipient_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE medical_records ADD COLUMN care_recipient_id uuid;
    RAISE NOTICE '  → Added care_recipient_id column to medical_records table';
    
    UPDATE medical_records SET care_recipient_id = v_default_recipient_id WHERE care_recipient_id IS NULL;
    RAISE NOTICE '  → Linked %s existing medical records to default care recipient', (SELECT COUNT(*) FROM medical_records);
    
    ALTER TABLE medical_records ALTER COLUMN care_recipient_id SET NOT NULL;
    
    ALTER TABLE medical_records ADD CONSTRAINT fk_medical_records_recipient 
      FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id) ON DELETE CASCADE;
    RAISE NOTICE '  → Added foreign key constraint';
    
    CREATE INDEX IF NOT EXISTS idx_medical_records_recipient ON medical_records(care_recipient_id);
    RAISE NOTICE '  → Created index';
  ELSE
    RAISE NOTICE '✓ Step 4: medical_records.care_recipient_id column already exists, skipping';
  END IF;
END $$;

-- ==========================================
-- Step 5: Add care_recipient_id to appointments table
-- ==========================================
DO $$
DECLARE
  v_default_recipient_id uuid;
  column_exists boolean;
BEGIN
  SELECT default_recipient_id INTO v_default_recipient_id FROM migration_temp LIMIT 1;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'care_recipient_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE appointments ADD COLUMN care_recipient_id uuid;
    RAISE NOTICE '  → Added care_recipient_id column to appointments table';
    
    UPDATE appointments SET care_recipient_id = v_default_recipient_id WHERE care_recipient_id IS NULL;
    RAISE NOTICE '  → Linked %s existing appointments to default care recipient', (SELECT COUNT(*) FROM appointments);
    
    ALTER TABLE appointments ALTER COLUMN care_recipient_id SET NOT NULL;
    
    ALTER TABLE appointments ADD CONSTRAINT fk_appointments_recipient 
      FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id) ON DELETE CASCADE;
    RAISE NOTICE '  → Added foreign key constraint';
    
    CREATE INDEX IF NOT EXISTS idx_appointments_recipient ON appointments(care_recipient_id);
    RAISE NOTICE '  → Created index';
  ELSE
    RAISE NOTICE '✓ Step 5: appointments.care_recipient_id column already exists, skipping';
  END IF;
END $$;

-- ==========================================
-- Step 6: Add care_recipient_id to emergency_contacts table (if exists)
-- ==========================================
DO $$
DECLARE
  v_default_recipient_id uuid;
  table_exists boolean;
  column_exists boolean;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'emergency_contacts'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT default_recipient_id INTO v_default_recipient_id FROM migration_temp LIMIT 1;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'emergency_contacts' AND column_name = 'care_recipient_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
      ALTER TABLE emergency_contacts ADD COLUMN care_recipient_id uuid;
      RAISE NOTICE '  → Added care_recipient_id column to emergency_contacts table';
      
      UPDATE emergency_contacts SET care_recipient_id = v_default_recipient_id WHERE care_recipient_id IS NULL;
      RAISE NOTICE '  → Linked %s emergency contacts to default care recipient', (SELECT COUNT(*) FROM emergency_contacts);
      
      ALTER TABLE emergency_contacts ADD CONSTRAINT fk_emergency_contacts_recipient 
        FOREIGN KEY (care_recipient_id) REFERENCES care_recipients(id) ON DELETE CASCADE;
      RAISE NOTICE '  → Added foreign key constraint';
      
      CREATE INDEX IF NOT EXISTS idx_emergency_contacts_recipient ON emergency_contacts(care_recipient_id);
      RAISE NOTICE '  → Created index';
    ELSE
      RAISE NOTICE '✓ Step 6: emergency_contacts.care_recipient_id column already exists, skipping';
    END IF;
  ELSE
    RAISE NOTICE '✓ Step 6: emergency_contacts table does not exist, skipping';
  END IF;
END $$;

-- ==========================================
-- Step 7: Create additional necessary indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_care_recipients_active ON care_recipients(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(type);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_completed ON appointments(is_completed);

-- ==========================================
-- Step 8: Configure Row Level Security
-- ==========================================
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop old policies (if they exist)
DROP POLICY IF EXISTS "Allow all operations for all users" ON care_recipients;
DROP POLICY IF EXISTS "Allow all operations for all users" ON documents;
DROP POLICY IF EXISTS "Allow all operations for all users" ON medical_records;
DROP POLICY IF EXISTS "Allow all operations for all users" ON appointments;

-- Create new policies
CREATE POLICY "Allow all operations for all users" ON care_recipients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON documents
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON medical_records
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for all users" ON appointments
  FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- Step 9: Clean up temporary tables
-- ==========================================
DROP TABLE IF EXISTS migration_temp;

-- ==========================================
-- Step 10: Migration statistics
-- ==========================================
DO $$
DECLARE
  recipient_count int;
  documents_count int;
  medical_records_count int;
  appointments_count int;
BEGIN
  SELECT COUNT(*) INTO recipient_count FROM care_recipients;
  SELECT COUNT(*) INTO documents_count FROM documents;
  SELECT COUNT(*) INTO medical_records_count FROM medical_records;
  SELECT COUNT(*) INTO appointments_count FROM appointments;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✓ Incremental Migration Completed!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Data Statistics:';
  RAISE NOTICE '  Care Recipients: %', recipient_count;
  RAISE NOTICE '  Documents: %', documents_count;
  RAISE NOTICE '  Medical Records: %', medical_records_count;
  RAISE NOTICE '  Appointments: %', appointments_count;
  RAISE NOTICE '====================================';
  RAISE NOTICE 'All existing data preserved and linked to default care recipient';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Modify default care recipient information';
  RAISE NOTICE '  2. Add more care recipients';
  RAISE NOTICE '  3. Reassign data to different care recipients';
  RAISE NOTICE '====================================';
END $$;

-- Migration completed!
