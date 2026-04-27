/**
 * 认证 Store 类型定义
 */

/**
 * 用户统计数据
 */
export interface UserStats {
  /** 模型总数 */
  totalModels: number;
  /** 公开模型数 */
  publicModels: number;
  /** 私有模型数 */
  privateModels: number;
  /** 获赞总数 */
  totalLikes: number;
  /** 收藏总数 */
  totalFavorites: number;
  /** 浏览总数 */
  totalViews: number;
  /** 下载总数 */
  totalDownloads: number;
  /** 点赞的模型数 */
  likedModelsCount: number;
  /** 收藏的模型数 */
  favoritedModelsCount: number;
  /** 请求总数 */
  totalRequests: number;
  /** 完成的请求数 */
  completedRequests: number;
  /** 失败的请求数 */
  failedRequests: number;
}

/**
 * 用户信息（匹配后端外部用户服务 UserInfoData 结构）
 */
export interface UserProfile {
  id: string;
  userName: string;
  nickName: string;
  email?: string;
  avatar?: string | null;
  gender?: string;
  createdAt?: number; // Unix 时间戳（秒）
  updatedAt?: number; // Unix 时间戳（秒）
  /** 用户统计数据 */
  stats?: UserStats;
}

/**
 * 认证状态
 */
export interface AuthState {
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 用户信息 */
  user: UserProfile | null;
  /** Token */
  token: string | null;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否正在提交（登录/注册/登出） */
  isSubmitting: boolean;
  /** 是否正在发送验证码 */
  isSendingCode: boolean;
}

/**
 * fetchProfile 返回结果
 */
export interface FetchProfileResult {
  success: boolean;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
}

/**
 * 认证操作
 */
export interface AuthActions {
  /** 发送验证码 */
  sendVerificationCode: (email: string, type: 'login' | 'register') => Promise<boolean>;
  /** 注册 */
  register: (email: string, code: string) => Promise<boolean>;
  /** 登录 */
  login: (email: string, code: string) => Promise<boolean>;
  /** 登出 */
  logout: () => Promise<void>;
  /** 获取用户信息 */
  fetchProfile: () => Promise<FetchProfileResult>;
  /** 检查登录状态 */
  checkAuth: () => Promise<void>;
  /** 重置状态 */
  reset: () => void;
}
