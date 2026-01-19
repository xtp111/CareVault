-- ==========================================
-- CareVault 终极完整重建 Schema
-- 彻底删除一切 + 从零重建 + 自动同步触发器
-- 版本: FINAL
-- 日期: 2026-01-19
-- ==========================================
-- 
-- ⚠️  警告: 此脚本将删除一切数据!
-- - 所有 auth.users (登录用户)
-- - 所有 public 表数据
-- - 所有 Storage 文件
-- 
-- ✅ 执行后自动配置:
-- - 用户注册时自动同步到 public.users
-- - 默认角色: caregiver
-- ==========================================

-- ==========================================
-- PART 1: 彻底清理 - 删除一切
-- ==========================================

-- 1.1 删除所有 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON users CASCADE;
DROP POLICY IF EXISTS "Caregivers can view own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Caregivers can insert own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Caregivers can update own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Caregivers can delete own patients" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Patients can view own profile" ON care_recipients CASCADE;
DROP POLICY IF EXISTS "Users can manage related medical records" ON medical_records CASCADE;
DROP POLICY IF EXISTS "Users can manage related appointments" ON appointments CASCADE;
DROP POLICY IF EXISTS "Users can manage related documents" ON documents CASCADE;
DROP POLICY IF EXISTS "Users can manage related emergency contacts" ON emergency_contacts CASCADE;

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can view" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects CASCADE;

-- 1.2 删除触发器(包括之前可能创建的同步触发器)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_care_recipients_updated_at ON care_recipients CASCADE;
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records CASCADE;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments CASCADE;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents CASCADE;
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON emergency_contacts CASCADE;

-- 1.3 删除函数
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_appointments(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS generate_emergency_summary(uuid) CASCADE;

-- 1.4 删除视图
DROP VIEW IF EXISTS patient_overview CASCADE;

-- 1.5 删除所有表
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS care_recipients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1.6 删除 Storage Bucket 中的所有文件
DELETE FROM storage.objects WHERE bucket_id = 'medical-documents';
DELETE FROM storage.buckets WHERE id = 'medical-documents';

-- 1.7 删除所有 Auth 用户 (所有登录账户)
DELETE FROM auth.users;

-- ==========================================
-- PART 2: 启用扩展
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- PART 3: 创建表结构
-- ==========================================

-- 3.1 用户表
CREATE TABLE users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'caregiver' CHECK (role IN ('caregiver', 'patient', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS '用户基本信息表';
COMMENT ON COLUMN users.role IS 'caregiver: 照护者, patient: 患者, admin: 管理员';

-- 3.2 受照护人表
CREATE TABLE care_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  caregiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  relationship text,
  photo_url text,
  notes text,
  diagnosis text,
  medications text,
  allergies text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE care_recipients IS '受照护人信息表';
COMMENT ON COLUMN care_recipients.caregiver_id IS '照护者ID(创建此记录的 Caregiver)';
COMMENT ON COLUMN care_recipients.user_id IS 'Patient用户ID(如果受照护人有登录账户)';

-- 3.3 医疗记录表
CREATE TABLE medical_records (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('medications', 'conditions')),
  name text NOT NULL,
  details text,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.4 预约表
CREATE TABLE appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  appointment_date timestamptz NOT NULL,
  remind_before_minutes integer DEFAULT 30,
  repeat_interval text DEFAULT 'none' CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
  is_completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.5 文档表
CREATE TABLE documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid NOT NULL REFERENCES care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('legal', 'medical', 'financial', 'identification')),
  file_url text,
  file_name text,
  file_size bigint,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.6 紧急联系人表
CREATE TABLE emergency_contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  care_recipient_id uuid REFERENCES care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  phone text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- PART 4: 创建索引
-- ==========================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_care_recipients_caregiver ON care_recipients(caregiver_id);
CREATE INDEX idx_care_recipients_user ON care_recipients(user_id);
CREATE INDEX idx_care_recipients_active ON care_recipients(is_active);
CREATE INDEX idx_medical_records_recipient ON medical_records(care_recipient_id);
CREATE INDEX idx_medical_records_type ON medical_records(type);
CREATE INDEX idx_medical_records_date ON medical_records(date DESC);
CREATE INDEX idx_appointments_recipient ON appointments(care_recipient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_completed ON appointments(is_completed);
CREATE INDEX idx_documents_recipient ON documents(care_recipient_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_date ON documents(date DESC);
CREATE INDEX idx_emergency_contacts_recipient ON emergency_contacts(care_recipient_id);
CREATE INDEX idx_emergency_contacts_primary ON emergency_contacts(is_primary);

-- ==========================================
-- PART 5: 创建触发器
-- ==========================================

-- 5.1 updated_at 自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 为所有表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_recipients_updated_at 
  BEFORE UPDATE ON care_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at 
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_contacts_updated_at 
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5.3 ⭐ 核心: 自动同步 auth.users 到 public.users 触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (NEW.id, 'caregiver', NEW.created_at, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- PART 6: 配置 Storage
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- PART 7: 配置 RLS 策略
-- ==========================================

-- 7.1 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 7.2 users 表策略
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 7.3 care_recipients 表策略
CREATE POLICY "Caregivers can view own patients"
  ON care_recipients FOR SELECT
  TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can insert own patients"
  ON care_recipients FOR INSERT
  TO authenticated
  WITH CHECK (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can update own patients"
  ON care_recipients FOR UPDATE
  TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Caregivers can delete own patients"
  ON care_recipients FOR DELETE
  TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Patients can view own profile"
  ON care_recipients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 7.4 medical_records 表策略
CREATE POLICY "Users can manage related medical records"
  ON medical_records FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid() OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid()
    )
  );

-- 7.5 appointments 表策略
CREATE POLICY "Users can manage related appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid() OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid()
    )
  );

-- 7.6 documents 表策略
CREATE POLICY "Users can manage related documents"
  ON documents FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid() OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid()
    )
  );

-- 7.7 emergency_contacts 表策略
CREATE POLICY "Users can manage related emergency contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid() OR user_id = auth.uid()
    )
  )
  WITH CHECK (
    care_recipient_id IN (
      SELECT id FROM care_recipients 
      WHERE caregiver_id = auth.uid()
    )
  );

-- 7.8 Storage 策略
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can view"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'medical-documents');

CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'medical-documents');

-- ==========================================
-- PART 8: 创建辅助函数和视图
-- ==========================================

-- 8.1 获取即将到来的预约
CREATE OR REPLACE FUNCTION get_upcoming_appointments(
  patient_id uuid,
  days_ahead integer DEFAULT 7
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  appointment_date timestamptz,
  remind_before_minutes integer,
  days_until integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.appointment_date,
    a.remind_before_minutes,
    EXTRACT(DAY FROM (a.appointment_date - now()))::integer as days_until
  FROM appointments a
  WHERE a.care_recipient_id = patient_id
    AND a.is_completed = false
    AND a.appointment_date BETWEEN now() AND (now() + make_interval(days => days_ahead))
  ORDER BY a.appointment_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.2 生成紧急情况摘要
CREATE OR REPLACE FUNCTION generate_emergency_summary(patient_id uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'patient', (
      SELECT json_build_object(
        'name', first_name || ' ' || last_name,
        'date_of_birth', date_of_birth,
        'diagnosis', diagnosis,
        'medications', medications,
        'allergies', allergies
      )
      FROM care_recipients
      WHERE id = patient_id
    ),
    'emergency_contacts', (
      SELECT json_agg(
        json_build_object(
          'name', name,
          'relationship', relationship,
          'phone', phone,
          'is_primary', is_primary
        )
        ORDER BY is_primary DESC, name
      )
      FROM emergency_contacts
      WHERE care_recipient_id = patient_id
    ),
    'recent_appointments', (
      SELECT json_agg(
        json_build_object(
          'title', title,
          'date', appointment_date,
          'description', description
        )
        ORDER BY appointment_date DESC
      )
      FROM appointments
      WHERE care_recipient_id = patient_id
        AND appointment_date >= (now() - interval '30 days')
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.3 患者概览视图
CREATE OR REPLACE VIEW patient_overview AS
SELECT 
  cr.id,
  cr.first_name,
  cr.last_name,
  cr.date_of_birth,
  cr.caregiver_id,
  cr.user_id,
  u.full_name as caregiver_name,
  COUNT(DISTINCT mr.id) as medical_records_count,
  COUNT(DISTINCT a.id) as appointments_count,
  COUNT(DISTINCT d.id) as documents_count,
  COUNT(DISTINCT ec.id) as emergency_contacts_count,
  cr.created_at,
  cr.updated_at
FROM care_recipients cr
LEFT JOIN users u ON cr.caregiver_id = u.id
LEFT JOIN medical_records mr ON cr.id = mr.care_recipient_id
LEFT JOIN appointments a ON cr.id = a.care_recipient_id
LEFT JOIN documents d ON cr.id = d.care_recipient_id
LEFT JOIN emergency_contacts ec ON cr.id = ec.care_recipient_id
WHERE cr.is_active = true
GROUP BY cr.id, u.full_name;

-- ==========================================
-- ✅ 完成!数据库重建成功
-- ==========================================

-- 验证: 查看所有表
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = tables.table_name) as column_count
FROM information_schema.tables tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 提示信息
SELECT '✅ 数据库重建完成! 所有用户需要重新注册。注册后会自动同步到 public.users 表,默认角色为 caregiver。' as message;
