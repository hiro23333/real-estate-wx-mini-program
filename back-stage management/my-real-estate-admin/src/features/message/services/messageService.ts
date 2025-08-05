// // src/features/message/services/messageService.ts
// import axiosInstance from '../../../api/axiosInstance';
// import type { ApiResponseSuccess, ApiResponseList } from '../../../types/api';
// import type { MessageDetail, MessageListItem, ReplyMessageParams } from '../types';

// /**
//  * 获取消息列表
//  * @returns Promise<ApiResponseList<Message>>
//  */
// export const getMessages = (): Promise<ApiResponseList<MessageListItem>> => {
//   // 根据新接口设计，此接口不接受任何参数
//   return axiosInstance.post('/api/admin/message/list');
// };

// /**
//  * 获取留言详情
//  * @param message_id 消息ID
//  * @returns Promise<ApiResponseSuccessWithData<Message>>
//  */
// export const getMessageDetail = (message_id: number): Promise<ApiResponseSuccess<MessageDetail>> => {
//   // 新接口：POST /api/admin/message/detail
//   return axiosInstance.post('/api/admin/message/detail', { message_id });
// };

// /**
//  * 回复留言
//  * @param message_id 消息ID
//  * @param replied_content 回复内容
//  * @returns Promise<ApiResponseSuccess>
//  */
// export const replyMessage = (params:ReplyMessageParams): Promise<ApiResponseSuccess<MessageDetail>> => {
//   // 新接口：POST /api/admin/message/reply
//   return axiosInstance.post('/api/admin/message/reply', params);
// };




//模拟后端响应
// src/features/message/services/messageService.ts
import type { ApiResponseList, ApiResponseSuccess} from '../../../types/api';
import type { MessageListItem, MessageDetail, ReplyMessageParams } from '../types';

// 获取消息列表（已模拟）
export const getMessages = (): Promise<ApiResponseList<MessageListItem>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        code: 200,
        message: 'success',
        data: {
          list: [
            { message_id: 1, property_id: 101, sender_id: 201, sent_time: '2025-07-28 10:00:00', is_replied: false },
            { message_id: 2, property_id: 102, sender_id: 202, sent_time: '2025-07-28 11:00:00', is_replied: true },
            { message_id: 3, property_id: 101, sender_id: 203, sent_time: '2025-07-28 12:00:00', is_replied: false },
            { message_id: 4, property_id: 103, sender_id: 204, sent_time: '2025-07-28 13:00:00', is_replied: false },
            { message_id: 5, property_id: 104, sender_id: 205, sent_time: '2025-07-28 14:00:00', is_replied: true },
            // ... 更多模拟数据
          ]
        }
      };
      resolve(mockData);
    }, 500);
  });
};

// 获取留言详情（已模拟）
export const getMessageDetail = (message_id: number): Promise<ApiResponseSuccess<MessageDetail>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockDetail: MessageDetail = {
        message_id,
        property_id: 101,
        sender_id: 201,
        content: `这是一条消息的详细内容，ID为 ${message_id}。`,
        sent_time: '2025-07-28 10:00:00',
        responder_id: message_id === 2 || message_id === 5 ? 1 : null,
        replied_content: message_id === 2 || message_id === 5 ? `这是一条回复内容，针对ID为 ${message_id} 的消息。` : null,
        replied_time: message_id === 2 || message_id === 5 ? '2025-07-28 15:00:00' : null,
      };
      resolve({ code: 200, message: 'success', data: mockDetail });
    }, 500);
  });
};

/**
 * 修改：回复留言（已模拟后端响应）
 * @param payload 包含 message_id, replied_content 和 responder_id
 * @returns Promise<ApiResponseSuccess>
 */
export const replyMessage = (payload: ReplyMessageParams): Promise<ApiResponseSuccess<ReplyMessageParams>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (payload.message_id > 0 && payload.replied_content && payload.responder_id) {
        resolve({ code: 200, message: '回复成功', data:payload });
      } else {
        reject({ response: { data: { code: 400, message: '参数错误' } } });
      }
    }, 500);
  });
};