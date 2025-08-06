// import axiosInstance from '../../../api/axiosInstance';
// import type { ApiResponseSuccess, ApiResponseList } from '../../../types/api';
// import type { Community, Tag } from '../types';

// // 内存缓存变量，用于存储已获取的小区和标签数据
// let communitiesCache: Community[] | null = null;
// let tagsCache: Tag[] | null = null;

// /**
//  * 获取小区列表
//  */
// export const getCommunities = (): Promise<ApiResponseList<Community>> => {
//   // 检查缓存，如果存在则直接返回
//   if (communitiesCache) {
//     return Promise.resolve({
//       code: 200,
//       message: 'success',
//       data: { list: communitiesCache },
//     });
//   }

//   // 缓存不存在，发起网络请求并缓存数据
//   return axiosInstance.post('/api/admin/community/list').then(response => {
//     communitiesCache = response.data.list;
//     return response;
//   });
// };

// /**
//  * 新增/编辑小区
//  * 修改参数类型为 Partial<Community> 以匹配 DictionaryTable 的期望
//  */
// export const addOrEditCommunity = (
//   params: Partial<Community>
// ): Promise<ApiResponseSuccess<Community>> => {
//   if (!params.name) {
//     return Promise.reject(new Error('小区名称不能为空'));
//   }

//   return axiosInstance.post('/api/admin/community/save', {
//     community_id: params.community_id,
//     name: params.name
//   }).then(response => {
//     // 请求成功后，更新小区缓存
//     if (communitiesCache) {
//       const savedCommunity = response.data.data;
//       if (params.community_id) {
//         // 编辑：找到并替换缓存中的旧数据
//         const index = communitiesCache.findIndex(c => c.community_id === savedCommunity.community_id);
//         if (index > -1) {
//           communitiesCache[index] = savedCommunity;
//         }
//       } else {
//         // 新增：将新数据添加到缓存列表
//         communitiesCache.push(savedCommunity);
//       }
//     }
//     return response;
//   });
// };

// /**
//  * 删除小区
//  */
// export const deleteCommunity = (
//   community_id: number
// ): Promise<ApiResponseSuccess<number>> => {
//   return axiosInstance.post('/api/admin/community/delete', { community_id }).then(response => {
//     // 请求成功后，更新小区缓存
//     if (communitiesCache) {
//       communitiesCache = communitiesCache.filter(c => c.community_id !== community_id);
//     }
//     return response;
//   });
// };

// /**
//  * 获取标签列表
//  */
// export const getTags = (): Promise<ApiResponseList<Tag>> => {
//   // 检查缓存，如果存在则直接返回
//   if (tagsCache) {
//     return Promise.resolve({
//       code: 200,
//       message: 'success',
//       data: { list: tagsCache },
//     });
//   }

//   // 缓存不存在，发起网络请求并缓存数据
//   return axiosInstance.post('/api/admin/tag/list').then(response => {
//     tagsCache = response.data.list;
//     return response;
//   });
// };

// /**
//  * 新增/编辑标签
//  * 修改参数类型为 Partial<Tag> 以匹配 DictionaryTable 的期望
//  */
// export const addOrEditTag = (
//   params: Partial<Tag>
// ): Promise<ApiResponseSuccess<Tag>> => {
//   if (!params.name) {
//     return Promise.reject(new Error('标签名称不能为空'));
//   }
  
//   return axiosInstance.post('/api/admin/tag/save', {
//     tag_id: params.tag_id,
//     name: params.name
//   }).then(response => {
//     // 请求成功后，更新标签缓存
//     if (tagsCache) {
//       const savedTag = response.data.data;
//       if (params.tag_id) {
//         // 编辑：找到并替换缓存中的旧数据
//         const index = tagsCache.findIndex(t => t.tag_id === savedTag.tag_id);
//         if (index > -1) {
//           tagsCache[index] = savedTag;
//         }
//       } else {
//         // 新增：将新数据添加到缓存列表
//         tagsCache.push(savedTag);
//       }
//     }
//     return response;
//   });
// };

// /**
//  * 删除标签
//  */
// export const deleteTag = (tag_id: number): Promise<ApiResponseSuccess<number>> => {
//   return axiosInstance.post('/api/admin/tag/delete', { tag_id }).then(response => {
//     // 请求成功后，更新标签缓存
//     if (tagsCache) {
//       tagsCache = tagsCache.filter(t => t.tag_id !== tag_id);
//     }
//     return response;
//   });
// };

// 模拟
import type { ApiResponseSuccess, ApiResponseList } from '../../../types/api';
import type { Community, Tag } from '../types';

// 模拟数据
let mockCommunities: Community[] = [
  { community_id: 1, name: '绿地中心' },
  { community_id: 2, name: '万科新都荟' },
  { community_id: 3, name: '保利天悦' },
];

let mockTags: Tag[] = [
  { tag_id: 101, name: '学区房' },
  { tag_id: 102, name: '地铁口' },
  { tag_id: 103, name: '精装修' },
  { tag_id: 104, name: '带阳台' },
];

// 内存缓存变量
let communitiesCache: Community[] | null = null;
let tagsCache: Tag[] | null = null;

/**
 * 获取小区列表
 */
export const getCommunities = (): Promise<ApiResponseList<Community>> => {
  console.log('模拟获取小区列表...');
  return new Promise((resolve) => {
    setTimeout(() => {
      // 检查缓存，如果存在则直接返回
      if (communitiesCache) {
        resolve({
          code: 200,
          message: 'Success (from cache)',
          data: {
            list: communitiesCache,
          },
        });
      } else {
        // 缓存不存在，读取模拟数据并存入缓存
        communitiesCache = [...mockCommunities];
        resolve({
          code: 200,
          message: 'Success',
          data: {
            list: communitiesCache,
          },
        });
      }
    }, 500);
  });
};

/**
 * 新增/编辑小区
 */
export const addOrEditCommunity = (
  params: Partial<Community>
): Promise<ApiResponseSuccess<Community>> => {
  console.log('模拟新增/编辑小区:', params);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!params.name) {
        return reject({ code: 400, message: '小区名称不能为空' });
      }

      if (params.community_id) {
        // 编辑
        const index = mockCommunities.findIndex(c => c.community_id === params.community_id);
        if (index !== -1) {
          mockCommunities[index].name = params.name;
          // 更新缓存
          if (communitiesCache) {
            communitiesCache[index].name = params.name;
          }
          resolve({
            code: 200,
            message: '编辑小区成功',
            data: mockCommunities[index],
          });
        } else {
          reject({ code: 404, message: '未找到对应的小区' });
        }
      } else {
        // 新增
        const newId = Math.max(...mockCommunities.map(c => c.community_id)) + 1;
        const newCommunity: Community = { community_id: newId, name: params.name };
        mockCommunities.push(newCommunity);
        // 更新缓存
        if (communitiesCache) {
          communitiesCache.push(newCommunity);
        }
        resolve({
          code: 200,
          message: '新增小区成功',
          data: newCommunity,
        });
      }
    }, 500);
  });
};

/**
 * 删除小区
 */
export const deleteCommunity = (
  community_id: number
): Promise<ApiResponseSuccess<number>> => {
  console.log('模拟删除小区:', community_id);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const initialLength = mockCommunities.length;
      mockCommunities = mockCommunities.filter(c => c.community_id !== community_id);
      if (mockCommunities.length < initialLength) {
        // 更新缓存
        if (communitiesCache) {
          communitiesCache = communitiesCache.filter(c => c.community_id !== community_id);
        }
        resolve({
          code: 200,
          message: '删除小区成功',
          data: 123,
        });
      } else {
        reject({ code: 404, message: '未找到对应的小区' });
      }
    }, 500);
  });
};

/**
 * 获取标签列表
 */
export const getTags = (): Promise<ApiResponseList<Tag>> => {
  console.log('模拟获取标签列表...');
  return new Promise((resolve) => {
    setTimeout(() => {
      // 检查缓存，如果存在则直接返回
      if (tagsCache) {
        resolve({
          code: 200,
          message: 'Success (from cache)',
          data: {
            list: tagsCache,
          },
        });
      } else {
        // 缓存不存在，读取模拟数据并存入缓存
        tagsCache = [...mockTags];
        resolve({
          code: 200,
          message: 'Success',
          data: {
            list: tagsCache,
          },
        });
      }
    }, 500);
  });
};

/**
 * 新增/编辑标签
 */
export const addOrEditTag = (
  params: Partial<Tag>
): Promise<ApiResponseSuccess<Tag>> => {
  console.log('模拟新增/编辑标签:', params);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!params.name) {
        return reject({ code: 400, message: '标签名称不能为空' });
      }
      
      if (params.tag_id) {
        // 编辑
        const index = mockTags.findIndex(t => t.tag_id === params.tag_id);
        if (index !== -1) {
          mockTags[index].name = params.name;
          // 更新缓存
          if (tagsCache) {
            tagsCache[index].name = params.name;
          }
          resolve({
            code: 200,
            message: '编辑标签成功',
            data: mockTags[index],
          });
        } else {
          reject({ code: 404, message: '未找到对应的标签' });
        }
      } else {
        // 新增
        const newId = Math.max(...mockTags.map(t => t.tag_id)) + 1;
        const newTag: Tag = { tag_id: newId, name: params.name };
        mockTags.push(newTag);
        // 更新缓存
        if (tagsCache) {
          tagsCache.push(newTag);
        }
        resolve({
          code: 200,
          message: '新增标签成功',
          data: newTag,
        });
      }
    }, 500);
  });
};

/**
 * 删除标签
 */
export const deleteTag = (tag_id: number): Promise<ApiResponseSuccess<number>> => {
  console.log('模拟删除标签:', tag_id);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const initialLength = mockTags.length;
      mockTags = mockTags.filter(t => t.tag_id !== tag_id);
      if (mockTags.length < initialLength) {
        // 更新缓存
        if (tagsCache) {
          tagsCache = tagsCache.filter(t => t.tag_id !== tag_id);
        }
        resolve({
          code: 200,
          message: '删除标签成功',
          data: 111,
        });
      } else {
        reject({ code: 404, message: '未找到对应的标签' });
      }
    }, 500);
  });
};