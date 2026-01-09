import { useState, useEffect, useRef } from "react";
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
  // Keep track of blob URLs we've created
  const blobUrlsRef = useRef<Map<string, string>>(new Map());

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleUpload = (files: File[]) => {
    files.forEach((file) => {
      // Create a blob URL and store it
      const fileUrl = URL.createObjectURL(file);

      let fileType = "other";
      if (file.type.startsWith("image/")) {
        fileType = "image";
      } else if (file.type === "application/pdf") {
        fileType = "pdf";
      }

      const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newDocument: DocumentType = {
        id: docId,
        name: file.name,
        type: fileType,
        uploadDate: new Date().toISOString().split("T")[0],
        size: formatFileSize(file.size),
        url: fileUrl,
        file: file, // Store the file object
      };

      // Keep track of the blob URL
      blobUrlsRef.current.set(docId, fileUrl);

      setDocuments((prev) => [newDocument, ...prev]);
      toast.success(`${file.name} uploaded successfully!`);
    });
  };

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    // Store reference for cleanup
    const currentBlobUrls = blobUrlsRef.current;

    return () => {
      // Revoke all blob URLs on unmount
      currentBlobUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      currentBlobUrls.clear();
    };
  }, []);

  const handleDelete = (docId: string) => {
    // Revoke the blob URL if it exists
    const blobUrl = blobUrlsRef.current.get(docId);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrlsRef.current.delete(docId);
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
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
