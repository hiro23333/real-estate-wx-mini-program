import { logout, updateUserInfo } from "../../api/user";
import { getOssSignedUrl } from "../../utils/oss";

Page({
    data: {
        userInfo: {
            avatarUrl: '',
            nickname: '',
            phone: '',
            user_id: 0,
            avatar_oss_path: ''
        },
        canEditPhone: false, // 通常手机号需要验证流程才能修改
        isModified: false    // 标记是否有修改
    },

    onLoad() {
        this.loadUserInfo();
        
    },

    loadUserInfo() {
        try {
            const userInfo = wx.getStorageSync('userInfo');
            if (userInfo) {
                // 处理头像URL
                if (userInfo.avatar_oss_path) {
                    getOssSignedUrl(userInfo.avatar_oss_path).then(url => {
                        this.setData({
                            'userInfo.avatarUrl': url,
                            'userInfo.avatar_oss_path': userInfo.avatar_oss_path,
                            'userInfo.nickname': userInfo.nickname,
                            'userInfo.phone': this.maskPhone(userInfo.phone),
                            'userInfo.user_id': userInfo.user_id
                        });
                    });
                } else {
                    this.setData({
                        userInfo: {
                            avatarUrl: '',
                            avatar_oss_path: '',
                            nickname: userInfo.nickname || '',
                            phone: this.maskPhone(userInfo.phone || ''),
                            user_id: 0
                        }
                    });
                }
            }
        } catch (e) {
            console.error('读取用户信息失败', e);
        }
    },

    // 手机号脱敏显示
    maskPhone(phone: string): string {
        if (!phone || phone.length < 11) return '未绑定手机';
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    },

    // 修改后的头像处理方法
    async onChooseAvatar(e: any) {
        wx.showLoading({ title: '准备头像...' });

        try {
            // 1. 使用 getFileSystemManager 保存文件
            const fs = wx.getFileSystemManager();
            const savedPath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.jpg`;

            await new Promise((resolve, reject) => {
                fs.saveFile({
                    tempFilePath: e.detail.avatarUrl,
                    filePath: savedPath,
                    success: resolve,
                    fail: reject
                });
            });

            // 2. 上传到后端
            await this.uploadAvatar(savedPath);

        } catch (error) {
            wx.showToast({
                title: '头像处理失败',
                icon: 'none'
            });
            console.error('头像保存失败:', error);
        } finally {
            wx.hideLoading();
        }
    },

    // 兼容手动选择图片
    async changeAvatar() {
        try {
            const res = await wx.chooseMedia({
                count: 1,
                mediaType: ['image'],
                sizeType: ['compressed'] // 自动压缩
            });
            this.uploadAvatar(res.tempFiles[0].tempFilePath);
        } catch (error) {
            console.error('选择图片失败:', error);
        }
    },

    // 统一上传逻辑（支持进度显示和错误重试）
    async uploadAvatar(tempFilePath: string) {
        wx.showLoading({
            title: '上传中...',
            mask: true
        });

        try {
            wx.uploadFile({
                url: 'http://localhost:3001/api/upload/avatar',
                filePath: tempFilePath,
                name: 'avatar',
                header: {
                    'Authorization': `Bearer ${wx.getStorageSync('token')}`
                },
                success: (res) => {
                    const data = JSON.parse(res.data);
                    
                    if (data.code === 0) {
                        this.handleUploadSuccess(data);
                    } else {
                        this.handleUploadFail(data.message || '上传失败');
                    }
                },
                fail: () => this.handleUploadFail('网络错误')
            });

        } catch (error) {
            this.handleUploadFail('系统异常');
        }
    },

    // 上传成功处理
    handleUploadSuccess(data: any) {
        // 更新本地数据
        
        const newUserInfo = {
            ...this.data.userInfo,
            avatarUrl: data.data.url,
            avatar_oss_path: data.data.oss_path
        };

        this.setData({
            'userInfo': newUserInfo,
        });
        
        // 立即保存到本地存储
        wx.setStorageSync('userInfo', newUserInfo);

        wx.showToast({
            title: '头像更新成功',
            icon: 'success'
        });
    },

    // 上传失败处理
    handleUploadFail(message: string) {
        wx.showToast({
            title: message,
            icon: 'none',
            duration: 2000
        });
    },

    // 昵称修改
    onNicknameChange(e: WechatMiniprogram.Input) {
        this.setData({
            'userInfo.nickname': e.detail.value,
            isModified: true
        });
    },

    // 手机号修改（这部分类似login，由于没有企业认证所以使用不了）
    onPhoneChange(e: WechatMiniprogram.Input) {
        this.setData({
            'userInfo.phone': e.detail.value,
            isModified: true
        });
    },

    // 保存修改
    async saveChanges() {
        if (!this.data.isModified) return;
        wx.showLoading({ title: '保存中...' });
        try {
            const params = {
                avatar_oss_path: this.data.userInfo.avatar_oss_path,
                nickname: this.data.userInfo.nickname,
                phone: this.data.userInfo.phone,
                user_id: this.data.userInfo.user_id
            };
            const res = await updateUserInfo(params);
            if (res.code === 0 && res.data) {
                wx.setStorageSync('userInfo', {
                    ...params,
                });
                wx.showToast({ title: '保存成功' });
            };
        } catch (error) {
            wx.showToast({ title: '保存失败' });
            console.error('保存失败', error);
        } finally {
            this.setData({ isModified: false });
            wx.hideLoading();
        }
    },

    // 退出登录
    async logout() {
        wx.showLoading({ title: '退出中...' });
        try {

            const res = await wx.showModal({
                title: '提示',
                content: '确定要退出登录吗？',
            });
            if (res.confirm) {
                const apiRes = await logout();
                if (apiRes.code === 0) {
                    this.clearSession();
                    wx.showToast({ title: '已退出', icon: 'success' });
                    wx.navigateBack({
                        delta: 1,
                    });
                }
            }
        } catch (error) {
            console.error('退出失败', error);
            wx.showToast({ title: '退出异常', icon: 'none' });
        }
    },

    // 清理本地会话数据
    clearSession() {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        getApp().globalData.userInfo = null; // 清除全局数据
    },

    onUnload() {
        // 页面卸载时自动保存修改
        if (this.data.isModified) {
            this.saveChanges();
        }
    }
});