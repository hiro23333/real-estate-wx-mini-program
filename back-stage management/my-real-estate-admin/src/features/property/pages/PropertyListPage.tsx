/* eslint-disable @typescript-eslint/no-unused-vars */
// src/features/property/pages/PropertyListPage.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  Input,
  Select,
  Space,
  Button,
  message,
  Popconfirm,
  Tag,
  Card,
  Tabs,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UpSquareOutlined,
  DownSquareOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getProperties,
  updatePropertyStatus,
  deleteProperty,
} from '../services/propertyService';
import type { PropertyListItem, PropertyStatus, PropertyCategory, PropertyTag } from '../types';
import { type ApiResponseList } from '../../../types/api';
import type { TableColumnsType, TablePaginationConfig, TabsProps } from 'antd';
import type { Community } from '../../data-dictionary/types';
import { getCommunities, getTags } from '../../data-dictionary/services/dictionaryService';


const { Search } = Input;
type FilterValue = string | number | number[] | PropertyCategory | undefined;

const PropertyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [allProperties, setAllProperties] = useState<PropertyListItem[]>([]);
  const [pagedProperties, setPagedProperties] = useState<PropertyListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    keyword?: string;
    community_id?: number;
    tag_ids?: number[];
    category?: PropertyCategory;
  }>({});
  const [communityOptions, setCommunityOptions] = useState<{ value: number; label: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ value: number; label: string }[]>([]);

  // 封装数据获取函数，使其可复用
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [propertiesResponse, communityResponse, tagResponse]: [
        ApiResponseList<PropertyListItem>,
        ApiResponseList<Community>,
        ApiResponseList<PropertyTag>,
      ] = await Promise.all([getProperties(), getCommunities(), getTags()]);

      if (propertiesResponse.code === 200 && propertiesResponse.data) {
        setAllProperties(propertiesResponse.data.list.map((item) => ({ ...item, key: item.property_id })));
      } else {
        message.error('获取房源列表失败');
      }

      setCommunityOptions(communityResponse.data.list.map((c: Community) => ({ value: c.community_id, label: c.name })));
      setTagOptions(tagResponse.data.list.map((t: PropertyTag) => ({ value: t.tag_id, label: t.name })));
    } catch (error) {
      message.error('请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. 在组件挂载时，一次性获取所有房源数据和选项
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. 使用 useMemo 在本地处理筛选和排序，仅在依赖项变化时重新计算
  const filteredAndSortedProperties = useMemo(() => {
    let result = allProperties;

    // 按状态Tab筛选
    if (activeStatusTab !== 'all') {
      const status = parseInt(activeStatusTab, 10);
      result = result.filter((item) => item.status === status);
    }

    // 按关键词筛选
    if (filters.keyword) {
      result = result.filter((item) => item.title.includes(filters.keyword!));
    }

    // 按小区筛选
    if (filters.community_id) {
      const communityName = communityOptions.find((opt) => opt.value === filters.community_id)?.label;
      result = result.filter((item) => item.community === communityName);
    }

    // 按标签筛选
    if (filters.tag_ids && filters.tag_ids.length > 0) {
      const selectedTags = tagOptions.filter((opt) => filters.tag_ids!.includes(opt.value)).map((opt) => opt.label);
      result = result.filter((item) => item.tags.some((tag) => selectedTags.includes(tag.name)));
    }

    // 按分类筛选
    if (filters.category) {
      result = result.filter((item) => item.category === filters.category);
    }

    return result;
  }, [allProperties, activeStatusTab, filters, communityOptions, tagOptions]);

  // 3. 根据筛选后的数据，更新分页数据和总数
  useEffect(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    setPagedProperties(filteredAndSortedProperties.slice(startIndex, endIndex));
    // 只有在 total 发生变化时才更新 pagination state
    if (pagination.total !== filteredAndSortedProperties.length) {
      setPagination((prev) => ({ ...prev, total: filteredAndSortedProperties.length }));
    }
  }, [filteredAndSortedProperties, pagination]);

  // Tab切换时，重置分页和筛选
  const handleTabsChange: TabsProps['onChange'] = (key) => {
    setActiveStatusTab(key);
    setFilters({});
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current ?? prev.current,
      pageSize: newPagination.pageSize ?? prev.pageSize,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, keyword: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const statusMap = {
    0: { text: '下架', color: 'red' },
    1: { text: '上架', color: 'green' },
    2: { text: '待审核', color: 'orange' },
  };

  const categoryMap = {
    sale: '出售',
    rent: '出租',
    commercial: '商用',
  };

  const handleStatusUpdate = async (id: number, action: '上架' | '下架' | '审核' | PropertyStatus) => {
    let newStatus: PropertyStatus | null = null;

    if (action === '上架' || action === 1) {
      newStatus = 1;
    } else if (action === '下架' || action === 0) {
      newStatus = 0;
    } else if (action === '审核') {
       Modal.confirm({
          title: '审核房源',
          content: '请选择审核结果：',
          okText: '上架',
          cancelText: '下架',
          onOk: () => handleStatusUpdate(id, 1),
          onCancel: () => handleStatusUpdate(id, 0),
       });
       return;
    }
    
    if (newStatus !== null) {
      try {
        await updatePropertyStatus({ property_id: id, status: newStatus });
        message.success('状态更新成功!');
        fetchData();
      } catch (error) {
        message.error('状态更新失败');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProperty({ property_id: id });
      message.success('房源删除成功!');
      fetchData();
    } catch (error) {
      message.error('房源删除失败');
    }
  };

  const columns: TableColumnsType<PropertyListItem> = [
    {
      title: 'ID',
      dataIndex: 'property_id',
      key: 'property_id',
      sorter: (a, b) => a.property_id - b.property_id,
    },
    {
      title: '房源标题',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <a>{text}</a>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: PropertyCategory) => categoryMap[category],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PropertyStatus) => {
        const { text, color } = statusMap[status];
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '所属小区',
      dataIndex: 'community',
      key: 'community',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: PropertyTag[]) => (
        <Space size={[0, 8]} wrap>
          {tags.map((tag) => (
            <Tag key={tag.tag_id}>{tag.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publish_time',
      key: 'publish_time',
      sorter: (a, b) => new Date(a.publish_time).getTime() - new Date(b.publish_time).getTime(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/properties/edit/${record.property_id}`)}>
            编辑
          </Button>
          {record.status === 1 && (
            <Button type="link" danger icon={<DownSquareOutlined />} onClick={() => handleStatusUpdate(record.property_id, 0)}>
              下架
            </Button>
          )}
          {record.status === 0 && (
            <Button type="link" icon={<UpSquareOutlined />} onClick={() => handleStatusUpdate(record.property_id, 1)}>
              上架
            </Button>
          )}
          {record.status === 2 && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleStatusUpdate(record.property_id, '审核')}>
              审核
            </Button>
          )}
          <Popconfirm
            title="确定要删除此房源吗？"
            onConfirm={() => handleDelete(record.property_id)}
            okText="是"
            cancelText="否"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: '1', label: '上架' },
    { key: '0', label: '下架' },
    { key: '2', label: '待审核' },
  ];

  return (
    <Card title="房源管理">
      <Tabs activeKey={activeStatusTab} onChange={handleTabsChange} items={tabItems} style={{ marginBottom: 16 }} />
      <Space style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap' }}>
        <Search
          placeholder="搜索房源标题"
          onSearch={handleSearch}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
          value={filters.keyword}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="选择分类"
          style={{ width: 120 }}
          onChange={(value) => handleFilterChange('category', value)}
          value={filters.category}
          allowClear
          options={[
            { value: 'sale', label: '出售' },
            { value: 'rent', label: '出租' },
            { value: 'commercial', label: '商用' },
          ]}
        />
        <Select
          placeholder="选择小区"
          style={{ width: 120 }}
          onChange={(value) => handleFilterChange('community_id', value)}
          value={filters.community_id}
          options={communityOptions}
          allowClear
        />
        <Select
          mode="multiple"
          maxTagCount={3}
          placeholder="选择标签"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('tag_ids', value)}
          value={filters.tag_ids}
          options={tagOptions}
          allowClear
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/properties/add')}>新增房源</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={pagedProperties}
        rowKey="property_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default PropertyListPage;