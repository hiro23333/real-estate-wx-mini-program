// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number): T => {
  // 定义一个状态来存储防抖后的值
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 设置一个定时器，在延迟后更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      // 清除上一个定时器，确保每次值变化时都重新开始计时
      clearTimeout(handler);
    };
  }, [value, delay]); 

  return debouncedValue;
};