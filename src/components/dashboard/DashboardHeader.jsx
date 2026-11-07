import { Link } from 'react-router-dom'
import { FiLayers, FiLogOut, FiMessageCircle } from 'react-icons/fi'

export default function DashboardHeader({ user, onLogout }) {
  return <header className="topbar">
    <Link to="/dashboard" className="brand"><span className="brand-mark"><FiLayers/></span><span>Livo</span></Link>
    <div className="topbar-right"><Link to="/chat" className="chat-nav-link"><FiMessageCircle/> Chat</Link><span className="user-chip"><span className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span><span>{user?.name || user?.username}</span></span>
      <button className="logout-button" onClick={onLogout}><FiLogOut/><span>Log out</span></button>
    </div>
  </header>
}
