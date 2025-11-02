import { useCallback } from 'react'

import { useThreadsState } from './context'
import { CommentCard } from './CommentCard'
import { ThreadCard } from './ThreadCard'
import { ThreadComposer } from './ThreadComposer'

export const ThreadsListItem = ({
                                  thread,
                                  provider,
                                  active,
                                  open,
                                }) => {
  const {
    onClickThread,
    deleteThread,
    onHoverThread,
    onLeaveThread,
    resolveThread,
    unresolveThread,
  } = useThreadsState()
  const classNames = ['threadsList--item']

  if (active || open) {
    classNames.push('threadsList--item--active')
  }

  const firstComment = thread.comments && thread.comments[0]

  const handleDeleteClick = useCallback(() => {
    deleteThread(thread.id)
  }, [thread.id, deleteThread])

  const handleResolveClick = useCallback(() => {
    resolveThread(thread.id)
  }, [thread.id, resolveThread])

  const handleUnresolveClick = useCallback(() => {
    unresolveThread(thread.id)
  }, [thread.id, resolveThread])

  const editComment = useCallback((commentId, val) => {
    provider.updateComment(thread.id, commentId, { content: val })
  }, [provider, thread.id])

  const deleteComment = useCallback(commentId => {
    provider.deleteComment(thread.id, commentId)
  }, [provider, thread.id])

  return (
    <div onMouseEnter={() => onHoverThread(thread.id)} onMouseLeave={() => onLeaveThread(thread.id)}>
      <ThreadCard
        id={thread.id}
        active={active}
        open={open}
        onClick={!open ? onClickThread : null}
        // onClickOutside
      >
        {open ? (
          <>
            <div className="header-group">
              <div className="button-group">
                {!thread.resolvedAt ? (
                  <button onClick={handleResolveClick}>✓ Resolve</button>
                ) : (
                  <button onClick={handleUnresolveClick}>⟲ Unresolve</button>
                )}
                <button onClick={handleDeleteClick}>× Delete</button>
              </div>
            </div>

            {thread.resolvedAt ? (
              <div className="hint">💡 Resolved at {new Date(thread.resolvedAt).toLocaleDateString()} {new Date(thread.resolvedAt).toLocaleTimeString()}</div>
            ) : null}

            <div className="comments-group">
              {thread.comments.map(comment => (
                <CommentCard
                  key={comment.id}
                  name={comment.data.userName}
                  content={comment.content}
                  createdAt={comment.createdAt}
                  onEdit={val => {
                    if (val) {
                      editComment(comment.id, val)
                    }
                  }}
                  onDelete={() => {
                    deleteComment(comment.id)
                  }}
                  showActions={true}
                />
              ))}
            </div>
            <div className="reply-group">
              <ThreadComposer threadId={thread.id} provider={provider} />
            </div>
          </>
        ) : null}

        {!open && firstComment && firstComment.data ? (
          <div className="comments-group">
            <CommentCard
              key={firstComment.id}
              name={firstComment.data.userName}
              content={firstComment.content}
              createdAt={firstComment.createdAt}
              onEdit={val => {
                if (val) {
                  editComment(firstComment.id, val)
                }
              }}
            />
            <div className="comments-count">
              <label>{thread.comments.length - 1 || 0} {(thread.comments.length - 1 || 0) === 1 ? 'reply' : 'replies'}</label>
            </div>
          </div>
        ) : null}
      </ThreadCard>
    </div>
  )
}
