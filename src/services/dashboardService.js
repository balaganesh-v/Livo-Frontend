import api from './api'

export async function scanFolder(folderPath) {
  const { data } = await api.post('/api/scans', { folder_path: folderPath })
  return data
}
