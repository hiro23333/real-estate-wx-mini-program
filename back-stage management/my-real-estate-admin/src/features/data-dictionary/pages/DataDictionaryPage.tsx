// src/features/data-dictionary/pages/DataDictionaryPage.tsx
import React from 'react';
import { Card, Tabs } from 'antd';
import type { TabsProps, TableColumnsType } from 'antd';
import DictionaryTable from '../components/DictionaryTable';
import {
  getCommunities,
  addOrEditCommunity,
  deleteCommunity,
  getTags,
  addOrEditTag,
  deleteTag,
} from '../services/dictionaryService';
import type { Community, Tag } from '../types';


const communityColumns: TableColumnsType<Community> = [
  {
    title: '小区ID',
    dataIndex: 'community_id', // 修正 dataIndex 为 community_id
    key: 'community_id',
    width: 80,
  },
  {
    title: '小区名称',
    dataIndex: 'name',
    key: 'name',
  },
];

const tagColumns: TableColumnsType<Tag> = [
  {
    title: '标签ID',
    dataIndex: 'tag_id', // 修正 dataIndex 为 tag_id
    key: 'tag_id',
    width: 80,
  },
  {
    title: '标签名称',
    dataIndex: 'name',
    key: 'name',
  },
];

const DataDictionaryPage: React.FC = () => {
  const tabItems: TabsProps['items'] = [
    {
      label: `小区管理`,
      key: 'community',
      children: (
        <DictionaryTable
          title="小区"
          dataKey="name"
          columns={communityColumns}
          getData={getCommunities}
          addOrEditData={addOrEditCommunity}
          deleteData={deleteCommunity}
        />
      ),
    },
    {
      label: `标签管理`,
      key: 'tag',
      children: (
        <DictionaryTable
          title="标签"
          dataKey="name"
          columns={tagColumns}
          getData={getTags}
          addOrEditData={addOrEditTag}
          deleteData={deleteTag}
        />
      ),
    },
  ];

  return (
    <Card title="数据字典管理" >
      <Tabs defaultActiveKey="community" items={tabItems} />
    </Card>
  );
};

export default DataDictionaryPage;