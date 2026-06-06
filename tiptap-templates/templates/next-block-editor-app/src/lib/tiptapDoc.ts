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
 * Tiptap document management utility class
 */
export class TiptapDocManager {
  private appId: string;
  private appConfig: ReturnType<typeof getCurrentAppConfig>;

  constructor(options: TiptapDocOptions = {}) {
    this.appId = options.appId || 'default';
    this.appConfig = getCurrentAppConfig(this.appId);
  }

  /**
   * Get the base URL for a document
   */
  private getDocumentUrl(docId: string): string {
    return `https://${this.appConfig.collabAppId}.collab.tiptap.cloud/api/documents/${docId}`;
  }

  /**
   * Check if a document exists
   * @param docId - Document ID (e.g. 'doc_xxx')
   * @returns Whether the document exists
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
   * Get document content
   * @param docId - Document ID (e.g. 'doc_xxx')
   * @returns Yjs binary data (includes comments and collaboration data)
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
   * Create or update a document
   * @param docId - Document ID
   * @param data - Yjs binary data
   * @param overwrite - Whether to overwrite existing document (uses PUT)
   * @returns Success status
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
        `${this.getDocumentUrl(docId)}`,
        data,
        {
          headers: {
            Authorization: this.appConfig.apiSecret,
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
   * Update document (incremental update)
   * Uses PATCH method to apply Yjs update to an existing document
   * @param docId - Document ID (e.g. 'doc_xxx')
   * @param updateData - Yjs update binary data
   * @returns Success status
   */
  async updateDocument(
    docId: string,
    updateData: ArrayBuffer | Uint8Array
  ): Promise<TiptapDocResult> {
    try {
      if (!this.appConfig.apiSecret) {
        return {
          success: false,
          error: 'API secret is not configured',
        };
      }

      const binaryData = updateData instanceof ArrayBuffer ? new Uint8Array(updateData) : updateData;

      await axios.patch(
        this.getDocumentUrl(docId),
        binaryData,
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
      const status = error.response?.status;
      let errorMessage: string;

      if (status === 404) {
        errorMessage = 'Document not found';
      } else if (status === 422) {
        errorMessage = 'Invalid payload or update cannot be applied';
      } else {
        errorMessage = error.message || 'Failed to update document';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Duplicate a document
   * @param sourceDocId - Source document ID (e.g. 'doc_xxx')
   * @param targetDocId - Target document ID (e.g. 'doc_yyy')
   * @param overwrite - Whether to overwrite if target already exists
   * @returns Duplication result
   */
  async duplicateDocument(
    sourceDocId: string,
    targetDocId: string,
    overwrite: boolean = false
  ): Promise<DuplicateDocResult> {
    try {
      console.log(`📄 Starting document duplication: ${sourceDocId} -> ${targetDocId}`);

      // 1. Check if source document exists
      const sourceExists = await this.exists(sourceDocId);
      if (!sourceExists) {
        console.error(`❌ Source document does not exist: ${sourceDocId}`);
        return {
          success: false,
          sourceExists: false,
          targetExists: false,
          duplicated: false,
          error: 'Source document does not exist',
        };
      }
      console.log(`✅ Source document exists: ${sourceDocId}`);

      // 2. Check if target document exists
      const targetExists = await this.exists(targetDocId);
      if (targetExists && !overwrite) {
        console.warn(`⚠️ Target document already exists: ${targetDocId}`);
        return {
          success: false,
          sourceExists: true,
          targetExists: true,
          duplicated: false,
          error: 'Target document already exists (use overwrite=true to replace)',
        };
      }

      if (targetExists) {
        console.log(`🔄 Target document exists, will overwrite: ${targetDocId}`);
      }

      // 3. Get source document content
      console.log(`📥 Fetching source document content...`);
      const getResult = await this.getDocument(sourceDocId);
      if (!getResult.success || !getResult.data) {
        console.error(`❌ Failed to get source document:`, getResult.error);
        return {
          success: false,
          sourceExists: true,
          targetExists,
          duplicated: false,
          error: `Failed to get source document: ${getResult.error}`,
        };
      }
      console.log(`✅ Source document fetched successfully, size: ${getResult.data.byteLength} bytes`);

      // 4. Save to target document
      console.log(`📤 Saving to target document...`);
      const saveResult = await this.saveDocument(targetDocId, getResult.data, overwrite);
      if (!saveResult.success) {
        console.error(`❌ Failed to save target document:`, saveResult.error);
        return {
          success: false,
          sourceExists: true,
          targetExists,
          duplicated: false,
          error: `Failed to save target document: ${saveResult.error}`,
        };
      }

      console.log(`✅ Document duplicated successfully: ${sourceDocId} -> ${targetDocId}`);
      return {
        success: true,
        sourceExists: true,
        targetExists: targetExists,
        duplicated: true,
      };
    } catch (error: any) {
      console.error(`❌ Error during document duplication:`, error);
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
   * Delete a document
   * @param docId - Document ID
   * @returns Success status
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
 * Create a document manager instance
 */
export const createTiptapDocManager = (options?: TiptapDocOptions) => {
  return new TiptapDocManager(options);
};

/**
 * Convenience method: Get a document
 */
export const getTiptapDocument = async (docId: string, appId?: string) => {
  const manager = createTiptapDocManager({ appId });
  return manager.getDocument(docId);
};

/**
 * Convenience method: Duplicate a document
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

