import { FiCpu, FiFolder, FiUser } from 'react-icons/fi'
import WorkflowCard from './WorkflowCard'

export default function MessageBubble({ message, onWorkflowUpdate, onRetryWorkflow }) {
  const user = message.role === 'user'
  return <article className={`chat-message ${user ? 'from-user' : 'from-assistant'}`}>
    <span className="message-avatar">{user ? <FiUser /> : <FiCpu />}</span>
    <div className="message-content"><span className="message-author">{user ? 'You' : 'Livo assistant'}</span><p>{message.content}</p>
      {message.scan && <div className="folder-action"><FiFolder /> <span><strong>Scan complete</strong><small>{message.scan.saved_files} files saved from {message.scan.folder_path}</small></span></div>}
      {message.workflow && <WorkflowCard workflow={message.workflow} onUpdate={onWorkflowUpdate}/>}
      {message.workflowStartError && <button className="workflow-retry-button" onClick={onRetryWorkflow}>Retry organization workflow</button>}
    </div>
  </article>
}
