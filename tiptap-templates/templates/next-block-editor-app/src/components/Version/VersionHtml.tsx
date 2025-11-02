import React, {useEffect,useCallback} from 'react';
import { VersioningModal } from './VersioningModal'
import Button from '@mui/material/Button';
import {Box} from "@mui/material";
import { renderDate } from '@/lib/utils'
import * as Y from 'yjs'
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";
import {TiptapCollabProvider} from "@hocuspocus/provider";
import { Editor } from '@tiptap/core'

interface VersionHtmlProps {
  ydoc: Y.Doc | null;
  provider?: TiptapCollabProvider | null | undefined;
  editor: Editor;
  versions: any[];
  isAutoVersioning: boolean;
}

// @ts-ignore
const VersionHtml: React.FC<VersionHtmlProps> = ({
                                                   ydoc,
                                                   provider,
                                                   editor,
                                                   versions,
                                                   isAutoVersioning,
                                                 }) => {
  const { showMessage } = useSnackbar();

  const [versioningModalOpen, setVersioningModalOpen] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)
  const [commitDescription, setCommitDescription] = React.useState('')

  // 添加调试信息
  console.log('VersionHtml render:', {
    hasYDoc: !!ydoc,
    hasProvider: !!provider,
    providerSynced: provider?.isSynced,
    isAutoVersioning,
    versionsCount: versions?.length || 0,
    hasChanges
  });

  const showVersioningModal = useCallback(() => {
    setVersioningModalOpen(true)
  }, [])


  // @ts-ignore
  const handleRevert = useCallback((version, versionData) => {
    const versionTitle = versionData ? versionData.name || renderDate(versionData.date) : version
    editor.commands.revertToVersion(version, `Revert to ${versionTitle}`, `Unsaved changes before revert to ${versionTitle}`)
  }, [editor])

  useEffect(() => {
    const onUpdate = () => {
      setHasChanges(true)
    }

    const onSynced = () => {
      console.log('Provider synced, setting up update listener')
      // @ts-ignore
      ydoc.on('update', onUpdate)
    }

    // 检查编辑器是否有内容
    const hasContent = !editor.isEmpty && editor.getHTML().trim().length > 0;
    console.log('Editor content check:', {
      isEmpty: editor.isEmpty,
      htmlLength: editor.getHTML().trim().length,
      hasContent
    });

    // 对于新文档，即使没有内容也要设置基础监听器
    if (hasContent || (versions && versions.length === 0)) {
      console.log('Setting up versioning - hasContent:', hasContent, 'isNewDoc:', versions && versions.length === 0);
      
      // 立即设置更新监听器
      if (ydoc) {
        console.log('Setting up immediate update listener')
        // @ts-ignore
        ydoc.on('update', onUpdate)
      }

      // 如果 provider 已经同步，立即设置监听器
      if (provider && provider.isSynced) {
        console.log('Provider already synced, setting up update listener')
        // @ts-ignore
        ydoc.on('update', onUpdate)
      }

      // 监听 provider 同步事件
      // @ts-ignore
      provider && provider.on('synced', onSynced)

      // 启用版本控制
      editor.commands.toggleVersioning()
    } else {
      console.log('Editor is empty and not a new document, skipping versioning setup');
    }

    return () => {
      // @ts-ignore
      provider && provider.off('synced', onSynced)
      // @ts-ignore
      ydoc && ydoc.off('update', onUpdate)
    }
  }, [ydoc, editor, provider])

  // 监听编辑器内容变化，当从空变为有内容时启用版本控制
  useEffect(() => {
    const checkContentAndSetupVersioning = () => {
      const hasContent = !editor.isEmpty && editor.getHTML().trim().length > 0;
      
      if (hasContent && !hasChanges) {
        console.log('Content detected, enabling versioning now');
        
        // 设置更新监听器
        if (ydoc) {
          console.log('Setting up update listener for new content');
          // @ts-ignore
          ydoc.on('update', () => setHasChanges(true))
        }

        // 启用版本控制
        editor.commands.toggleVersioning()
        
        // 标记有变化
        setHasChanges(true)
      }
    };

    // 监听编辑器更新事件
    const onEditorUpdate = () => {
      checkContentAndSetupVersioning()
    };

    editor.on('update', onEditorUpdate)

    return () => {
      editor.off('update', onEditorUpdate)
    }
  }, [editor, ydoc, hasChanges])

  // 强制为新文档创建初始版本
  useEffect(() => {
    // 检查是否有版本历史
    if (versions && versions.length === 0) {
      console.log('No versions found, this is a new document');
      
      // 延迟一下，确保编辑器完全初始化
      const timer = setTimeout(() => {
        if (editor) {
          console.log('Creating initial version for new document');
          // 创建初始版本，即使编辑器是空的
          editor.commands.saveVersion('Initial version');
          setHasChanges(false);
          
          // 强制启用版本控制
          editor.commands.toggleVersioning();
          
          // 设置自动保存为开启状态
          if (typeof isAutoVersioning !== 'undefined' && !isAutoVersioning) {
            console.log('Enabling auto versioning after creating initial version');
            editor.commands.toggleVersioning();
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [versions, editor, isAutoVersioning]);

  // 监听版本变化，当有版本时自动设置自动保存为开启状态
  useEffect(() => {
    if (versions && versions.length > 0) {
      console.log('Versions found, ensuring auto versioning is enabled');
      
      // 如果有版本但自动保存未开启，则开启自动保存
      if (typeof isAutoVersioning !== 'undefined' && !isAutoVersioning) {
        console.log('Enabling auto versioning for existing document');
        editor.commands.toggleVersioning();
      }
    }
  }, [versions, editor, isAutoVersioning]);

  const handleNewVersion = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!commitDescription) {
      return
    }
    editor.commands.saveVersion(commitDescription)
    setCommitDescription('')
    showMessage(`Version ${commitDescription} created! Open the version history to see all versions.`, 'success');
    setHasChanges(false)
  }, [editor, commitDescription])

  const handleVersioningClose = useCallback(() => {
    setVersioningModalOpen(false)
  }, [])

  const handleCommitDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommitDescription(event.target.value)
  }

  return (
    <div>
      {/* Versioning Modal */}
      <VersioningModal
        versions={versions}
        isOpen={versioningModalOpen}
        onClose={handleVersioningClose}
        onRevert={handleRevert}
        provider={provider}
      />

      <div className="col-group">
        <div className="sidebar-options">
          {/* Auto Versioning Section */}
          <div className="option-group">
            <div className="label-large">Auto versioning</div>
            <div className="switch-group">
              <label>
                <input
                  type="radio"
                  name="auto-versioning"
                  onChange={() => {
                    if (!isAutoVersioning) {
                      console.log('User enabling auto versioning');
                      editor.commands.toggleVersioning();
                    }
                  }}
                  checked={isAutoVersioning}
                />
                Enable
              </label>
              <label>
                <input
                  type="radio"
                  name="auto-versioning"
                  onChange={() => {
                    if (isAutoVersioning) {
                      console.log('User disabling auto versioning');
                      editor.commands.toggleVersioning();
                    }
                  }}
                  checked={!isAutoVersioning}
                />
                Disable
              </label>
            </div>
            {/* 显示当前状态信息 */}
            <div className="label-small" style={{ marginTop: '8px', color: '#666' }}>
              {versions && versions.length > 0 
                ? `Document has ${versions.length} version(s)` 
                : 'No versions yet'
              }
            </div>
          </div>

          <hr />

          {/* Manual Versioning Section */}
          <div className="option-group">
            <div className="label-large">Manual versioning</div>
            <div className="label-small">
              Make adjustments to the document to manually save a new version.
            </div>
            <form className="commit-panel" onSubmit={(e) => e.preventDefault()}>
              <Box>
                <input
                  type="text"
                  placeholder="Version name"
                  value={commitDescription}
                  onChange={handleCommitDescriptionChange}
                  disabled={!hasChanges}
                />
                <Box mt={1}>
                  <Button
                    variant="outlined" size="small"
                    disabled={!hasChanges || commitDescription.length === 0}
                    onClick={handleNewVersion}
                  >
                    Create
                  </Button>
                </Box>
              </Box>
            </form>
          </div>

          <hr />

          {/* Show History Button */}
          <button
            className="primary"
            type="button"
            onClick={showVersioningModal}
          >
            Show history
          </button>
        </div>
      </div>
    </div>
  );
}

export default VersionHtml;
