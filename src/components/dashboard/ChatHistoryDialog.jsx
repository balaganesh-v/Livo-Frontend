import { useState } from 'react'

export default function ChatHistoryDialog({ mode, chat, onCancel, onConfirm }) {
  const [title, setTitle] = useState(chat?.title || '')
  if (!mode || !chat) return null

  const renaming = mode === 'rename'
  function submit(event) {
    event.preventDefault()
    onConfirm(renaming ? title.trim() : undefined)
  }

  return <div className="chat-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <form className="chat-history-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-dialog-title" onSubmit={submit}>
      <h2 id="chat-dialog-title">{renaming ? 'Rename chat' : 'Delete chat?'}</h2>
      {renaming
        ? <label>Chat name<input autoFocus maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        : <p>“{chat.title}” and its saved conversation will be removed from this device. This will not delete any files or folders.</p>}
      <div className="chat-dialog-actions">
        <button type="button" className="dialog-cancel" onClick={onCancel}>Cancel</button>
        <button type="submit" className={renaming ? 'dialog-save' : 'dialog-delete'} disabled={renaming && !title.trim()}>{renaming ? 'Save' : 'Delete chat'}</button>
      </div>
    </form>
  </div>
}
