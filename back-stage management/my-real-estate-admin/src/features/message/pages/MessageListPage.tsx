// src/features/message/pages/MessageListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, message, Tabs, Spin, Pagination } from 'antd';
import { EyeOutlined, MessageOutlined } from '@ant-design/icons';
import { useAuth } from '../../../hooks/useAuth';
import { getMessages, getMessageDetail, replyMessage } from '../services/messageService';
import type { MessageListItem, MessageDetail } from '../types';
import type { TableProps } from 'antd';
import type { ApiResponseList } from '../../../types/api';

const { TextArea } = Input;

interface ReplyFormValues {
  replied_content: string;
}

const MessageListPage: React.FC = () => {
  const [allMessages, setAllMessages] = useState<MessageListItem[]>([]);
  const [pagedMessages, setPagedMessages] = useState<MessageListItem[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'all' | 'unreplied' | 'replied'>('all');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyForm] = Form.useForm<ReplyFormValues>();

  const { userInfo } = useAuth();

  const fetchAllMessages = async () => {
    setLoading(true);
    try {
      const response: ApiResponseList<MessageListItem> = await getMessages();
      if (response.code === 200 && response.data) {
        const fetchedList = response.data.list.map(msg => ({
          ...msg,
          key: msg.message_id,
        }));
        setAllMessages(fetchedList);
      } else {
        message.error('获取消息列表失败');
      }
    } catch (error) {
      message.error('请求消息列表失败，请稍后再试');
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMessages();
  }, []);

  // 关键修正点：优化 setPagination 的调用，避免不必要的对象引用更新
  useEffect(() => {
    let filteredMessages = allMessages;
    if (currentTab === 'unreplied') {
      filteredMessages = allMessages.filter(msg => !msg.is_replied);
    } else if (currentTab === 'replied') {
      filteredMessages = allMessages.filter(msg => msg.is_replied);
    }

    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    setPagedMessages(filteredMessages.slice(startIndex, endIndex));

    // 只有当 total 值发生变化时，才创建新的 pagination 对象
    setPagination(prev => {
      const newTotal = filteredMessages.length;
      if (prev.total !== newTotal) {
        return { ...prev, total: newTotal };
      }
      return prev; // 如果 total 值没变，返回旧的 prev 对象，避免不必要的渲染
    });
  }, [allMessages, currentTab, pagination]);

  const unrepliedCount = useMemo(() => {
    return allMessages.filter(msg => !msg.is_replied).length;
  }, [allMessages]);

  const handleTabChange = (key: string) => {
    setCurrentTab(key as 'all' | 'unreplied' | 'replied');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || prev.pageSize }));
  };

  const showMessageModal = async (messageId: number) => {
    setIsDetailLoading(true);
    setIsModalVisible(true);
    try {
      const response = await getMessageDetail(messageId);
      if (response.code === 200 && response.data) {
        setSelectedMessage(response.data);
      } else {
        message.error('获取消息详情失败');
      }
    } catch (error) {
      message.error('请求消息详情失败');
      console.error(error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleReplySubmit = async (values: ReplyFormValues) => {
    if (!selectedMessage || !userInfo) {
      message.error('无法获取用户信息或消息详情，请刷新重试');
      return;
    }

    setIsReplying(true);
    try {
      const params = {
        responder_id: userInfo.admin_id,
        message_id: selectedMessage.message_id,
        replied_content: values.replied_content,
      };

      const response = await replyMessage(params);

      if (response.code === 200) {
        message.success('回复成功！');
        setIsModalVisible(false);
        fetchAllMessages();
      } else {
        message.error('回复失败');
      }
    } catch (error) {
      message.error('回复失败，请稍后再试');
      console.error('Failed to reply message:', error);
    } finally {
      setIsReplying(false);
    }
  };

  const columns: TableProps<MessageListItem>['columns'] = [
    { title: '消息ID', dataIndex: 'message_id', key: 'message_id', width: 100 },
    { title: '发送者ID', dataIndex: 'sender_id', key: 'sender_id', width: 120 },
    { title: '咨询房源编号', dataIndex: 'property_id', key: 'property_id', width: 150 },
    { title: '发送时间', dataIndex: 'sent_time', key: 'sent_time', width: 180 },
    {
      title: '状态',
      dataIndex: 'is_replied',
      key: 'status',
      width: 100,
      render: (is_replied: boolean) => (
        is_replied ? <Tag color="green">已回复</Tag> : <Tag color="red">未回复</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          {record.is_replied ? (
            <Button icon={<EyeOutlined />} onClick={() => showMessageModal(record.message_id)}>
              查看
            </Button>
          ) : (
            <Button type="primary" icon={<MessageOutlined />} onClick={() => showMessageModal(record.message_id)}>
              回复
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部消息' },
    { key: 'unreplied', label: `未回复 (${unrepliedCount})` },
    { key: 'replied', label: '已回复' },
  ];

  return (
    <Card title="消息管理" >
      <Tabs activeKey={currentTab} onChange={handleTabChange} items={tabItems} style={{ marginBottom: 16 }} />
      <Spin spinning={loading} tip="加载中...">
        <Table
          columns={columns}
          dataSource={pagedMessages}
          pagination={false}
          rowKey="message_id"
          locale={{ emptyText: '暂无消息数据' }}
        />
        <Pagination
          style={{ marginTop: 16, textAlign: 'right' }}
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handleTableChange}
          showSizeChanger
          showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`}
        />
      </Spin>

      <Modal
        title="消息详情与回复"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Spin spinning={isDetailLoading}>
          {selectedMessage && (
            <div style={{ marginBottom: 24 }}>
              <h3>消息详情</h3>
              <p><strong>消息ID:</strong> {selectedMessage.message_id}</p>
              <p><strong>发送者ID:</strong> {selectedMessage.sender_id}</p>
              <p><strong>咨询房源编号:</strong> {selectedMessage.property_id}</p>
              <p><strong>发送时间:</strong> {selectedMessage.sent_time}</p>
              <p><strong>咨询内容:</strong> {selectedMessage.content}</p>
              {selectedMessage.replied_content ? (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <h3>回复信息</h3>
                  <p><strong>回复者ID:</strong> {selectedMessage.responder_id || 'N/A'}</p>
                  <p><strong>回复时间:</strong> {selectedMessage.replied_time || 'N/A'}</p>
                  <p><strong>回复内容:</strong> {selectedMessage.replied_content}</p>
                </div>
              ) : (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                  <h3>回复消息</h3>
                  <Form form={replyForm} onFinish={handleReplySubmit} layout="vertical">
                    <Form.Item
                      name="replied_content"
                      rules={[{ required: true, message: '请输入回复内容' }]}
                    >
                      <TextArea rows={4} placeholder="请输入回复内容" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={isReplying} style={{ float: 'right' }}>
                        回复
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Modal>
    </Card>
  );
};

export default MessageListPage;