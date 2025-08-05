// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { adminLogin } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import type { LoginPayload } from '../types';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // 使用认证上下文的 login 方法

  const onFinish = async (values: LoginPayload) => {
    setLoading(true);
    try {
      const response = await adminLogin(values);
      if (response.code === 200 && response.data) {
        message.success('登录成功！');
        // 将用户信息存储到认证上下文
        login({
          token: response.data.token,
          admin_id: response.data.admin_id,
          username: response.data.username,
        });
        navigate('/properties'); // 登录成功后跳转到房源管理页面
      } else {
        message.error(response.message || '登录失败，请检查用户名或密码');
      }
    } catch (error) {
      message.error('登录请求失败，请稍后再试');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#f0f2f5' 
    }}>
      <Card 
        title="后台管理系统登录" 
        style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
        headStyle={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}
      >
        <Spin spinning={loading}>
          <Form
            name="admin_login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                登录
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default LoginPage;