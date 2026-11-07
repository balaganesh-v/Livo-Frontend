import { useState } from 'react'
import { FiEdit2, FiMessageSquare, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi'

export default function ChatHistoryItem({ chat, active, onSelect, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function choose(action, event) {
    event.stopPropagation()
    setMenuOpen(false)
    if (action === 'rename') onRename(chat)
    else onDelete(chat)
  }

  return <div className={`sidebar-history-row ${active ? 'active' : ''}`}>
    <button className="sidebar-history-item" onClick={onSelect} title={chat.title} aria-current={active ? 'page' : undefined}>
      <FiMessageSquare /><span>{chat.title}</span>
    </button>
    <button className="chat-history-menu-trigger" onClick={(event) => { event.stopPropagation(); setMenuOpen((open) => !open) }} aria-label={`Options for ${chat.title}`} aria-expanded={menuOpen}>
      <FiMoreHorizontal />
    </button>
    {menuOpen && <div className="chat-history-menu" role="menu">
      <button role="menuitem" onClick={(event) => choose('rename', event)}><FiEdit2 /> Rename</button>
      <button role="menuitem" className="danger" onClick={(event) => choose('delete', event)}><FiTrash2 /> Delete</button>
    </div>}
  </div>
}
