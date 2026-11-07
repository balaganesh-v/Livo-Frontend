import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatHeader from '../components/chat/ChatHeader'
import ChatWindow from '../components/chat/ChatWindow'
import useAuth from '../hooks/useAuth'
import { scanSelectedFolder, sendChatMessage } from '../services/chatService'
import { getApiError } from '../services/api'

export default function ChatPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  function addMessage(role, content, extra = {}) {
    setMessages((current) => [...current, { id: `${Date.now()}-${Math.random()}`, role, content, ...extra }])
  }

  async function send() {
    const text = value.trim()
    if (!text || loading) return
    setValue('')
    setError('')
    addMessage('user', text)
    setLoading(true)
    try {
      const response = await sendChatMessage(text, messages)
      addMessage('assistant', response.response)
    } catch (requestError) {
      if (requestError.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else addMessage('assistant', requestError.message || 'The AI service could not process this message.')
    }
    finally { setLoading(false) }
  }

  async function selectFolder() {
    setError('')
    if (!window.desktop?.selectFolder) { setError('Folder selection is available in the Livo Electron desktop app.'); return }
    try {
      const folderPath = await window.desktop.selectFolder()
      if (!folderPath) return
      setScanning(true)
      addMessage('user', `Please scan this folder: ${folderPath}`)
      const result = await scanSelectedFolder(folderPath)
      addMessage('assistant', `Folder scan finished. ${result.saved_files} of ${result.total_files} discovered files were saved. Files were not moved or changed.`, { scan: result })
    } catch (requestError) {
      if (requestError.response?.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else setError(getApiError(requestError))
    } finally { setScanning(false) }
  }

  function logout() { signOut(); navigate('/login', { replace: true }) }

  return <div className="chat-shell"><ChatHeader user={user} onLogout={logout} onSelectFolder={selectFolder} scanning={scanning} />
    <ChatWindow messages={messages} loading={loading} value={value} onChange={setValue} onSend={send} error={error} />
  </div>
}
