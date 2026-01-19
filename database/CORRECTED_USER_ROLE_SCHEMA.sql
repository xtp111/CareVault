-- =====================================================================
-- CareVault Corrected Schema - Single User Table with Role-Based Access
-- =====================================================================
-- 正确的数据库设计：统一用户表，基于角色的权限控制
-- =====================================================================

-- =====================================================================
-- STEP 1: 清理现有结构
-- =====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_care_recipient_on_patient_registration ON public.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS sync_user_email() CASCADE;
DROP FUNCTION IF EXISTS create_care_recipient_for_patient() CASCADE;

DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.care_recipients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS medication_frequency CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;

-- =====================================================================
-- STEP 2: 创建基础类型
-- =====================================================================
CREATE TYPE user_role AS ENUM ('caregiver', 'patient');

-- =====================================================================
-- STEP 3: 创建统一用户表
-- =====================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'User Name',
  phone TEXT,
  role user_role NOT NULL DEFAULT 'caregiver',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- STEP 4: 创建用户关联关系表 (Caregiver-Patient关系)
-- =====================================================================
CREATE TABLE public.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caregiver_id, patient_id) -- 防止重复关系
);

-- =====================================================================
-- STEP 5: 创建医疗相关表 (使用user_id而非care_recipient_id)
-- =====================================================================
CREATE TYPE medication_frequency AS ENUM ('daily', 'weekly', 'monthly', 'as_needed');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- 医疗记录表 (属于特定用户)
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('condition', 'medication', 'allergy', 'vital_signs')),
  name TEXT NOT NULL,
  details TEXT,
  date_recorded DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 预约表 (属于特定用户)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

-- 文档表 (属于特定用户)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medical', 'insurance', 'legal', 'personal')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  upload_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- STEP 6: 创建索引优化查询性能
-- =====================================================================
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_user_relationships_caregiver ON public.user_relationships(caregiver_id);
CREATE INDEX idx_user_relationships_patient ON public.user_relationships(patient_id);
CREATE INDEX idx_user_relationships_status ON public.user_relationships(status);
CREATE INDEX idx_medical_records_user ON public.medical_records(user_id);
CREATE INDEX idx_appointments_user ON public.appointments(user_id);
CREATE INDEX idx_documents_user ON public.documents(user_id);

-- =====================================================================
-- STEP 7: 创建触发器函数
-- =====================================================================

-- 自动同步auth.users到public.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role := 'caregiver';
  user_full_name TEXT;
BEGIN
  -- 安全解析角色
  BEGIN
    IF NEW.raw_user_meta_data ? 'role' THEN
      user_role_value := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      user_role_value := 'caregiver'; -- 默认值
  END;
  
  -- 获取或设置全名
  user_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User Name');
  
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (NEW.id, NEW.email, user_full_name, NEW.raw_user_meta_data->>'phone', user_role_value);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- STEP 8: 创建触发器
-- =====================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================================
-- STEP 9: 配置 Row Level Security (RLS)
-- =====================================================================

-- 启用RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 用户表RLS策略
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 关系表RLS策略
CREATE POLICY "Caregivers can manage patient relationships"
  ON public.user_relationships FOR ALL
  USING (
    caregiver_id = auth.uid() 
    OR patient_id = auth.uid()
  );

CREATE POLICY "Users can view their own medical records"
  ON public.medical_records FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Caregivers can view patient medical records"
  ON public.medical_records FOR SELECT
  USING (
    user_id IN (
      SELECT patient_id 
      FROM public.user_relationships 
      WHERE caregiver_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Caregivers can manage patient appointments"
  ON public.appointments FOR ALL
  USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT patient_id 
      FROM public.user_relationships 
      WHERE caregiver_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage own documents"
  ON public.documents FOR ALL
  USING (
    user_id = auth.uid() 
    OR user_id IN (
      SELECT patient_id 
      FROM public.user_relationships 
      WHERE caregiver_id = auth.uid() AND status = 'active'
    )
  );

-- =====================================================================
-- STEP 10: 授予必要权限
-- =====================================================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================================
-- 完成
-- =====================================================================
-- 新架构特点:
-- 1. 单一用户表，角色区分 (caregiver/patient)
-- 2. 关系表管理用户间关联
-- 3. 医疗数据直接关联到用户
-- 4. 基于角色的权限控制
-- =====================================================================