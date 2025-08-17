// utils/request.ts

import { ApiResponse } from '../types/api';
import Toast from '@vant/weapp/toast/toast';

const BASE_URL = 'http://localhost:3001';

interface RequestOptions extends WechatMiniprogram.RequestOption {
  needAuth?: boolean;
}

const request = <T = any>(options: RequestOptions): Promise<ApiResponse<T>> => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');

    if(options.needAuth){
        if(!token){
            wx.navigateTo({ url: '/pages/login/login' });
        } else{
            options.header = {
                ...options.header,
                'Authorization': `Bearer ${token}`
              };
        }
    }

    wx.request({
      ...options,
      url: BASE_URL + options.url,
      success: (res: WechatMiniprogram.RequestSuccessCallbackResult) => {
        // 在 success 中处理 statusCode
        if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          Toast.fail('登录过期，请重新登录');
          setTimeout(() => {
            wx.navigateTo({ url: '/pages/login/login' });
          }, 1500);
          reject(res); // 终止 promise
          return;
        }

        const apiResponse = res.data as ApiResponse<T>;
        if (apiResponse.code === 0) {
          resolve(apiResponse);
        } else {
          Toast.fail(apiResponse.message || '请求失败');
          reject(apiResponse);
        }
      },
      fail: (err: WechatMiniprogram.GeneralCallbackResult) => {
        // 网络请求失败，不包含 statusCode
        Toast.fail('网络请求失败，请稍后重试');
        reject(err);
      }
    });
  });
};

export default request;