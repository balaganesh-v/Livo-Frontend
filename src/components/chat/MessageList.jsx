import { useEffect, useRef } from 'react'
import { FiFolder, FiShield, FiZap } from 'react-icons/fi'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

export default function MessageList({ messages, loading }) {
  const endRef = useRef(null)
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [messages, loading])
  return <div className="message-scroll">
    {!messages.length && <section className="chat-welcome">
      <span className="welcome-mark"><FiFolder /></span><span className="eyebrow"><FiZap /> YOUR ORGANIZATION ASSISTANT</span>
      <h1>A little more order,<br /><em>one folder at a time.</em></h1>
      <p>Choose a folder to scan its files. This chat keeps your session history here, and will connect to an AI endpoint when the backend provides one.</p>
      <div className="welcome-capabilities"><span><FiFolder /> Scan a folder</span><span><FiShield /> Your files stay in place</span></div>
    </section>}
    <div className="message-list">{messages.map((message) => <MessageBubble key={message.id} message={message} />)}
      {loading && <div className="chat-message from-assistant"><span className="message-avatar"><FiZap /></span><div className="message-content"><span className="message-author">Livo assistant</span><TypingIndicator /></div></div>}
      <div ref={endRef} />
    </div>
  </div>
}
