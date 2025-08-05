// src/features/property/services/propertyService.ts

import type { ApiResponseSuccess, ApiResponseList } from '../../../types/api';
import type { 
  PropertyListItem, 
  PropertyDetail, 
  PropertyStatus,
  PropertyCategory,
  PropertyTag,
  PropertyFormPayload
} from '../types';

// 模拟社区和标签数据，用于下拉选项
const MOCK_COMMUNITIES = [
  { community_id: 1, name: '碧海湾' },
  { community_id: 2, name: '都市丽景' },
  { community_id: 3, name: '阳光家园' },
  { community_id: 4, name: '书香门第' },
  { community_id: 5, name: '江畔华庭' },
];

const MOCK_TAGS = [
  { tag_id: 1, name: '学区房' },
  { tag_id: 2, name: '精装' },
  { tag_id: 3, name: '新房' },
  { tag_id: 4, name: '豪宅' },
  { tag_id: 5, name: '别墅' },
];

// 模拟所有房源数据，以支持前端分页
const MOCK_ALL_PROPERTIES_DATA: PropertyDetail[] = Array.from({ length: 50 }, (_, i) => {
  const status: PropertyStatus = i % 5 === 0 ? 0 : i % 5 === 1 ? 2 : 1; // 模拟不同状态
  const category: PropertyCategory = i % 3 === 0 ? 'sale' : i % 3 === 1 ? 'rent' : 'commercial';
  const community = MOCK_COMMUNITIES[i % MOCK_COMMUNITIES.length];
  const tags: PropertyTag[] = [MOCK_TAGS[i % MOCK_TAGS.length], MOCK_TAGS[(i + 1) % MOCK_TAGS.length]];

  return {
    property_id: i + 1,
    title: `房源标题 ${i + 1}`,
    category,
    address: "123",
    price: 500000 + i * 10000,
    house_type: `${(i % 4) + 1}室${(i % 3)}厅`,
    area: 50 + i,
    floor: `${(i % 20) + 1}层`,
    orientation: 'south',
    description: `这是房源 ${i + 1} 的详细描述`,
    status,
    community_id: community.community_id,
    tags,
    images: Array.from({ length: (i % 3) + 1 }, (_, imgIdx) => ({
      image_id: `img-${i}-${imgIdx}`,
      oss_path: `real-estate/1754417659021-o6auo17dd.png`,
      is_primary: imgIdx === 0,
      url: `https://mock-image-url.com/${i}-${imgIdx}.jpg`,
      mime_type: 'image/jpeg',
      sort_order: imgIdx + 1,
    })),
  };
});

/**
 * 获取所有房源列表（模拟）
 * @returns Promise<ApiResponseList<PropertyListItem>>
 */
export const getProperties = (): Promise<ApiResponseList<PropertyListItem>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟返回列表数据，将 PropertyDetail 映射为 PropertyListItem
      const listItems: PropertyListItem[] = MOCK_ALL_PROPERTIES_DATA.map(p => ({
        property_id: p.property_id,
        title: p.title,
        category: p.category,
        status: p.status,
        community: MOCK_COMMUNITIES.find(c => c.community_id === p.community_id)?.name || '未知',
        publish_time: '2025-08-01',
        tags: p.tags,
      }));
      resolve({
        code: 200,
        message: 'success',
        data: {
          list: listItems,
        }
      });
    }, 500);
  });
};

/**
 * 获取房源详情（模拟）
 * @param id 房源ID
 * @returns Promise<ApiResponseSuccessWithData<PropertyDetail>>
 */
export const getPropertyDetail = (id: number): Promise<ApiResponseSuccess<PropertyDetail>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const property = MOCK_ALL_PROPERTIES_DATA.find(p => p.property_id === id);
      if (property) {
        resolve({
          code: 200,
          message: 'success',
          data: property,
        });
      } else {
        reject({
          response: { data: { code: 404, message: '房源未找到' } }
        });
      }
    }, 500);
  });
};

/**
 * 新增/编辑房源（模拟）
 */
export const saveProperty = (payload: PropertyFormPayload): Promise<ApiResponseSuccess<PropertyFormPayload>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('新增/编辑房源:', payload);
      // 模拟成功响应
      resolve({ code: 200, message: '操作成功', data: payload });
    }, 500);
  });
};


/**
 * 更新房源状态（模拟）
 */
export const updatePropertyStatus = (payload: { property_id: number; status: PropertyStatus }): Promise<ApiResponseSuccess<{ property_id: number; status: PropertyStatus }>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`更新房源状态: ID ${payload.property_id}, 状态: ${payload.status}`);
      // 模拟成功响应
      resolve({ code: 200, message: '状态更新成功', data: payload });
    }, 500);
  });
};

/**
 * 删除房源（模拟）
 */
export const deleteProperty = (payload: { property_id: number }): Promise<ApiResponseSuccess<{ property_id: number }>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`删除房源: ID ${payload.property_id}`);
      resolve({ code: 200, message: '删除成功', data: payload });
    }, 500);
  });
};



