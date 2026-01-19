# CareVault

一个为慢性病患者和照护者设计的医疗信息管理系统。

## 🎯 项目简介

CareVault 是一个基于 Next.js 和 Supabase 的全栈医疗文档管理应用,帮助照护者高效管理受照护人的医疗信息、用药记录、预约提醒和重要文档。

### 核心功能

- **👥 多用户管理**: 支持照护者(Caregiver)和患者(Patient)双角色
- **🏥 受照护人管理**: 一个照护者可管理多个受照护人
- **💊 用药记录**: 记录和追踪药物信息、剂量、用法
- **📅 预约提醒**: 管理医疗预约,支持重复提醒
- **📄 文档存储**: 上传和管理医疗、法律、财务等重要文档
- **🚨 紧急摘要**: 快速生成包含关键医疗信息的紧急摘要
- **🔒 数据隔离**: 基于 RLS 的严格数据权限控制

## 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **编程语言**: TypeScript
- **样式方案**: Tailwind CSS + shadcn/ui
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Authentication
- **存储**: Supabase Storage
- **部署**: Vercel

## 📁 项目结构

```
caregiver_app_project/
├── app/                      # Next.js 应用目录
│   ├── dashboard/           # 仪表盘页面
│   ├── login/               # 登录页面
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
├── components/              # React 组件
│   ├── ui/                  # shadcn/ui 组件
│   └── EmergencySummary.tsx # 紧急摘要组件
├── contexts/                # React Context
│   └── AuthContext.tsx      # 认证上下文
├── hooks/                   # 自定义 Hooks
│   └── usePermissions.ts    # 权限管理 Hook
├── lib/                     # 工具库
│   ├── supabase.ts         # Supabase 客户端
│   ├── supabase-service.ts # 数据库服务层
│   ├── permissions.ts      # 权限配置
│   └── utils.ts            # 工具函数
├── types/                   # TypeScript 类型定义
│   └── supabase.ts         # 数据库类型
├── database/                # 数据库脚本
│   └── CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql
├── public/                  # 静态资源
└── package.json            # 项目依赖
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Supabase 账号

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd caregiver_app_project
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env.local` 文件:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **初始化数据库**

- 登录 [Supabase Dashboard](https://supabase.com/dashboard)
- 进入 SQL Editor
- 执行 `database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql` 中的所有内容
- 等待执行完成

5. **创建用户并设置角色**

```sql
-- 在 Supabase SQL Editor 中执行
-- 注册用户后,设置为 caregiver 角色
INSERT INTO users (id, role, full_name)
VALUES (
  'your-user-uuid',  -- 从 auth.users 表获取
  'caregiver',
  'Your Name'
)
ON CONFLICT (id) DO UPDATE SET role = 'caregiver';
```

6. **启动开发服务器**

```bash
npm run dev
```

访问 `http://localhost:3000`

## 📊 数据库架构

### 核心表结构

- **users**: 用户基本信息,关联 Supabase Auth
- **care_recipients**: 受照护人信息(核心实体)
- **medical_records**: 医疗记录(药物、病情、医生)
- **appointments**: 预约提醒
- **documents**: 文档管理
- **emergency_contacts**: 紧急联系人

### 数据隔离

- 使用 Row Level Security (RLS) 实现多用户数据隔离
- 每个照护者只能访问自己管理的受照护人数据
- 患者角色为只读权限

## 🔐 用户角色与权限

| 角色 | 权限 |
|------|------|
| **Caregiver** (照护者) | 完整的 CRUD 权限,可管理受照护人、医疗记录、预约、文档 |
| **Patient** (患者) | 只读权限,可查看自己的医疗信息 |
| **Admin** (管理员) | 预留角色,暂未实现 |

## 📝 开发指南

### 可用脚本

```bash
npm run dev      # 启动开发服务器 (localhost:3000)
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行 ESLint 检查
```

### 添加新功能

1. 在 `types/supabase.ts` 中定义 TypeScript 类型
2. 在 `lib/supabase-service.ts` 中添加数据库服务函数
3. 在 `hooks/` 中创建自定义 Hook (如需要)
4. 在 `components/` 中实现 UI 组件
5. 更新数据库 schema (如需要新表)

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 Next.js 14 App Router 最佳实践
- 使用 Tailwind CSS 进行样式编写
- 组件使用 shadcn/ui 设计系统

## 🚢 部署

### Vercel 部署 (推荐)

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. 部署完成后自动可用

### 环境变量配置

确保在 Vercel Dashboard 中设置以下环境变量:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🗄️ 数据库维护

### 重建数据库

如需完全重建数据库:

```bash
# 在 Supabase SQL Editor 中执行
database/CAREVAULT_COMPLETE_SCHEMA_REBUILD.sql
```

⚠️ **警告**: 此操作会删除所有现有数据!

### 备份数据

建议定期在 Supabase Dashboard 中创建数据库备份。

## 🐛 常见问题

### 1. 登录后看不到"Add Patient"按钮?

**原因**: 用户角色为 `patient` (只读)

**解决**:
```sql
-- 在 Supabase SQL Editor 中执行
UPDATE users SET role = 'caregiver' WHERE id = 'your-user-uuid';
```

### 2. 添加患者时报错 "Failed to add patient"?

**可能原因**:
- 数据库 schema 未正确初始化
- RLS 策略配置错误
- 用户未在 `users` 表中注册

**解决**: 检查浏览器控制台错误信息,确认数据库 schema 已正确执行

### 3. 上传文档失败?

**原因**: Storage bucket 未创建或权限配置错误

**解决**: 确保执行了完整的数据库初始化脚本

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

**Built with ❤️ using Next.js and Supabase**
