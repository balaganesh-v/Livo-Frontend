import { FiCopy, FiFolder, FiLayers, FiZap } from 'react-icons/fi'

const suggestions = [
  { title: 'Select and Scan a Folder', icon: FiFolder, action: 'scan' },
  { title: 'Analyze My Files', icon: FiZap, action: 'analyze' },
  { title: 'Find Duplicate Files', icon: FiCopy, action: 'duplicates' },
  { title: 'Organize My Folder', icon: FiLayers, action: 'organize' },
]

export default function WelcomeScreen({ onSuggestion }) {
  return <section className="dashboard-chat-welcome">
    <span className="dashboard-welcome-mark"><FiFolder /></span>
    <h1>Welcome to AI Folder Organizer.<br /><span>How can I help you organize your files today?</span></h1>
    <div className="dashboard-suggestions">{suggestions.map(({ title, icon: Icon, action }) => <button key={action} onClick={() => onSuggestion(action)}><Icon /><span>{title}</span></button>)}</div>
  </section>
}
