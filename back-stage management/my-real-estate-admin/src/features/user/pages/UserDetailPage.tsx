// src/features/user/pages/UserDetailPage.tsx
import React from 'react';
import { Card } from 'antd';
import { useParams } from 'react-router-dom';

const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  return (
    <Card title={`用户详情 - ID: ${userId}`}>
      <p>这里是用户详情页面。</p>
      {/* TODO: 实现用户详情展示和备注功能 */}
    </Card>
  );
};

export default UserDetailPage;