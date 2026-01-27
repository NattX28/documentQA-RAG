"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/error";
import { useStore } from "@/lib/store";
import {
  createNewConversation,
  getUserConversationHistory,
  getConversations,
  updateTitleConversation,
} from "@/services/chat";
import { loadAllDocuments } from "@/services/documents";
import { Message } from "@/types";
import { SourceChunk } from "@/types/document";
import { SendHorizonal, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");
  const { documents, setDocuments, setConversations } = useStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<SourceChunk | null>(
    null,
  );
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (documents.length === 0) {
          const { data } = await loadAllDocuments();
          setDocuments(data.documents);
        }

        const { data: convData } = await getConversations();
        setConversations(convData.conversations);
      } catch (error) {
        console.error("Failed to initialize data:", error);
      }
    };

    initializeData();
  }, []); // เพิ่ม dependency array

  const loadConversation = async (id: string) => {
    try {
      const { data } = await getUserConversationHistory(id);
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
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
      let isNewConversation = false;
      if (!convId) {
        const { data: convData } =
          await createNewConversation("New Conversation");
        convId = convData.conversation.id;
        setCurrentConvId(convId);
        isNewConversation = true;
      }

      if (isNewConversation || messages.length === 0) {
        try {
          await updateTitleConversation(convId, userMessage.slice(0, 50));

          // Update local state
          const { data: convData } = await getConversations();
          setConversations(convData.conversations);
        } catch (error) {
          console.error("Failed to update conversation title:", error);
        }
      }
      // Create AbortController for cancellation
      abortControllerRef.current = new AbortController();

      // Get token
      const token = localStorage.getItem("token");

      // Fetch with streaming
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/message-stream`,
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
    const initConversation = async () => {
      if (conversationId) {
        setMessages([]);
        setStreamingMessage("");
        await loadConversation(conversationId);
        setCurrentConvId(conversationId);
      } else {
        setMessages([]);
        setStreamingMessage("");
        setCurrentConvId(null);
      }
    };

    initConversation();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="h-full flex flex-col">
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="text-9xl font-semibold mb-2">💬</div>
            <h2 className="text-2xl font-semibold mb-2">
              Start a Conversation
            </h2>
            <p className="text-gray-600 mb-6">
              Ask questions about uploaded documents
            </p>
            {documents.length === 0 && (
              <p className="text-sm text-amber-600">
                ⚠️ Please upload document first ⚠️
              </p>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] p-4 sm:p-2 ${message.role === "user" ? "bg-indigo-600 text-white" : "bg-white"}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-xl">
                      {message.role === "user" ? "👤" : "👾"}
                    </div>
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-semibold mb-2 text-gray-700">
                            📚 Sources ({message.sources.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedSource(source);
                                  setIsSourceDialogOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-medium transition-colors cursor-pointer border border-indigo-200"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">
                                  {source.document_title}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {Math.round(source.similarity * 100)}%
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            {/* Streaming Message */}
            {streamingMessage && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 bg-white">
                  <div className="flex items-start gap-2">
                    <div className="text-xl">👾</div>
                    <div className="flex-1">
                      <div className="whitespace-pre-wrap">
                        {streamingMessage}
                        <span className="inline-block w-2 h-4 bg-indigo-600 ml-1 animate-pulse">
                          ▋
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {loading && !streamingMessage && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4 bg-white">
              <div className="flex items-center gap-2">
                <div className="text-xl">👾</div>
                <div className="flex gap-1">
                  <span className="animate-bounce">•</span>
                  <span className="animate-bounce delay-100">•</span>
                  <span className="animate-bounce delay-200">•</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={loading}
            className="flex-1"
          />
          {loading ? (
            <Button type="button" onClick={handleStop} variant="destructive">
              Stop
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()}>
              <SendHorizonal />
            </Button>
          )}
        </form>
      </div>

      {/* Source Dialog */}
      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              {selectedSource?.document_title}
            </DialogTitle>
            <DialogDescription>
              View the source content that was used to generate the response
            </DialogDescription>
          </DialogHeader>

          {selectedSource && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Relevance:
                  </span>
                  <Badge variant="secondary">
                    {Math.round(selectedSource.similarity * 100)}%
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Chunk:
                  </span>
                  <Badge variant="outline">#{selectedSource.chunk_index}</Badge>
                </div>

                {selectedSource.page_number && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Page:
                    </span>
                    <Badge variant="outline">
                      {selectedSource.page_number}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h4 className="text-sm font-semibold mb-2 text-gray-700">
                  Content:
                </h4>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {selectedSource.content}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPage;
