"use client";

import { getErrorMessage } from "@/lib/error";
import { useStore } from "@/lib/store";
import { createNewConversation } from "@/services/chat";
import { Message } from "@/types";
import { SourceChunk } from "@/types/document";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");
  const { documents } = useStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadConversation = async (id: string) => {
    try {
    } catch (error) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (documents.length === 0) {
      toast.error("Please upload document first");
      return;
    }

    const userMessage = input;
    setInput("");
    setLoading(true);
    setStreamingMessage(""); // Reset streaming message

    // Add user's message immediately
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Create conversation if needed
      let convId = currentConvId;
      if (!convId) {
        const { data: convData } = await createNewConversation(
          userMessage.slice(0, 50),
        );
        convId = convData.conversation.id;
        setCurrentConvId(convId);
      }

      // Create AbortController for cancellation
      abortControllerRef.current = new AbortController();

      // Get token
      const token = localStorage.getItem("token");

      // Fetch with streaming
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversations/message-stream`,
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: convId,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let sources: SourceChunk[] = [];

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                fullText += data.content;
                setStreamingMessage(fullText);
              } else if (data.type === "sources") {
                sources = data.sources;
              } else if (data.type === "done") {
                // Stream complete
                const aiMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: "assistant",
                  content: fullText,
                  sources: sources,
                  created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, aiMessage]);
                setStreamingMessage("");
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        toast.info("Message cancelled");
      } else {
        toast.error(getErrorMessage(error) || "Failed to send message");
      }
      setStreamingMessage("");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setStreamingMessage("");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      setCurrentConvId(conversationId);
    } else {
      setMessages([]);
      setCurrentConvId(null);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);
};

export default ChatPage;
