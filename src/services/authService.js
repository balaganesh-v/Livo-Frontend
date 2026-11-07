import api, { TOKEN_KEY } from './api'

export async function register({ username, email, password }) {
  const { data } = await api.post('/api/auth/register', { username, email, password })
  return data
}

export async function login({ identifier, password }) {
  const { data } = await api.post('/api/auth/login', { identifier, password })
  localStorage.setItem(TOKEN_KEY, data.access_token)
  return data
}

export async function getCurrentUser() {
  const { data } = await api.get('/api/auth/me')
  return data
}

export function logout() {
  // The current FastAPI auth router has no logout endpoint; the access token is
  // stateless, so clearing the client token ends the local session.
  localStorage.removeItem(TOKEN_KEY)
}
