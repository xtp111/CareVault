-- ==========================================
-- 修复现有 Supabase Auth 用户
-- 将已注册的邮箱重新添加到 users 表并设置角色
-- ==========================================

-- ==========================================
-- STEP 1: 将所有现有 auth.users 添加到 public.users 表
-- ==========================================

-- 1.1 添加所有 auth 用户到 users 表(默认 caregiver 角色)
INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
  id,
  'caregiver' as role,  -- 默认设置为 caregiver
  created_at,
  now() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STEP 2: 设置 Patient 角色并建立关联(根据你的需求选择一种方式)
-- ==========================================

-- 方式 A: 手动指定某个邮箱为 Patient,并创建对应的 care_recipient 记录
-- 使用场景: 你知道哪些用户应该是 Patient

-- 示例 1: 将特定邮箱设为 patient 角色
-- UPDATE public.users 
-- SET role = 'patient' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'patient@example.com');

-- 示例 2: 为该 Patient 创建 care_recipient 记录(由某个 Caregiver 管理)
-- 请替换以下值:
--   - 'patient@example.com': 患者邮箱
--   - 'caregiver@example.com': 照护者邮箱
--   - '张', '三': 患者姓名
--   - '1990-01-01': 出生日期

/*
INSERT INTO care_recipients (
  caregiver_id,
  user_id,
  first_name,
  last_name,
  date_of_birth,
  is_active
)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'caregiver@example.com'),  -- Caregiver 邮箱
  (SELECT id FROM auth.users WHERE email = 'patient@example.com'),    -- Patient 邮箱
  '张',                    -- 名
  '三',                    -- 姓
  '1990-01-01',           -- 出生日期
  true
);
*/

-- 方式 B: 将已有的 care_recipient 记录关联到现有 Patient 用户
-- 使用场景: care_recipient 记录已存在,但 user_id 为空,需要关联到某个邮箱

-- 示例: 将某个 care_recipient 关联到 patient 邮箱
-- UPDATE care_recipients
-- SET user_id = (SELECT id FROM auth.users WHERE email = 'patient@example.com')
-- WHERE first_name = '张' AND last_name = '三';  -- 用姓名定位 care_recipient

-- ==========================================
-- STEP 3: 查看所有用户状态(诊断用)
-- ==========================================

-- 查看所有 auth 用户及其在 public.users 中的角色
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  u.role,
  u.created_at as user_created_at,
  CASE 
    WHEN u.id IS NULL THEN '❌ 未在 users 表'
    WHEN u.role = 'patient' THEN '🏥 Patient'
    WHEN u.role = 'caregiver' THEN '👨‍⚕️ Caregiver'
    ELSE '❓ 其他'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- 查看 Patient 用户的关联状态
SELECT 
  u.id as user_id,
  au.email as patient_email,
  u.role,
  cr.id as care_recipient_id,
  cr.first_name,
  cr.last_name,
  caregiver_email.email as caregiver_email,
  CASE 
    WHEN cr.id IS NULL THEN '❌ 无关联的 care_recipient 记录'
    ELSE '✅ 已关联'
  END as link_status
FROM public.users u
JOIN auth.users au ON u.id = au.id
LEFT JOIN care_recipients cr ON cr.user_id = u.id
LEFT JOIN auth.users caregiver_email ON cr.caregiver_id = caregiver_email.id
WHERE u.role = 'patient'
ORDER BY u.created_at DESC;
