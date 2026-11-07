import { FiChevronLeft, FiChevronRight, FiLogOut, FiMessageSquare, FiPlus } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import ChatHistoryItem from './ChatHistoryItem'

export default function ChatSidebar({ collapsed, conversations, activeId, user, onToggle, onNewChat, onSelectChat, onRenameChat, onDeleteChat, onLogout }) {
  return <aside className={`dashboard-chat-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="sidebar-brand-row">
      <Link to="/dashboard" className="sidebar-brand"><span className="brand-mark"><FiMessageSquare /></span>{!collapsed && <span>AI Folder Organizer</span>}</Link>
      <button className="sidebar-icon-button sidebar-collapse" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <FiChevronRight /> : <FiChevronLeft />}</button>
    </div>
    <button className="sidebar-new-chat" onClick={onNewChat} title={collapsed ? 'New chat' : undefined}><FiPlus /><span className="sidebar-label">New Chat</span></button>
    {!collapsed && <div className="sidebar-history"><p className="sidebar-section-label">YOUR CHATS</p>
      {conversations.map((chat) => <ChatHistoryItem key={chat.id} chat={chat} active={chat.id === activeId} onSelect={() => onSelectChat(chat.id)} onRename={onRenameChat} onDelete={onDeleteChat} />)}
      {!conversations.length && <p className="sidebar-empty">No saved chats yet. Start a New Chat to begin.</p>}
    </div>}
    <div className="sidebar-account">
      {!collapsed && <div className="sidebar-user"><span className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span><span><strong>{user?.name || user?.username}</strong><small>Signed in</small></span></div>}
      <button className="sidebar-logout" onClick={onLogout} title={collapsed ? 'Log out' : undefined}><FiLogOut /><span className="sidebar-label">Log out</span></button>
    </div>
  </aside>
}
