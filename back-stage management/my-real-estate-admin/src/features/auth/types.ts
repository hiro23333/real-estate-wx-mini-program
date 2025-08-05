// src/features/auth/types.ts

// 登录请求参数类型
export interface LoginPayload {
  username: string;
  password: string;
}

// 登录成功响应数据类型
export interface LoginResponseData {
  token: string;
  admin_id: number;
  username: string;
}

// 用户信息存储类型
export interface UserInfo {
  token: string;
  admin_id: number;
  username: string;
}

// 新增：修改密码请求参数类型
export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}