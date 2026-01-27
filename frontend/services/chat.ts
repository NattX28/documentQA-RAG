import api from "@/lib/api";

import { ConversationResponse } from "@/types/chat";

export const createNewConversation = (title?: string) => {
  return api.post<ConversationResponse>("/conversations/create", { title });
};

export const getConversations = () => {
  return api.get("/conversations");
};
