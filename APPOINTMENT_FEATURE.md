# CareVault - 预约提醒功能说明

## 功能概述

CareVault 应用现在包含了一个完整的预约提醒功能，允许用户创建、管理和跟踪医疗预约，并接收及时的提醒通知。

## 数据模型

### Appointment 接口
```typescript
interface Appointment {
  id: string;
  title: string;           // 预约标题
  description: string;     // 预约描述
  appointment_date: string; // 预约日期时间 (ISO 格式)
  remind_before_minutes: number; // 提前提醒分钟数
  repeat_interval: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'; // 重复间隔
  is_completed: boolean;   // 是否已完成
  created_at?: string;     // 创建时间
}
```

## 功能特性

### 1. 预约管理
- **添加预约**：用户可以输入预约标题、描述、日期时间、提前提醒时间和重复选项
- **标记完成**：用户可以将预约标记为已完成
- **删除预约**：用户可以从列表中删除预约
- **查看列表**：用户可以查看即将到来和过去的预约

### 2. 分类显示
- **即将到来的预约**：按时间顺序显示未完成且时间未过的预约
- **过去/已完成的预约**：显示已完成或已过期的预约

### 3. 通知系统
- **浏览器通知**：当预约接近时，应用会发送浏览器通知提醒用户
- **智能提醒**：基于用户设置的提前提醒时间发送通知
- **防重复通知**：使用 localStorage 防止同一提醒被多次发送

### 4. 用户界面
- **添加预约模态框**：提供表单供用户输入预约详细信息
- **预约列表视图**：清晰展示所有预约，区分即将到来和过去的预约
- **快速操作按钮**：方便用户标记完成或删除预约

## 数据库结构

### Appointments 表
```sql
CREATE TABLE appointments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  remind_before_minutes INTEGER DEFAULT 30,
  repeat_interval TEXT CHECK (repeat_interval IN ('none', 'daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'none',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 使用指南

### 添加新预约
1. 点击底部的"Quick Actions"区域中的"Appointment Reminder"按钮
2. 在弹出的列表界面中，点击右上角的日历图标打开添加预约模态框
3. 填写预约信息：
   - 标题（必填）
   - 描述（可选）
   - 预约日期和时间
   - 提前提醒时间（分钟）
   - 重复间隔（如果需要）
4. 点击"Add Appointment"

### 管理现有预约
1. 点击"Appointment Reminder"按钮显示预约列表
2. 对于即将到来的预约：
   - 点击日历图标可将其标记为已完成
   - 点击垃圾桶图标可删除预约
3. 对于已完成或过去的预约：
   - 可以点击下载图标（如果还未标记完成）来标记为已完成
   - 点击垃圾桶图标可删除预约

### 接收提醒通知
- 应用会每分钟检查一次即将到来的预约
- 如果预约时间在用户设置的提前提醒时间内，应用将发送浏览器通知
- 首次使用时，浏览器可能会请求通知权限

## 技术实现

### 通知机制
- 使用 `useEffect` Hook 实现定期检查
- 检查频率：每分钟一次
- 使用浏览器 `Notification` API 发送通知
- 使用 `localStorage` 防止重复通知

### 状态管理
- 使用 React `useState` 管理预约数据
- 自动过滤和排序即将到来和过去的预约
- 实时更新界面以反映数据变化

## 隐私和安全
- 所有预约数据存储在 Supabase 数据库中
- 使用 Supabase 的行级安全策略控制数据访问
- 通知权限由用户控制