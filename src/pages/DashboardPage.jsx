import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMenu, FiFolder, FiZap } from 'react-icons/fi'
import ChatSidebar from '../components/dashboard/ChatSidebar'
import WelcomeScreen from '../components/dashboard/WelcomeScreen'
import MessageBubble from '../components/chat/MessageBubble'
import ChatInput from '../components/chat/ChatInput'
import TypingIndicator from '../components/chat/TypingIndicator'
import ChatHistoryDialog from '../components/dashboard/ChatHistoryDialog'
import useAuth from '../hooks/useAuth'
import { analyzeScannedFiles, createOrganizationPlan, processScannedFolder, scanSelectedFolder, sendChatMessage, startOrganizationWorkflow } from '../services/chatService'
import { getChatHistoryKey, loadChatHistory, saveChatHistory } from '../services/chatHistoryService'
import { getApiError } from '../services/api'

/** @returns {import('../types/chat').ChatSession} */
function newConversation() {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), title: 'New chat', messages: [], createdAt: now, updatedAt: now }
}

const EMPTY_MESSAGES = []

function mostRecentScan(chats) {
  const ordered = [...chats].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
  for (const chat of ordered) {
    const scan = lastScanInChat(chat)
    if (scan) return scan
  }
  return null
}

function lastScanInChat(chat) {
  return [...(chat?.messages || [])].reverse().find((message) => message.scan?.source_folder_id)?.scan || null
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const storageKey = getChatHistoryKey(user)
  const [conversations, setConversations] = useState(() => loadChatHistory(storageKey))
  const [activeId, setActiveId] = useState(() => loadChatHistory(storageKey)[0]?.id || null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 700)
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [scannedFiles, setScannedFiles] = useState(() => mostRecentScan(loadChatHistory(storageKey))?.files || [])
  const [sourceFolderId, setSourceFolderId] = useState(() => mostRecentScan(loadChatHistory(storageKey))?.source_folder_id || null)
  const [historyDialog, setHistoryDialog] = useState(null)
  const scrollRef = useRef(null)
  const activeConversation = conversations.find((chat) => chat.id === activeId)
  const messages = activeConversation?.messages || EMPTY_MESSAGES

  useEffect(() => saveChatHistory(storageKey, conversations), [storageKey, conversations])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  function appendMessage(chatId, role, content, extra = {}) {
    setConversations((current) => current.map((chat) => {
      if (chat.id !== chatId) return chat
      const isFirstMessage = chat.messages.length === 0
      return {
        ...chat,
        title: isFirstMessage && role === 'user' ? content.slice(0, 34) || 'New chat' : chat.title,
        messages: [...chat.messages, { id: `${Date.now()}-${Math.random()}`, role, content, ...extra }],
        updatedAt: new Date().toISOString(),
      }
    }))
  }

  function startNewChat() {
    if (activeConversation && activeConversation.messages.length === 0) return
    const emptyChat = conversations.find((chat) => chat.messages.length === 0)
    if (emptyChat) { setActiveId(emptyChat.id); setValue(''); return }
    const chat = newConversation()
    setConversations((current) => [chat, ...current])
    setActiveId(chat.id)
    setValue('')
  }

  async function sendMessage() {
    const text = value.trim()
    if (!text || loading) return
    let chatId = activeConversation?.id
    if (!activeConversation) {
      const initial = newConversation()
      chatId = initial.id
      setConversations((current) => [initial, ...current])
      setActiveId(chatId)
    }
    setValue('')
    if (/^(please\s+)?(scan|select\s+and\s+scan)\b/i.test(text)) return runAction('scan', text, chatId)
    if (/^(please\s+)?(analy[sz]e|review)\s+(my\s+|the\s+)?(files|documents|folder)\b/i.test(text)) return runAction('analyze', text, chatId)
    if (/\b(find|identify|show|check)\b.*\bduplicates?\b/i.test(text)) return runAction('duplicates', text, chatId)
    if (/^(please\s+)?(organize|sort|categorize)\b/i.test(text)) return runAction('organize', text, chatId)
    appendMessage(chatId, 'user', text)
    setLoading(true)
    try {
      const response = await sendChatMessage(text, activeConversation?.messages || [])
      appendMessage(chatId, 'assistant', response.response)
    } catch (error) {
      if (error.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else appendMessage(chatId, 'assistant', error.message || 'The AI service could not process this message.')
    } finally { setLoading(false) }
  }

  async function scanFolder(chatId, promptText = 'Select and scan a folder') {
    if (!window.desktop?.selectFolder) {
      appendMessage(chatId, 'assistant', 'Folder selection is available in the Livo Electron desktop app. Open the desktop application to select a folder.')
      return
    }
    try {
      const folderPath = await window.desktop.selectFolder()
      if (!folderPath) return
      appendMessage(chatId, 'user', `${promptText}: ${folderPath}`)
      setLoading(true)
      const result = await scanSelectedFolder(folderPath)
      setScannedFiles(result.files || [])
      setSourceFolderId(result.source_folder_id)
      const fileContext = (result.files || []).slice(0, 25).map((file) => {
        const details = [file.extension, `${file.size_bytes} bytes`, file.file_id ? `file ID ${file.file_id}` : null].filter(Boolean).join(', ')
        return `• ${file.name} (${details})`
      }).join('\n')
      const omitted = Math.max(0, result.files.length - 25)
      const scanSummary = `Scan complete. ${result.saved_files} of ${result.total_files} discovered files were saved. Your files were not moved or changed. The scan provides file metadata, not file contents.${fileContext ? `\n\nFiles from this scan:\n${fileContext}` : ''}${omitted ? `\n…and ${omitted} more files.` : ''}`
      const savedScan = {
        folder_path: result.folder_path,
        source_folder_id: result.source_folder_id,
        total_files: result.total_files,
        saved_files: result.saved_files,
        files: (result.files || []).map(({ file_id, name, extension, size_bytes, file_hash }) => ({ file_id, name, extension, size_bytes, file_hash })),
      }
      appendMessage(chatId, 'assistant', scanSummary, { scan: savedScan })
      if (result.source_folder_id) {
        try {
          const workflow = await startOrganizationWorkflow(result.source_folder_id)
          appendMessage(chatId, 'assistant', 'Your completed scan is being processed for a proposed folder structure.', { workflow })
        } catch (workflowError) {
          if (workflowError.response?.status === 401) { signOut(); navigate('/login', { replace: true }); return }
          const status = workflowError.response?.status
          const detail = getApiError(workflowError)
          const hint = status === 404 || status === 405 || status === 503
            ? ' Restart the backend so it loads the workflow endpoint and database table, then try starting organization again.'
            : ''
          appendMessage(chatId, 'assistant', `The scan completed and was saved, but the organization workflow could not start${status ? ` (HTTP ${status})` : ''}. ${detail}${hint}`, { workflowStartError: { source_folder_id: result.source_folder_id } })
        }
      }
    } catch (error) {
      if (error.response?.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else appendMessage(chatId, 'assistant', getApiError(error))
    } finally { setLoading(false) }
  }

  function updateWorkflow(chatId, messageId, workflow) {
    setConversations((current) => current.map((chat) => chat.id !== chatId ? chat : {
      ...chat,
      messages: chat.messages.map((message) => message.id === messageId ? { ...message, workflow } : message),
      updatedAt: new Date().toISOString(),
    }))
  }

  async function retryOrganizationWorkflow(chatId, messageId, sourceFolderId) {
    setLoading(true)
    try {
      const workflow = await startOrganizationWorkflow(sourceFolderId)
      setConversations((current) => current.map((chat) => chat.id !== chatId ? chat : {
        ...chat,
        messages: chat.messages.map((message) => message.id === messageId
          ? { ...message, content: 'The saved scan is being processed for a proposed folder structure.', workflow, workflowStartError: undefined }
          : message),
        updatedAt: new Date().toISOString(),
      }))
    } catch (error) {
      if (error.response?.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else setConversations((current) => current.map((chat) => chat.id !== chatId ? chat : {
        ...chat,
        messages: chat.messages.map((message) => message.id !== messageId ? message : {
          ...message,
          content: `Could not start organization workflow: ${getApiError(error)}. From the Backend directory, run “alembic upgrade head”, restart the backend, then retry.`,
        }),
      }))
    } finally { setLoading(false) }
  }

  async function analyzeFiles(chatId, promptText = 'Analyze my scanned files') {
    const fileIds = scannedFiles.map((file) => file.file_id).filter(Number.isInteger)
    if (!fileIds.length && !sourceFolderId) {
      appendMessage(chatId, 'assistant', 'Scan a folder first. I can then analyze its files through the existing AI analysis workflow.')
      return
    }
    appendMessage(chatId, 'user', promptText)
    setLoading(true)
    try {
      if (fileIds.length) {
        const analyses = await analyzeScannedFiles(fileIds)
        const summary = analyses.slice(0, 20).map((item) => `${item.file_id}: ${item.category} — ${item.description.slice(0, 250)}`).join('\n')
        const omitted = Math.max(0, analyses.length - 20)
        appendMessage(chatId, 'assistant', `Analysis completed for ${analyses.length} files:\n${summary}${omitted ? `\n…and ${omitted} more analyses.` : ''}`)
      } else {
        const result = await processScannedFolder(sourceFolderId)
        const summary = result.results.slice(0, 20).map((item) => `${item.file_name}: ${item.category || item.error || item.extraction_status}`).join('\n')
        const omitted = Math.max(0, result.results.length - 20)
        appendMessage(chatId, 'assistant', `Folder processing complete. ${result.categorized_files} of ${result.total_files} files were categorized; ${result.failed_files} failed and ${result.unsupported_files} were unsupported.${summary ? `\n\n${summary}` : ''}${omitted ? `\n…and ${omitted} more files.` : ''}`)
      }
    } catch (error) {
      if (error.response?.status === 401) { signOut(); navigate('/login', { replace: true }) }
      else appendMessage(chatId, 'assistant', getApiError(error))
    } finally { setLoading(false) }
  }

  async function runAction(action, promptText = null, requestedChatId = null) {
    if (loading) return
    let chatId = requestedChatId || activeConversation?.id
    if (!chatId) {
      const chat = newConversation()
      chatId = chat.id
      setConversations((current) => [chat, ...current])
      setActiveId(chatId)
    }
    if (action === 'scan') return scanFolder(chatId, promptText || 'Select and scan a folder')
    if (action === 'analyze') return analyzeFiles(chatId, promptText || 'Analyze my scanned files')
    if (action === 'duplicates') {
      appendMessage(chatId, 'user', promptText || 'Find duplicate files')
      const groups = new Map()
      scannedFiles.filter((file) => file.file_hash).forEach((file) => groups.set(file.file_hash, [...(groups.get(file.file_hash) || []), file.name]))
      const duplicates = [...groups.values()].filter((names) => names.length > 1)
      appendMessage(chatId, 'assistant', scannedFiles.length
        ? duplicates.length ? `Found ${duplicates.length} duplicate groups by matching file hashes:\n${duplicates.map((names) => `• ${names.join(', ')}`).join('\n')}` : 'No duplicate file hashes were found in the latest folder scan.'
        : 'Scan a folder first. Duplicate detection uses the hashes returned by the existing scan endpoint.')
      return
    }
    if (action === 'organize') {
      appendMessage(chatId, 'user', promptText || 'Organize my folder')
      if (!sourceFolderId) {
        appendMessage(chatId, 'assistant', 'Scan a folder first so I can use its saved folder record to request an organization plan.')
        return
      }
      setLoading(true)
      try {
        const plan = await createOrganizationPlan(sourceFolderId)
        if (plan.status === 'failed' && plan.analyzed_files === 0) {
          const failure = plan.failed_files?.[0]?.reason || plan.skipped_files?.[0]?.reason || 'No files could be analyzed.'
          appendMessage(chatId, 'assistant', `An organization plan could not be generated: ${failure} No files were moved or changed.`)
          return
        }
        const destinations = plan.subfolders.map((folder) => `${folder.name}: ${folder.files.map((file) => file.file_name).join(', ')}`).join('\n')
        const partial = plan.failed_files?.length ? ` ${plan.failed_files.length} files could not be analyzed.` : ''
        appendMessage(chatId, 'assistant', `Organization plan ${plan.plan_id} is ready for review. ${plan.analyzed_files} files were analyzed.${partial} These are proposed destinations only; no files were moved or changed.${destinations ? `\n\n${destinations}` : '\nNo files were eligible for a proposed destination.'}`)
      } catch (error) {
        if (error.response?.status === 401) { signOut(); navigate('/login', { replace: true }) }
        else appendMessage(chatId, 'assistant', getApiError(error))
      } finally { setLoading(false) }
    }
  }

  function logout() {
    signOut()
    navigate('/login', { replace: true })
  }

  function selectChat(chatId) {
    setActiveId(chatId)
    setValue('')
    const scan = lastScanInChat(conversations.find((chat) => chat.id === chatId))
    setScannedFiles(scan?.files || [])
    setSourceFolderId(scan?.source_folder_id || null)
  }

  function confirmHistoryDialog(value) {
    if (!historyDialog) return
    const { mode, chat } = historyDialog
    if (mode === 'rename') {
      const title = value?.trim()
      if (title) setConversations((current) => current.map((item) => item.id === chat.id ? { ...item, title, updatedAt: new Date().toISOString() } : item))
    } else {
      const remaining = conversations.filter((item) => item.id !== chat.id)
      setConversations(remaining)
      saveChatHistory(storageKey, remaining)
      if (activeId === chat.id) {
        const next = remaining[0]
        setActiveId(next?.id || null)
        const scan = lastScanInChat(next)
        setScannedFiles(scan?.files || [])
        setSourceFolderId(scan?.source_folder_id || null)
      }
    }
    setHistoryDialog(null)
  }

  return <main className="dashboard-chat-app">
    <ChatSidebar collapsed={sidebarCollapsed} conversations={conversations} activeId={activeId} user={user} onToggle={() => setSidebarCollapsed((value) => !value)} onNewChat={startNewChat} onSelectChat={selectChat} onRenameChat={(chat) => setHistoryDialog({ mode: 'rename', chat })} onDeleteChat={(chat) => setHistoryDialog({ mode: 'delete', chat })} onLogout={logout} />
    <section className="dashboard-chat-main">
      <header className="dashboard-chat-header">
        <button className="dashboard-menu-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}><FiMenu /></button>
        <span><FiFolder /> AI Folder Organizer</span>
        <small>{user?.name || user?.username}</small>
      </header>
      <div className="dashboard-chat-scroll" ref={scrollRef}>
        {!messages.length ? <WelcomeScreen onSuggestion={runAction} /> : <div className="dashboard-message-list">
          {messages.map((message) => <MessageBubble key={message.id} message={message} onRetryWorkflow={() => retryOrganizationWorkflow(activeConversation.id, message.id, message.workflowStartError?.source_folder_id)} onWorkflowUpdate={(workflow) => updateWorkflow(activeConversation.id, message.id, workflow)} />)}
          {loading && <div className="chat-message from-assistant"><span className="message-avatar"><FiZap /></span><div className="message-content"><span className="message-author">AI Folder Organizer</span><TypingIndicator /></div></div>}
        </div>}
      </div>
      <div className="dashboard-composer-wrap"><ChatInput value={value} onChange={setValue} onSend={sendMessage} disabled={loading} /><p>AI responses use the model configured on your local backend. File actions require your request.</p></div>
    </section>
    <ChatHistoryDialog key={historyDialog ? `${historyDialog.mode}-${historyDialog.chat.id}` : 'closed'} mode={historyDialog?.mode} chat={historyDialog?.chat} onCancel={() => setHistoryDialog(null)} onConfirm={confirmHistoryDialog} />
  </main>
}
