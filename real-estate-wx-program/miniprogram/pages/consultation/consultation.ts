import { Message } from "../../types/models";
import { getMessageList } from "../../api/message";

interface MessagePageData {
  messages: Message[];
  loading: boolean; // 新增加载状态
}

interface MessagePageMethods {
  onShow(): void;
  loadMessage(user_id: number, reset?: boolean): Promise<void>; // 新增reset参数
  onCellTap(e: WechatMiniprogram.TouchEvent): void;
  onPullDownRefresh(): void; // 新增下拉刷新方法
  initLoad(): void
}

Page<MessagePageData, MessagePageMethods>({
  data: {
    messages: [],
    loading: false
  },

  onShow() {
    this.initLoad();
  },

  // 初始化加载（共用逻辑）
  initLoad() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.loadMessage(userInfo.user_id, true); // 重置加载
  },

  // 加载消息（支持重置）
  async loadMessage(user_id: number, reset = false) {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const res = await getMessageList(user_id);
      if (res.code === 0) {
        this.setData({
          messages: reset ? res.data : [...this.data.messages, ...res.data]
        });
      }
    } catch (error) {
      console.error('加载失败', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh(); // 无论成功失败都停止动画
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.initLoad();
  },

  // 点击跳转（保持不变）
  onCellTap(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const propertyId = this.data.messages[index]?.property_id;
    if (propertyId) {
      wx.navigateTo({ 
        url: `/pages/property-detail/property-detail?id=${propertyId}` 
      });
    }
  }
});