// api/property.ts
import request from '../utils/request';
import { ApiResponse } from '../types/api';
import { Banner, Community, Property, PropertyDetail, SubmitPropertyParams, Tag } from '../types/models';

/**
 * 获取 Banner 列表
 */
export const getBannerList = (): Promise<ApiResponse<Banner[]>> => {
    return request<Banner[]>({
        url: '/api/banner/list',
        method: 'POST'
    });
};

interface GetPropertyListParams {
    page: number;
    pageSize: number;
    category?: 'sale' | 'rent' | 'commercial';
    keyword?: string; // 房源标题搜索
    community_id?: number;
    tag_ids?: number[];
    sort_by?: 'default' | 'latest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
}

/**
 * 获取房源列表
 */
export const getPropertyList = (params: GetPropertyListParams): Promise<ApiResponse<Property[]>> => {
    return request<Property[]>({ // ✅ 正确
        url: '/api/property/list',
        method: 'POST',
        data: params
    });
};


/**
 * 获取收藏房源列表
 */
export const getFavoritePropertyList = (params: GetPropertyListParams): Promise<ApiResponse<Property[]>> => {
    return request<Property[]>({ // ✅ 正确
        url: '/api/favorite/list',
        method: 'POST',
        data: params,
        needAuth:true,
    });
};

/**
 * 获取房源详情
 */
export const getPropertyDetail = (property_id: number): Promise<ApiResponse<PropertyDetail>> => {
    return request<PropertyDetail>({ // ✅ 正确
        url: '/api/property/detail',
        method: 'POST',
        data: { property_id }
    });
};






/**
 * 提交房源信息
 */
export const submitProperty = (params: SubmitPropertyParams): Promise<ApiResponse<any>> => {
    return request<any>({ // ✅ 正确
        url: '/api/property/submitByUser',
        method: 'POST',
        data: params,
        needAuth:true,
    });
};

// 上传房源图片到后端（由后端统一传OSS）
export const uploadPropertyImages = async (tempFilePaths: string[]) => {
    const uploadedImages: SubmitPropertyParams['images'] = [];

    for (const filePath of tempFilePaths) {
        try {
            const uploadRes = await new Promise<WechatMiniprogram.UploadFileSuccessCallbackResult>((resolve, reject) => {
                wx.uploadFile({
                    url: 'http://localhost:3001/api/upload/property-image',
                    filePath,
                    name: 'image',
                    formData: {
                        is_primary: uploadedImages.length === 0, // 第一张设为主图
                        sort_order: uploadedImages.length
                    },
                    header: {
                        'Authorization': `Bearer ${wx.getStorageSync('token')}`
                    },
                    success: resolve,
                    fail: reject
                });
            });

            const data = JSON.parse(uploadRes.data);
            if (data.code === 0) {
                uploadedImages.push(data.data);
            }
        } catch (error) {
            console.error('图片上传失败:', error);
            wx.showToast({ title: `图片${uploadedImages.length + 1}上传失败`, icon: 'none' });
        }
    }

    return uploadedImages;
};

// 提交房源表单
export const submitPropertyForm = async (formData: Omit<SubmitPropertyParams, 'images'>, tempImages: string[]) => {
    try {
        wx.showLoading({ title: '上传图片中...' });

        // 1. 先上传所有图片
        const images = await uploadPropertyImages(tempImages);
        if (images.length === 0) throw new Error('至少需要一张图片');

        // 2. 提交完整数据
        const res = await submitProperty({ ...formData, images });

        wx.showToast({ title: '提交成功' });
        return res;
    } catch (error) {
        wx.showToast({ title: error.message, icon: 'none' });
        throw error;
    } finally {
        wx.hideLoading();
    }
};



/**
 * 收藏/取消收藏房源
 * @param property_id 房源ID
 * @param user_id 用户ID
 * @returns 收藏/取消收藏结果
 */
export const toggleFavorite = (property_id: number, user_id: number): Promise<ApiResponse<{ favorite: boolean }>> => {
    return request<{ favorite: boolean }>({ // ✅ 正确
        url: '/api/favorite/toggle',
        method: 'POST',
        data: { user_id, property_id },
        needAuth:true,
    });
};

/**
 * 提交房源咨询
 * @param property_id 房源ID
 * @param content 咨询内容
 * @param user_id 用户ID
 * @returns 提交结果
 */
export const submitMessage = (property_id: number, content: string, user_id: number): Promise<ApiResponse<any>> => {
    return request<any>({ // ✅ 正确
        url: '/api/message/submit',
        method: 'POST',
        data: { user_id, property_id, content },
        needAuth: true,
    });
};


/**
 * 获取所有标签列表
 * 接口路径为 /api/tags
 */
export const getTagList = (): Promise<ApiResponse<Tag[]>> => {
    return request<Tag[]>({ // ✅ 正确
        url: '/api/tags',
        method: 'POST',
    });
};

/**
 * 获取所有小区列表
 * 接口路径为 /api/community
 */
export const getCommunityList = (): Promise<ApiResponse<Community[]>> => {
    return request<Community[]>({ // ✅ 正确
        url: '/api/community',
        method: 'POST',
    });
};
