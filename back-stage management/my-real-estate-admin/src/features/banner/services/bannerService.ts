// src/features/banner/services/bannerService.ts
import axiosInstance from '../../../api/axiosInstance';
import type { ApiResponseSuccess, ApiResponseList } from '../../../types/api';

// 定义 Image 类型
export interface Image {
  image_id: string; // GUID
  oss_path: string; // OSS 存储路径
  url: string;
  mime_type: string; // 如 image/jpeg
}

// 修正后的 Banner 数据类型，包含嵌套的 Image 对象
export interface Banner {
  banner_id: number;
  property_id: number;
  image: Image;
}

// 定义保存 Banner 所需的 payload 类型，与 Banner 结构一致
export interface SaveBannerPayloadItem {
  banner_id?: number; // 新增时可选
  property_id: number;
  image: Image;
}

// 模拟后端返回的数据
const mockBannersResponse: ApiResponseList<Banner> = {
  code: 200,
  message: 'success',
  data: {
    list: [
      {
        banner_id: 1,
        property_id: 101,
        image: {
          image_id: "c1f7a0b5-9f2d-4e8c-8c1d-1b9f6f8b6a3f",
          oss_path: "real-estate/1754417659021-o6auo17dd.png",
          url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
          mime_type: "image/jpeg"
        }
      },
      {
        banner_id: 2,
        property_id: 102,
        image: {
          image_id: "d2a9c3e4-5b6f-4d7a-8b9c-2c8e7f1d4a5b",
          oss_path: "real-estate/1754417659021-o6auo17dd.png",
          url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
          mime_type: "image/png"
        }
      },
      {
        banner_id: 3,
        property_id: 103,
        image: {
          image_id: "e3b8d4f6-7a1c-4e0f-9f8e-3d7f9e2c6d4a",
          oss_path: "real-estate/1754417659021-o6auo17dd.png",
          url: "https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png",
          mime_type: "image/jpeg"
        }
      }
    ]
  }
};

/**
 * 模拟获取 Banner 列表信息
 * @returns Promise<ApiResponseList<Banner>>
 */
export const getBanners = (): Promise<ApiResponseList<Banner>> => {
  // 使用 Promise.resolve 模拟异步请求的成功返回
  return Promise.resolve(mockBannersResponse);
};


// /**
//  * 获取 Banner 列表信息
//  * 接口: POST /api/admin/banner
//  * @returns Promise<ApiResponseList<Banner>>
//  */
// export const getBanners = (): Promise<ApiResponseList<Banner>> => {
//   return axiosInstance.post('/api/admin/banner');
// };

/**
 * 保存/更新所有 Banner 配置 (统一接口)
 * 接口: POST /api/admin/banner/upload
 * @param banners 完整的 Banner 列表
 * @returns Promise<ApiResponseSuccess<SaveBannerPayloadItem[]>>
 */
export const saveBanners = (banners: SaveBannerPayloadItem[]): Promise<ApiResponseSuccess<SaveBannerPayloadItem[]>> => {
  const payload = {
    list: banners,
  };
  
  return axiosInstance.post('/api/admin/banner/upload', payload);
};