import type { Request, Response } from "express";

import { uploadDocument as uploadDocumentService } from "../services/document.service";

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
