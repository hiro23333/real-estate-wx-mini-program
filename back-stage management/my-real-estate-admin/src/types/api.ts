// src/types/api.ts
export interface ApiResponseSuccess<T> {
  code: number; // 例如：200
  message: string; // 例如："成功"
  data: T;
}

export interface ApiResponseList<T> {
  code: number;
  message: string;
  data: {
    list: T[]; // 列表数据
  };
}