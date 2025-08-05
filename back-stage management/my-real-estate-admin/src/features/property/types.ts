// src/features/property/types.ts

import { type UploadFile } from 'antd/lib/upload/interface';

// 新的房源状态枚举，对应数据库 tinyint 类型
export type PropertyStatus = 0 | 1 | 2; // 0下架 1上架 2待审核

// 房源分类枚举
export type PropertyCategory = 'sale' | 'rent' | 'commercial';

// 房源朝向枚举
export type PropertyOrientation = 'north' | 'south' | 'east' | 'west' | 'southeast' | 'northeast' | 'southwest' | 'northwest';

// 社区类型
export interface Community {
  community_id: number;
  name: string;
}

// 标签类型
export interface Tag {
  tag_id: number;
  name: string;
}

// 房源列表项类型
export interface PropertyListItem {
  property_id: number;
  title: string;
  category: PropertyCategory;
  status: PropertyStatus;
  community: string;
  publish_time: string; // 发布时间
  tags: Tag[]; // 标签列表
}

// 图片类型
export interface PropertyImage {
  image_id: string; // Guid
  oss_path: string;
  is_primary: boolean;
  url: string;
  mime_type: string;
  sort_order: number;
}

// 房源详情类型
export interface PropertyDetail {
  property_id: number;
  title: string;
  category: PropertyCategory;
  price: number;
  address: string; // 新增地址字段
  house_type?: string;
  area: number;
  floor?: string;
  orientation?: PropertyOrientation;
  description?: string;
  status: PropertyStatus;
  community_id: number; // 关联的小区ID
  tags: Tag[]; // 关联的标签列表
  images: PropertyImage[]; // 图片列表
}

// 新增/编辑房源的请求体类型
export interface PropertyFormPayload {
  property_id?: number;
  title: string;
  category: PropertyCategory;
  address: string;
  price: number;
  house_type?: string;
  area: number;
  floor?: string;
  orientation?: PropertyOrientation;
  description?: string;
  status: PropertyStatus;
  community_id: number;
  tag_ids: number[];
  images: PropertyImage[]; // 后端期望的图片列表类型
}



// 房源表单值类型，用于 react-hook-form
export interface PropertyFormValues {
  property_id?: number;
  title: string;
  category: PropertyCategory;
  address: string; // 新增地址字段
  price: number;
  house_type?: string;
  area: number;
  floor?: string;
  orientation?: PropertyOrientation;
  description?: string;
  status: PropertyStatus;
  community_id: number;
  tag_ids: number[]; // 表单中只传标签ID数组
  images: UploadFile[]; // 上传组件的文件列表
}

// 更新房源状态的请求参数
export interface PropertyUpdateStatusPayload {
  property_id: number;
  status: PropertyStatus;
}

// 删除房源的请求参数
export interface PropertyDeletePayload {
  property_id: number;
}

export interface PropertyTag {
  tag_id: number;
  name: string;
}