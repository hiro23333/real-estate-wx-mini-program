import { getOssSignedUrl } from '../../utils/oss';


Page({
    data: {
        userInfo: {
            avatarUrl: '',
            nickname: '',
            user_id: '',
            phone: ''
        },
        show: false,
    },

    onShow() {
        this.loadUserInfo();
    },


    loadUserInfo() {
        try {
            const userInfo = wx.getStorageSync('userInfo');
            

            if (userInfo) {
                // 如果有OSS路径，转换为实际URL
                if (userInfo.avatar_oss_path) {
                    getOssSignedUrl(userInfo.avatar_oss_path).then(url => {
                        this.setData({
                            'userInfo.avatarUrl': url,
                            'userInfo.nickname': userInfo.nickname,
                            'userInfo.user_id': userInfo.user_id,
                            'userInfo.phone': userInfo.phone
                        });
                    });
                } else {
                    this.setData({ userInfo });
                }
            } else {
                this.setData({ userInfo });
            }
        } catch (e) {
        }
    },

    navigateToSettings() {
        const token = wx.getStorageSync('token');
        if (token) {

            wx.navigateTo({
                url: '/pages/settings/settings'
            });
        } else {
            wx.navigateTo({
                url: '/pages/login/login'
            });
        }

    },

    navigateToFunction(e: WechatMiniprogram.TouchEvent) {
        const type = e.currentTarget.dataset.type;
        let url = '';

        switch (type) {
            case 'myFavorite':
                if (!this.data.userInfo.user_id) {
                    wx.navigateTo({ url: '/pages/login/login' });
                    return;
                } else {
                    wx.navigateTo({ url: '/pages/myFavorite/myFavorite' });
                    return;
                }
                break;
            case 'history':
                url = '/pages/history/history';
                break;
        }

        if (url) {
            wx.navigateTo({ url });
        }
    },

    onShowDialog() {
        this.setData({ show: true })
    },
});