import { useEffect, useState } from 'react'
import { useEditor, useEditorState } from '@tiptap/react'
import type { AnyExtension, Editor, EditorOptions } from '@tiptap/core'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { TiptapCollabProvider, WebSocketStatus } from '@hocuspocus/provider'
import type { Doc as YDoc } from 'yjs'

import { ExtensionKit } from '@/extensions/extension-kit'
import { userColors, userNames } from '../lib/constants'
import { randomElement } from '../lib/utils'
import type { EditorUser } from '../components/BlockEditor/types'
import { initialContent } from '@/lib/data/initialContent'
// import { Ai } from '@/extensions/Ai'
// import { AiImage, AiWriter } from '@/extensions'
import { CommentsKit } from '@tiptap-pro/extension-comments'
import {SearchAndReplace} from "@sereneinserenade/tiptap-search-and-replace";
import {Import} from "@tiptap-pro/extension-import";
import CollaborationHistory from '@tiptap-pro/extension-collaboration-history'
import { useFileInfo, useReadOnly } from './useFileInfo'
import { useUser } from '@/hooks/useUser'


declare global {
  interface Window {
    editor: Editor | null
  }
}

export const useBlockEditor = ({
  aiToken,
  ydoc,
  provider,
  userId,
  userName = 'Maxi',
  editParam,
  ...editorOptions
}: {
  aiToken?: string
  ydoc: YDoc | null
  provider?: TiptapCollabProvider | null | undefined
  userId?: string
  userName?: string
  editParam: object
} & Partial<Omit<EditorOptions, 'extensions'>>) => {
  const [collabState, setCollabState] = useState<WebSocketStatus>(
    provider ? WebSocketStatus.Connecting : WebSocketStatus.Disconnected,
  )
  const appId = process.env.NEXT_PUBLIC_TIPTAP_CONVERT_APPID;

  const isReadOnly = useReadOnly ();
  const { data: fileInfo} = useFileInfo();
  let composing = false;
  const loginUser = useUser();


  const editor = useEditor(
    {
      ...editorOptions,
      editable: false,
      immediatelyRender: true,
      shouldRerenderOnTransaction: false,
      autofocus: true,
      //content: fileInfo.content_html?.trim(),
      onCreate: ctx => {
        console.log('Editor onCreate triggered');
        console.log('Provider:', provider);
        console.log('Provider isSynced:', provider?.isSynced);
        console.log('FileInfo:', fileInfo);

        setTimeout(() => {
          console.log('After 2s delay - Provider:', provider);
          console.log('After 2s delay - Provider isSynced:', provider?.isSynced);
          console.log('Condition check:', provider && !provider.isSynced);

          if (provider && !provider.isSynced) {
            console.log('Provider not synced, waiting for sync event...');
            provider.on('synced', () => {
              console.log('Provider synced event triggered');
              if (fileInfo.content_html?.trim()) {
                //ctx.editor.commands.setContent(fileInfo.content_html?.trim())
              }
              // @ts-ignore
              editParam.setIsEditorLoading(false)
            })
          } else if (ctx.editor.isEmpty) {
            console.log('Provider already synced or no provider, checking if editor is empty');
            if (fileInfo.content_html?.trim()) {
              //ctx.editor.commands.setContent(fileInfo.content_html?.trim())
            }
            // @ts-ignore
            editParam.setIsEditorLoading(false)
            ctx.editor.commands.focus('start', { scrollIntoView: true })
          } else {
            console.log('Editor not empty, setting loading to false');
            // @ts-ignore
            editParam.setIsEditorLoading(false)
          }
        }, 2000);
      },
      onUpdate: ({ editor }) => {
        // @ts-ignore
        // if (!isReadOnly && !editParam.isEditorLoading) {
        //   const content = editor.getJSON();
        //   const content2 = editor.getHTML();
        //   // @ts-ignore
        //   debouncedSave(content2, JSON.stringify(content), fileInfo.file_id);
        // } else {
        //
        // }
      },
      extensions: [
        ...ExtensionKit({
          provider
        }),

        SearchAndReplace.configure({
          searchResultClass: "search-result", // class to give to found items. default 'search-result'
          // @ts-ignore
          caseSensitive: false, // no need to explain
          disableRegex: true, // also no need to explain
        }),
        Import.configure({
          // The Convert App-ID from the Convert settings page: https://cloud.tiptap.dev/convert-settings
          appId: appId,

          // The JWT token you generated in the previous step
          //token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MzM2ODg0NTgsIm5iZiI6MTczMzY4ODQ1OCwiZXhwIjoxNzMzNzc0ODU4LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJiYWU0NjkxZS0zYjQ0LTQzOGMtYjZjZi1jYTZlMGNiNDU5ODUifQ.AVYqzAwEjCh1YL-2U4nQ1bCdIKyWHjeJC9CMehPVbJs',
          // @ts-ignore
          token: editParam.convertToken,
          //token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzM3MDI3MTR9.vZWycjkRUnAcSoBrndVHmLGjV9nClivAslqCw9noPdY'
          experimentalDocxImport: true,

          //endpoint: 'https://api-demo.tiptap.dev/v1/convert/import-docx?gfm=1&',
          //
          // imageUploadCallbackUrl: 'https://dev-portal.fluidbusinesssystems.co.nz/api/',
        }),
        provider && ydoc
          ? Collaboration.configure({
              document: ydoc,
            })
          : undefined,
        provider
          ? CollaborationCursor.configure({
              provider,
              user: {
                name: loginUser?.name || userName || randomElement(userNames),
                color: loginUser?.color || randomElement(userColors),
                clientId: loginUser.clientId || Math.random().toString(36).substring(2, 15),
                id: loginUser?.id || Math.random().toString(36).substring(2, 15),
              },
            })
          : undefined,
        provider
          ? CommentsKit.configure({
          provider,
          useLegacyWrapping: true,
          onClickThread: (threadId: any) => {
            // @ts-ignore
            editParam.threadClickHandler(threadId)
          }
        }): undefined,

        provider
        ? CollaborationHistory.configure({
          provider: provider!,
          onUpdate: data => {
            if ("setVersions" in editParam) {
              // @ts-ignore
              editParam.setVersions(data.versions)
            }
            if ("setIsAutoVersioning" in editParam) {
              // @ts-ignore
              editParam.setIsAutoVersioning(data.versioningEnabled)
            }

            if ("setLatestVersion" in editParam) {
              // @ts-ignore
              editParam.setLatestVersion(data.version)
            }
            if ("setCurrentVersion" in editParam) {
              // @ts-ignore
              editParam.setCurrentVersion(data.currentVersion)
            }
          },
        }): undefined,

        // aiToken
        //   ? AiWriter.configure({
        //       authorId: userId,
        //       authorName: userName,
        //     })
        //   : undefined,
        // aiToken
        //   ? AiImage.configure({
        //       authorId: userId,
        //       authorName: userName,
        //     })
        //   : undefined,
        // aiToken ? Ai.configure({ token: aiToken }) : undefined,
      ].filter((e): e is AnyExtension => e !== undefined),
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class: 'min-h-full',
        },
        handleDOMEvents: {
          compositionstart: () => {
            composing = true
            return false
          },
          compositionend: () => {
            composing = false
            return false
          },
          beforeinput: (view, event) => {
            if (isReadOnly) {
              event.preventDefault()
              return true
            }
            return false
          },
          input: (view, event) => {
            if (composing && isReadOnly ) {
              setTimeout(() => {
                editor.commands.undo()
              }, 0)
              return true
            }
            return false
          },
          keydown(view, event) {

            if (isReadOnly) {
              // Block Ctrl+A (select all)
              if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
                event.preventDefault()
                return true
              }
              // Block all other keyboard input except navigation
              const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']
              if (!allowedKeys.includes(event.key)) {
                event.preventDefault()
                return true
              }
            }
            return false
          },
          copy: (view, event) => {
            if (isReadOnly) {
              event.preventDefault()
              return true
            }
            return false
          },
          cut: (view, event) => {
            if (isReadOnly) {
              event.preventDefault()
              return true
            }
            return false
          },
          paste: (view, event) => {
            if (isReadOnly) {
              event.preventDefault()
              return true
            }
            return false
          },
          drop: (view, event) => {
            if (isReadOnly) {
              event.preventDefault()
              return true
            }
            return false
          },
          click: (view, event) => {

            // const isActive = editor.isActive('link')
            //
            // if (isActive) {
            //   const linkAttributes = editor.getAttributes('link')
            //   if (linkAttributes.href && !linkAttributes.href.startsWith('javascript:')) {
            //     // Open the link in a new tab
            //     window.open(linkAttributes.href, '_blank', 'noopener,noreferrer')
            //   }
            // }

            // if (isReadOnly) {
            //   editor.view.dom.classList.remove('ProseMirror-focused')
            //   event.preventDefault()
            //   return true
            // } else {
            //
            // }
          },
          contextmenu: (view, event) => {
            if (isReadOnly) {
              event.preventDefault()
              return true
            }
          }
        }
      },
    },
    [ydoc, provider],
  )

  useEffect(() => {
    if (editor && !isReadOnly) {
      editor.setEditable(true);
    }
  }, [editor, isReadOnly]);


  const users = useEditorState({
    editor,
    selector: (ctx): (EditorUser & { initials: string })[] => {
      if (!ctx.editor?.storage.collaborationCursor?.users) {
        return []
      }


      return ctx.editor.storage.collaborationCursor.users.map((user: EditorUser) => {
        const names = user.name?.split(' ')
        const firstName = names?.[0]
        const lastName = names?.[names.length - 1]
        const initials = `${firstName?.[0] || '?'}${lastName?.[0] || '?'}`

        return { ...user, initials: initials.length ? initials : '?' }
      })
    },
  })

  useEffect(() => {
    if (provider) {
      console.log('Setting up provider status listener');
      provider.on('status', (event: { status: WebSocketStatus }) => {
        console.log('Provider status changed:', event.status);
        setCollabState(event.status)
      })

      // 监听同步状态变化
      provider.on('synced', () => {
        console.log('Provider synced event fired');
      })

      // 监听连接状态
      provider.on('connect', () => {
        console.log('Provider connected');
      })

      provider.on('disconnect', () => {
        console.log('Provider disconnected');
      })
    }
  }, [provider])

  window.editor = editor

  return { editor, users, collabState }
}
