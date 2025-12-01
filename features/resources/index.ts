// Main components
export { default as Dashboard } from "./components/Dashboard";
export { default as ResourceCard } from "./components/ResourceCard";
export { default as ResourceGrid } from "./components/ResourceGrid";
export { default as FilterBar } from "./components/FilterBar";
export { default as SearchInput } from "./components/SearchInput";
export { default as ResourcePagination } from "./components/ResourcePagination";
export { default as EmptyState } from "./components/EmptyState";

// Viewers
export { PDFViewer } from "./components/viewers/PDFViewer";
export { VideoViewer } from "./components/viewers/VideoViewer";
export { TextViewer } from "./components/viewers/TextViewer";

// Hooks
export { useResources } from "./hooks/useResources";

// Types
export type { Resource, ResourceType } from "./types";
 