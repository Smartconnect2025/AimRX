import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ResourcePaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const ResourcePagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
}: ResourcePaginationProps) => {
  const hidePagination = totalPages <= 1;
  if (hidePagination) {
    return null;
  }

  const handlePrevious = () => {
    setCurrentPage(Math.max(currentPage - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage(Math.min(currentPage + 1, totalPages));
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    let startPage = 1;

    if (totalPages > 5 && currentPage > 3) {
      startPage = currentPage - 2;
    }

    const endPage = Math.min(startPage + 4, totalPages);

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={handlePrevious}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>

        {getPageNumbers().map((pageNum) => (
          <PaginationItem key={pageNum}>
            <PaginationLink
              isActive={currentPage === pageNum}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={handleNext}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default ResourcePagination;
