import { Property } from "../types/models";

// utils/history.ts
const HISTORY_KEY = 'property_view_history';
const MAX_HISTORY = 20; // 最大保存数量

export function saveViewHistory(property: Property) {
    const historyList: Property[] = wx.getStorageSync(HISTORY_KEY) || [];

    // 去重：如果已存在则移除旧记录
    const filtered = historyList.filter(item => item.property_id !== property.property_id);

    // 添加新记录到开头
    filtered.unshift(property);

    // 控制存储数量
    const trimmedList = filtered.slice(0, MAX_HISTORY);
    wx.setStorageSync(HISTORY_KEY, trimmedList);
};

export function getViewHistory(): Property[] {
    return wx.getStorageSync(HISTORY_KEY) || [];
};