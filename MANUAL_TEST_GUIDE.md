# CareVault 注册流程手动测试指南

## 测试前提条件

### 1. Supabase 配置

**当前问题**：`.env.local` 文件中的 Supabase 凭据未配置，导致应用无法启动。

**解决方法**：

1. 打开 `.env.local` 文件
2. 将占位符替换为真实的 Supabase 凭据：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. 从 [Supabase Dashboard](https://app.supabase.com) → Project Settings → API 获取这些值

### 2. 数据库初始化

确保已在 Supabase SQL Editor 中执行以下脚本：

```bash
database/COMPLETE_REBUILD_WITH_REGISTRATION_FLOW.sql
```

或使用最新的：

```bash
database/CAREVAULT_COMPLETE_REBUILD_V3_CLEAN_SLATE.sql
```

### 3. 启动开发服务器

```bash
npm run dev -- --port 3004
```

确认服务器成功启动在 `http://localhost:3004`

---

## 测试 1: Caregiver 注册流程

### 步骤

1. **访问登录页面**
   - 导航至 `http://localhost:3004/login`
   - 截图：初始登录页面

2. **切换到注册模式**
   - 点击页面底部的 "Don't have an account? Register" 按钮
   - 验证：按钮文字变为 "Sign Up"

3. **选择 Caregiver 角色**
   - 确认 "Caregiver (Full Access)" 单选框已选中（默认应该选中）

4. **填写 Caregiver 注册表单**
   - **Email**: `test-caregiver-001@example.com`
   - **Password**: `Password123!`
   - **Full Name**: `John Caregiver`
   - **Phone Number**: `1234567890` (可选)

5. **提交注册**
   - 点击 "Sign Up" 按钮
   - 等待 3-5 秒处理时间

6. **验证结果**
   - 截图：注册后的页面状态
   - 打开浏览器开发者工具（F12）→ Console 标签
   - 检查是否有错误信息

### 预期结果

✅ **成功场景**:
- 重定向到 `/` (主页/仪表盘)
- URL 变为 `http://localhost:3004/` 或 `http://localhost:3004/dashboard`
- 页面显示 Caregiver Portal 或 Dashboard
- Console 无错误信息
- 用户已登录状态

❌ **失败场景**:
- 页面停留在 `/login`
- 显示错误消息（例如：Email already registered）
- Console 显示红色错误信息
- 页面白屏或崩溃

### 需要截图的位置

1. `01-login-page-initial.png` - 初始登录页面
2. `02-caregiver-registration-form.png` - 填写完成的注册表单
3. `03-caregiver-registration-result.png` - 点击 Sign Up 后 3 秒
4. `04-caregiver-dashboard.png` - 最终的仪表盘页面

---

## 测试 2: Patient 注册流程

### 前提条件

⚠️ **重要**：必须先完成 Test 1（Caregiver 注册），因为 Patient 注册需要验证 Caregiver 是否存在。

### 步骤

1. **登出（如果仍在登录状态）**
   - 点击右上角的用户菜单 → Logout
   - 或直接访问 `http://localhost:3004/login`

2. **切换到注册模式**
   - 点击 "Don't have an account? Register"

3. **选择 Patient 角色**
   - 点击 "Patient (View Only)" 单选框
   - 验证：额外的 "Caregiver Information" 表单区域出现（蓝色背景）

4. **填写 Patient 注册表单**
   - **Email**: `test-patient-001@example.com`
   - **Password**: `Password123!`
   - **Full Name**: `Jane Patient`
   - **Caregiver Email**: `test-caregiver-001@example.com` (使用 Test 1 中注册的 Caregiver 邮箱)
   - **Caregiver Name**: `John Caregiver`

5. **提交注册**
   - 点击 "Sign Up" 按钮
   - 等待 3-5 秒处理时间

6. **验证结果**
   - 截图：注册后的页面状态
   - 检查 Console 是否有错误

### 预期结果

✅ **成功场景**:
- 重定向到 `/` 或 `/dashboard`
- 页面显示 Patient View 或受限的仪表盘
- 没有 "Add Patient" 按钮（Patient 只读权限）
- Console 无错误信息

❌ **失败场景**:
- 错误消息: "This caregiver email is not registered. Please ask your caregiver to register first."
- Console 显示 Supabase 查询错误
- 页面无响应或崩溃

### 需要截图的位置

5. `05-patient-registration-form.png` - Patient 注册表单（显示 Caregiver 信息区域）
6. `06-patient-registration-result.png` - 点击 Sign Up 后 3 秒
7. `07-patient-dashboard.png` - 最终的 Patient 仪表盘

---

## 测试 3: Console 错误检查

### 如何检查

1. 在注册前打开开发者工具（F12）
2. 切换到 "Console" 标签
3. 清空现有日志（右键 → Clear console）
4. 执行注册流程
5. 记录所有出现的错误信息

### 常见错误及原因

| 错误信息 | 原因 | 解决方法 |
|---------|------|---------|
| `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` | `.env.local` 未配置或配置错误 | 检查环境变量配置 |
| `Failed to fetch` | Supabase 连接失败 | 检查网络连接和 Supabase 项目状态 |
| `duplicate key value violates unique constraint` | Email 已被注册 | 使用不同的邮箱或清理数据库 |
| `This caregiver email is not registered` | Caregiver 不存在 | 先完成 Caregiver 注册 |
| `relation "users" does not exist` | 数据库 schema 未初始化 | 执行数据库初始化脚本 |

---

## 测试 4: 数据库验证

### 验证 Caregiver 注册

在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 查看 auth.users 表（Supabase 认证）
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'test-caregiver-001@example.com';

-- 查看 public.users 表（应用用户数据）
SELECT id, email, role, full_name, phone 
FROM users 
WHERE email = 'test-caregiver-001@example.com';
```

**预期结果**：
- `auth.users` 中有一条记录
- `public.users` 中有一条记录
- `role` 字段为 `'caregiver'`
- `full_name` 为 `'John Caregiver'`

### 验证 Patient 注册

```sql
-- 查看 Patient 用户
SELECT id, email, role, full_name 
FROM users 
WHERE email = 'test-patient-001@example.com';

-- 查看 care_recipients 关联
SELECT cr.*, u.email as patient_email
FROM care_recipients cr
JOIN users u ON u.id = cr.id
WHERE u.email = 'test-patient-001@example.com';
```

**预期结果**：
- `users` 表中有 Patient 记录，`role` 为 `'patient'`
- `care_recipients` 表中有对应记录，`caregiver_id` 指向 Caregiver 的 ID

---

## 自动化测试脚本使用

### 如果 Supabase 已配置

可以尝试使用 Playwright 自动化测试：

```bash
# 确保服务器在 port 3004 运行
npm run dev -- --port 3004

# 在新终端运行测试
npx playwright test --headed --timeout 60000
```

### 测试文件位置

- `tests/registration-flow.spec.ts` - 注册流程自动化测试
- `test-screenshots/` - 截图保存目录
- `test-results/` - Playwright 测试结果

---

## 故障排查

### 问题 1: 页面显示 "Supabase is not configured"

**解决**：
1. 检查 `.env.local` 文件是否存在
2. 确认环境变量格式正确（无额外空格）
3. 重启开发服务器（Ctrl+C 然后 `npm run dev`）

### 问题 2: 注册后没有重定向

**可能原因**：
1. 数据库触发器未执行（`handle_new_user` 函数）
2. RLS 策略阻止了数据写入
3. Session 创建失败

**调试方法**：
```sql
-- 检查触发器是否存在
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 检查函数是否存在
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### 问题 3: Patient 注册失败 "Caregiver not found"

**解决**：
1. 确认 Caregiver 邮箱拼写完全一致
2. 检查 Caregiver 的 `role` 字段是否为 `'caregiver'`
3. 检查 Caregiver 账号是否已激活

---

## 测试报告模板

### Caregiver 注册测试

- [ ] 访问登录页面成功
- [ ] 切换到注册模式成功
- [ ] Caregiver 角色默认选中
- [ ] 表单验证工作正常（必填字段）
- [ ] 提交后成功重定向到仪表盘
- [ ] Console 无错误
- [ ] 数据库中创建了用户记录
- [ ] 截图已保存

**Console 错误**：_（如有，请列出）_

**最终 URL**：_（例如：http://localhost:3004/dashboard）_

**测试结果**：✅ 通过 / ❌ 失败

---

### Patient 注册测试

- [ ] 切换到 Patient 角色成功
- [ ] Caregiver 信息字段显示
- [ ] Caregiver 验证工作正常
- [ ] 提交后成功重定向
- [ ] Patient 仪表盘显示正确（无编辑权限）
- [ ] Console 无错误
- [ ] 数据库中创建了用户和 care_recipient 记录
- [ ] 截图已保存

**Console 错误**：_（如有，请列出）_

**最终 URL**：_（例如：http://localhost:3004/dashboard）_

**测试结果**：✅ 通过 / ❌ 失败

---

## 联系支持

如果测试过程中遇到问题，请提供：

1. 截图（特别是 Console 错误）
2. 浏览器版本
3. Supabase 项目是否已初始化
4. 完整的错误消息
5. `.env.local` 配置状态（不要分享实际的密钥）
