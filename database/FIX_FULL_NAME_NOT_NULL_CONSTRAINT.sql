-- =====================================================================
-- CareVault Database Fix - Full Name NOT NULL Constraint
-- =====================================================================
-- 此脚本修复full_name字段的NOT NULL约束问题
-- =====================================================================

-- 1. 修复users表中的full_name字段，确保非空
ALTER TABLE public.users 
ALTER COLUMN full_name SET NOT NULL;

-- 2. 更新所有现有的空full_name值为默认值
UPDATE public.users 
SET full_name = 'User Name'
WHERE full_name IS NULL OR TRIM(full_name) = '';

-- 3. 验证更新结果
DO $$
BEGIN
  RAISE NOTICE '=== Full Name Validation Results ===';
  RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE 'Users with non-empty full_name: %', (SELECT COUNT(*) FROM public.users WHERE full_name IS NOT NULL AND TRIM(full_name) != '');
  RAISE NOTICE 'Users with empty full_name: %', (SELECT COUNT(*) FROM public.users WHERE full_name IS NULL OR TRIM(full_name) = '');
  RAISE NOTICE '====================================';
END $$;

-- 4. 如果需要，更新触发器函数以确保始终有值
CREATE OR REPLACE FUNCTION handle_new_user_with_full_name()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role, pending_caregiver_email, pending_caregiver_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User Name'), -- Default to 'User Name' if null or empty
    NEW.raw_user_meta_data->>'phone',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'caregiver'),
    NEW.raw_user_meta_data->>'pending_caregiver_email',
    NEW.raw_user_meta_data->>'pending_caregiver_name'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth.users insert
    RAISE WARNING 'Error in handle_new_user_with_full_name: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建一个检查约束作为额外保护
ALTER TABLE public.users 
ADD CONSTRAINT full_name_not_empty CHECK (TRIM(full_name) != '');

-- 6. 完成
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✓ Full Name NOT NULL Constraint Applied!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Now all users will have a non-null, non-empty full_name';
  RAISE NOTICE '====================================';
END $$;