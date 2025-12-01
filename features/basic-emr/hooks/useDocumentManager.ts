import { useState } from "react";
import { toast } from "sonner";

interface DocumentType {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
}

export function useDocumentManager() {
  const [documents, setDocuments] = useState<DocumentType[]>([
    {
      id: "doc_1",
      name: "Patient History.pdf",
      type: "pdf",
      uploadDate: "2024-03-14",
      size: "2.4 MB",
      url: "#",
    },
    {
      id: "doc_2",
      name: "X-Ray Results.jpg",
      type: "image",
      uploadDate: "2024-03-13",
      size: "1.8 MB",
      url: "#",
    },
  ]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleUpload = (files: File[]) => {
    files.forEach((file) => {
      const fileUrl = URL.createObjectURL(file);

      let fileType = "other";
      if (file.type.startsWith("image/")) {
        fileType = "image";
      } else if (file.type === "application/pdf") {
        fileType = "pdf";
      }

      const newDocument: DocumentType = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        uploadDate: new Date().toISOString().split("T")[0],
        size: formatFileSize(file.size),
        url: fileUrl,
      };

      setDocuments((prev) => [newDocument, ...prev]);
      toast.success(`${file.name} uploaded successfully!`);
    });
  };

  const handleDelete = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    toast.success("Document deleted successfully");
  };

  const handleView = (doc: DocumentType) => {
    if (doc.url === "#") {
      toast.info("Document preview not available for sample documents");
      return false;
    }
    return true;
  };

  return {
    documents,
    handleUpload,
    handleDelete,
    handleView,
  };
}
