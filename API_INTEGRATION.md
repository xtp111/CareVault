# CareVault - API 集成说明

## Supabase 数据 API 配置

### 1. 环境配置

确保在 `.env.local` 文件中设置了正确的 Supabase 凭据：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 2. 数据库表结构

确保在 Supabase 项目中已创建以下表：

#### documents 表
```sql
create table documents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text not null check (category in ('legal', 'medical', 'financial', 'identification')),
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### medical_records 表
```sql
create table medical_records (
  id uuid default uuid_generate_v4() primary key,
  type text not null check (type in ('doctors', 'medications', 'conditions')),
  name text not null,
  details text,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 3. API 使用说明

主页面现在使用 Supabase API 进行数据操作：

- **获取数据**: 使用 `useEffect` 在组件挂载时从数据库加载文档和医疗记录
- **添加文档**: `handleAddDocument` 函数现在将新文档插入到 `documents` 表中
- **添加医疗记录**: `handleAddMedicalRecord` 函数现在将新记录插入到 `medical_records` 表中

### 4. 安全注意事项

当前的行级安全（RLS）策略允许所有操作，仅用于开发目的。在生产环境中，应实施适当的安全措施。

## 如何获取 Supabase 凭据

1. 访问 [supabase.com](https://supabase.com) 并登录
2. 选择您的项目
3. 转到 Settings > API
4. 复制 "Project URL" 和 "anon public" 密钥
5. 将它们填入 `.env.local` 文件中