# Resources Feature

## Overview

The Resources feature provides a modular, scalable library of educational materials (articles, PDFs, videos, and links) for health and wellness. Users can search, filter, and browse resources with tag-based filtering and pagination. The feature is fully integrated with Supabase for server-side data operations and follows project conventions for clean, maintainable code.

## Architecture & Structure

- **Feature Isolation:** All business logic, hooks, and UI for resources live in `features/resources/`.
- **Thin Pages:** Pages under `app/(features)/resources/` only import and render feature components.
- **Reusable UI:** Shared UI components (e.g., `SkeletonCard`, `ResponsiveGrid`, `InteractiveTag`) are in `components/ui/`.
- **Hooks & Utilities:** Generic hooks (e.g., `useFilterState`) and utilities (e.g., `generateUniqueId`, `tagUtils`) are reused across features.

## Main Components

- **Dashboard:** Main entry point, combines search, filter, grid, and pagination.
- **ResourceCard:** Displays resource info, type, tags, and actions.
- **ResourceGrid:** Responsive grid layout for resources.
- **FilterBar:** Search and filter controls (type, tags, clear all).
- **ResourcePagination:** Handles pagination UI and logic.
- **Viewers:** PDF, video, and text viewers for resource content.

## Pages

- `/resources` — Main dashboard
- `/resources/article/[id]` — Article view (placeholder)
- `/resources/video/[id]` — Video view (placeholder)

## Features

- **Search:** Debounced, server-side search across titles and descriptions.
- **Filtering:** By resource type and tags (server-side, multi-select).
- **Pagination:** Server-side, with configurable page size and total count.
- **Interactive Tags:** Clickable tags for quick filtering.
- **Responsive Design:** Mobile and desktop optimized.
- **Loading & Error States:** Skeletons and error messages for UX.

## Data Model & Supabase Integration

- **Table:** `resources`
  - `id` (UUID, PK)
  - `title`, `description`, `cover_src`, `type`, `tags` (TEXT[]), `url`, `created_at`, `updated_at`
- **Security:** RLS policies restrict access to authenticated users.
- **Performance:** Indexed columns for search, filter, and pagination.
- **API:** All data fetching uses Supabase client with server-side filtering, search, and pagination.

## Server-Side Features

- **Debounced Search:** 300ms debounce to minimize API calls.
- **Efficient Pagination:** Uses `range` queries and total count.
- **Tag Aggregation:** Unique tags aggregated for filter UI.
- **Error Handling:** Graceful fallback for API errors.

## Extensibility

- Add new resource types by updating the `ResourceType` union and UI.
- Extend filtering or search logic in `useResources` and `resourceService`.
- UI components are generic and reusable for other features.

## Dependencies

- React Hook Form + Zod (forms/validation)
- Lucide React (icons)
- Tailwind CSS (styling)
- ShadCN UI (UI primitives)

---

For implementation details, see code comments and the main feature files in `features/resources/`.
