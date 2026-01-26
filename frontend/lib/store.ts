import { create } from "zustand";
import { User, Conversation, Document } from "@/types";

interface AppState {
  user: User | null;
  conversations: Conversation[];
  documents: Document[];
  currentConversationId: string | null;

  setUser: (user: User | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setDocuments: (documents: Document[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  conversations: [],
  documents: [],
  currentConversationId: null,

  setUser: (user) => set({ user }),
  setConversations: (conversations) => set({ conversations }),
  setDocuments: (documents) => set({ documents }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, conversations: [], currentConversationId: null });
  },
}));
