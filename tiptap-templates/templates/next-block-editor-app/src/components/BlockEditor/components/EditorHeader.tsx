'use client'

import { Icon } from '@/components/ui/Icon'
import { EditorInfo } from './EditorInfo'
import { EditorUser } from '../types'
import { WebSocketStatus } from '@hocuspocus/provider'
import { Toolbar } from '@/components/ui/Toolbar'
import { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { useCallback, useState,useEffect,useRef } from 'react'
import { useFileInfo, useReadOnly } from '@/hooks/useFileInfo'
import API from "@/lib/api";
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";
import {useUser} from "@/hooks/useUser";

export type EditorHeaderProps = {
  isSidebarOpen?: boolean
  toggleSidebar?: () => void
  editor: Editor
  collabState: WebSocketStatus
  users: EditorUser[]
}

export const EditorHeader = ({ editor, collabState, users, isSidebarOpen, toggleSidebar }: EditorHeaderProps) => {
  const { characters, words } = useEditorState({
    editor,
    selector: (ctx): { characters: number; words: number } => {
      const { characters, words } = ctx.editor?.storage.characterCount || { characters: () => 0, words: () => 0 }
      return { characters: characters(), words: words() }
    },
  })

  const toggleEditable = useCallback(() => {
    editor.setOptions({ editable: !editor.isEditable })
    // force update the editor
    editor.view.dispatch(editor.view.state.tr)
  }, [editor])


  const isReadOnly = useReadOnly();
  const { data: fileInfo} = useFileInfo();
  const {showMessage} = useSnackbar();

  const [isEditing, setIsEditing] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && divRef.current) {
      divRef.current.focus()
    }
  }, [isEditing])

  const loginUser = useUser();

  const handleSave = () => {
    console.log('handleSave')
    if (divRef.current) {
      const newFileName = divRef.current.textContent || '';

      if (!newFileName) {
        divRef.current.textContent = "Untitled File";
        setIsEditing(false);
        return;
      }

      if (newFileName !== fileInfo.file.name) {
        const titleData = {
          file_name: newFileName,
        };

        let data = {
          'data': titleData,
          action: 'rename',
          file_id: fileInfo.file_id,
          rtime: new Date().getTime()
        }
        API.saveExtraToEditor(fileInfo.file_id, data)
      }
    }


    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }
  // @ts-ignore
  const showName =  loginUser.showName;



  return (
    <div className="flex flex-row items-center justify-between flex-none py-2 pl-6 pr-3 text-black bg-white border-b border-neutral-200 dark:bg-black dark:text-white dark:border-neutral-800">
      <div className="flex flex-row gap-x-1.5 items-center">
        <div className="flex items-center gap-x-1.5">
          <Toolbar.Button
            tooltip={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={toggleSidebar}
            active={isSidebarOpen}
            className={isSidebarOpen ? 'bg-transparent' : ''}
          >
            <Icon name={isSidebarOpen ? 'PanelLeftClose' : 'PanelLeft'} />
          </Toolbar.Button>
          {/*<Toolbar.Button tooltip={editor.isEditable ? 'Disable editing' : 'Enable editing'} onClick={toggleEditable}>*/}
          {/*  <Icon name={editor.isEditable ? 'PenOff' : 'Pen'} />*/}
          {/*</Toolbar.Button>*/}
          <div className="flex-1 text-center">
            <div
              ref={divRef}
              contentEditable={!isReadOnly && isEditing}
              onBlur={!isReadOnly ? handleSave : undefined}
              onKeyDown={!isReadOnly ? handleKeyDown : undefined}
              onClick={!isReadOnly ? () => setIsEditing(true) : undefined}
              title={!isReadOnly ? "Rename" : undefined}
              className={`
              min-w-[100px]
              max-w-[400px]
              bg-transparent
              text-left
              border-0
              ${!isReadOnly ? 'hover:border hover:border-gray-300 dark:hover:border-gray-600' : ''}
              ${!isReadOnly ? 'focus:border focus:border-blue-500 dark:focus:border-blue-400' : ''}
              rounded
              px-2 py-1
              outline-none
              transition-colors
              ${!isReadOnly && isEditing ? 'cursor-text' : 'cursor-default'}
              whitespace-nowrap overflow-hidden
            `}
              suppressContentEditableWarning
            >
              {fileInfo.file.name}
            </div>
          </div>
        </div>
      </div>
      {/*<div className="flex items-center gap-x-3 ">*/}
      {/*  <div className="text-sm text-gray-600 dark:text-gray-400 pr-4 py-2 border-r border-neutral-200 dark:border-neutral-800">*/}
      {/*    Welcome, <span className="font-medium text-gray-900 dark:text-white">{showName}</span>*/}
      {/*  </div>*/}
      {/*  <EditorInfo characters={characters} words={words} collabState={collabState} users={users} />*/}
      {/*</div>*/}
    </div>
  )
}
