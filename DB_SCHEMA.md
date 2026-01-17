# CareVault 数据库架构说明

## 概述

CareVault 应用使用 Supabase 作为后端数据库，包含多个表来存储用户的医疗文档、医疗记录、预约提醒和其他相关信息。

## 表结构

### 1. documents 表
存储用户上传的各类文档信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 文档唯一标识符 |
| name | text | NOT NULL | 文档名称 |
| category | text | NOT NULL, CHECK (category in ('legal', 'medical', 'financial', 'identification')) | 文档分类 |
| file_url | text | 可选 | 文件存储的URL路径 |
| file_name | text | 可选 | 文件原始名称 |
| file_size | integer | 可选 | 文件大小（字节） |
| date | date | NOT NULL | 文档关联的日期 |
| created_at | timestamp with time zone | DEFAULT now() | 创建时间 |
| updated_at | timestamp with time zone | DEFAULT now() | 更新时间 |

**索引**: 
- idx_documents_category: 按分类查询优化
- idx_documents_created_at: 按创建时间倒序查询优化

### 2. medical_records 表
存储用户的医疗记录信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 医疗记录唯一标识符 |
| type | text | NOT NULL, CHECK (type in ('doctors', 'medications', 'conditions')) | 记录类型 |
| name | text | NOT NULL | 记录名称 |
| details | text | 可选 | 详细信息 |
| date | date | NOT NULL | 记录关联的日期 |
| created_at | timestamp with time zone | DEFAULT now() | 创建时间 |
| updated_at | timestamp with time zone | DEFAULT now() | 更新时间 |

**索引**: 
- idx_medical_records_type: 按类型查询优化
- idx_medical_records_created_at: 按创建时间倒序查询优化

### 3. appointments 表
存储用户的预约提醒信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 预约唯一标识符 |
| title | text | NOT NULL | 预约标题 |
| description | text | 可选 | 预约描述 |
| appointment_date | timestamp with time zone | NOT NULL | 预约日期时间 |
| remind_before_minutes | integer | DEFAULT 30 | 提前提醒分钟数 |
| repeat_interval | text | DEFAULT 'none', CHECK (repeat_interval in ('none', 'daily', 'weekly', 'monthly', 'yearly')) | 重复间隔 |
| is_completed | boolean | DEFAULT false | 是否已完成 |
| created_at | timestamp with time zone | DEFAULT now() | 创建时间 |
| updated_at | timestamp with time zone | DEFAULT now() | 更新时间 |

**索引**: 
- idx_appointments_date: 按预约日期查询优化
- idx_appointments_completed: 按完成状态查询优化

### 4. emergency_contacts 表
存储紧急联系人信息

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | 紧急联系人唯一标识符 |
| name | text | NOT NULL | 联系人姓名 |
| relationship | text | 可选 | 与患者的关系 |
| phone | text | 可选 | 联系电话 |
| email | text | 可选 | 电子邮件 |
| is_primary | boolean | DEFAULT false | 是否为主要联系人 |
| created_at | timestamp with time zone | DEFAULT now() | 创建时间 |
| updated_at | timestamp with time zone | DEFAULT now() | 更新时间 |

### 5. users 表
存储用户信息（用于未来身份验证）

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PRIMARY KEY, REFERENCES auth.users | 用户ID（引用Supabase Auth） |
| full_name | text | 可选 | 全名 |
| phone | text | 可选 | 电话号码 |
| role | text | DEFAULT 'user', CHECK (role in ('user', 'caregiver', 'admin')) | 用户角色 |
| created_at | timestamp with time zone | DEFAULT now() | 创建时间 |
| updated_at | timestamp with time zone | DEFAULT now() | 更新时间 |

**索引**: 
- idx_users_role: 按角色查询优化

## 存储桶

### documents 存储桶
- ID: 'documents'
- 公开: true
- 用途: 存储用户上传的文档文件

## 行级安全 (RLS) 策略

### 开发环境策略
为了便于开发测试，所有表都启用了完全访问权限策略：
- 允许所有用户对所有表进行所有操作
- 在生产环境中应限制为更严格的权限控制

### 存储对象策略
对 documents 存储桶启用：
- 公共读取访问
- 公共插入访问
- 公共更新访问
- 公共删除访问

## 扩展插件

- uuid-ossp: 用于生成UUID

## 注意事项

1. **生产环境安全性**: 当前的RLS策略适用于开发环境，生产环境需要实施更严格的身份验证和授权策略
2. **索引优化**: 已为常用查询创建了索引以提高性能
3. **时间戳**: 所有表都包含 created_at 和 updated_at 时间戳字段
4. **扩展支持**: 使用了 uuid-ossp 扩展以支持UUID生成

## 未来改进方向

1. 实施基于角色的访问控制
2. 添加审计日志表
3. 增加数据加密功能
4. 添加备份和恢复策略