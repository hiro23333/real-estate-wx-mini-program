// utils/oss.ts
import request from './request'; // 使用我们自己的 request 封装
import Toast from '@vant/weapp/toast/toast'; // 引入 Vant Weapp Toast
import { ApiResponse } from '../types/api';
import { OssCredentials } from '../types/models';

// 定义凭证缓存的类型
interface CredentialsCache {
    credentials: OssCredentials;
    expiresAt: number; // 凭证过期的时间戳
}

// 在模块作用域中定义一个缓存变量
let credentialsCache: CredentialsCache | null = null;

/**
 * 从后端获取 OSS 上传临时凭证
 * 实现了缓存机制，避免频繁请求
 */
export const getOssUploadCredentials = async (): Promise<ApiResponse<OssCredentials>> => {
    // 检查缓存是否有效且未过期 (我们提前5分钟刷新凭证，避免过期时的请求失败)
    if (credentialsCache && credentialsCache.expiresAt > Date.now() + 5 * 60 * 1000) {
        // 如果缓存有效，则直接返回
        return Promise.resolve({
            code: 0,
            message: 'success',
            data: credentialsCache.credentials,
        });
    }

    // 如果缓存无效或已过期，则发起新的网络请求
    try {
        const response = await request<OssCredentials>({
            url: '/api/user/oss/upload/credentials',
            method: 'GET',
        });
        const credentials = response.data;

        // 假设 STS 凭证默认有效期是1小时，我们可以设置缓存有效期为55分钟
        const expirationTime = Date.now() + 55 * 60 * 1000;

        // 更新缓存
        credentialsCache = {
            credentials: credentials,
            expiresAt: expirationTime,
        };

        return response;
    } catch (error) {
        // 请求失败时清空缓存，并抛出错误
        credentialsCache = null;
        throw error;
    }
};

/**
 * 从后端获取带签名的临时可访问 URL
 * @param ossPath 文件在OSS上的路径
 * @returns 临时的、可访问的、带签名的 URL
 */
export const getOssSignedUrl = async (ossPath: string): Promise<string> => {
    if (!ossPath) {
        return ''; // 或者返回一个默认占位图
    }
    if (ossPath==='real-estate/1754417659021-o6auo17dd.png') {
        return "/assets/image/house.jpg"; // 模拟
    }

    try {
        // 调用后端 API，让后端使用 ali-oss SDK 生成签名 URL
        const response = await request<{ signedUrl: string }>({
            url: '/api/user/oss/get-signed-url', // 这是我们新的后端 API 接口
            method: 'GET',
            data: {
                ossPath: ossPath,
            },
        });

        if (response.code === 0 && response.data && response.data.signedUrl) {
            return response.data.signedUrl;
        } else {
            throw new Error('从后端获取签名 URL 失败');
        }
    } catch (error) {
        console.error('Failed to get signed URL:', error);
        Toast.fail('获取图片临时链接失败'); // 使用 Vant Weapp Toast
        // 根据实际情况，这里可以返回一个空的URL或者一个占位图的URL
        return '';
    }
};


/**
 * 将本地文件上传到 OSS
 * @param filePath 本地文件路径
 * @param ossFileName 上传到OSS后的文件名（或完整路径）
 * @returns 上传成功后返回的完整 OSS 路径
 */
export const uploadFileToOss = async (filePath: string, ossFileName: string): Promise<string> => {
    try {
        const response = await getOssUploadCredentials();
        const credentials = response.data;

        if (!credentials) {
            throw new Error('获取OSS临时凭证失败');
        }

        const { accessKeyId, securityToken, bucket, region } = credentials;

        // 使用小程序的 wx.uploadFile API 进行上传
        await new Promise<WechatMiniprogram.UploadFileSuccessCallbackResult>((resolve, reject) => {
            wx.uploadFile({
                url: `https://${bucket}.${region}.aliyuncs.com`, // 替换为你的 OSS 上传 endpoint
                filePath: filePath,
                name: 'file', // 必须是 file
                formData: {
                    key: ossFileName,
                    policy: credentials.policy,
                    OSSAccessKeyId: accessKeyId,
                    success_action_status: '200', // 确保上传成功后返回 200
                    'x-oss-security-token': securityToken, // STS 凭证的 token
                    signature: credentials.signature, // 签名
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        resolve(res);
                    } else {
                        reject(new Error(`上传失败，状态码: ${res.statusCode}`));
                    }
                },
                fail: (err) => {
                    reject(err);
                },
            });
        });

        // 上传成功，返回完整的 OSS 路径
        return ossFileName;

    } catch (error) {
        console.error('Failed to upload file to OSS:', error);
        Toast.fail('文件上传失败');
        throw error;
    }
};