// src/context/AuthContext.ts

import { createContext } from 'react';
import type { UserInfo } from '../features/auth/types';

interface AuthState {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
}

interface AuthContextType extends AuthState {
  login: (userInfo: UserInfo) => void;
  logout: () => void;
}

// 导出上下文对象，可以给一个明确的初始值
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userInfo: null,
  login: () => {},
  logout: () => {},
});