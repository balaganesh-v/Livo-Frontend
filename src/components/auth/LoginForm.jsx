import { useState } from 'react'
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiShield } from 'react-icons/fi'
import AuthField from './AuthField'
import ErrorMessage from '../common/ErrorMessage'
import LoadingSpinner from '../common/LoadingSpinner'
import { getApiError } from '../../services/api'

export default function LoginForm({ onSubmit, registered = false }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try { await onSubmit({ identifier: identifier.trim(), password }) }
    catch (requestError) { setError(getApiError(requestError)) }
    finally { setLoading(false) }
  }

  return <form onSubmit={submit} className="auth-form">
    {registered && <ErrorMessage success>Your account is ready. Sign in to continue.</ErrorMessage>}
    <AuthField label="Username or email" icon={FiMail} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="Your username or email" autoComplete="username"/>
    <AuthField label="Password" icon={FiLock} type={visible ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" trailing={<button className="reveal" type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <FiEyeOff/> : <FiEye/>}</button>}/>
    {error && <ErrorMessage>{error}</ErrorMessage>}
    <button className="primary-button" disabled={loading}>{loading ? <><LoadingSpinner small/> Signing in…</> : <>Sign in <FiArrowRight/></>}</button>
    <p className="secure-note"><FiShield/> Your account is protected with secure authentication</p>
  </form>
}
