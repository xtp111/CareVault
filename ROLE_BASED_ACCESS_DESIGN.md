# 修正后的角色权限设计方案

## 问题分析
原始设计存在以下问题：
1. 不必要的分离了caregiver和patient概念
2. 缺乏灵活的用户关系管理
3. 权限控制不够清晰

## 修正后的设计方案

### 1. 数据库表结构

#### users 表 (统一用户表)
- id (UUID, 主键, 引用auth.users)
- email (TEXT, 非空, 唯一)
- full_name (TEXT, 非空)
- phone (TEXT)
- role (user_role, 非空, 默认'caregiver')
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

#### user_relationships 表 (用户关系管理)
- id (UUID, 主键)
- caregiver_id (UUID, 非空, 外键引用users)
- patient_id (UUID, 非空, 外键引用users)
- status (TEXT, 默认'active', 检查约束)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

#### medical_records 表 (医疗记录)
- id (UUID, 主键)
- user_id (UUID, 非空, 外键引用users)
- record_type (TEXT, 非空, 检查约束)
- name (TEXT, 非空)
- details (TEXT)
- date_recorded (DATE, 非空)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

#### appointments 表 (预约)
- id (UUID, 主键)
- user_id (UUID, 非空, 外键引用users)
- title (TEXT, 非空)
- description (TEXT)
- appointment_date (TIMESTAMPTZ, 非空)
- location (TEXT)
- doctor_name (TEXT)
- status (appointment_status, 默认'scheduled')
- notes (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

#### documents 表 (文档)
- id (UUID, 主键)
- user_id (UUID, 非空, 外键引用users)
- name (TEXT, 非空)
- category (TEXT, 非空, 检查约束)
- file_url (TEXT)
- file_name (TEXT)
- file_size (INTEGER)
- upload_date (DATE, 非空)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### 2. 权限控制策略

#### 用户权限
- 每个用户都可以查看和更新自己的个人信息
- 每个用户都可以完全管理自己的医疗记录、预约和文档

#### Caregiver权限
- 可以查看与其建立关系的patient的医疗记录、预约和文档
- 可以管理与其建立关系的patient的医疗记录、预约和文档
- 可以管理用户关系（添加/删除patient）

#### Patient权限
- 可以管理自己的数据
- 可以查看与自己相关的数据
- 可以管理自己的关系（添加caregiver）

### 3. 优势

1. **简化结构** - 统一用户表，角色区分
2. **灵活关系** - 通过关系表管理用户间关联
3. **清晰权限** - 基于角色和关系的权限控制
4. **可扩展** - 易于添加新的角色类型或关系类型
5. **数据隔离** - 通过RLS确保数据安全

### 4. 实施步骤

1. 使用 CORRECTED_USER_ROLE_SCHEMA.sql 替换现有数据库结构
2. 更新应用程序代码以适应新结构
3. 迁移现有数据（如有）
4. 测试所有功能以确保权限控制正常工作

这个设计解决了原始设计中的问题，提供了更好的用户体验和数据管理灵活性。