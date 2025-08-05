// src/features/property/pages/PropertyFormPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import PropertyForm from '../components/PropertyForm'; // 引入表单组件
import { Card } from 'antd';

const PropertyFormPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId?: string }>();
  const isEditMode =!!propertyId;
  const id = propertyId? parseInt(propertyId, 10) : undefined;

  return (
    <Card title={isEditMode? '编辑房源' : '新增房源'}>
      <PropertyForm propertyId={id} />
    </Card>
  );
};

export default PropertyFormPage;