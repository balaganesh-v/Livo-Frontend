import MessageList from './MessageList'
import ChatInput from './ChatInput'

export default function ChatWindow({ messages, loading, value, onChange, onSend, error }) {
  return <main className="chat-main"><MessageList messages={messages} loading={loading} />
    {error && <div className="chat-error" role="alert">{error}</div>}
    <ChatInput value={value} onChange={onChange} onSend={onSend} disabled={loading} />
  </main>
}
