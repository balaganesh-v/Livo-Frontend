import { useEffect, useMemo, useState } from 'react'
import { TOKEN_KEY } from '../services/api'
import * as authService from '../services/authService'
import AuthContext from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    let active = true
    authService.getCurrentUser()
      .then((currentUser) => { if (active) setUser(currentUser) })
      .catch(() => {
        authService.logout()
        if (active) setUser(null)
      })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  const value = useMemo(() => ({
    user,
    checking,
    async signIn(credentials) {
      const response = await authService.login(credentials)
      setUser(response.user)
      return response.user
    },
    async signUp(fields) { return authService.register(fields) },
    signOut() {
      authService.logout()
      setUser(null)
    },
  }), [user, checking])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
