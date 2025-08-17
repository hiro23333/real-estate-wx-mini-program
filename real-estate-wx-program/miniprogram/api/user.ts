import { ApiResponse } from "../types/api";
import { User } from "../types/models";
import request from "../utils/request";

/**
 * 修改用户信息
 */
export const updateUserInfo = (params: User): Promise<ApiResponse<any>> => {
    return request<User>({
        url: '/api/updateUserInfo',
        method: 'POST',
        data: params
    });
};

/**
 * 退出登录
 */
export const logout = (): Promise<ApiResponse<any>> => {
    return request<any>({ 
      url: '/api/logout',
      method: 'POST',
      needAuth:true,
    });
  };
