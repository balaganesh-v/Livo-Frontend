import { FiFolder, FiLayers, FiLogOut } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import BackButton from '../common/BackButton'

export default function ChatHeader({ user, onLogout, onSelectFolder, scanning }) {
  return <header className="chat-topbar">
    <Link to="/dashboard" className="chat-brand"><span className="brand-mark"><FiLayers /></span><span>AI Folder Organizer</span></Link>
    <div className="chat-header-actions">
      <button className="chat-secondary-button" onClick={onSelectFolder} disabled={scanning}><FiFolder /> {scanning ? 'Scanning…' : 'Select & scan folder'}</button>
      <span className="user-chip"><span className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span><span>{user?.name || user?.username}</span></span>
      <button className="logout-button" onClick={onLogout} aria-label="Log out"><FiLogOut /></button>
    </div>
    <div className="chat-back"><BackButton /></div>
  </header>
}
