// // src/features/statistics/services/statisticsService.ts
// import axiosInstance from '../../../api/axiosInstance';
// import type { ApiResponseSuccess } from '../../../types/api';

// // 定义统计概览数据类型
// export interface StatsOverview {
//   users: number; // 用户总数
//   properties: number; // 房源总数
//   consultations: number; // 咨询总数 (图中的 consultations 应该是留言/咨询)
//   replies: number; // 回复总数 (留言的回复数)
// }

// // 定义请求参数类型
// export interface StatsRequestParams {
//   period: 'daily' | 'weekly' | 'monthly'; // 统计周期
// }

// /**
//  * 获取统计概览数据
//  * @param params { period: 'daily' | 'weekly' | 'monthly' }
//  * @returns Promise<ApiResponseSuccess<StatsOverview>>
//  */
// export const getStatsOverview = (params: StatsRequestParams): Promise<ApiResponseSuccess<StatsOverview>> => {
//   return axiosInstance.post('/api/admin/stats', params);
// };


//模拟后端响应
import type { ApiResponseSuccess } from '../../../types/api';

// 定义统计概览数据类型
export interface StatsOverview {
  users: number; // 用户总数
  properties: number; // 房源总数
  consultations: number; // 咨询总数 (图中的 consultations 应该是留言/咨询)
  replies: number; // 回复总数 (留言的回复数)
}

// 定义请求参数类型
export interface StatsRequestParams {
  period: 'daily' | 'weekly' | 'monthly'; // 统计周期
}

/**
 * 模拟获取统计概览数据
 * @param params { period: 'daily' | 'weekly' | 'monthly' }
 * @returns Promise<ApiResponseSuccess<StatsOverview>>
 */
export const getStatsOverview = (params: StatsRequestParams): Promise<ApiResponseSuccess<StatsOverview>> => {
  console.log('模拟获取统计概览数据，周期：', params.period);

  let mockData: StatsOverview;
  switch (params.period) {
    case 'daily':
      mockData = {
        users: 15,
        properties: 5,
        consultations: 20,
        replies: 12,
      };
      break;
    case 'weekly':
      mockData = {
        users: 80,
        properties: 25,
        consultations: 110,
        replies: 75,
      };
      break;
    case 'monthly':
      mockData = {
        users: 350,
        properties: 120,
        consultations: 450,
        replies: 310,
      };
      break;
    default:
      // 默认返回 monthly 数据
      mockData = {
        users: 350,
        properties: 120,
        consultations: 450,
        replies: 310,
      };
      break;
  }

  // 模拟 API 请求的延迟
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        message: 'Success',
        data: mockData,
      });
    }, 500);
  });
};