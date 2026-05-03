import { apiClient } from './client'

export interface MessageUser {
  id: string
  full_name: string
  email: string
  role: string
}

export interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  body: string
  course_id?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  from_user?: Partial<MessageUser>
  to_user?: Partial<MessageUser>
  courses?: { code: string; name: string } | null
}

export interface MessagesResponse {
  inbox: Message[]
  sent: Message[]
  unread_count: number
}

export async function listMessages(): Promise<MessagesResponse> {
  const { data } = await apiClient.get('/messages')
  return data
}

export async function sendMessage(payload: {
  to_user_id?: string
  to_user_ids?: string[]
  subject?: string
  body: string
  course_id?: string
}): Promise<{ sent: number; messages: Message[] }> {
  const { data } = await apiClient.post('/messages', payload)
  return data
}

export async function markMessageRead(messageId: string): Promise<void> {
  await apiClient.post(`/messages/${messageId}/read`)
}

export async function markAllRead(): Promise<void> {
  await apiClient.post('/messages/read-all')
}

export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/messages/${messageId}`)
}
