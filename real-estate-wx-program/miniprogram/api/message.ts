import { ApiResponse } from "../types/api";
import request from "../utils/request";
import { Message } from "../types/models";


/**
 * 获取 Message 列表
 */
export const getMessageList = (user_id:number): Promise<ApiResponse<Message[]>> => {
    return request<Message[]>({ 
      url: '/api/message/list',
      method: 'POST',
      data:{user_id},
      needAuth:true,
    });
  };
