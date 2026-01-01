import { useState } from "react";
import { toast } from "sonner";

interface DocumentType {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  url: string;
  file?: File; // Store the actual file object for viewing
}

export function useDocumentManager() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleUpload = (files: File[]) => {
    files.forEach((file) => {
      // Create a persistent blob URL that won't be revoked
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
        file: file, // Store the file object
      };

      setDocuments((prev) => [newDocument, ...prev]);
      toast.success(`${file.name} uploaded successfully!`);
    });
  };

  const handleDelete = (docId: string) => {
    setDocuments((prev) => {
      // Find and revoke the blob URL to free up memory
      const docToDelete = prev.find((doc) => doc.id === docId);
      if (docToDelete && docToDelete.url.startsWith("blob:")) {
        URL.revokeObjectURL(docToDelete.url);
      }
      return prev.filter((doc) => doc.id !== docId);
    });
    toast.success("Document deleted successfully");
  };

  const handleView = (_doc: DocumentType) => {
    // All uploaded documents should be viewable
    // The URL is a blob URL created from the file
    return true;
  };

  return {
    documents,
    handleUpload,
    handleDelete,
    handleView,
  };
}
