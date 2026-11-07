import api, { getApiError } from './api'

/** @typedef {{ file_id: number | null, name: string, file_path: string, extension: string | null, mime_type: string | null, size_bytes: number, file_hash: string | null, error: string | null }} ScannedFile */
/** @typedef {{ folder_path: string, source_folder_id: number, files_discovered: number, records_persisted: number, total_files: number, processed_files: number, saved_files: number, failed_files: number, files: ScannedFile[] }} FolderScanResponse */
/** @typedef {{ id: string, role: 'user' | 'assistant', content: string, scan?: FolderScanResponse }} ChatMessage */
/** @typedef {import('../types/chat').ChatTurn} ChatTurn */
/** @typedef {import('../types/chat').ChatResponse} ChatResponse */
/** @typedef {import('../types/chat').OrganizationPlanResponse} OrganizationPlanResponse */

/** @param {string} message @param {ChatTurn[]} [history] @returns {Promise<ChatResponse>} */
export async function sendChatMessage(message, history = []) {
  try {
    const { data } = await api.post('/api/chat', {
      message,
      history: history.slice(-20).map(({ role, content }) => ({ role, content: content.slice(-8000) })),
    }, { timeout: 70_000 })
    return data
  } catch (error) {
    const detail = error.response?.data?.detail || getApiError(error)
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const timeoutError = new Error('The AI response timed out. Please try again.')
      timeoutError.status = error.response?.status
      throw timeoutError
    }
    if (!error.response && error.code === 'ERR_NETWORK') {
      const networkError = new Error('Could not reach the AI service. Check that the backend is running and try again.')
      networkError.status = error.response?.status
      throw networkError
    }
    const chatError = new Error(typeof detail === 'string' ? detail : 'The AI service could not process this message.')
    chatError.status = error.response?.status
    throw chatError
  }
}

/** @param {string} folderPath @returns {Promise<FolderScanResponse>} */
export async function scanSelectedFolder(folderPath) {
  const { data } = await api.post('/api/scans', { folder_path: folderPath })
  return data
}

/** @param {number[]} fileIds */
export async function analyzeScannedFiles(fileIds) {
  return Promise.all(fileIds.map(async (fileId) => {
    const { data } = await api.post(`/api/ai-analysis/${fileId}`)
    return data
  }))
}

/** @param {number} sourceFolderId */
export async function processScannedFolder(sourceFolderId) {
  const { data } = await api.post(`/api/source-folders/${sourceFolderId}/process-files`)
  return data
}

/** @param {number} sourceFolderId @returns {Promise<OrganizationPlanResponse>} */
export async function createOrganizationPlan(sourceFolderId) {
  const { data } = await api.post('/api/ai-analysis/bulk', { source_folder_id: sourceFolderId })
  return data
}

export async function startOrganizationWorkflow(sourceFolderId) {
  const { data } = await api.post('/api/workflows/start', { source_folder_id: sourceFolderId })
  return data
}

export async function getOrganizationWorkflowStatus(workflowId) {
  const { data } = await api.get(`/api/workflows/${workflowId}/status`)
  return data
}

export async function getOrganizationWorkflowPreview(workflowId) {
  const { data } = await api.get(`/api/workflows/${workflowId}/preview`)
  return data
}

export async function updateWorkflowDestination(workflowId, fileId, proposedPath) {
  const { data } = await api.patch(`/api/workflows/${workflowId}/items/${fileId}`, { proposed_path: proposedPath })
  return data
}

export async function decideOrganizationPlan(workflowId, decision) {
  const { data } = await api.post(`/api/workflows/${workflowId}/decision`, { decision })
  return data
}

export async function moveApprovedWorkflowFiles(workflowId) {
  const { data } = await api.post(`/api/workflows/${workflowId}/move-files`)
  return data
}
