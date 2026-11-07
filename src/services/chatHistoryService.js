/** @typedef {import('../types/chat').ChatSession} ChatSession */

const STORAGE_PREFIX = 'livo_chat_history_v1'

export function getChatHistoryKey(user) {
  const owner = user?.id ?? user?.username ?? user?.email ?? 'default'
  return `${STORAGE_PREFIX}:${String(owner).trim().toLowerCase()}`
}

/** @param {string} storageKey @returns {ChatSession[]} */
export function loadChatHistory(storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]')
    if (!Array.isArray(saved)) return []
    return saved.filter((chat) => chat && typeof chat.id === 'string' && typeof chat.title === 'string' && Array.isArray(chat.messages))
  } catch {
    return []
  }
}

/** @param {string} storageKey @param {ChatSession[]} conversations */
export function saveChatHistory(storageKey, conversations) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(conversations))
  } catch (error) {
    console.error('Could not save chat history to this device.', error)
  }
}
