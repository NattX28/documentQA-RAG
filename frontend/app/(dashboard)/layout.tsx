"use client";
import AppSideBar from "@/components/App-Sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getErrorMessage } from "@/lib/error";
import { useStore } from "@/lib/store";
import { getConversations } from "@/services/chat";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, setUser, setConversations } = useStore();
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data.conversations);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.push("/login");
      return;
    }

    if (!user) {
      setUser(JSON.parse(savedUser));
    }

    loadConversations();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSideBar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-semibold">Document Q&A</h1>
        </header>
        {/* Main Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
