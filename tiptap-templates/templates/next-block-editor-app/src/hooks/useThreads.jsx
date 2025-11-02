import { subscribeToThreads } from '@tiptap-pro/extension-comments'
import { useCallback, useEffect, useState } from 'react'
import API from '@/lib/api'
export const useThreads = (provider, editor, user) => {
  const [threads, setThreads] = useState()

  useEffect(() => {
    if (provider) {
      const unsubscribe = subscribeToThreads({
        provider,
        callback: currentThreads => {
          setThreads(currentThreads)

          let data = {
            'data': currentThreads,
            action: 'comment',
            file_id: user.room,
            rtime: new Date().getTime()
          }

          //API.saveExtraToEditor(user.room, data)

        },
      })

      return () => {
        unsubscribe()
      }
    }
  }, [provider])

  const createThread = useCallback((input) => {

    if (!input) {
      return false;
    }

    if (!editor) {
      return false;
    }

    editor.chain().focus().setThread({ content: input, commentData: {
      userName: user.name,
      userId: user.id,
      } }).run()

    return true
  }, [editor, user])

  return { threads, createThread }
}
