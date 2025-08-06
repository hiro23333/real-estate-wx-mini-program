// src/features/user/pages/UserListPage.tsx

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Table, Input, Space, Button, message, Modal, Form } from 'antd';
import { EditOutlined, EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { getUserList, getUserDetail, addUserNote } from '../services/userService';
import type { UserListItem, UserDetail, AddUserNotePayload } from '../types';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import { useAuth } from '../../../hooks/useAuth';
import type { FormInstance } from 'antd/lib/form';

// 导入 getOssSignedUrl
import { getOssSignedUrl } from '../../../services/ossService';

const { TextArea } = Input;

interface NoteFormValues {
  content: string;
}

// 搜索表单的类型
interface SearchFormValues {
    userId?: string;
    nickname?: string;
    phone?: string;
}

const UserListPage: React.FC = () => {
  const { userInfo } = useAuth();
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [searchParams, setSearchParams] = useState<SearchFormValues>({});

  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState<boolean>(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);
  const [selectedUserIdForNote, setSelectedUserIdForNote] = useState<number | null>(null);
  const [noteForm] = Form.useForm<NoteFormValues>();

  // 一次性获取所有用户数据
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUserList({});
      if (response.code === 200) {
        setAllUsers(response.data.list);
      } else {
        message.error('获取用户列表失败');
      }
    } catch (error) {
      message.error('请求用户列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // 根据搜索参数在本地过滤数据
  const filteredUsers = useMemo(() => {
    const { userId, nickname, phone } = searchParams;
    let filteredList = allUsers;

    if (userId) {
        filteredList = filteredList.filter(user => user.user_id.toString().includes(userId.trim()));
    }
    if (nickname) {
        filteredList = filteredList.filter(user => user.nickname.toLowerCase().includes(nickname.trim().toLowerCase()));
    }
    if (phone) {
        filteredList = filteredList.filter(user => user.phone.includes(phone.trim()));
    }

    return filteredList;
  }, [allUsers, searchParams]);

  // 当筛选列表变化时，更新总数并重置到第一页
  useEffect(() => {
    setPagination(prev => {
      const newTotal = filteredUsers.length;
      if (prev.total !== newTotal) {
        return { ...prev, total: newTotal, current: 1 };
      }
      return prev;
    });
  }, [filteredUsers]);

  // 根据当前分页信息，从筛选后的列表中获取当前页的数据
  const pagedUsers = useMemo(() => {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, pagination]);

  // 处理表格分页变化
  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current || prev.current,
      pageSize: newPagination.pageSize || prev.pageSize,
    }));
  };
  
  // 处理搜索表单提交
  const handleSearch = (values: SearchFormValues) => {
      setSearchParams(values);
  };

  // 处理重置搜索
  const handleReset = () => {
      searchForm.resetFields();
      setSearchParams({});
  };

  // 显示用户详情模态框
  const showDetailModal = async (userId: number) => {
    try {
      const response = await getUserDetail(userId);
      if (response.code === 200) {
        setSelectedUserDetail(response.data);
        setIsDetailModalVisible(true);
      } else {
        message.error('获取用户详情失败');
      }
    } catch (error) {
      message.error('请求用户详情失败');
      console.error(error);
    }
  };

  // 显示备注模态框
  const showNoteModal = (userId: number) => {
    setSelectedUserIdForNote(userId);
    setIsNoteModalVisible(true);
    noteForm.resetFields();
  };

  // 提交备注
  const handleNoteSubmit = async (values: NoteFormValues) => {
    if (!selectedUserIdForNote || !userInfo?.admin_id) {
      message.error('无法获取用户信息，请刷新重试');
      return;
    }

    try {
      const payload: AddUserNotePayload = {
        user_id: selectedUserIdForNote,
        admin_id: userInfo.admin_id,
        content: values.content,
      };
      const response = await addUserNote(payload);
      if (response.code === 200) {
        message.success('备注添加成功');
        setIsNoteModalVisible(false);
      } else {
        message.error('备注添加失败');
      }
    } catch (error) {
      message.error('请求备注接口失败');
    }
  };

  // 表格列定义
  const columns: TableColumnsType<UserListItem> = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      sorter: (a, b) => a.user_id - b.user_id,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => showDetailModal(record.user_id)}>
            查看详情
          </Button>
          <Button icon={<EditOutlined />} onClick={() => showNoteModal(record.user_id)}>
            备注
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="用户管理">
      <div style={{ marginBottom: 16 }}>
        <Form
            form={searchForm}
            layout="inline"
            onFinish={handleSearch}
            style={{ marginBottom: 16 }}
        >
            <Form.Item name="userId" label="用户ID">
                <Input placeholder="请输入用户ID" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="nickname" label="用户昵称">
                <Input placeholder="请输入用户昵称" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="phone" label="电话号码">
                <Input placeholder="请输入电话号码" style={{ width: 150 }} />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                        查询
                    </Button>
                    <Button onClick={handleReset} icon={<ReloadOutlined />}>
                        重置
                    </Button>
                </Space>
            </Form.Item>
        </Form>
      </div>
      <Table
        columns={columns}
        dataSource={pagedUsers}
        rowKey="user_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
      />

      {/* 用户详情模态框 */}
      <Modal
        title="用户详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedUserDetail && (
          <UserDetailModal userDetail={selectedUserDetail} />
        )}
      </Modal>

      {/* 备注模态框 */}
      <Modal
        title={`为用户 ${selectedUserIdForNote} 添加备注`}
        open={isNoteModalVisible}
        onCancel={() => setIsNoteModalVisible(false)}
        footer={null}
      >
        <UserNoteModal
          form={noteForm}
          onFinish={handleNoteSubmit}
        />
      </Modal>
    </Card>
  );
};

export default UserListPage;

// 详情展示组件
const UserDetailModal: React.FC<{ userDetail: UserDetail }> = ({ userDetail }) => {
  // 关键修改: 使用状态来存储签名后的 URL
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // 当 userDetail 变化时，异步获取签名 URL
    const fetchSignedUrl = async () => {
      if (userDetail && userDetail.avatar_url) {
        try {
          const url = await getOssSignedUrl(userDetail.avatar_url);
          setSignedAvatarUrl(url);
        } catch (error) {
          console.error('Failed to get signed URL for avatar:', error);
          setSignedAvatarUrl(null); // 获取失败则清空URL
        }
      }
    };
    fetchSignedUrl();
  }, [userDetail]);

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <h3>基本信息</h3>
      <p><strong>用户ID:</strong> {userDetail.user_id}</p>
      <p><strong>昵称:</strong> {userDetail.nickname}</p>
      <p><strong>电话:</strong> {userDetail.phone}</p>
      <p>
        <strong>头像:</strong>
        {signedAvatarUrl ? (
          <img src={signedAvatarUrl} alt="头像" style={{ width: 60, height: 60, borderRadius: '50%' }} />
        ) : (
          <span>加载中...</span>
        )}
      </p>
      <p><strong>创建时间:</strong> {userDetail.created_at}</p>
      <p><strong>最后一次登录时间:</strong> {userDetail.last_login_time}</p>

      <h3 style={{ marginTop: 24 }}>留言列表</h3>
      <Table
        dataSource={userDetail.messages.map((item, index) => ({ ...item, key: item.message_id, index: index + 1 }))}
        columns={[
          { title: '序号', dataIndex: 'index', key: 'index', width: 80 },
          { title: '留言ID', dataIndex: 'message_id', key: 'message_id' },
          { title: '留言内容', dataIndex: 'message_content', key: 'message_content' },
          { title: '回复内容', dataIndex: 'replied_content', key: 'replied_content' },
        ]}
        pagination={false}
        rowKey="message_id"
      />

      <h3 style={{ marginTop: 24 }}>备注列表</h3>
      <Table
        dataSource={userDetail.remarks.map((item, index) => ({ ...item, key: index, index: index + 1 }))}
        columns={[
          { title: '序号', dataIndex: 'index', key: 'index', width: 80 },
          { title: '备注内容', dataIndex: 'content', key: 'content' },
          { title: '备注者昵称', dataIndex: 'admin_username', key: 'admin_username' },
        ]}
        pagination={false}
        rowKey={(record) => record.remark_index.toString()}
      />
    </div>
  );
};

// 备注组件
const UserNoteModal: React.FC<{ form: FormInstance<NoteFormValues>, onFinish: (values: NoteFormValues) => void }> = ({ form, onFinish }) => (
  <Form form={form} onFinish={onFinish} layout="vertical">
    <Form.Item
      name="content"
      label="备注内容"
      rules={[{ required: true, message: '请输入备注内容' }]}
    >
      <TextArea rows={4} placeholder="请输入备注内容" />
    </Form.Item>
    <Form.Item style={{ textAlign: 'right' }}>
      <Button type="primary" htmlType="submit">
        保存备注
      </Button>
    </Form.Item>
  </Form>
);