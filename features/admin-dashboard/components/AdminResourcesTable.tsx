"use client";

import { useState } from "react";
import {
  Edit,
  Trash2,
  FileText,
  FileVideo,
  ExternalLink,
  Image,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { formatResourceDate } from "../utils/formatResourceDate";
import type { Resource, ResourceType } from "../types";

interface AdminResourcesTableProps {
  resources: Resource[];
  loading?: boolean;
  currentPage: number;
  totalResources: number;
  pageSize: number;
  onEdit: (resource: Resource) => void;
  onDelete: (resourceId: string) => void;
  onView: (resource: Resource) => void;
  onPageChange: (page: number) => void;
}

export function AdminResourcesTable({
  resources,
  loading = false,
  currentPage,
  totalResources,
  pageSize,
  onEdit,
  onDelete,
  onView,
  onPageChange,
}: AdminResourcesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(
    null,
  );

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (resourceToDelete) {
      onDelete(resourceToDelete.id);
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
    }
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case "PDF":
        return <FileText size={16} />;
      case "Article":
        return <FileText size={16} />;
      case "Text Content":
        return <FileText size={16} />;
      case "Video":
        return <FileVideo size={16} />;
      case "Link":
        return <ExternalLink size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  <div className="text-muted-foreground">
                    Loading resources...
                  </div>
                </div>
              </div>
              {/* Skeleton rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="h-12 w-12 bg-muted rounded animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-6 bg-muted rounded animate-pulse w-20" />
                  <div className="h-6 bg-muted rounded animate-pulse w-24" />
                  <div className="h-4 bg-muted rounded animate-pulse w-16" />
                  <div className="h-8 bg-muted rounded animate-pulse w-8" />
                </div>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <h3 className="mt-4 text-lg font-semibold">No resources found</h3>
              <p className="text-muted-foreground">
                Create your first resource to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                      Resource
                    </TableHead>
                    <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                      Type
                    </TableHead>
                    <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                      Tags
                    </TableHead>
                    <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                      Created
                    </TableHead>
                    <TableHead className="text-gray-500 p-4 whitespace-nowrap">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => {
                    const createdDate = formatResourceDate(resource.created_at);

                    return (
                      <TableRow key={resource.id} className="hover:bg-gray-50">
                        <TableCell className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {resource.cover_src ? (
                                <img
                                  src={resource.cover_src}
                                  alt={resource.title}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                  <Image className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {resource.title}
                              </p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {resource.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 border border-border"
                          >
                            {getTypeIcon(resource.type as ResourceType)}
                            {resource.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-32">
                            {resource.tags
                              ?.slice(0, 3)
                              .map((tag: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs border border-border"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            {resource.tags && resource.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{resource.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-4 whitespace-nowrap text-sm text-gray-500">
                          {createdDate}
                        </TableCell>
                        <TableCell className="p-4 whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 border border-border"
                            >
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => onEdit(resource)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => onView(resource)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => handleDeleteClick(resource)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalResources > pageSize && (
        <Pagination className="mt-6">
          <PaginationContent className="flex items-center space-x-1">
            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                aria-disabled={currentPage === 1}
                onClick={() =>
                  currentPage !== 1 &&
                  onPageChange(Math.max(1, currentPage - 1))
                }
                className={`px-3 py-2 text-gray-700 border-border hover:bg-secondary cursor-pointer 
                  ${currentPage === 1 ? "opacity-50" : ""}`}
              >
                Previous
              </Button>
            </PaginationItem>

            {(() => {
              const totalPages = Math.ceil(totalResources / pageSize);
              const maxVisiblePages = 5;
              let startPage = 1;
              let endPage = totalPages;

              if (totalPages > maxVisiblePages) {
                if (currentPage <= 3) {
                  endPage = maxVisiblePages;
                } else if (currentPage >= totalPages - 2) {
                  startPage = totalPages - maxVisiblePages + 1;
                } else {
                  startPage = currentPage - 2;
                  endPage = currentPage + 2;
                }
              }

              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <PaginationItem key={i}>
                    <Button
                      variant={currentPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(i)}
                      className={`px-3 py-2 cursor-pointer ${
                        currentPage === i
                          ? "bg-primary text-white hover:bg-primary/90"
                          : "text-gray-700 border-border hover:bg-secondary"
                      }`}
                    >
                      {i}
                    </Button>
                  </PaginationItem>,
                );
              }

              return pages;
            })()}

            <PaginationItem>
              <Button
                variant="outline"
                size="sm"
                aria-disabled={
                  currentPage === Math.ceil(totalResources / pageSize)
                }
                onClick={() => {
                  if (currentPage !== Math.ceil(totalResources / pageSize)) {
                    onPageChange(
                      Math.min(
                        Math.ceil(totalResources / pageSize),
                        currentPage + 1,
                      ),
                    );
                  }
                }}
                className={`px-3 py-2 text-gray-700 border-border hover:bg-secondary cursor-pointer 
                  ${currentPage === Math.ceil(totalResources / pageSize) ? "opacity-50" : ""}`}
              >
                Next
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{resourceToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
