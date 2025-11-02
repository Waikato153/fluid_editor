// lib/config.ts
export interface AppConfig {
  id: string;
  name: string;
  collabAppId: string;
  aiSecret?: string;
  convertSecret?: string;
  collabSecret?: string;
}

// 预定义的App配置
export const APP_CONFIGS: Record<string, AppConfig> = {
  'default': {
    id: 'default',
    name: 'Default App',
    collabAppId: process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID || '',
    aiSecret: process.env.TIPTAP_AI_SECRET,
    convertSecret: process.env.TIPTAP_CONVERT_SECRET,
    collabSecret: process.env.TIPTAP_COLLAB_SECRET,
  },
  'app1': {
    id: 'app1',
    name: 'App 1',
    collabAppId: process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID_1 || '',
    aiSecret: process.env.TIPTAP_AI_SECRET_1,
    convertSecret: process.env.TIPTAP_CONVERT_SECRET,
    collabSecret: process.env.TIPTAP_COLLAB_SECRET_1,
  },
  // 'app2': {
  //   id: 'app2',
  //   name: 'App 2',
  //   collabAppId: process.env.NEXT_PUBLIC_TIPTAP_COLLAB_APP_ID_2 || '',
  //   aiSecret: process.env.TIPTAP_AI_SECRET_2,
  //   convertSecret: process.env.TIPTAP_CONVERT_SECRET_2,
  //   collabSecret: process.env.TIPTAP_COLLAB_SECRET_2,
  // },
  // 可以添加更多App配置
};

// 获取当前App配置
export const getCurrentAppConfig = (appId?: string): AppConfig => {
  const currentAppId = appId || 'default';
  return APP_CONFIGS[currentAppId] || APP_CONFIGS['default'];
};

// 获取所有可用的App配置
export const getAvailableApps = (): AppConfig[] => {
  return Object.values(APP_CONFIGS).filter(config =>
    config.collabAppId && config.collabAppId.trim() !== ''
  );
};

// 验证App配置是否有效
export const isValidAppConfig = (config: AppConfig): boolean => {
  return !!(config.collabAppId && config.collabAppId.trim() !== '');
};
