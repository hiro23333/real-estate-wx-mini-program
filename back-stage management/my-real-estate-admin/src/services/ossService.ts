// src/services/ossService.ts
import OSS from 'ali-oss';
import axiosInstance from '../api/axiosInstance';
import { message } from 'antd';
import type { ApiResponseSuccess } from '../types/api';

// 定义 OSS 临时凭证的类型
export interface OssCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  region: string;
  bucket: string;
  endpoint: string;
}

// 定义上传成功后返回的数据类型
export interface OssUploadResponse {
    id: string;
    oss_path: string;
    url: string;
}

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
export const getOssUploadCredentials = async (): Promise<ApiResponseSuccess<OssCredentials>> => {
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
    const response = await axiosInstance.get('/api/oss/upload/credentials');
    const credentials = response.data.data;

    // 假设 STS 凭证默认有效期是1小时，我们可以设置缓存有效期为55分钟
    const expirationTime = Date.now() + 55 * 60 * 1000;
    
    // 更新缓存
    credentialsCache = {
      credentials: credentials,
      expiresAt: expirationTime,
    };

    return response.data;
  } catch (error) {
    // 请求失败时清空缓存，并抛出错误
    credentialsCache = null;
    throw error;
  }
};

/**
 * 图片上传的 customRequest 函数，可复用于所有需要上传图片的页面
 * @param options Upload 组件传递的参数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const customUploadRequest = async (options: any) => {
  const { file, onSuccess, onError } = options;

  try {
    // 现在 response 的类型就是 ApiResponseSuccess<OssCredentials>，可以直接访问 data 属性
    const response = await getOssUploadCredentials();
    const credentials = response.data;

    // 检查 credentials 是否包含所有必需字段
    if (!credentials || !credentials.accessKeyId || !credentials.accessKeySecret) {
      throw new Error('获取OSS临时凭证失败，缺少accessKeyId或accessKeySecret');
    }

    const client = new OSS({
      accessKeyId: credentials.accessKeyId,
      accessKeySecret: credentials.accessKeySecret,
      stsToken: credentials.securityToken,
      region: credentials.region,
      bucket: credentials.bucket,
    });

    const fileExtension = (file as File).name.split('.').pop();
    const objectKey = `real-estate/${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${fileExtension}`;

    const result = await client.put(objectKey, file);

    const uploadResponse: OssUploadResponse = {
        id: result.name,
        oss_path: result.name,
        url: result.url,
    };
    onSuccess(uploadResponse);

  } catch (error) {
    console.error('OSS upload failed:', error);
    // 关键修改：使用类型守卫来安全地处理 error
    if (error instanceof Error) {
        onError(error);
        message.error(`文件上传失败: ${error.message}`);
    } else {
        // 如果 error 不是 Error 类型，则将其转换为字符串
        onError(new Error(String(error)));
        message.error(`文件上传失败: ${String(error) || '未知错误'}`);
    }
  }
};


/**
 * 根据 oss_path 和临时凭证生成一个带签名的临时可访问 URL
 * @param ossPath 文件在OSS上的路径
 * @param expiresSeconds URL的有效期，单位为秒 (默认为1小时)
 * @returns 临时的、可访问的、带签名的 URL
 */
export const getOssSignedUrl = async (
  ossPath: string,
  expiresSeconds: number = 3600,
): Promise<string> => {
  try {
    const response = await getOssUploadCredentials();
    const credentials = response.data;

    if (!credentials || !credentials.accessKeyId || !credentials.accessKeySecret) {
      throw new Error('获取OSS临时凭证失败，缺少accessKeyId或accessKeySecret');
    }

    const client = new OSS({
      accessKeyId: credentials.accessKeyId,
      accessKeySecret: credentials.accessKeySecret,
      stsToken: credentials.securityToken,
      region: credentials.region,
      bucket: credentials.bucket,
    });

    console.log("尝试获得带签名的URL");

    // 使用 signatureUrl 方法生成一个带签名的 URL
    // client.signatureUrl 会自动处理签名和过期时间
    const signedUrl = client.signatureUrl(ossPath, {
      expires: expiresSeconds,
    });

    console.log("获得带签名的URL");
    console.log(signedUrl);
    
    return signedUrl;
    
    
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    message.error('获取图片临时链接失败');
    throw error;
  }
};