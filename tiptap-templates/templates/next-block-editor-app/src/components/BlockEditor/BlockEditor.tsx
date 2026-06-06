import { EditorContent } from '@tiptap/react'
import React, {useCallback, useRef, useState,useEffect } from 'react'

import { LinkMenu } from '@/components/menus'

import { useBlockEditor } from '@/hooks/useBlockEditor'

import '@/styles/index.css'

import { Sidebar } from '@/components/Sidebar'
import ImageBlockMenu from '@/extensions/ImageBlock/components/ImageBlockMenu'
import { ColumnsMenu } from '@/extensions/MultiColumn/menus'
import { TableColumnMenu, TableRowMenu } from '@/extensions/Table/menus'
import { EditorHeader } from './components/EditorHeader'
import { TextMenu } from '../menus/TextMenu'
import { ContentItemMenu } from '../menus/ContentItemMenu'
import { useSidebar } from '@/hooks/useSidebar'
import * as Y from 'yjs'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { hoverOffThread, hoverThread } from '@tiptap-pro/extension-comments'
import { useThreads } from '@/hooks/useThreads'
import {CommentModal} from "@/components/BlockEditor/modal/CommentModal";

import CustomizedMenus from './components/Settings'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import SearchIcon from '@mui/icons-material/Search';


import {Drawer, Button, Accordion, AccordionSummary, AccordionDetails, Typography, AlertColor} from '@mui/material';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import HistoryIcon from '@mui/icons-material/History';

import { useFileInfo, useReadOnly } from '@/hooks/useFileInfo';
import {useSnackbar} from "@/components/SnackbarTips/SnackbarTips";
import { CoverPageModal } from './modal/CoverPageModal';
import { SnapShotModal } from "./modal/SnapshotModal";

import {ExportModal} from "./modal/ExportModal";
import MetaDialog from "./modal/MetaDialog";
import {Searchbar} from "@/components/Searchbar";
import { useSearchbar } from '@/hooks/useSearchbar'

import { ThreadsProvider } from '@/components/Comment/context';
import CommentHtml from "./components/CommentHtml";
import VersionHtml from '@/components/Version/VersionHtml';
import { useUser } from '@/hooks/useUser'
import { debounce } from 'lodash';
import {yUndoPluginKey} from 'y-prosemirror'

import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import API from "@/lib/api";




export const BlockEditor = ({
  convertToken,
  aiToken,
  ydoc,
  provider,
}: {
  convertToken?: string
  aiToken?: string
  ydoc: Y.Doc | null
  provider?: TiptapCollabProvider | null | undefined
}) => {
  const [isEditorLoading, setIsEditorLoading] = useState(true)
  const {showMessage} = useSnackbar();
  const { data: fileInfo} = useFileInfo();
  const room = fileInfo.file_id;
  const isReadOnly = useReadOnly();
  const loginUser = useUser();

  const [isEditable, setIsEditable] = useState(isReadOnly? false : true)
  const menuContainerRef = useRef(null)

  // Block keyboard shortcuts in readonly mode (Ctrl+A, Ctrl+C, etc.)
  useEffect(() => {
    if (!isReadOnly) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+A (select all), Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste)
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'x', 'v'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('copy', handleCopy, true)
    document.addEventListener('paste', handlePaste, true)
    document.addEventListener('contextmenu', handleContextMenu, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('copy', handleCopy, true)
      document.removeEventListener('paste', handlePaste, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [isReadOnly])

  const [showUnresolved, setShowUnresolved] = useState(true)
  const [selectedThread, setSelectedThread] = useState(null)
  const [exportModalOpen, setExportModalOpen] = React.useState(false)
  const [snapModalOpen, setSnapModalOpen] = React.useState(false)

  const [coverModalOpen, setCoverModalOpen] = React.useState(false)


  const [latestVersion, setLatestVersion] = React.useState(null)
  const [currentVersion, setCurrentVersion] = React.useState(null)
  const [versions, setVersions] = React.useState([])
  const [isAutoVersioning, setIsAutoVersioning] = React.useState(true)




  const threadsRef = useRef([])

  const leftSidebar = useSidebar()
  const searchbar = useSearchbar()


  const threadClickHandler = (threadId: any) => {
    // @ts-ignore
    //
    const isResolved = threads.find(t => t.id === threadId)?.resolvedAt

    if (!threadId || isResolved) {
      setSelectedThread(null)
      editor.chain().unselectThread().run()
      return
    }

    setSelectedThread(threadId)
    editor.chain().selectThread({ id: threadId, updateSelection: false }).run()
  }


  const editParam = {
    setVersions: setVersions,
    setIsAutoVersioning: setIsAutoVersioning,
    setLatestVersion: setLatestVersion,
    setCurrentVersion: setCurrentVersion,
    setIsEditorLoading: setIsEditorLoading,
    isEditorLoading:isEditorLoading,
    'convertToken': convertToken,
    // 'room':room,
    // 'initialContent': fileInfo?.content_html,
    'threadClickHandler': threadClickHandler,
  };


  const { editor, users, collabState } = useBlockEditor({
    aiToken,
    ydoc,
    provider,
    onTransaction({ editor: currentEditor }) {
      setIsEditable(currentEditor.isEditable)
    },
    editParam,
  })

  if (!editor || !users) {
    return null
  }


  const { threads = [], createThread } = useThreads(provider, editor, loginUser)

  threadsRef.current = threads

  const selectThreadInEditor = useCallback((threadId: any) => {
    editor.chain().selectThread({ id: threadId }).run()
    const { node } = editor.view.domAtPos(
      editor.state.selection.anchor
    );
    node instanceof HTMLElement &&
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editor])

  const deleteThread = useCallback((threadId: any) => {
    provider?.deleteThread(threadId)
    editor.commands.removeThread({ id: threadId })
  }, [editor])

  const resolveThread = useCallback((threadId: any) => {
    editor.commands.resolveThread({ id: threadId })
  }, [editor])

  const unresolveThread = useCallback((threadId: any) => {
    editor.commands.unresolveThread({ id: threadId })
  }, [editor])

  const updateComment = useCallback((threadId: any, commentId: any, content: any, metaData: any) => {
    editor.commands.updateComment({
      threadId, id: commentId, content, data: metaData,
    })
  }, [editor])

  const onHoverThread = useCallback((threadId: any) => {
    hoverThread(editor, [threadId])
  }, [editor])

  const onLeaveThread = useCallback(() => {
    hoverOffThread(editor)
  }, [editor])

  if (!editor) {
    return null
  }

  // @ts-ignore
  const filteredThreads = threads.filter(t => (showUnresolved ? !t.resolvedAt : !!t.resolvedAt))



  const handleExport = async () => {
    setExportModalOpen(true);
  }

  const handleCoverExport = async () => {
    setCoverModalOpen(true);
  }

  const handleSnapshot = async () => {
    setSnapModalOpen(true);
  }

  const sanitizeContent = (content: any[]): any[] => {
    return content
      .map(node => {
        if (!node || typeof node !== 'object') return node;

        // Validate bulletList or orderedList contents
        // @ts-ignore
        if ((node.type === 'bulletList' || node.type === 'orderedList') && (!Array.isArray(node.content) || node.content.some(item => item.type !== 'listItem'))
        ) {
          return null; // remove invalid lists
        }

        // Recurse first
        if (Array.isArray(node.content)) {
          node.content = sanitizeContent(node.content);
        }

        // Fix nested lists in listItem
        if (node.type === 'listItem' && Array.isArray(node.content)) {
          const newContent = [];
          for (const child of node.content) {
            if (
              (child.type === 'bulletList' || child.type === 'orderedList') &&
              (newContent.length === 0 || newContent[newContent.length - 1].type !== 'paragraph')
            ) {
              newContent.push({
                type: 'paragraph',
                content: []
              });
            }
            newContent.push(child);
          }
          node.content = newContent;
        }

        return node;
      })
      .filter(Boolean); // remove nulls
  };



  const importRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isImportLoading, setIsImportLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleImportClick = useCallback(() => {
    // @ts-ignore
    importRef.current.click()
  }, [])

  // @ts-ignore
  const handleImportFilePick = useCallback(e => {
    const file = e.target.files[0]

    // @ts-ignore
    importRef.current.value = ''

    if (!file) {
      return
    }


    setIsImportLoading(true)
    try {

      editor
        .chain()
        .import({
          file,
          onImport(context) {

            if (context.error) {
              // @ts-ignore
              showMessage(context.error, 'error');
              setIsImportLoading(false)
              return
            }

            try {
              context.setEditorContent(context.content)
            } catch (e) {
                context.content['content'] = sanitizeContent(context.content['content'] ?? [])
                context.setEditorContent(context.content)
            }

            setError(null)
            setIsImportLoading(false)
          },
          format: 'gfm',
        })
        .run()

    } catch (e) {
      setIsImportLoading(false)
    }
  }, [editor])

  const handleSeach = () => {
    //onClick={}
    //searchbar.open()
    editor.storage.searchModal = 1;
    console.log(editor.storage)
    setOpen(true);
  }


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {

      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        handleSeach();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSeach]);


  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
    editor.storage.searchModal = 0;
  };

  const showCoverModal = useCallback((open:boolean) => {
    setCoverModalOpen(open)
  }, [])


  const showExportModal = useCallback((open:boolean) => {
    setExportModalOpen(open)
  }, [])


  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const debouncedSave = debounce(async (content2, contentJSON, room: string) => {
    try {
      const result = await API.saveTip(content2, contentJSON, room);
      //showMessage('Internal Server Error (500). Please refresh the page and try again.', 'error');
      if (result.success == 1) {
        //showMessage(result.msg, 'success');
      } else {
        //showMessage(result.msg, 'error');
      }
    } catch (e) {
      //showMessage('Internal Server Error (500). Please refresh the page and try again.', 'error');
    }
  }, 3000);

  useEffect(() => {
    const undoManager = yUndoPluginKey.getState(editor.view.state)?.undoManager
    if (!undoManager) return

    const updateButtons = () => {
      const undoManager = yUndoPluginKey.getState(editor.view.state)?.undoManager
      if (isEditorLoading && undoManager) {
        undoManager.undoStack = [];
        undoManager.redoStack = [];
      }
      const newCanUndo = undoManager?.undoStack.length > 0 && isEditorLoading == false;
      const newCanRedo = undoManager?.redoStack.length > 0 && isEditorLoading == false;
      setCanUndo(newCanUndo)
      setCanRedo(newCanRedo)
    }

    updateButtons()

    undoManager.on('stack-item-added', updateButtons)
    undoManager.on('stack-item-popped', updateButtons)

    //after loading
    if (isEditorLoading == false) {
      if (true) {
          editor.on('update', function(){
            const content = editor.getJSON();
            const content2 = editor.getHTML();
            // @ts-ignore
            debouncedSave(content2, JSON.stringify(content), fileInfo.file_id);
          });
      }

      if (fileInfo.usecontent == 1) {
        // @ts-ignore
        editor.commands.setContent(fileInfo.content_html);
      }

    }

    return () => {
      undoManager.off('stack-item-added', updateButtons)
      undoManager.off('stack-item-popped', updateButtons)
    }
  }, [editor, isEditorLoading])







  return (
    <ThreadsProvider
      onClickThread={selectThreadInEditor}
      onDeleteThread={deleteThread}
      onHoverThread={onHoverThread}
      onLeaveThread={onLeaveThread}
      onResolveThread={resolveThread}
      onUpdateComment={updateComment}
      onUnresolveThread={unresolveThread}
      selectedThreads={editor.storage.comments.focusedThreads}
      selectedThread={selectedThread}
      setSelectedThread={setSelectedThread}
      threads={threads}
    >
        <CoverPageModal room={room} isOpen={coverModalOpen} showCoverPageModal={showCoverModal}/>

        {/*<SnapShotModal provider={provider} room={room} isOpen={snapModalOpen} onClose={() => setSnapModalOpen(false)} parentEditor={editor} />*/}


        <ExportModal room={room} isOpen={exportModalOpen} editor={editor} showExportModal={showExportModal}/>

        <MetaDialog editor={editor} room={room} />
        <CommentModal editor={editor} createThread={createThread} />

        <Drawer
          // Add a custom backdrop for outside click detection
          disableScrollLock={false}
          disableRestoreFocus={true}
          anchor='right' open={open} onClose={toggleDrawer(false)}
          sx={{
            '.MuiBackdrop-root': {
              backgroundColor: 'transparent', // Remove gray background
            },
            width: 'auto', // Set width of the drawer (can be specific like '300px' or '20%')
            height: '100px', // Set height to one-third of the viewport height
            position: 'absolute', // Position it properly on the right side of the screen
            top: 0, // Ensure it starts from the top of the screen
          }}
        >
          <Searchbar editor={editor} isOpen={open}/>
        </Drawer>


      <div className="flex h-full" ref={menuContainerRef} data-viewmode={showUnresolved ? 'open' : 'resolved'}>
          <Sidebar isOpen={leftSidebar.isOpen} onClose={leftSidebar.close} editor={editor} />

          <div className="relative flex flex-col flex-1 h-full overflow-hidden">
            <EditorHeader
              editor={editor}
              collabState={collabState}
              users={users}
              isSidebarOpen={leftSidebar.isOpen}
              toggleSidebar={leftSidebar.toggle}
            />
            {!isReadOnly && (

              <div className="flex py-2 flex-row pl-3 gap-4" style={{maxWidth: '82rem'}}>
                <div className="flex gap-4">
                  <Button size="small"
                          variant="contained"
                          style={{ backgroundColor: isLoading ? 'gray' : undefined }}
                          startIcon={<ImportExportIcon />}

                          onClick={handleExport}>
                    Export to PDF
                  </Button>

                  <Button size="small"
                          variant="contained"
                          startIcon={<ImportExportIcon />}
                          onClick={handleImportClick}
                          loading={isImportLoading}
                          loadingPosition="start"
                  >
                    Import Docx
                    <input
                      onChange={handleImportFilePick}
                      type="file"
                      accept=".docx"
                      style={{ display: 'none' }}
                      ref={importRef}
                    />
                  </Button>

                  <Button onClick={handleSeach} size="small"
                          variant="contained"
                          startIcon={<SearchIcon />}
                  >
                    Search
                  </Button>




                  <CustomizedMenus room={room} handleExport={handleCoverExport} />


                  {/*<Button onClick={handleSnapshot} size="small"*/}
                  {/*        variant="contained"*/}
                  {/*        startIcon={<HistoryIcon />}*/}
                  {/*>*/}
                  {/*  Snapshot*/}
                  {/*</Button>*/}

                  <Button size="small" onClick={() => editor.commands.undo()}
                          variant="contained" disabled={!canUndo}
                          startIcon={<UndoIcon />}
                  >
                    Undo
                  </Button>

                  <Button onClick={() => editor.commands.redo()} size="small"
                          variant="contained" disabled={!canRedo}
                          startIcon={<RedoIcon />}
                  >
                    Redo
                  </Button>
                </div>
              </div>

            )}

            <div className="overflow-y-auto flex p-2">
                <div className={`${isReadOnly ? 'w-full' : 'w-3/4'} p-6`}>
                  {isEditorLoading && (
                    <div className="flex flex-col justify-center items-center h-48 space-y-2">
                      <CircularProgress />
                      <span className="text-gray-600 text-sm">Editor loading...</span>
                    </div>
                  )}
                  <div style={{ display: isEditorLoading ? 'none' : 'block' }}>
                    <EditorContent editor={editor} className="flex-1 overflow-y-auto p-6" />
                  </div>

                </div>

              { (fileInfo.publishornot == 0 || !isReadOnly) && (
                <div className="w-1/4 sidebar overflow-y-auto">
                  {fileInfo.publishornot == 0 && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header" style={{border: '1px solid #f0f0f0',}}>
                        <Typography component="span"
                        >Comments</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography>
                          <CommentHtml setShowUnresolved={setShowUnresolved} showUnresolved={showUnresolved}
                                       provider={provider} filteredThreads={filteredThreads} />
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ) }

                  {!isReadOnly && (   <Accordion defaultExpanded={fileInfo.publishornot == 1}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel2-content"
                        id="panel2-header"
                        style={{
                          border: '1px solid #f0f0f0',

                        }}
                      >
                        <Typography component="span"

                        >Version History</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography>
                          <VersionHtml
                            provider={provider}
                            editor={editor}
                            ydoc={ydoc}
                            versions={versions}
                            isAutoVersioning={isAutoVersioning}
                          />
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}

                </div>
              )}
            </div>


            <ContentItemMenu editor={editor} isEditable={isEditable} />
            <LinkMenu editor={editor} appendTo={menuContainerRef} />
            <TextMenu editor={editor} />
            <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
            <TableRowMenu editor={editor} appendTo={menuContainerRef} />
            <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
            <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
        </div>
        </div>
      </ThreadsProvider>
  )
}

export default BlockEditor
