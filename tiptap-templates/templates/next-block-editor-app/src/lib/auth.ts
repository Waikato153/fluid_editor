import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

// 从Authorization header中解析用户信息
export function parseAuthHeader(authHeader: string | null): User | null {
  if (!authHeader) {
    return null;
  }

  try {
    // 支持 Basic auth 格式: "Basic base64(token:jwt)"
    if (authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [token, type] = credentials.split(':');
      
      if (type === 'jwt') {
        return parseJWT(token);
      }
    }
    
    // 支持 Bearer token 格式: "Bearer token"
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return parseJWT(token);
    }

    return null;
  } catch (error) {
    console.error('Error parsing auth header:', error);
    return null;
  }
}

// 解析JWT token
export function parseJWT(token: string): User | null {
  try {
    // 如果设置了JWT密钥，则验证token
    if (process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
      return {
        id: decoded.sub || decoded.id || decoded.user_id || 'anonymous',
        name: decoded.name,
        email: decoded.email,
        ...decoded
      };
    } else {
      // 如果没有密钥，只解码token (不验证)
      const decoded = jwt.decode(token) as any;
      if (decoded) {
        return {
          id: decoded.sub || decoded.id || decoded.user_id || 'anonymous',
          name: decoded.name,
          email: decoded.email,
          ...decoded
        };
      }
    }
  } catch (error) {
    console.error('Error parsing JWT:', error);
  }
  
  return null;
}

// 生成模拟用户（用于开发和测试）
export function generateMockUser(): User {
  return {
    id: 'user_' + Math.random().toString(36).substring(2, 15),
    name: 'Test User',
    email: 'test@example.com'
  };
} 