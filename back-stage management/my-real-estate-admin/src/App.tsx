// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import './styles/global.css';

// 认证相关
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import LoginPage from './features/auth/pages/LoginPage';

// 布局组件
import MainLayout from './layout/MainLayout';

// 功能页面组件
import PropertyListPage from './features/property/pages/PropertyListPage';
import PropertyFormPage from './features/property/pages/PropertyFormPage';
import UserListPage from './features/user/pages/UserListPage';
import MessageListPage from './features/message/pages/MessageListPage';
import DataDictionaryPage from './features/data-dictionary/pages/DataDictionaryPage';
import BannerManagementPage from './features/banner/pages/BannerManagementPage';
import StatisticsOverviewPage from './features/statistics/pages/StatisticsOverviewPage';

const NotFoundPage: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '24px' }}>
    <h1>404 - 页面未找到</h1>
    <p>抱歉，您访问的页面不存在。</p>
  </div>
);

// 路由守卫组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider> {/* 包裹整个应用，提供认证上下文 */}
          <Routes>
            {/* 登录页面 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 受保护的后台管理路由 */}
            <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/properties" replace />} /> {/* 默认重定向 */}
              <Route path="properties" element={<PropertyListPage />} />
              <Route path="properties/add" element={<PropertyFormPage />} />
              <Route path="properties/edit/:propertyId" element={<PropertyFormPage />} />

              <Route path="users" element={<UserListPage />} />

              <Route path="messages" element={<MessageListPage />} />

              <Route path="data-dictionaries" element={<DataDictionaryPage />} />

              <Route path="banners" element={<BannerManagementPage />} />

              <Route path="statistics" element={<StatisticsOverviewPage />} />
            </Route>

            {/* 404 页面 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;