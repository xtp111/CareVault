-- =====================================================================
-- CareVault 完整数据库清理与重建脚本 (FINAL VERSION)
-- =====================================================================
-- 执行顺序:
-- 1. 删除所有触发器
-- 2. 删除所有函数
-- 3. 删除所有RLS策略
-- 4. 删除所有表
-- 5. 删除所有类型
-- 6. 重新创建完整schema
-- =====================================================================

-- =====================================================================
-- STEP 1: 删除所有触发器
-- =====================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_care_recipient_on_patient_registration ON public.users;

-- =====================================================================
-- STEP 2: 删除所有函数
-- =====================================================================

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS sync_user_email() CASCADE;
DROP FUNCTION IF EXISTS create_care_recipient_for_patient() CASCADE;

-- =====================================================================
-- STEP 3: 删除所有表 (级联删除RLS策略)
-- =====================================================================

DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.care_recipients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- =====================================================================
-- STEP 4: 删除所有自定义类型
-- =====================================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS medication_frequency CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- =====================================================================
-- STEP 5: 创建基础类型
-- =====================================================================

CREATE TYPE user_role AS ENUM ('caregiver', 'patient');
CREATE TYPE medication_frequency AS ENUM ('daily', 'weekly', 'monthly', 'as_needed');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- =====================================================================
-- STEP 6: 创建核心表结构
-- =====================================================================

-- Users表 (扩展 auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'caregiver',
  pending_caregiver_email TEXT,
  pending_caregiver_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.users.role IS 'User role: caregiver (manages patients) or patient (read-only)';
COMMENT ON COLUMN public.users.pending_caregiver_email IS 'Temporary field for patient registration linking';

-- Care Recipients表 (患者信息和caregiver关联)
CREATE TABLE public.care_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  medical_conditions TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_email)
);

COMMENT ON TABLE public.care_recipients IS 'Patient records managed by caregivers';
COMMENT ON COLUMN public.care_recipients.patient_email IS 'Email linking to patient user account';

-- Medications表 (药物管理)
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency medication_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  prescribing_doctor TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medications IS 'Medication records for care recipients';

-- Appointments表 (预约管理)
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

COMMENT ON TABLE public.appointments IS 'Medical appointments for care recipients';

-- =====================================================================
-- STEP 7: 创建索引优化查询性能
-- =====================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_care_recipients_caregiver ON public.care_recipients(caregiver_id);
CREATE INDEX idx_care_recipients_patient_email ON public.care_recipients(patient_email);
CREATE INDEX idx_care_recipients_active ON public.care_recipients(is_active);
CREATE INDEX idx_medications_care_recipient ON public.medications(care_recipient_id);
CREATE INDEX idx_medications_active ON public.medications(is_active);
CREATE INDEX idx_appointments_care_recipient ON public.appointments(care_recipient_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- =====================================================================
-- STEP 8: 创建触发器函数
-- =====================================================================

-- Function 1: 自动同步 auth.users 到 public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- 安全解析role字段
  BEGIN
    user_role_value := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'caregiver';
  END;
  
  -- 插入到public.users
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    pending_caregiver_email, 
    pending_caregiver_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User Name'),
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

COMMENT ON FUNCTION handle_new_user() IS 'Syncs new auth.users to public.users with role assignment';

-- Function 2: 同步email更新
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_user_email() IS 'Syncs email changes from auth.users to public.users';

-- Function 3: Patient注册时自动创建care_recipient关联
CREATE OR REPLACE FUNCTION create_care_recipient_for_patient()
RETURNS TRIGGER AS $$
DECLARE
  caregiver_user_id UUID;
  first_name_part TEXT;
  last_name_part TEXT;
BEGIN
  -- 仅处理patient角色且有pending_caregiver_email的情况
  IF NEW.role = 'patient' AND NEW.pending_caregiver_email IS NOT NULL THEN
    
    -- 查找caregiver的user_id
    SELECT id INTO caregiver_user_id
    FROM public.users
    WHERE email = NEW.pending_caregiver_email
      AND role = 'caregiver';
    
    -- 如果找到caregiver，创建care_recipient关联
    IF caregiver_user_id IS NOT NULL THEN
      
      -- 解析姓名
      first_name_part := COALESCE(SPLIT_PART(NEW.full_name, ' ', 1), 'Unknown');
      last_name_part := COALESCE(NULLIF(SPLIT_PART(NEW.full_name, ' ', 2), ''), '');
      
      -- 插入care_recipient记录
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
        CURRENT_DATE, -- 默认生日，需要后续更新
        TRUE
      );
      
      -- 清空pending字段
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

COMMENT ON FUNCTION create_care_recipient_for_patient() IS 'Auto-creates care_recipient when patient registers with caregiver email';

-- =====================================================================
-- STEP 9: 创建触发器
-- =====================================================================

-- Trigger 1: 新用户注册时同步到public.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger 2: Email更新时同步
CREATE TRIGGER sync_user_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_user_email();

-- Trigger 3: Patient创建后自动关联caregiver
CREATE TRIGGER create_care_recipient_on_patient_registration
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_care_recipient_for_patient();

-- =====================================================================
-- STEP 10: 配置 Row Level Security (RLS)
-- =====================================================================

-- 启用RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users表RLS策略
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Care Recipients表RLS策略
CREATE POLICY "Caregivers can view their care recipients"
  ON public.care_recipients FOR SELECT
  USING (caregiver_id = auth.uid());

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

-- Medications表RLS策略
CREATE POLICY "Caregivers can manage medications for their care recipients"
  ON public.medications FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view medications for their records"
  ON public.medications FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Appointments表RLS策略
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

-- =====================================================================
-- STEP 11: 授予必要权限
-- =====================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================================
-- 完成
-- =====================================================================
-- 
-- ✅ 数据库重建完成!
-- 
-- 新架构支持:
-- 1. Caregiver注册: email, password, full_name, phone
-- 2. Patient注册: email, password, full_name, caregiver_email, caregiver_name
-- 3. 自动关联: Patient注册后自动创建care_recipient关联到caregiver
-- 4. 完整的RLS安全策略
-- 5. 优化的索引结构
-- 
-- 下一步:
-- 1. 在Supabase SQL Editor中执行此脚本
-- 2. 测试Caregiver注册 → 应该看到 "Caregiver Portal"
-- 3. 测试Patient注册 → 应该自动关联到Caregiver
-- 
-- =====================================================================
