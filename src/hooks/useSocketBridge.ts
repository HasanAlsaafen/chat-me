import { useEffect } from "react";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";
import { useChatStore } from "../store/chatStore";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";
import { useLocalPrefsStore } from "../store/localPrefsStore";
import type { Message, MessageStatusValue, NotificationType } from "../types";

interface DeliveredPayload {
  messageIds: string[];
  conversationId: string;
  recipientIds: string[];
}

interface ReadPayload {
  messageId: string;
  conversationId: string;
  readBy: string;
}

interface TypingPayload {
  conversationId: string;
  userId: string;
}

interface EditedPayload {
  messageId: string;
  conversationId: string;
  content: string;
  editedAt: string;
}

interface DeletedPayload {
  messageId: string;
  conversationId: string;
}

interface ReactionAddedPayload {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
}

interface ReactionRemovedPayload {
  messageId: string;
  conversationId: string;
  userId: string;
}

interface LiveNotificationPayload {
  type: NotificationType;
  payload: { conversationId?: string; senderName?: string; preview?: string };
}

let liveNotificationSeq = 0;

export function useSocketBridge() {
  const status = useAuthStore((s) => s.status);
  const addMessage = useChatStore((s) => s.addMessage);
  const setMessageReceipt = useChatStore((s) => s.setMessageReceipt);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setReaction = useChatStore((s) => s.setReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);
  const setTyping = useChatStore((s) => s.setTyping);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (status !== "authenticated") return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      addMessage(message.conversation, message);
    };

    const handleDelivered = (data: DeliveredPayload) => {
      data.recipientIds.forEach((userId) => {
        setMessageReceipt(
          data.conversationId,
          data.messageIds,
          userId,
          "delivered" as MessageStatusValue,
        );
      });
    };

    const handleRead = (data: ReadPayload) => {
      setMessageReceipt(
        data.conversationId,
        [data.messageId],
        data.readBy,
        "read" as MessageStatusValue,
      );
    };

    const handleNotification = (data: LiveNotificationPayload) => {
      const conversationId = data.payload.conversationId;
      const muted = conversationId
        ? Boolean(
            useLocalPrefsStore.getState().conversationFlags[conversationId]
              ?.muted,
          )
        : false;
      if (data.type === "new_message" && !muted) {
        toast(
          `${data.payload.senderName ?? "New message"}: ${data.payload.preview ?? ""}`,
        );
      }
      liveNotificationSeq += 1;
      addNotification({
        id: `live-${Date.now()}-${liveNotificationSeq}`,
        recipient: "",
        type: data.type,
        payload: data.payload,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    };

    const handleError = (data: { message: string }) => {
      toast.error(data.message);
    };

    const handleTyping = (data: TypingPayload) => {
      setTyping(data.conversationId, data.userId, true);
    };

    const handleStoppedTyping = (data: TypingPayload) => {
      setTyping(data.conversationId, data.userId, false);
    };

    const handleEdited = (data: EditedPayload) => {
      updateMessage(data.conversationId, data.messageId, {
        content: data.content,
        isEdited: true,
        editedAt: data.editedAt,
      });
    };

    const handleDeleted = (data: DeletedPayload) => {
      updateMessage(data.conversationId, data.messageId, {
        isDeleted: true,
      });
    };

    const handleReactionAdded = (data: ReactionAddedPayload) => {
      setReaction(data.conversationId, data.messageId, data.userId, data.emoji);
    };

    const handleReactionRemoved = (data: ReactionRemovedPayload) => {
      removeReaction(data.conversationId, data.messageId, data.userId);
    };

    socket.on("new_message", handleNewMessage);
    socket.on("messages_delivered", handleDelivered);
    socket.on("message_read", handleRead);
    socket.on("notification", handleNotification);
    socket.on("error", handleError);
    socket.on("user_typing", handleTyping);
    socket.on("user_stopped_typing", handleStoppedTyping);
    socket.on("message_edited", handleEdited);
    socket.on("message_deleted", handleDeleted);
    socket.on("message_reaction_added", handleReactionAdded);
    socket.on("message_reaction_removed", handleReactionRemoved);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("messages_delivered", handleDelivered);
      socket.off("message_read", handleRead);
      socket.off("notification", handleNotification);
      socket.off("error", handleError);
      socket.off("user_typing", handleTyping);
      socket.off("user_stopped_typing", handleStoppedTyping);
      socket.off("message_edited", handleEdited);
      socket.off("message_deleted", handleDeleted);
      socket.off("message_reaction_added", handleReactionAdded);
      socket.off("message_reaction_removed", handleReactionRemoved);
    };
  }, [
    status,
    addMessage,
    setMessageReceipt,
    updateMessage,
    setReaction,
    removeReaction,
    setTyping,
    addNotification,
  ]);
}
