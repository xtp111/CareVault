-- =====================================================================
-- CareVault Database Rebuild - Aligned with Current App Schema
-- =====================================================================
-- 根据 types/supabase.ts 和 lib/supabase-service.ts 重建数据库
-- =====================================================================

-- =====================================================================
-- STEP 1: 完全清理现有数据库
-- =====================================================================

-- 删除所有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_care_recipient_on_patient_registration ON public.users;

-- 删除所有函数
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS sync_user_email() CASCADE;
DROP FUNCTION IF EXISTS create_care_recipient_for_patient() CASCADE;

-- 删除所有表
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.care_recipients CASCADE;
DROP TABLE IF EXISTS public.user_relationships CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 删除所有类型
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;

-- =====================================================================
-- STEP 2: 创建枚举类型
-- =====================================================================

CREATE TYPE user_role AS ENUM ('user', 'caregiver', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE document_category AS ENUM ('medical', 'insurance', 'legal', 'personal', 'financial', 'identification');

-- =====================================================================
-- STEP 3: 创建表结构 (按照 types/supabase.ts)
-- =====================================================================

-- Users表
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'caregiver',
  pending_caregiver_email TEXT,
  pending_caregiver_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON COLUMN public.users.role IS 'User role: user, caregiver, or patient';

-- Care Recipients表 (患者档案)
CREATE TABLE public.care_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  relationship TEXT,
  photo_url TEXT,
  notes TEXT,
  diagnosis TEXT,
  medications TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_email)
);

COMMENT ON TABLE public.care_recipients IS 'Patient profiles managed by caregivers';

-- Medical Records表 (病历、药物、日志)
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medications', 'conditions', 'procedures', 'lab_results')),
  name TEXT NOT NULL,
  details TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medical_records IS 'Medical records including medications, conditions, procedures';

-- Appointments表
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

-- Documents表
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_recipient_id UUID NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category document_category NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'Document storage for care recipients';

-- User Relationships表 (可选，用于未来扩展)
CREATE TABLE public.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id)
);

COMMENT ON TABLE public.user_relationships IS 'Relationships between caregivers and patients';

-- Emergency Contacts表
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.emergency_contacts IS 'Emergency contact information';

-- =====================================================================
-- STEP 4: 创建索引
-- =====================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_care_recipients_caregiver ON public.care_recipients(caregiver_id);
CREATE INDEX idx_care_recipients_patient_email ON public.care_recipients(patient_email);
CREATE INDEX idx_care_recipients_active ON public.care_recipients(is_active);
CREATE INDEX idx_medical_records_care_recipient ON public.medical_records(care_recipient_id);
CREATE INDEX idx_medical_records_type ON public.medical_records(type);
CREATE INDEX idx_appointments_care_recipient ON public.appointments(care_recipient_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_documents_care_recipient ON public.documents(care_recipient_id);
CREATE INDEX idx_documents_category ON public.documents(category);

-- =====================================================================
-- STEP 5: 创建触发器函数
-- =====================================================================

-- Function 1: 自动同步 auth.users 到 public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- 安全解析role字段，支持 'user', 'caregiver', 'patient'
  BEGIN
    user_role_value := (NEW.raw_user_meta_data->>'role')::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'caregiver'; -- 默认为caregiver
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

-- Function 3: Patient注册时自动创建care_recipient
CREATE OR REPLACE FUNCTION create_care_recipient_for_patient()
RETURNS TRIGGER AS $$
DECLARE
  caregiver_user_id UUID;
  first_name_part TEXT;
  last_name_part TEXT;
BEGIN
  -- 仅处理patient角色且有pending_caregiver_email
  IF NEW.role = 'patient' AND NEW.pending_caregiver_email IS NOT NULL THEN
    
    -- 查找caregiver
    SELECT id INTO caregiver_user_id
    FROM public.users
    WHERE email = NEW.pending_caregiver_email
      AND role = 'caregiver';
    
    -- 如果找到caregiver，创建care_recipient
    IF caregiver_user_id IS NOT NULL THEN
      
      -- 解析姓名
      first_name_part := COALESCE(SPLIT_PART(NEW.full_name, ' ', 1), 'Unknown');
      last_name_part := COALESCE(NULLIF(SPLIT_PART(NEW.full_name, ' ', 2), ''), '');
      
      -- 插入care_recipient
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
        CURRENT_DATE, -- 默认生日
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

-- =====================================================================
-- STEP 6: 创建触发器
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
-- STEP 7: 配置 Row Level Security (RLS)
-- =====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Users表RLS
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Care Recipients表RLS
CREATE POLICY "Caregivers can view their care recipients"
  ON public.care_recipients FOR SELECT
  USING (caregiver_id = auth.uid());

CREATE POLICY "Patients can view their own records"
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

-- Medical Records表RLS
CREATE POLICY "Caregivers can manage medical records"
  ON public.medical_records FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their medical records"
  ON public.medical_records FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Appointments表RLS
CREATE POLICY "Caregivers can manage appointments"
  ON public.appointments FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their appointments"
  ON public.appointments FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Documents表RLS
CREATE POLICY "Caregivers can manage documents"
  ON public.documents FOR ALL
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients WHERE caregiver_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their documents"
  ON public.documents FOR SELECT
  USING (
    care_recipient_id IN (
      SELECT id FROM public.care_recipients
      WHERE patient_email IN (
        SELECT email FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- =====================================================================
-- STEP 8: 授予权限
-- =====================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================================
-- 完成
-- =====================================================================
--
-- ✅ 数据库重建完成! 完全匹配当前 App schema
--
-- 表结构:
-- - users (扩展auth.users, 支持 'user', 'caregiver', 'patient' 三种角色)
-- - care_recipients (患者档案)
-- - medical_records (病历/药物/日志, 通过type字段区分)
-- - appointments (预约)
-- - documents (文档)
-- - user_relationships (用户关系, 可选)
-- - emergency_contacts (紧急联系人)
--
-- 触发器:
-- - 自动同步 auth.users → public.users
-- - Patient 注册时自动创建 care_recipient 关联
--
-- 下一步:
-- 1. 在 Supabase SQL Editor 执行此脚本
-- 2. 测试 Caregiver 注册
-- 3. 测试 Patient 注册与关联
--
-- =====================================================================
