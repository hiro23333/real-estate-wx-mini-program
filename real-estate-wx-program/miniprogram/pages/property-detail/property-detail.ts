// pages/property-detail/property-detail.ts
import { getOssSignedUrl } from '../../utils/oss';
import { getPropertyDetail, submitMessage, toggleFavorite } from '../../api/property';
import { PropertyDetail } from '../../types/models';
import Toast from '@vant/weapp/toast/toast';
import { saveViewHistory } from '../../utils/history';

interface DetailPageData {
    propertyDetail: PropertyDetail | null;
    showChatModal: boolean;
    messageContent: string;
}

interface DetailPageMethods {
    onLoad(options: { id: string }): void;
    onToggleFavorite(): void;
    fetchPropertyDetail(id: number): void;
    onChatTap(): void;
    onCloseChatModal(): void;
    onMessageContentChange(e: WechatMiniprogram.CustomEvent): void;
    onSubmitMessage(): void;
    onShareAppMessage(): any;
}

Page<DetailPageData, DetailPageMethods>({
    data: {
        propertyDetail: null,
        showChatModal: false,    // 默认不显示
        messageContent: '',
    },

    onLoad(options: { id: string; }) {
        const propertyId = parseInt(options.id, 10);
        if (propertyId) {
            this.fetchPropertyDetail(propertyId);
        }
    },

    async fetchPropertyDetail(id: number) {
        try {
            const res = await getPropertyDetail(id);
            if (res.code === 0 && res.data) { // **注意：这里增加了 res.data 的非空判断**
                const propertyDetail = res.data;

                const imagesToSign = propertyDetail.images;

                const signedImages = await Promise.all(
                    imagesToSign.map(async (image) => ({
                        ...image,
                        url: await getOssSignedUrl(image.oss_path)
                    }))
                );

                const updatedPropertyDetail = {
                    ...propertyDetail,
                    images: signedImages
                };

                this.setData({ propertyDetail: updatedPropertyDetail });
                saveViewHistory({
                    property_id: propertyDetail.property_id,
                    title: propertyDetail.title,
                    category:propertyDetail.category,
                    area: propertyDetail.area, 
                    price: propertyDetail.price, 
                    publish_time: '',
                    community_id: propertyDetail.community_id,
                    tags: propertyDetail.tags,
                    image_oss_path: propertyDetail.images[0].oss_path
                  });
            }
        } catch (error) {
            console.error('Failed to fetch property detail:', error);
            wx.showToast({ title: '获取房源详情失败', icon: 'none' });
        }
    },

    async onToggleFavorite() {
        const { propertyDetail } = this.data;
        if (!propertyDetail) return;

        const userId = 1;
        const propertyId = propertyDetail.property_id;

        try {
            const res = await toggleFavorite(propertyId, userId);
            if (res.code === 0) {
                const newFavoriteStatus = res.data.favorite;
                this.setData({
                    'propertyDetail.is_favorite': newFavoriteStatus
                });
                wx.showToast({
                    title: newFavoriteStatus ? '收藏成功' : '已取消收藏',
                    icon: 'success'
                });
            }
        } catch (error) {
            console.error('Failed to toggle favorite status:', error);
            wx.showToast({ title: '操作失败', icon: 'none' });
        }
    },
    // 点击“聊一下”按钮
    onChatTap() {

        if (!wx.getStorageSync('userInfo')) {
            wx.navigateTo({ url: '/pages/login/login' });
        } else {
            this.setData({ showChatModal: true });
        }

    },

    // 关闭模态框
    onCloseChatModal() {
        this.setData({
            showChatModal: false,
            messageContent: '' // 关闭时清空内容
        });
    },

    // 监听输入框内容变化
    onMessageContentChange(e) {
        this.setData({
            messageContent: e.detail as unknown as string
        });
    },

    // 提交咨询内容
    async onSubmitMessage() {
        const { propertyDetail, messageContent } = this.data;
        if (!propertyDetail) return;

        // 验证咨询内容是否为空
        if (!messageContent.trim()) {
            Toast.fail('请输入咨询内容');
            return;
        }

        const userId = wx.getStorageSync('userInfo.user_id');
        const propertyId = propertyDetail.property_id;

        Toast.loading({
            message: '提交中...',
            forbidClick: true,
            duration: 0
        });

        try {
            const res = await submitMessage(propertyId, messageContent, userId);
            Toast.clear();
            if (res.code === 0) {
                Toast.success('提交成功，稍后客服会联系您');
                this.onCloseChatModal(); // 提交成功后关闭模态框
            } else {
                Toast.fail(res.message || '提交失败');
            }
        } catch (error) {
            Toast.clear();
            console.error('提交咨询失败:', error);
            Toast.fail('提交失败，请稍后再试');
        }
    },
    onShareAppMessage() {
        const { propertyDetail } = this.data;
        if (!propertyDetail) {
            return {};
        }

        const propertyId = propertyDetail.property_id;
        const mainImage = propertyDetail.images && propertyDetail.images.length > 0
            ? propertyDetail.images[0].oss_path // 使用第一个图片的签名地址作为分享图
            : ''; // 如果没有图片，则不设置分享图

        return {
            title: `${propertyDetail.title} - ${propertyDetail.price}元`,
            path: `/pages/property-detail/property-detail?id=${propertyId}`, // 分享卡片点击后跳转的路径
            imageUrl: mainImage // 分享卡片的图片
        };
    },
});