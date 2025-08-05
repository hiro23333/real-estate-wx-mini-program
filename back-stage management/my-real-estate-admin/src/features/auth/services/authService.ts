// // src/features/auth/services/authService.ts
// import axiosInstance from '../../../api/axiosInstance';
// import type { ApiResponseSuccess} from '../../../types/api';
// import type { ChangePasswordPayload, LoginPayload, LoginResponseData } from '../types';

// /**
//  * 管理员登录接口
//  * @param payload 包含用户名和密码
//  * @returns Promise<ApiResponseSuccessWithData<LoginResponseData>>
//  */
// export const adminLogin = (payload: LoginPayload): Promise<ApiResponseSuccess<LoginResponseData>> => {
//   return axiosInstance.post('/api/admin/login', payload);
// };

// // 假设我们还需要一个登出接口，尽管目前没有提供
// export const adminLogout = (): Promise<ApiResponseSuccess<LoginResponseData>> => {
//   // 实际登出可能需要后端清除会话或使 token 失效
//   // 这里仅为示例，实际项目中可能不需要发送请求，只需前端清除 token
//   return axiosInstance.post('/api/admin/logout');
// };

// // 新增：修改密码接口
// // 自行设计接口为 POST /api/admin/change-password
// export const changeAdminPassword = (payload: ChangePasswordPayload): Promise<ApiResponseSuccess<ChangePasswordPayload>> => {
//   return axiosInstance.post('/api/admin/change-password', payload);
// };

//模拟

// src/features/auth/services/authService.ts
import type { ApiResponseSuccess } from '../../../types/api';
import type { LoginPayload, LoginResponseData, ChangePasswordPayload } from '../types';

/**
 * 管理员登录接口（已模拟后端响应）
 * @param payload 包含用户名和密码
 * @returns Promise<ApiResponseSuccessWithData<LoginResponseData>>
 */
export const adminLogin = (payload: LoginPayload): Promise<ApiResponseSuccess<LoginResponseData>> => {
  // 模拟后端请求，延迟 1 秒
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟登录成功的条件：用户名 'admin' 和密码 '123456'
      if (payload.username === 'admin' && payload.password === '123456') {
        const mockResponse: ApiResponseSuccess<LoginResponseData> = {
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock-admin-token-1234567890', // 模拟的 token
            admin_id: 1,
            username: 'admin',
          },
        };
        resolve(mockResponse);
      } else {
        // 模拟登录失败
        const mockErrorResponse = {
          code: 401,
          message: '用户名或密码错误',
        };
        reject({ response: { data: mockErrorResponse } }); // 模拟 axios 错误响应
      }
    }, 1000); // 模拟网络延迟
  });
};

/**
 * 登出接口（已模拟后端响应）
 */
export const adminLogout = (): Promise<ApiResponseSuccess<LoginResponseData>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: '登出成功',
        data: {
            token: 'mock-admin-token-1234567890', // 模拟的 token
            admin_id: 1,
            username: 'admin',
          },
      });
    }, 500);
  });
};

/**
 * 修改密码接口（已模拟后端响应）
 * @param payload 包含旧密码和新密码
 * @returns Promise<ApiResponseSuccess>
 */
export const changeAdminPassword = (payload: ChangePasswordPayload): Promise<ApiResponseSuccess<ChangePasswordPayload>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟密码修改成功的条件：旧密码为 '123456'
      if (payload.old_password === '123456') {
        const mockResponse: ApiResponseSuccess<ChangePasswordPayload> = {
          code: 200,
          message: '密码修改成功',
          data: {
            new_password:"111222", // 模拟的 token
            old_password:"123456",
          },
        };
        resolve(mockResponse);
      } else {
        const mockErrorResponse = {
          code: 400,
          message: '旧密码不正确',
        };
        reject({ response: { data: mockErrorResponse } });
      }
    }, 1000); // 模拟网络延迟
  });
};