// pages/index/index.ts
import { Property } from '../../types/models';
import { getOssSignedUrl } from '../../utils/oss';
import { getViewHistory } from '../../utils/history';

interface PropertyWithSignedUrl extends Property {
    signedUrl?: string;
}

// --- 定义页面的数据类型 ---
interface IndexPageData {
    properties: PropertyWithSignedUrl[];
}

// --- 定义自定义方法接口 ---
interface IndexPageMethods {
    onLoad(): void;
    loadProperties():void;
    onPropertyTap(e:any):void;
}

Page<IndexPageData, IndexPageMethods>({
    data: {
        properties: [],
    },

    onLoad() {
        this.loadProperties();
    },

    async loadProperties() {
        try {
            const properties=getViewHistory()
            if (properties) {
                const propertiesWithSignedUrls = await Promise.all(
                    properties.map(async (prop) => ({
                        ...prop,
                        signedUrl: await getOssSignedUrl(prop.image_oss_path)
                    }))
                );
                this.setData({
                    properties: propertiesWithSignedUrls
                });
            } else {
                this.setData({ loading: false, finished: true });
            }
        } catch (error) {
            console.error('加载房源失败', error);
            this.setData({ loading: false, finished: true });
        } 
    },

    onPropertyTap(e:any) {
        wx.navigateTo({ url: `/pages/property-detail/property-detail?id=${e.detail.propertyId}` });
    },
});