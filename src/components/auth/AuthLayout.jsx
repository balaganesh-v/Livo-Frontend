import { Link } from 'react-router-dom'
import { FiCheck, FiFolder, FiLayers, FiZap } from 'react-icons/fi'

export default function AuthLayout({ children, eyebrow, title, subtitle, footer }) {
  return <main className="auth-shell">
    <div className="auth-glow glow-one"/><div className="auth-glow glow-two"/>
    <section className="auth-card">
      <Link to="/login" className="brand"><span className="brand-mark"><FiLayers/></span><span>Livo</span></Link>
      <div className="auth-intro"><span className="eyebrow"><FiZap/> {eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>
      {children}<div className="auth-footer">{footer}</div>
    </section>
    <aside className="auth-aside"><div className="aside-content">
      <span className="aside-icon"><FiFolder/></span><p className="aside-kicker">A calmer kind of organized</p>
      <h2>Your files,<br/>finally in sync.</h2>
      <p className="aside-copy">Bring clarity to your folders with intelligent scanning and AI-powered insights.</p>
      <div className="aside-points"><span><FiCheck/> One clear view of every folder</span><span><FiCheck/> Insights grounded in your files</span></div>
    </div><span className="aside-orbit orbit-a"/><span className="aside-orbit orbit-b"/></aside>
  </main>
}
