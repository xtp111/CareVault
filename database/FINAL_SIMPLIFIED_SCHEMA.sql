-- =====================================================================
-- CareVault Complete Database Rebuild - Simplified Global Sharing Model
-- =====================================================================
-- 执行此脚本将：
-- 1. 完全删除所有现有数据和表结构
-- 2. 创建简化的全局共享数据模型
-- 3. 配置 Caregiver 全权限，Patient 只读权限
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

-- 删除所有表（级联删除所有依赖）
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.care_recipients CASCADE;
DROP TABLE IF EXISTS public.user_relationships CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 删除所有枚举类型
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS document_category CASCADE;
DROP TYPE IF EXISTS medical_record_type CASCADE;
DROP TYPE IF EXISTS medication_frequency CASCADE;

-- =====================================================================
-- STEP 2: 创建枚举类型
-- =====================================================================

CREATE TYPE user_role AS ENUM ('caregiver', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE document_category AS ENUM ('medical', 'insurance', 'legal', 'personal', 'financial', 'identification');
CREATE TYPE medical_record_type AS ENUM ('medication', 'condition', 'procedure', 'lab_result', 'vital_sign');

-- =====================================================================
-- STEP 3: 创建表结构
-- =====================================================================

-- Users表 - 只有 caregiver 和 patient 两种角色
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'caregiver',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles - caregiver (create content) or patient (view only)';
COMMENT ON COLUMN public.users.role IS 'User role: caregiver has full access, patient has read-only access';

-- Medical Records表 - 由 caregiver 创建，patient 可查看所有
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type medical_record_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  medication_name TEXT,
  medication_dosage TEXT,
  medication_frequency TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medical_records IS 'Medical records created by caregivers, visible to all patients';
COMMENT ON COLUMN public.medical_records.created_by IS 'The caregiver who created this record';
COMMENT ON COLUMN public.medical_records.type IS 'Type: medication, condition, procedure, lab_result, vital_sign';

-- Appointments表 - 由 caregiver 创建，patient 可查看所有
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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

COMMENT ON TABLE public.appointments IS 'Appointments created by caregivers, visible to all patients';

-- Documents表 - 由 caregiver 上传，patient 可查看所有
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category document_category NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS 'Documents uploaded by caregivers, visible to all patients';

-- Emergency Contacts表 - 全局共享
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.emergency_contacts IS 'Emergency contacts created by caregivers, visible to all users';

-- =====================================================================
-- STEP 4: 创建索引优化查询
-- =====================================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_medical_records_created_by ON public.medical_records(created_by);
CREATE INDEX idx_medical_records_type ON public.medical_records(type);
CREATE INDEX idx_medical_records_date ON public.medical_records(date);
CREATE INDEX idx_medical_records_active ON public.medical_records(is_active);
CREATE INDEX idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_documents_created_by ON public.documents(created_by);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_emergency_contacts_created_by ON public.emergency_contacts(created_by);

-- =====================================================================
-- STEP 5: 创建触发器函数
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
      user_role_value := 'caregiver'; -- 默认为caregiver
  END;
  
  -- 插入用户
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    NEW.raw_user_meta_data->>'phone',
    user_role_value
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION handle_new_user() IS 'Auto-syncs new auth.users to public.users with role assignment';

-- Function 2: 同步email更新
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

-- =====================================================================
-- STEP 7: 配置 Row Level Security (RLS)
-- =====================================================================

-- 启用RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Users表RLS策略
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Medical Records表RLS策略
CREATE POLICY "Caregivers can manage all medical records"
  ON public.medical_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'caregiver'
    )
  );

CREATE POLICY "Patients can view all medical records"
  ON public.medical_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

-- Appointments表RLS策略
CREATE POLICY "Caregivers can manage all appointments"
  ON public.appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'caregiver'
    )
  );

CREATE POLICY "Patients can view all appointments"
  ON public.appointments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

-- Documents表RLS策略
CREATE POLICY "Caregivers can manage all documents"
  ON public.documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'caregiver'
    )
  );

CREATE POLICY "Patients can view all documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

-- Emergency Contacts表RLS策略
CREATE POLICY "Caregivers can manage emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'caregiver'
    )
  );

CREATE POLICY "All authenticated users can view emergency contacts"
  ON public.emergency_contacts FOR SELECT
  USING (auth.uid() IS NOT NULL);

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
-- ✅ 简化数据库重建完成!
--
-- 核心设计:
-- - Caregiver: 创建和管理所有内容（医疗记录、预约、文档）
-- - Patient: 只读查看所有 Caregiver 创建的内容
-- - 移除了 care_recipients 一对多关系
-- - 所有内容全局共享，无需关联特定病人
--
-- 表结构:
-- - users (caregiver/patient)
-- - medical_records (药物、病情、检查结果等)
-- - appointments (预约)
-- - documents (文档)
-- - emergency_contacts (紧急联系人)
--
-- RLS 权限:
-- - Caregiver: 增删改查所有表
-- - Patient: 只读所有表
--
-- 下一步:
-- 1. 在 Supabase SQL Editor 中执行此脚本
-- 2. 测试 Caregiver 注册 → 应该能创建内容
-- 3. 测试 Patient 注册 → 应该能查看所有内容（只读）
--
-- =====================================================================
