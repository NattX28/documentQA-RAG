import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import type { ParsedDocument } from "../models/types";

export const parsePDF = async (buffer: Buffer): Promise<ParsedDocument> => {
  const uint8 = new Uint8Array(buffer);

  const pdf = await getDocumentProxy(uint8);

  const result = await extractText(pdf, { mergePages: false });

  const pages = result.text as string[];

  return {
    text: pages.join("\n\n"),
    pages,
  };
};

// No pages
export const parseDOCX = async (buffer: Buffer): Promise<ParsedDocument> => {
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: result.value,
  };
};

export const parseTXT = async (buffer: Buffer): Promise<ParsedDocument> => {
  return {
    text: buffer.toString("utf-8"),
  };
};

// Main dispatcher
export const parseFile = async (
  buffer: Buffer,
  mimeType?: string,
  fileName?: string,
): Promise<ParsedDocument> => {
  const type = mimeType?.toLowerCase() ?? "";
  const ext = fileName?.split(".").pop()?.toLowerCase();

  if (type == "application/pdf" || ext === "pdf") {
    return parsePDF(buffer);
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    return parseDOCX(buffer);
  }

  if (type === "text/plain" || ext === "txt") {
    return parseTXT(buffer);
  }

  throw new Error("ไม่รองรับไฟล์ประเภทนี้");
};
