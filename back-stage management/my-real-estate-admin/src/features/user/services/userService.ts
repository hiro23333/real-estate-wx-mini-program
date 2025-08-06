// src/features/user/services/userService.ts
import type {
  UserListItem,
  UserListParams,
  UserDetail,
  AddUserNotePayload,
} from '../types';

import type { ApiResponseList, ApiResponseSuccess } from '../../../types/api';

// 模拟数据
const mockUserList: UserListItem[] = [
  { user_id: 1, nickname: '张三', phone: '13800138000' },
  { user_id: 2, nickname: '李四', phone: '13912345678' },
  { user_id: 3, nickname: '王五', phone: '13787654321' },
  { user_id: 4, nickname: '赵六', phone: '13601234567' },
  { user_id: 5, nickname: '钱七', phone: '13598765432' },
  { user_id: 6, nickname: '孙八', phone: '13411223344' },
  { user_id: 7, nickname: '周九', phone: '13399887766' },
  { user_id: 8, nickname: '吴十', phone: '13255443322' },
];

const mockUserDetail: UserDetail = {
  user_id: 1,
  nickname: '张三',
  phone: '13800138000',
  avatar_url: 'real-estate/1754417659021-o6auo17dd.png',
  created_at: '2023-01-01 10:00:00',
  last_login_time: '2023-10-27 15:30:00',
  messages: [
    { message_id: 1, message_content: '咨询一下房源A，价格能便宜吗？', replied_content: '暂未回复' },
    { message_id: 2, message_content: '房源B的户型图有吗？', replied_content: '你好，户型图已发送，请查收。' },
  ],
  remarks: [
    { remark_index: 1, admin_username: '管理员A', content: '此用户对房源A感兴趣，价格敏感。' },
    { remark_index: 2, admin_username: '管理员B', content: '已发送房源B的户型图。' },
  ],
};

// 1. 获取用户列表
// 现在假设后端一次性返回所有数据，前端自行处理分页
export const getUserList = async (
  params: UserListParams,
): Promise<ApiResponseList<UserListItem>> => {
  console.log('Fetching all user list with search params:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      // 修复过滤逻辑，使用逻辑与组合多个可选条件
      const filteredList = mockUserList.filter(user => {
        const userIdMatch = !params.user_id || user.user_id.toString().includes(params.user_id.toString());
        const nicknameMatch = !params.nickname || user.nickname.includes(params.nickname);
        const phoneMatch = !params.phone || user.phone.includes(params.phone);
        return userIdMatch && nicknameMatch && phoneMatch;
      });
      
      resolve({
        code: 200,
        message: 'Success',
        data: {
          list: filteredList,
        },
      });
    }, 500);
  });
};

// 2. 获取用户详情
export const getUserDetail = async (user_id: number): Promise<ApiResponseSuccess<UserDetail>> => {
  console.log('Fetching user detail for ID:', user_id);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user_id === 1) {
        resolve({
          code: 200,
          message: 'Success',
          data: mockUserDetail,
        });
      } else {
        reject({ code: 404, message: 'User not found' });
      }
    }, 500);
  });
};

// 3. 添加用户备注
export const addUserNote = async (payload: AddUserNotePayload): Promise<ApiResponseSuccess<AddUserNotePayload>> => {
  console.log('Adding note for user:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '备注添加成功',
        data: payload,
      });
    }, 500);
  });
};