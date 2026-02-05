'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestRegistrationPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCaregiverRegistration = async () => {
    setTesting(true);
    setLogs([]);

    try {
      const testEmail = `test-caregiver-${Date.now()}@example.com`;
      const testPassword = 'TestPass123!';

      addLog('🔵 开始测试 Caregiver 注册...');
      addLog(`Email: ${testEmail}`);

      // Step 1: 注册
      addLog('📤 发送注册请求到 Supabase Auth...');

      if (!supabase) {
        addLog('❌ Supabase not configured');
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test Caregiver',
            phone: '1234567890',
            role: 'caregiver',
            pending_caregiver_email: null,
            pending_caregiver_name: null,
          },
        },
      });

      if (signUpError) {
        addLog(`❌ 注册失败: ${signUpError.message}`);
        return;
      }

      addLog('✅ Supabase Auth 注册成功');
      addLog(`User ID: ${authData.user?.id}`);
      addLog(`Metadata sent: ${JSON.stringify(authData.user?.user_metadata)}`);

      // Step 2: 等待触发器执行
      addLog('⏳ 等待 2 秒让数据库触发器执行...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: 查询 public.users 表
      addLog('🔍 查询 public.users 表...');
      if (!supabase) {
        addLog('❌ Supabase 客户端未配置');
        return;
      }

      const { data: userData, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (queryError) {
        addLog(`❌ 查询失败: ${queryError.message}`);
        addLog(`Code: ${queryError.code}`);
        return;
      }

      if (!userData) {
        addLog('❌ 用户在 public.users 表中不存在!');
        addLog('🔴 问题: 数据库触发器未执行或执行失败');
        return;
      }

      addLog('✅ 在 public.users 表中找到用户');
      addLog(`实际 Role: ${userData.role}`);
      addLog(`Full Name: ${userData.full_name}`);
      addLog(`Phone: ${userData.phone}`);

      // Step 4: 验证 role 是否正确
      if (userData.role === 'caregiver') {
        addLog('✅✅✅ 测试成功! Role 正确设置为 caregiver');
      } else {
        addLog(`❌❌❌ 测试失败! Role 应该是 "caregiver" 但实际是 "${userData.role}"`);
        addLog('🔴 问题定位: 数据库触发器 handle_new_user() 的 role 解析逻辑有问题');
      }

      // Step 5: 登出
      addLog('🔐 登出测试账号...');
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      addLog(`❌ 异常: ${err.message}`);
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const testPatientRegistration = async () => {
    setTesting(true);
    setLogs([]);

    try {
      if (!supabase) {
        addLog('❌ Supabase not configured');
        return;
      }

      const caregiverEmail = `test-caregiver-${Date.now()}@example.com`;
      const patientEmail = `test-patient-${Date.now()}@example.com`;
      const testPassword = 'TestPass123!';

      addLog('🟢 步骤 1: 先注册 Caregiver...');

      // Register caregiver first
      const { data: caregiverAuth, error: caregiverError } = await supabase.auth.signUp({
        email: caregiverEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test Caregiver',
            phone: '1234567890',
            role: 'caregiver',
          },
        },
      });

      if (caregiverError) {
        addLog(`❌ Caregiver 注册失败: ${caregiverError.message}`);
        return;
      }

      addLog(`✅ Caregiver 注册成功: ${caregiverEmail}`);
      await supabase.auth.signOut();

      addLog('⏳ 等待 2 秒...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      addLog('🟡 步骤 2: 注册 Patient 并关联 Caregiver...');

      const { data: patientAuth, error: patientError } = await supabase.auth.signUp({
        email: patientEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test Patient',
            role: 'patient',
            pending_caregiver_email: caregiverEmail,
            pending_caregiver_name: 'Test Caregiver',
          },
        },
      });

      if (patientError) {
        addLog(`❌ Patient 注册失败: ${patientError.message}`);
        return;
      }

      addLog(`✅ Patient 注册成功: ${patientEmail}`);

      addLog('⏳ 等待 3 秒让关联触发器执行...');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check if care_recipient was created
      addLog('🔍 查询 care_recipients 表...');
      const { data: careRecipient, error: crError } = await supabase
        .from('care_recipients')
        .select('*')
        .eq('patient_email', patientEmail)
        .single();

      if (crError) {
        addLog(`❌ 查询失败: ${crError.message}`);
        addLog('🔴 问题: Patient-Caregiver 自动关联失败');
        return;
      }

      if (!careRecipient) {
        addLog('❌ 没有创建 care_recipient 记录!');
        addLog('🔴 问题: create_care_recipient_for_patient() 触发器未执行');
        return;
      }

      addLog('✅✅✅ Patient-Caregiver 自动关联成功!');
      addLog(`Care Recipient ID: ${careRecipient.id}`);
      addLog(`Patient Email: ${careRecipient.patient_email}`);

      await supabase.auth.signOut();
    } catch (err: any) {
      addLog(`❌ 异常: ${err.message}`);
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>注册流程诊断工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testCaregiverRegistration} disabled={testing} className="w-full">
              {testing ? '测试中...' : '测试 Caregiver 注册'}
            </Button>
            <Button
              onClick={testPatientRegistration}
              disabled={testing}
              variant="secondary"
              className="w-full"
            >
              {testing ? '测试中...' : '测试 Patient 注册与关联'}
            </Button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">点击按钮开始测试...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
