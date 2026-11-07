export type ChatRole = 'user' | 'assistant'

export interface ChatTurn {
  role: ChatRole
  content: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  scan?: {
    folder_path: string
    source_folder_id: number
    total_files: number
    saved_files: number
    files: Array<{ file_id: number | null; name: string; extension: string | null; size_bytes: number; file_hash: string | null }>
  }
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatRequest {
  message: string
  history: ChatTurn[]
}

export interface ChatResponse {
  response: string
  model: string
}

export interface OrganizationPlanResponse {
  plan_id: number
  status: string
  analyzed_files: number
  failed_files: Array<{ file_id: number; file_name: string; reason: string }>
  skipped_files: Array<{ file_id: number; file_name: string; reason: string }>
  subfolders: Array<{ name: string; files: Array<{ file_id: number; file_name: string; reason?: string | null }> }>
}
