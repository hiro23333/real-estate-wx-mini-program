// src/features/message/types.ts

// 消息状态
export type MessageStatus = 'replied' | 'unreplied';

// 用于消息列表的数据类型，对应 /api/admin/message/list 接口返回的数据
// 包含一个 is_replied 字段，不包含详细内容
export interface MessageListItem {
  message_id: number;
  sender_id: number;
  property_id: number;
  sent_time: string; // 消息发送时间
  is_replied: boolean; // 是否已回复
}

// 用于消息详情的数据类型，对应 /api/admin/message/detail 接口返回的数据
// 包含消息的全部字段
export interface MessageDetail {
  message_id: number;
  sender_id: number;
  property_id: number;
  content: string; // 原始咨询内容
  sent_time: string; // 消息发送时间
  responder_id: number | null; // 回复者id，null 表示未回复
  replied_content: string | null; // 回复内容，null 表示未回复
  replied_time: string | null; // 回复时间，null 表示未回复
  // 假设后端在详情接口中也返回了房源标题和发送者昵称，如果没有则需要调整
  property_title: string;
  sender_nickname: string;
}

// 回复消息请求参数
export interface ReplyMessageParams {
  responder_id: number;
  message_id: number;
  replied_content: string;
}

// 在页面组件中，我们可能需要一个包含所有字段的类型，以便于状态管理
export type Message = MessageListItem & Partial<MessageDetail>;