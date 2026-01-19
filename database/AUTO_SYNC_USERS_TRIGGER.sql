-- ==========================================
-- 注册后立即执行:自动同步 auth.users 到 public.users
-- ==========================================

-- 创建触发器函数:当 auth.users 插入新用户时,自动在 public.users 创建记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, created_at, updated_at)
  VALUES (NEW.id, 'caregiver', NEW.created_at, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器:监听 auth.users 的 INSERT 事件
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 立即修复:将现有 auth.users 同步到 public.users
-- ==========================================

INSERT INTO public.users (id, role, created_at, updated_at)
SELECT 
  id,
  'caregiver' as role,
  created_at,
  now() as updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 验证查询
-- ==========================================

-- 查看所有用户状态
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  u.role,
  u.created_at as user_created_at,
  CASE 
    WHEN u.id IS NULL THEN ' lack users 记录'
    WHEN u.role = 'patient' THEN '🏥 Patient'
    WHEN u.role = 'caregiver' THEN '👨‍⚕️ Caregiver'
    ELSE 'Correct'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;
