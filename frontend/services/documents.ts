import api from "@/lib/api";

export const loadAllDocuments = () => {
  return api.get("/documents");
};

export const uploadDocument = (formData: FormData) => {
  return api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteDocument = (id: string) => {
  api.delete(`/documents/${id}`);
};
