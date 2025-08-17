import Toast from '@vant/weapp/toast/toast';
import { User } from '../../types/models';
import request from '../../utils/request';

interface loginResponse extends User {
    token: string;
}


Page({
    data: {
        loading: false
    },


    // 一键登录主逻辑
    async handleLogin() {
        if (this.data.loading) return;
        this.setData({ loading: true });
        Toast.loading({ message: '登录中...', forbidClick: true });

        try {
            // 1. 获取微信登录code
            const loginCode = await this.getLoginCode();

            // 2. 强制获取手机号
            const phoneData = await this.getPhoneNumber();

            // 3. 提交到后端处理用户信息
            const res = await request<loginResponse>({
                url: '/api/login',
                method: 'POST',
                data: {
                    code: loginCode,
                    encryptedData: phoneData.encryptedData,
                    iv: phoneData.iv,
                    skipAuth: true
                }
            });

            if (res.code === 0) {
                Toast.success('登录成功');
                wx.setStorageSync('token', res.data.token);
                wx.setStorageSync('userInfo', {
                    user_id: res.data.user_id,
                    avatar_oss_path: res.data.avatar_oss_path,
                    nickname: res.data.nickname,
                    phone: res.data.phone
                });

            }
        } catch (error) {
            Toast.fail(error.message.includes('拒绝') ? '需授权手机号才能登录' : '登录失败');

        } finally {
            this.setData({ loading: false });
            Toast.clear();
            wx.navigateBack({
                delta: 1,
            });
        }
    },

    // 获取微信登录code
    getLoginCode(): Promise<string> {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => res.code ? resolve(res.code) : reject(new Error('获取登录凭证失败')),
                fail: () => reject(new Error('微信登录失败'))
            });
        });
    },

    // 强制手机号授权（企业认证必需）
    getPhoneNumber(): Promise<{ encryptedData: string; iv: string }> {
        return new Promise((resolve, reject) => {
            wx.showModal({
                title: '授权提示',
                content: '需要手机号授权才能完成登录',
                confirmText: '立即授权',
                success: (res) => {
                    // 这里我们没有授权，所以测试时跳过
                    // if (res.confirm) {
                    //     // 跳转到专门授权页（需企业认证）
                    //     wx.navigateTo({
                    //         url: '/pages/phone-auth/index',
                    //         events: {
                    //             accept: (data: any) => resolve(data),
                    //             reject: () => reject(new Error('用户拒绝授权手机号'))
                    //         }
                    //     });
                    // } else {
                    //     reject(new Error('用户拒绝授权手机号'));
                    // }
                    resolve({ encryptedData: "dauiwdaw", iv: "123ycjcska" });
                }
            });
        });
    }
});