// src/context/AuthProvider.tsx

import React, { useState, type ReactNode, useCallback, useMemo } from 'react';
import { AuthContext } from '../hooks/AuthContext';// 从新文件导入上下文
import type { UserInfo } from '../features/auth/types';

interface AuthState {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    try {
      const storedToken = localStorage.getItem('adminToken');
      const storedAdminId = localStorage.getItem('admin_id');
      const storedUsername = localStorage.getItem('adminUsername');
      
      if (storedToken && storedAdminId && storedUsername) {
        const admin_id = parseInt(storedAdminId, 10);
        if (!isNaN(admin_id)) {
          const userInfo: UserInfo = {
            token: storedToken,
            admin_id: admin_id,
            username: storedUsername,
          };
          return { isAuthenticated: true, userInfo };
        }
      }
    } catch (error) {
      console.error("Failed to load user info from localStorage:", error);
    }
    return { isAuthenticated: false, userInfo: null };
  });

  const login = useCallback((info: UserInfo) => {
    localStorage.setItem('adminToken', info.token);
    localStorage.setItem('admin_id', info.admin_id.toString());
    localStorage.setItem('adminUsername', info.username);
    setAuthState({ isAuthenticated: true, userInfo: info });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('adminUsername');
    setAuthState({ isAuthenticated: false, userInfo: null });
  }, []);

  const value = useMemo(() => ({
    ...authState,
    login,
    logout,
  }), [authState, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};