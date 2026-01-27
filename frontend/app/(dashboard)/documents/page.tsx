"use client";

import { getErrorMessage } from "@/lib/error";
import { useStore } from "@/lib/store";
import {
  deleteDocument,
  loadAllDocuments,
  uploadDocument,
} from "@/services/documents";
import { useState } from "react";
import { toast } from "sonner";

const DocumentsPage = () => {
  const { documents, setDocuments } = useStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data } = await loadAllDocuments();
      setDocuments(data.documents);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.warning("Invalid file type", {
        description: "Please upload PDF, TXT, or DOCX files only",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning("File too large: Maximum 10MB", {
        description: "Maximum file size is 10MB",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleupload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data } = await uploadDocument(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Success", {
        description: "Document upload successfully",
      });

      setDialogOpen(false);
      setSelectedFile(null);
      loadAllDocuments();
    } catch (error) {
      toast.error("Upload failed", {
        description: getErrorMessage(error) || "Failed to upload document",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(id);
      toast.success("Success", {
        description: "Document deleted",
      });
      loadAllDocuments();
    } catch (error) {
      toast.error("Error", {
        description: "Failed to delete document",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
};

export default DocumentsPage;
