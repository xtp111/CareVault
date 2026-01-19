# CareVault 注册流程测试用例

## 前提条件
1. 已在Supabase Dashboard执行 `COMPLETE_REBUILD_WITH_REGISTRATION_FLOW.sql`
2. 数据库已完全清空并重建
3. 应用已部署到Vercel或本地运行

---

## 测试场景 1: Caregiver 正常注册

### 步骤:
1. 访问登录页面 `/login`
2. 点击"没有账号? 注册"
3. 选择角色: **护理人 (完整权限)**
4. 填写表单:
   - 邮箱: `caregiver1@test.com`
   - 密码: `Test123456`
   - 完整姓名: `张三`
   - 电话号码: `13800138000` (可选)
5. 点击"注册"

### 预期结果:
- ✅ 注册成功,自动跳转到 `/dashboard`
- ✅ Supabase `auth.users` 表创建新用户
- ✅ `public.users` 表同步创建记录:
  ```sql
  SELECT * FROM public.users WHERE email = 'caregiver1@test.com';
  -- 预期: role = 'caregiver', full_name = '张三', phone = '13800138000'
  ```
- ✅ Dashboard显示 Caregiver 视图 (显示患者列表界面)

---

## 测试场景 2: Caregiver 注册 - 缺少必填字段

### 步骤:
1. 访问登录页面 `/login`
2. 点击"没有账号? 注册"
3. 选择角色: **护理人 (完整权限)**
4. 填写表单:
   - 邮箱: `caregiver2@test.com`
   - 密码: `Test123456`
   - 完整姓名: *(留空)*
5. 点击"注册"

### 预期结果:
- ❌ 显示错误信息: `请填写完整姓名`
- ❌ 不创建任何用户记录

---

## 测试场景 3: Patient 注册 - Caregiver 不存在

### 步骤:
1. 访问登录页面 `/login`
2. 点击"没有账号? 注册"
3. 选择角色: **患者 (仅查看)**
4. 填写表单:
   - 邮箱: `patient1@test.com`
   - 密码: `Test123456`
   - 完整姓名: `李四`
   - 护理人邮箱: `nonexistent@test.com`
   - 护理人姓名: `不存在的护理人`
5. 点击"注册"

### 预期结果:
- ❌ 显示错误信息: `该护理人邮箱未注册,请先让护理人注册账号`
- ❌ 不创建任何用户记录

---

## 测试场景 4: Patient 正常注册并自动关联 Caregiver

### 前提:
- 已完成**测试场景 1** (caregiver1@test.com 已注册)

### 步骤:
1. 访问登录页面 `/login`
2. 点击"没有账号? 注册"
3. 选择角色: **患者 (仅查看)**
4. 填写表单:
   - 邮箱: `patient1@test.com`
   - 密码: `Test123456`
   - 完整姓名: `李四`
   - 护理人邮箱: `caregiver1@test.com`
   - 护理人姓名: `张三`
5. 点击"注册"

### 预期结果:
- ✅ 注册成功,自动跳转到 `/dashboard`
- ✅ `auth.users` 表创建新用户
- ✅ `public.users` 表同步创建记录:
  ```sql
  SELECT * FROM public.users WHERE email = 'patient1@test.com';
  -- 预期: role = 'patient', full_name = '李四'
  -- pending_caregiver_email = NULL (已清除)
  -- pending_caregiver_name = NULL (已清除)
  ```
- ✅ `care_recipients` 表自动创建关联记录:
  ```sql
  SELECT * FROM public.care_recipients 
  WHERE patient_email = 'patient1@test.com';
  -- 预期: 
  -- caregiver_id = (caregiver1@test.com 的 user.id)
  -- patient_email = 'patient1@test.com'
  -- first_name = '李' (从 full_name 分割)
  -- last_name = '四' (从 full_name 分割)
  -- is_active = true
  ```
- ✅ Dashboard显示 Patient 视图 (只读权限,显示自己的信息)

---

## 测试场景 5: Caregiver 登录并查看关联的 Patient

### 前提:
- 已完成**测试场景 1** 和 **测试场景 4**

### 步骤:
1. 退出当前登录 (如果已登录)
2. 访问 `/login`
3. 使用 Caregiver 账号登录:
   - 邮箱: `caregiver1@test.com`
   - 密码: `Test123456`
4. 点击"登录"

### 预期结果:
- ✅ 登录成功,跳转到 `/dashboard`
- ✅ Dashboard显示患者列表
- ✅ 列表中包含自动关联的患者:
  - 姓名: `李四`
  - 邮箱: `patient1@test.com`
  - 状态: 激活

---

## 测试场景 6: Patient 登录并查看自己的信息

### 前提:
- 已完成**测试场景 4**

### 步骤:
1. 退出当前登录
2. 访问 `/login`
3. 使用 Patient 账号登录:
   - 邮箱: `patient1@test.com`
   - 密码: `Test123456`
4. 点击"登录"

### 预期结果:
- ✅ 登录成功,跳转到 `/dashboard`
- ✅ Dashboard显示 Patient Portal 视图
- ✅ 显示自己的医疗信息 (只读)
- ✅ **无法**添加或编辑患者信息

---

## 测试场景 7: Patient 注册 - 缺少 Caregiver 信息

### 步骤:
1. 访问登录页面 `/login`
2. 点击"没有账号? 注册"
3. 选择角色: **患者 (仅查看)**
4. 填写表单:
   - 邮箱: `patient2@test.com`
   - 密码: `Test123456`
   - 完整姓名: `王五`
   - 护理人邮箱: *(留空)*
   - 护理人姓名: *(留空)*
5. 点击"注册"

### 预期结果:
- ❌ 显示错误信息: `请填写护理人邮箱`
- ❌ 不创建任何用户记录

---

## 测试场景 8: 重复邮箱注册

### 前提:
- 已完成**测试场景 1** (caregiver1@test.com 已注册)

### 步骤:
1. 访问登录页面 `/login`
2. 点击"没有账号? 注册"
3. 选择角色: **护理人 (完整权限)**
4. 填写表单:
   - 邮箱: `caregiver1@test.com` (已存在)
   - 密码: `NewPassword123`
   - 完整姓名: `重复用户`
5. 点击"注册"

### 预期结果:
- ❌ Supabase 返回错误: `User already registered`
- ❌ 不创建新用户记录

---

## 测试场景 9: 触发器验证 - 检查 Email 同步

### 步骤:
1. 完成任意用户注册
2. 在 Supabase SQL Editor 执行:
   ```sql
   -- 检查 auth.users 和 public.users email 一致性
   SELECT 
     au.email AS auth_email,
     pu.email AS public_email,
     au.email = pu.email AS emails_match
   FROM auth.users au
   JOIN public.users pu ON au.id = pu.id;
   ```

### 预期结果:
- ✅ 所有记录的 `emails_match` = `true`

---

## 测试场景 10: 触发器验证 - Care Recipient 自动创建

### 前提:
- 已完成**测试场景 4** (patient1 已注册并关联 caregiver1)

### 步骤:
在 Supabase SQL Editor 执行:
```sql
-- 验证 care_recipient 自动创建
SELECT 
  cr.id,
  cr.caregiver_id,
  cr.patient_email,
  cr.first_name,
  cr.last_name,
  u.full_name AS caregiver_full_name
FROM public.care_recipients cr
JOIN public.users u ON cr.caregiver_id = u.id
WHERE cr.patient_email = 'patient1@test.com';
```

### 预期结果:
- ✅ 返回 1 条记录
- ✅ `caregiver_id` 对应 caregiver1@test.com 的用户ID
- ✅ `patient_email` = `patient1@test.com`
- ✅ `first_name` + `last_name` = Patient 的完整姓名
- ✅ `caregiver_full_name` = `张三`

---

## 测试场景 11: RLS 策略验证 - Caregiver 数据隔离

### 前提:
- 注册第二个 Caregiver: `caregiver2@test.com`
- 注册 Patient 关联到 caregiver2: `patient2@test.com`

### 步骤:
1. 使用 `caregiver1@test.com` 登录
2. 访问 Dashboard
3. 查看患者列表

### 预期结果:
- ✅ 仅显示关联到 caregiver1 的患者 (`patient1@test.com`)
- ✅ **不显示** 关联到 caregiver2 的患者 (`patient2@test.com`)

---

## 测试场景 12: RLS 策略验证 - Patient 只能查看自己

### 前提:
- caregiver1 有两个患者: patient1 和 patient3

### 步骤:
1. 使用 `patient1@test.com` 登录
2. 访问 Dashboard

### 预期结果:
- ✅ 仅显示自己的医疗信息 (patient1)
- ✅ **不显示** patient3 的信息
- ✅ 无法访问编辑功能

---

## 数据库验证 SQL 查询

### 查询 1: 检查所有用户及角色
```sql
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  pending_caregiver_email,
  pending_caregiver_name,
  created_at
FROM public.users
ORDER BY created_at DESC;
```

### 查询 2: 检查所有 Care Recipient 关联
```sql
SELECT 
  cr.id,
  c.email AS caregiver_email,
  c.full_name AS caregiver_name,
  cr.patient_email,
  cr.first_name || ' ' || cr.last_name AS patient_name,
  cr.is_active,
  cr.created_at
FROM public.care_recipients cr
JOIN public.users c ON cr.caregiver_id = c.id
ORDER BY cr.created_at DESC;
```

### 查询 3: 验证触发器是否正确清除 pending 字段
```sql
SELECT 
  email,
  role,
  pending_caregiver_email,
  pending_caregiver_name
FROM public.users
WHERE role = 'patient';
-- 预期: 所有 patient 的 pending_* 字段应为 NULL
```

### 查询 4: 检查孤立的 Patient (未关联的)
```sql
SELECT 
  u.email,
  u.full_name,
  u.role
FROM public.users u
LEFT JOIN public.care_recipients cr ON u.email = cr.patient_email
WHERE u.role = 'patient' AND cr.id IS NULL;
-- 预期: 空结果 (所有 patient 应该都已自动关联)
```

---

## 回归测试检查清单

执行完所有测试后,验证:

- [ ] 所有 Caregiver 注册成功且能登录
- [ ] 所有 Patient 注册成功且能登录
- [ ] Patient 自动关联到正确的 Caregiver
- [ ] Caregiver 仅能查看自己的患者
- [ ] Patient 仅能查看自己的信息
- [ ] 触发器正确同步 email
- [ ] 触发器正确创建 care_recipient
- [ ] 触发器正确清除 pending 字段
- [ ] RLS 策略正确隔离数据
- [ ] 表单验证正确阻止无效输入
- [ ] 无 TypeScript 编译错误
- [ ] 无 Console 运行时错误

---

## 测试完成后清理

如需重新测试,执行:
```sql
-- 在 Supabase SQL Editor 执行完整重建脚本
-- 文件: COMPLETE_REBUILD_WITH_REGISTRATION_FLOW.sql
```

---

## 已知限制

1. **姓名分割逻辑**:
   - 当前使用空格分割 `full_name` 为 `first_name` 和 `last_name`
   - 对于中文姓名 (如"张三"),可能需要调整分割逻辑
   - 建议: 在注册表单中分别收集姓和名

2. **生日默认值**:
   - 触发器使用 `CURRENT_DATE` 作为默认生日
   - Patient 注册后需要在 Dashboard 更新真实生日

3. **Patient 多 Caregiver 支持**:
   - 当前架构支持一个 Patient 关联多个 Caregiver
   - 但注册流程仅支持关联一个 Caregiver
   - 额外 Caregiver 需要通过 Dashboard 手动添加
