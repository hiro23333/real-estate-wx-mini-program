// src/features/data-dictionary/components/DictionaryTable.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, Modal, Form, Input, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { FormInstance } from 'antd/es/form';
import type { ApiResponseSuccess, ApiResponseList } from '../../../types/api';
import type { Community, DictionaryItem, Tag } from '../types';

// 修改为只接受 Community 或 Tag 类型
type AddOrEditParams<T extends DictionaryItem> = Partial<T>;

interface DictionaryTableProps<T extends DictionaryItem> {
  title: string;
  dataKey: keyof T; // 数据的唯一键
  columns: ColumnsType<T>;
  getData: () => Promise<ApiResponseList<T>>;
  addOrEditData: (params: AddOrEditParams<T>) => Promise<ApiResponseSuccess<unknown>>;
  deleteData: (id: number) => Promise<ApiResponseSuccess<unknown>>;
}


const DictionaryTable = <T extends DictionaryItem>(
  props: DictionaryTableProps<T>
): React.ReactElement => {
  const { title, dataKey, columns, getData, addOrEditData, deleteData } = props;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [form] = Form.useForm<T>();

  const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await getData();
    setData(response.data.list);
  } catch (error) {
    message.error(`获取${title}列表失败`);
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [getData, title]); 

useEffect(() => {
  fetchData();
}, [fetchData]); 

  const handleAddOrEdit = async (values: T) => {
  try {
    const payload: AddOrEditParams<T> = { ...values };
    
    if (editingItem) {
      // 根据实际类型设置正确的ID字段
      if ('community_id' in editingItem) {
        (payload as Partial<Community>).community_id = editingItem.community_id;
      } else {
        (payload as Partial<Tag>).tag_id = editingItem.tag_id;
      }
    }

    await addOrEditData(payload);
    message.success(`${editingItem ? '编辑' : '新增'}${title}成功！`);
    setIsModalVisible(false);
    fetchData();
  } catch (error) {
    message.error(`${editingItem ? '编辑' : '新增'}${title}失败！`);
    console.error(error);
  }
};

  const handleDelete = async (id: number) => {
    try {
      await deleteData(id);
      message.success(`删除${title}成功！`);
      fetchData();
    } catch (error) {
      message.error(`删除${title}失败！`);
      console.error(error);
    }
  };

  const showModal = (item?: T) => {
    if (item) {
      setEditingItem(item);
      form.setFieldsValue(item as Parameters<FormInstance['setFieldsValue']>[0]);
    } else {
      setEditingItem(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // 根据类型获取正确的ID值
  const getRecordId = (record: T): number => {
    return 'community_id' in record ? record.community_id : record.tag_id;
  };

  const actionColumns: ColumnsType<T> = [
    ...columns,
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
            编辑
          </Button>
          <Popconfirm 
            title={`确定删除该${title}吗？`} 
            onConfirm={() => handleDelete(getRecordId(record))}
          >
            <Button icon={<DeleteOutlined />} danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          新增{title}
        </Button>
      </div>
      <Table 
        columns={actionColumns} 
        dataSource={data} 
        loading={loading} 
        rowKey={record => getRecordId(record).toString()}
      />
      
      <Modal
        title={`${editingItem ? '编辑' : '新增'}${title}`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form<T> form={form} layout="vertical" onFinish={handleAddOrEdit}>
          <Form.Item
            name={dataKey as string}
            label={title}
            rules={[{ required: true, message: `请输入${title}` }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ float: 'right' }}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DictionaryTable;