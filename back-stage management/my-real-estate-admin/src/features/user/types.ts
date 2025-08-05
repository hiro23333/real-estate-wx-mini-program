// src/features/user/types.ts

// 用户列表项
export interface UserListItem {
  user_id: number;
  nickname: string;
  phone: string;
}

// 用户列表请求参数 (前端分页，后端搜索，所以没有page和pageSize)
export interface UserListParams {
  user_id?: number;
  nickname?: string ;
  phone?: string ;
}

// 留言列表项 (来自用户详情接口)
export interface UserMessage {
  message_id: number;
  message_content: string;
  replied_content: string; // 如果未回复，后端返回 "暂未回复"
}

// 备注列表项 (来自用户详情接口)
export interface UserNote {
  remark_index: number; // 备注序号
  admin_username: string; // 备注者昵称
  content: string; // 备注内容
}

// 用户详情
export interface UserDetail {
  user_id: number;
  nickname: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
  last_login_time: string;
  messages: UserMessage[];
  remarks: UserNote[];
}

// 添加用户备注的请求体
export interface AddUserNotePayload {
  user_id: number;
  admin_id: number; // 假设需要管理员id
  content: string;
}