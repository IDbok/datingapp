export type Message = {
  id: string
  senderId: string
  senderDisplayName: string
  senderImageUrl: string
  recipientId: string
  recipientDisplayName: string
  recipientImageUrl: string
  content: string
  sentAt: string
  readAt: string | null
  currentUserSender?: boolean
}
