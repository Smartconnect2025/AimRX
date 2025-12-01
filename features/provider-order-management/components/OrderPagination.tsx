/**
 * OrderPagination Component
 * 
 * Pagination controls for provider order table.
 */

"use client";

import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { OrderPaginationProps } from "../types";
import { generatePaginationPages } from "../utils";

export function OrderPagination({
  currentPage,
  totalPages,
  searchQuery,
  onPageChange
}: OrderPaginationProps) {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const pages = generatePaginationPages(currentPage, totalPages);
  
  // Build query string for URL-based navigation if needed
  const buildQueryString = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    return params.toString();
  };

  const handlePageClick = (page: number, e: React.MouseEvent) => {
    e.preventDefault();
    onPageChange(page);
  };

  const handlePreviousClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="py-4">
      <Pagination>
        <PaginationContent>
          {/* Previous button */}
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href={`?${buildQueryString(currentPage - 1)}`}
                onClick={handlePreviousClick}
              />
            </PaginationItem>
          )}

          {/* Page numbers */}
          {pages.map((pageNumber, index) => {
            const prevPage = index > 0 ? pages[index - 1] : null;
            const showEllipsisBefore = prevPage && pageNumber > prevPage + 1;

            return (
              <React.Fragment key={pageNumber}>
                {/* Show ellipsis before current page if there's a gap */}
                {showEllipsisBefore && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                
                {/* Page number */}
                <PaginationItem>
                  <PaginationLink
                    href={`?${buildQueryString(pageNumber)}`}
                    onClick={(e) => handlePageClick(pageNumber, e)}
                    isActive={pageNumber === currentPage}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            );
          })}

          {/* Show ellipsis after if needed */}
          {pages.length > 0 && pages[pages.length - 1] < totalPages - 1 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {/* Next button */}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                href={`?${buildQueryString(currentPage + 1)}`}
                onClick={handleNextClick}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
} 