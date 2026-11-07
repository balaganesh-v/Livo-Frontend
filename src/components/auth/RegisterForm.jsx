import { useState } from 'react'
import { FiArrowRight, FiEye, FiEyeOff, FiLayers, FiLock, FiMail, FiShield } from 'react-icons/fi'
import AuthField from './AuthField'
import ErrorMessage from '../common/ErrorMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import { getApiError } from '../../services/api'

export default function RegisterForm({ onSubmit }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return }
    if (username.trim().length > 50) { setError('Username must be 50 characters or fewer.'); return }
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return }
    setLoading(true)
    try { await onSubmit({ username: username.trim(), email: email.trim(), password }) }
    catch (requestError) { setError(getApiError(requestError)) }
    finally { setLoading(false) }
  }

  return <form onSubmit={submit} className="auth-form">
    <AuthField label="Username" icon={FiLayers} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" autoComplete="username" minLength={3} maxLength={50}/>
    <AuthField label="Email address" icon={FiMail} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email"/>
    <AuthField label="Password" icon={FiLock} type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} maxLength={128} trailing={<button className="reveal" type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <FiEyeOff/> : <FiEye/>}</button>}/>
    {error && <ErrorMessage>{error}</ErrorMessage>}
    <button className="primary-button" disabled={loading}>{loading ? <><LoadingSpinner small/> Creating account…</> : <>Create account <FiArrowRight/></>}</button>
    <p className="secure-note"><FiShield/> Your password is securely encrypted</p>
  </form>
}
