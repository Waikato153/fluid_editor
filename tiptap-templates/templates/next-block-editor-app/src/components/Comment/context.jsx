import {
  createContext, useCallback, useContext,
} from 'react'

export const ThreadsContext = createContext({
  threads: [],
  selectedThreads: [],
  selectedThread: null,

  onClickThread: () => null,
  deleteThread: () => null,
  resolveThread: () => null,
  unresolveThread: () => null,
  onUpdateComment: () => null,
  onHoverThread: () => null,
  onLeaveThread: () => null,
})

// @ts-ignore
export const ThreadsProvider = ({
                                  children,
                                  threads = [],
                                  selectedThreads = [],
                                  selectedThread = null,
                                  onClickThread = (id) => {},
                                  onDeleteThread = (id) => {},
                                  onResolveThread = (id) => {},
                                  onUnresolveThread = (id) => {},
                                  onUpdateComment = (threadId, commentId, content, metaData) => {},
                                  onHoverThread = (id) => {},
                                  onLeaveThread = (id) => {},
                                  setSelectedThread = (id) => {}
                                }) => {
  // @ts-ignore
  const handleThreadClick = useCallback(threadId => {
    // @ts-ignore
    setSelectedThread(currentThreadId => {
      if (currentThreadId !== threadId) {
        onClickThread(threadId)
        setSelectedThread(threadId)
      }

      return currentThreadId !== threadId ? threadId : null
    })
  }, [onClickThread])

  const providerValue = {
    threads,
    selectedThreads,
    selectedThread,
    deleteThread: onDeleteThread,
    resolveThread: onResolveThread,
    unresolveThread: onUnresolveThread,
    onClickThread: handleThreadClick,
    onUpdateComment,
    onHoverThread,
    onLeaveThread,
  }

  // @ts-ignore
  return (
    <ThreadsContext.Provider value={providerValue}>
      {children}
    </ThreadsContext.Provider>
  )
}

export const useThreadsState = () => {
  return useContext(ThreadsContext)
}
