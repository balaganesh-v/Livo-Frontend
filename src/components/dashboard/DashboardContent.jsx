import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiActivity, FiCheck, FiFile, FiFolder, FiLayers, FiPlus, FiZap } from 'react-icons/fi'
import useAuth from '../../hooks/useAuth'
import { scanFolder } from '../../services/dashboardService'
import { getApiError } from '../../services/api'
import ErrorMessage from '../common/ErrorMessage'
import LoadingSpinner from '../common/LoadingSpinner'

const statCards = [['Total files', 'total_files', FiFile, 'blue'], ['Total folders', 'total_folders', FiFolder, 'violet'], ['Duplicate files', 'duplicate_files', FiLayers, 'amber'], ['AI-analyzed', 'analyzed_files', FiZap, 'mint']]

export default function DashboardContent({ user }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState({ total_files: null, total_folders: null, duplicate_files: null, analyzed_files: null, recent_activity: [] })
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState('')

  async function scan() {
    setScanMessage('')
    setError('')
    if (!window.desktop?.selectFolder) { setScanMessage('Folder selection is available in the Livo desktop app. Open Electron to choose a folder and scan it.'); return }
    try {
      const folderPath = await window.desktop.selectFolder()
      if (!folderPath) return
      setScanning(true)
      const data = await scanFolder(folderPath)
      const hashes = data.files.map((file) => file.file_hash).filter(Boolean)
      const hashCounts = hashes.reduce((counts, hash) => ({ ...counts, [hash]: (counts[hash] || 0) + 1 }), {})
      const duplicateCount = Object.values(hashCounts).reduce((total, count) => total + (count > 1 ? count : 0), 0)
      setSummary({ total_files: data.total_files, total_folders: 1, duplicate_files: duplicateCount, analyzed_files: null, recent_activity: [] })
      setScanMessage(`Scan complete — ${data.saved_files} files added from the selected folder.`)
    } catch (requestError) {
      if (requestError.response?.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else setError(getApiError(requestError))
    } finally { setScanning(false) }
  }

  return <section className="dash-content">
    <div className="dash-welcome"><div><span className="eyebrow"><FiZap/> YOUR WORKSPACE</span><h1>AI Folder Organizer</h1><p>Welcome back, {(user?.name || user?.username || '').split(' ')[0]}. Here’s your workspace at a glance.</p></div>
      <button className="primary-button scan-button" onClick={scan} disabled={scanning}>{scanning ? <><LoadingSpinner small/> Scanning…</> : <><FiPlus/> Select Folder &amp; Scan</>}</button>
    </div>
    {(error || scanMessage) && <ErrorMessage success={!error}>{error || scanMessage}</ErrorMessage>}
    <div className="notice">Summary cards show data from the latest scan in this session. The current backend does not expose saved dashboard totals, AI-analysis totals, or activity history.</div>
    <div className="stats-grid">{statCards.map(([label, key, Icon, color]) => <article className="stat-card" key={key}><div className={`stat-icon ${color}`}><Icon/></div><p>{label}</p><strong>{summary[key] !== null ? Number(summary[key] || 0).toLocaleString() : '—'}</strong><span className="stat-caption">From latest folder scan</span></article>)}</div>
    <section className="activity-card"><div className="section-heading"><div><span className="eyebrow"><FiActivity/> WORKSPACE</span><h2>Recent activity</h2></div><span className="activity-count">{summary.recent_activity.length} updates</span></div>
      {summary.recent_activity.length ? <div className="activity-list">{summary.recent_activity.map((item) => <div className="activity-row" key={item.id}><span className="activity-dot"><FiCheck/></span><div><strong>{item.action}</strong><p>{item.status === 'success' ? 'Completed successfully' : 'Needs attention'}</p></div><time>{new Date(item.performed_at).toLocaleString()}</time></div>)}</div> : <div className="activity-empty"><span className="empty-icon"><FiActivity/></span><h3>No activity feed available</h3><p>The current backend does not expose recent activity.</p></div>}
    </section>
    <footer className="dash-footer">Livo <span>·</span> A little more order, every day</footer>
  </section>
}
