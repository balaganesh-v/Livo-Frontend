import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<Navigate to="/login" replace/>}/>
    <Route path="/login" element={<ProtectedRoute guestOnly><LoginPage/></ProtectedRoute>}/>
    <Route path="/register" element={<ProtectedRoute guestOnly><RegisterPage/></ProtectedRoute>}/>
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage/></ProtectedRoute>}/>
    <Route path="/chat" element={<ProtectedRoute><ChatPage/></ProtectedRoute>}/>
    <Route path="*" element={<Navigate to="/login" replace/>}/>
  </Routes></AuthProvider></BrowserRouter>
}
