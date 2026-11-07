import { useRef } from 'react'
import { FiArrowUp } from 'react-icons/fi'

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const inputRef = useRef(null)
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend(); }
  }
  return <div className="chat-composer"><textarea ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleKeyDown} placeholder="Message AI Folder Organizer…" rows={1} maxLength={8000} aria-label="Message" />
    <button className="send-button" onClick={onSend} disabled={disabled || !value.trim()} aria-label="Send message"><FiArrowUp /></button>
    <small>Enter to send · Shift + Enter for a new line</small>
  </div>
}
