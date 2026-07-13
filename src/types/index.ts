export type Provider = "google" | "github" | "local";

export interface Identity {
  provider: Provider;
  providerId: string;
  email?: string;
}

export interface User {
  id: string;
  _id?: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  identities: Identity[];
  role: "user" | "admin";
  isVerified: boolean;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export type ConversationType = "direct" | "group";

export interface Conversation {
  id: string;
  _id?: string;
  type: ConversationType;
  members: User[];
  name?: string;
  avatar?: string;
  admin?: string;
  lastMessage?: Message;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = "text" | "image" | "audio" | "file";

export type MessageStatusValue = "sent" | "delivered" | "read";

export interface MessageReceipt {
  user: string;
  status: MessageStatusValue;
}

export interface MessageReaction {
  user: string;
  emoji: string;
}

export interface Message {
  id: string;
  _id?: string;
  conversation: string;
  sender: User | string;
  type: MessageType;
  content: string;
  replyTo?: Message | string;
  receipts: MessageReceipt[];
  reactions: MessageReaction[];
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = "new_message" | "group_added" | "group_removed";

export interface NewMessageNotificationPayload {
  conversationId: string;
  senderName: string;
  preview: string;
}

export interface Notification {
  id: string;
  _id?: string;
  recipient: string;
  type: NotificationType;
  payload: NewMessageNotificationPayload | Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
}

export interface ApiError {
  message: string | string[];
  error?: string;
  statusCode?: number;
}
