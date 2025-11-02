import * as Dialog from '@radix-ui/react-dialog'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { watchPreviewContent } from '@tiptap-pro/extension-collaboration-history'
import {
  memo, useCallback, useEffect, useMemo, useState,
} from 'react'

import { VersionItem } from './VersionItem'
import { ExtensionKit } from '@/extensions/extension-kit'
import {CommentsKit} from "@tiptap-pro/extension-comments";

// Define the type for version
interface Version {version: number;name?: string;date: string;}

const getVersionName = (version: Version) => {
  if (version.name) {
    return version.name
  }

  if (version.version === 0) {
    return 'Initial version'
  }

  return `Version ${version.version}`
}

interface VersioningModalProps {
  versions: Version[];  // Declare 'versions' as an array of Version objects
  isOpen: boolean;
  onClose: () => void;
  onRevert: (versionId: number, versionData: Version | null) => void;
  provider: any; // Adjust 'any' to the correct type for your provider
}

export const VersioningModal = memo<VersioningModalProps>(
  ({
     versions,
     isOpen,
     onClose,
     onRevert,
     provider,
   }) => {
    const [currentVersionId, setCurrentVersionId] = useState<number | null>(null)
    const isCurrentVersion = versions && versions.length > 0 ? currentVersionId === versions.at(-1)?.version : false


    // @ts-ignore
    const editor = useEditor({
      editable: false,
      extensions: [
        ...ExtensionKit({
          provider
        }),
        provider
          ? CommentsKit.configure({
            provider,

          }): undefined,
        StarterKit,
      ],
    })

    const reversedVersions = useMemo(() => versions.slice().reverse(), [versions])

    const handleVersionChange = useCallback((newVersion: number) => {
      editor.commands.setContent('Loading...');

      setCurrentVersionId(newVersion)

      provider.sendStateless(JSON.stringify({
        action: 'version.preview',
        version: newVersion,
      }))
    }, [provider,editor])

    const versionData = useMemo(() => {
      if (!versions.length) {
        return null
      }

      return versions.find(v => v.version === currentVersionId)
    }, [currentVersionId, versions])

    useEffect(() => {
      if (isOpen && currentVersionId === null && versions.length > 0) {
        const initialVersion = versions.at(-1)?.version ?? null;

        editor.commands.setContent('Loading...');
        setCurrentVersionId(initialVersion)

        provider.sendStateless(JSON.stringify({
          action: 'version.preview',
          version: initialVersion,
        }))
      }
    }, [currentVersionId, versions, isOpen])

    useEffect(() => {
      if (isOpen) {
        // @ts-ignore
        const unbindContentWatcher = watchPreviewContent(provider, (content) => {

          if (editor) {
            editor.commands.setContent(content)
          }
        })

        return () => {
          unbindContentWatcher()
        }
      }
    }, [isOpen, provider, editor])

    const onOpenChange = useCallback(
      (open: boolean) => {
        if (!open) {
          onClose()
          setCurrentVersionId(null)
          if (editor) {
            editor.commands.clearContent();
          }

        }
      },
      [onClose, editor],
    )

    const handleRevert = useCallback(() => {

      if (currentVersionId === null) {
        // Handle the case where currentVersionId is null, maybe show an error or return early
        return;
      }

      const accepted = confirm('Are you sure you want to revert to this version? Any changes not versioned will be lost.') // eslint-disable-line no-restricted-globals

      if (accepted) {
        onRevert(currentVersionId, versionData ?? null)
        onClose()
      }
    }, [onRevert, currentVersionId, onClose])

    return (
      <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog">
            <Dialog.Title className="dialog-title">Version History</Dialog.Title>
            <div className="dialog-content col-group">
              <div className="main">
                <EditorContent editor={editor} className="flex-1 overflow-y-auto p-6" />
              </div>
              <div className="sidebar1">
                <div className="sidebar-options">
                  <div className="label-large">History ({reversedVersions.length} versions)</div>
                  <div className="versions-group">
                    {reversedVersions.map((v) => (
                      <VersionItem
                        date={v.date}
                        title={getVersionName(v)}
                        onClick={() => handleVersionChange(v.version)}
                        isActive={currentVersionId === v.version}
                        key={`version_item_${v.version}`}
                      />
                    ))}
                  </div>
                  <div className="button-group">
                    <button type="button" onClick={onClose}>
                      Close
                    </button>
                    <button className="primary" type="button" disabled={!versionData || isCurrentVersion} onClick={handleRevert}>
                      Restore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  },
)

VersioningModal.displayName = 'VersioningModal'
