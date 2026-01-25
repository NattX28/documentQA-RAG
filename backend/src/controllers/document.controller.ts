import type { Request, Response } from "express";

import {
  getDocumentById,
  getUserDocuments,
  uploadDocument as uploadDocumentService,
  deleteDocument as deleteDocumentService,
} from "../services/document.service";

export const uploadDocument = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const document = await uploadDocumentService(userId, file);

  res.status(201).json({
    message: "Document uploaded successfully",
    document: {
      id: document.id,
      title: document.title,
      file_size: document.file_size,
      uploaded_at: document.uploaded_at,
    },
  });
};

export const getDocuments = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const documents = await getUserDocuments(userId);

  res.json({ success: true, documents });
};

export const deleteDocument = async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { documentId } = req.params;

  await deleteDocumentService(documentId as string, userId);

  res.json({
    success: true,
    message: "Document deleted successfully",
  });
};
