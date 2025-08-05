// src/layout/MainLayout.tsx
import React, { useState } from 'react';
import { Layout, Menu, theme, Dropdown, Space, Avatar, Modal, Form, Input, message, Button } from 'antd';
import { UserOutlined, HomeOutlined, MessageOutlined, SettingOutlined, BarChartOutlined, DatabaseOutlined, LogoutOutlined, KeyOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { changeAdminPassword } from '../features/auth/services/authService';
import type { ChangePasswordPayload } from '../features/auth/types';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[], // 修改这里，children 应该是 MenuItem 数组
): MenuItem => {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem;
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const navigate = useNavigate();
  const { logout, userInfo } = useAuth();
  const [passwordForm] = Form.useForm();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems: MenuItem[] = [
    getItem('房源管理', '/properties', <HomeOutlined />),
    getItem('用户管理', '/users', <UserOutlined />),
    getItem('消息管理', '/messages', <MessageOutlined />),
    getItem('数据字典', '/data-dictionaries', <DatabaseOutlined />),
    getItem('Banner管理', '/banners', <SettingOutlined />),
    getItem('统计概览', '/statistics', <BarChartOutlined />),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    message.success('已安全退出！');
  };

  const handlePasswordChange = async (values: ChangePasswordPayload) => {
    setIsSubmitting(true);
    try {
      const response = await changeAdminPassword(values);
      if (response.code === 200) {
        message.success('密码修改成功，请重新登录！');
        setIsModalVisible(false);
        handleLogout();
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改请求失败，请稍后再试');
      console.error('Change password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 修复：将 userDropdownMenu 从 JSX 元素改为对象数组，以适应新的 menu 属性
  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'change_password',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => {
        setIsModalVisible(true);
        passwordForm.resetFields();
      },
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value: boolean) => setCollapsed(value)}>
        <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          房产管理
        </div>
        <Menu
          theme="dark"
          defaultSelectedKeys={['/properties']}
          mode="inline"
          items={menuItems}
          onClick={({ key }: { key: string }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ float: 'right', paddingRight: 24 }}>
            {/* 修复：将 overlay 属性替换为 menu 属性，并传入新的对象数组 */}
            <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>欢迎回来, {userInfo?.username || 'Admin'}!</span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </Layout>
      
      {/* 修改密码的模态框 */}
      <Modal
        title="修改密码"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnHidden={true}
      >
        <Form
          form={passwordForm}
          name="change_password"
          onFinish={handlePasswordChange}
          layout="vertical"
        >
          <Form.Item
            name="old_password"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码！' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码！' }]}
            hasFeedback
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirm_new_password"
            label="确认新密码"
            dependencies={['new_password']}
            hasFeedback
            rules={[
              { required: true, message: '请再次输入新密码！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right' }}>
            <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainLayout;