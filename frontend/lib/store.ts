import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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
        set({
          user: null,
          conversations: [],
          documents: [],
          currentConversationId: null,
        });
      },
    }),
    {
      name: "rag-app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        conversations: state.conversations,
        documents: state.documents,
      }),
    },
  ),
);
