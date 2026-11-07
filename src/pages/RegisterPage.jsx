import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import AuthLayout from '../components/auth/AuthLayout'
import RegisterForm from '../components/auth/RegisterForm'
import useAuth from '../hooks/useAuth'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  async function submit(fields) {
    await signUp(fields)
    navigate('/login', { replace: true, state: { registered: true } })
  }
  return <AuthLayout eyebrow="GET STARTED" title="Create your account" subtitle="Set up your workspace and bring your files into focus." footer={<>Already have an account? <Link to="/login">Login <FiArrowRight/></Link></>}>
    <RegisterForm onSubmit={submit}/>
  </AuthLayout>
}
