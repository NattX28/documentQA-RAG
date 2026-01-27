import api from "@/lib/api";

import { ConversationHistory, ConversationResponse } from "@/types/chat";

export const createNewConversation = (title?: string) => {
  return api.post<ConversationResponse>("/conversations/create", { title });
};

export const getConversations = () => {
  return api.get("/conversations");
};

export const getUserConversationHistory = (id: string) => {
  return api.get<ConversationHistory>(`/conversations/${id}`);
};

export const updateTitleConversation = (
  conversationId: string,
  newTitle: string,
) => {
  return api.patch(`/conversations/${conversationId}`, {
    title: newTitle,
  });
};
