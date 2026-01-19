--
-- Fix care_recipients table schema
-- Add caregiver_id and proper RLS policies
--

-- Step 1: Add caregiver_id column to care_recipients table
ALTER TABLE care_recipients 
ADD COLUMN IF NOT EXISTS caregiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Create index for caregiver_id
CREATE INDEX IF NOT EXISTS idx_care_recipients_caregiver ON care_recipients(caregiver_id);

-- Step 3: Drop existing overly permissive RLS policies
DROP POLICY IF EXISTS "Allow all operations for all users" ON care_recipients;

-- Step 4: Create proper RLS policies for caregivers
-- Allow caregivers to view their own patients
CREATE POLICY "Caregivers can view their own patients" ON care_recipients
  FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());

-- Allow caregivers to insert their own patients
CREATE POLICY "Caregivers can insert their own patients" ON care_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

-- Allow caregivers to update their own patients
CREATE POLICY "Caregivers can update their own patients" ON care_recipients
  FOR UPDATE
  TO authenticated
  USING (caregiver_id = auth.uid())
  WITH CHECK (caregiver_id = auth.uid());

-- Allow caregivers to delete their own patients
CREATE POLICY "Caregivers can delete their own patients" ON care_recipients
  FOR DELETE
  TO authenticated
  USING (caregiver_id = auth.uid());

-- Step 5: Verification
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✓ care_recipients schema fixed!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  1. Added caregiver_id column';
  RAISE NOTICE '  2. Created index on caregiver_id';
  RAISE NOTICE '  3. Updated RLS policies for data isolation';
  RAISE NOTICE '====================================';
END $$;
