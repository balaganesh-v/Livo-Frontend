import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  async function submit(credentials) {
    await signIn(credentials)
    navigate('/dashboard', { replace: true })
  }
  return <AuthLayout eyebrow="WELCOME BACK" title="Sign in to Livo" subtitle="Your organized workspace is right where you left it." footer={<>New to Livo? <Link to="/register">Create an account <FiArrowRight/></Link></>}>
    <LoginForm onSubmit={submit} registered={Boolean(location.state?.registered)}/>
  </AuthLayout>
}
