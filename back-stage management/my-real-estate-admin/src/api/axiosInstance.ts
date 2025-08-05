// src/api/axiosInstance.ts
import axios from 'axios';

const axiosInstance = axios.create({
  // 确保这里的 baseURL 指向你的后端服务器地址
  baseURL: 'http://localhost:3001',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：在发送请求前添加认证 token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken'); // 从 localStorage 获取 token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 添加到 Authorization 头
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误响应，例如 token 过期
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果是 401 Unauthorized 错误，可能是 token 过期或无效
      // 清除本地 token 并重定向到登录页
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminId');
      localStorage.removeItem('adminUsername');
      // 注意：这里不能直接使用 useNavigate，因为不在 React 组件中
      // 可以通过 window.location.href 或事件通知来处理
      window.location.href = '/login'; // 重定向到登录页
      // 或者触发一个全局事件，让 AuthProvider 监听并处理
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;