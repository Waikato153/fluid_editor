// lib/tiptapDoc.ts
import axios from 'axios';
import { getCurrentAppConfig } from '@/lib/config';

export interface TiptapDocOptions {
  appId?: string;
}

export interface TiptapDocResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
}

export interface DuplicateDocResult {
  success: boolean;
  sourceExists: boolean;
  targetExists: boolean;
  duplicated: boolean;
  error?: string;
}

/**
 * Tiptap 文档操作工具类
 */
export class TiptapDocManager {
  private appId: string;
  private appConfig: ReturnType<typeof getCurrentAppConfig>;

  constructor(options: TiptapDocOptions = {}) {
    this.appId = options.appId || 'default';
    this.appConfig = getCurrentAppConfig(this.appId);
  }

  /**
   * 获取文档的基础 URL
   */
  private getDocumentUrl(docId: string): string {
    return `https://${this.appConfig.collabAppId}.collab.tiptap.cloud/api/documents/${docId}`;
  }

  /**
   * 检查文档是否存在
   * @param docId - 文档 ID（如 'doc_xxx'）
   * @returns 是否存在
   */
  async exists(docId: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.getDocumentUrl(docId)}?format=yjs`, {
        headers: {
          Authorization: this.appConfig.apiSecret!,
        },
        responseType: 'arraybuffer',
        validateStatus: (status) => status === 200 || status === 404,
      });

      return response.status === 200;
    } catch (error) {
      console.error('Error checking document existence:', error);
      return false;
    }
  }

  /**
   * 获取文档内容
   * @param docId - 文档 ID（如 'doc_xxx'）
   * @returns 文档的 Yjs 二进制数据
   */
  async getDocument(docId: string): Promise<TiptapDocResult> {
    try {
      if (!this.appConfig.apiSecret) {
        return {
          success: false,
          error: 'API secret is not configured',
        };
      }

      const response = await axios.get(`${this.getDocumentUrl(docId)}?format=yjs`, {
        headers: {
          Authorization: this.appConfig.apiSecret,
        },
        responseType: 'arraybuffer',
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.status === 404 
          ? 'Document not found' 
          : error.message || 'Failed to get document',
      };
    }
  }

  /**
   * 创建或更新文档
   * @param docId - 文档 ID
   * @param data - Yjs 二进制数据
   * @param overwrite - 是否覆盖已存在的文档（使用 PUT）
   * @returns 是否成功
   */
  async saveDocument(
    docId: string, 
    data: ArrayBuffer, 
    overwrite: boolean = false
  ): Promise<TiptapDocResult> {
    try {
      if (!this.appConfig.apiSecret) {
        return {
          success: false,
          error: 'API secret is not configured',
        };
      }

      const method = overwrite ? 'put' : 'post';
      
      await axios[method](
        `${this.getDocumentUrl(docId)}?format=yjs`,
        data,
        {
          headers: {
            Authorization: this.appConfig.apiSecret,
            'Content-Type': 'application/octet-stream',
          },
        }
      );

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.status === 409
          ? 'Document already exists (use overwrite=true to replace)'
          : error.message || 'Failed to save document',
      };
    }
  }

  /**
   * 复制文档
   * @param sourceDocId - 源文档 ID（如 'doc_xxx'）
   * @param targetDocId - 目标文档 ID（如 'doc_yyy'）
   * @param overwrite - 如果目标已存在，是否覆盖
   * @returns 复制结果
   */
  async duplicateDocument(
    sourceDocId: string,
    targetDocId: string,
    overwrite: boolean = false
  ): Promise<DuplicateDocResult> {
    try {
      console.log(`📄 开始复制文档: ${sourceDocId} -> ${targetDocId}`);

      // 1. 检查源文档是否存在
      const sourceExists = await this.exists(sourceDocId);
      if (!sourceExists) {
        console.error(`❌ 源文档不存在: ${sourceDocId}`);
        return {
          success: false,
          sourceExists: false,
          targetExists: false,
          duplicated: false,
          error: 'Source document does not exist',
        };
      }
      console.log(`✅ 源文档存在: ${sourceDocId}`);

      // 2. 检查目标文档是否存在
      const targetExists = await this.exists(targetDocId);
      if (targetExists && !overwrite) {
        console.warn(`⚠️  目标文档已存在: ${targetDocId}`);
        return {
          success: false,
          sourceExists: true,
          targetExists: true,
          duplicated: false,
          error: 'Target document already exists (use overwrite=true to replace)',
        };
      }

      if (targetExists) {
        console.log(`🔄 目标文档已存在，将覆盖: ${targetDocId}`);
      }

      // 3. 获取源文档内容
      console.log(`📥 正在获取源文档内容...`);
      const getResult = await this.getDocument(sourceDocId);
      if (!getResult.success || !getResult.data) {
        console.error(`❌ 获取源文档失败:`, getResult.error);
        return {
          success: false,
          sourceExists: true,
          targetExists,
          duplicated: false,
          error: `Failed to get source document: ${getResult.error}`,
        };
      }
      console.log(`✅ 源文档内容获取成功，大小: ${getResult.data.byteLength} bytes`);

      // 4. 保存到目标文档
      console.log(`📤 正在保存到目标文档...`);
      const saveResult = await this.saveDocument(targetDocId, getResult.data, overwrite);
      if (!saveResult.success) {
        console.error(`❌ 保存目标文档失败:`, saveResult.error);
        return {
          success: false,
          sourceExists: true,
          targetExists,
          duplicated: false,
          error: `Failed to save target document: ${saveResult.error}`,
        };
      }

      console.log(`✅ 文档复制成功: ${sourceDocId} -> ${targetDocId}`);
      return {
        success: true,
        sourceExists: true,
        targetExists: targetExists,
        duplicated: true,
      };
    } catch (error: any) {
      console.error(`❌ 复制文档时发生错误:`, error);
      return {
        success: false,
        sourceExists: false,
        targetExists: false,
        duplicated: false,
        error: error.message || 'Unexpected error during duplication',
      };
    }
  }

  /**
   * 删除文档
   * @param docId - 文档 ID
   * @returns 是否成功
   */
  async deleteDocument(docId: string): Promise<TiptapDocResult> {
    try {
      if (!this.appConfig.apiSecret) {
        return {
          success: false,
          error: 'API secret is not configured',
        };
      }

      await axios.delete(this.getDocumentUrl(docId), {
        headers: {
          Authorization: this.appConfig.apiSecret,
        },
      });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.status === 404
          ? 'Document not found'
          : error.message || 'Failed to delete document',
      };
    }
  }
}

/**
 * 创建文档管理器实例
 */
export const createTiptapDocManager = (options?: TiptapDocOptions) => {
  return new TiptapDocManager(options);
};

/**
 * 便捷方法：获取文档
 */
export const getTiptapDocument = async (docId: string, appId?: string) => {
  const manager = createTiptapDocManager({ appId });
  return manager.getDocument(docId);
};

/**
 * 便捷方法：复制文档
 */
export const duplicateTiptapDocument = async (
  sourceDocId: string,
  targetDocId: string,
  appId?: string,
  overwrite: boolean = false
) => {
  const manager = createTiptapDocManager({ appId });
  return manager.duplicateDocument(sourceDocId, targetDocId, overwrite);
};

