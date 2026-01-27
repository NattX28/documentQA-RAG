import { Conversation, Message } from ".";

export interface ConversationResponse {
  conversation: Conversation;
}

export interface ConversationHistory {
  conversation: Conversation;
  messages: Message[];
}
