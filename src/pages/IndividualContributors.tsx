
import React, { useRef, useCallback } from 'react';
import { useIndividualContributors } from '@/hooks/useIndividualContributors';
import { ContributorCard } from '@/components/contributors/ContributorCard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ContributorSearchAndFilters from '@/components/contributors/ContributorSearchAndFilters';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function IndividualContributors() {
  const { 
    contributors, 
    loading, 
    hasMore, 
    loadMore,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    totalPages
  } = useIndividualContributors();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Reference for the last contributor element for infinite scrolling
  const lastContributorRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);

  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <div key={`skeleton-${index}`} className="h-64">
        <Skeleton className="h-full w-full" />
      </div>
    ));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages)) {
      setPage(newPage);
      window.scrollTo(0, 0); // Scroll to top when changing pages
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    if (totalPages <= 7) {
      // If 7 or fewer pages, show all
      return Array.from({ length: totalPages }).map((_, i) => (
        <PaginationItem key={i + 1}>
          <PaginationLink 
            isActive={page === i + 1} 
            onClick={() => handlePageChange(i + 1)}
          >
            {i + 1}
          </PaginationLink>
        </PaginationItem>
      ));
    } else {
      // Show first page, current page, last page, and ellipses
      const items = [];
      
      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            isActive={page === 1} 
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Show ellipsis if current page is > 2
      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      // Show previous page if not first or second page
      if (page > 2) {
        items.push(
          <PaginationItem key={page - 1}>
            <PaginationLink onClick={() => handlePageChange(page - 1)}>
              {page - 1}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Show current page if not first page
      if (page !== 1 && page !== totalPages) {
        items.push(
          <PaginationItem key={page}>
            <PaginationLink isActive onClick={() => handlePageChange(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Show next page if not last or second last page
      if (page < totalPages - 1) {
        items.push(
          <PaginationItem key={page + 1}>
            <PaginationLink onClick={() => handlePageChange(page + 1)}>
              {page + 1}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Show ellipsis if current page is < totalPages - 1
      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      // Always show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              isActive={page === totalPages}
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      return items;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Individual Contributors
            </h1>
            <p className="text-muted-foreground mt-1">
              Top contributors across all repositories
            </p>
          </div>
        </div>
        
        <ContributorSearchAndFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributors.map((contributor, index) => {
            if (index === contributors.length - 1) {
              return (
                <div key={contributor.login} ref={lastContributorRef}>
                  <ContributorCard contributor={contributor} />
                </div>
              );
            } else {
              return (
                <div key={contributor.login}>
                  <ContributorCard contributor={contributor} />
                </div>
              );
            }
          })}
          
          {loading && renderSkeletons()}
        </div>
        
        {!loading && contributors.length > 0 && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(page - 1)}
                    aria-disabled={page === 1}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(page + 1)}
                    aria-disabled={page === totalPages || totalPages === 0}
                    className={page === totalPages || totalPages === 0 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
        {!loading && hasMore && (
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => loadMore()} 
              className="gap-2"
            >
              <ArrowDown className="h-4 w-4" />
              Load more
            </Button>
          </div>
        )}
        
        {!loading && !hasMore && contributors.length > 0 && (
          <div className="mt-6 text-center text-muted-foreground">
            No more contributors to load
          </div>
        )}
        
        {!loading && contributors.length === 0 && (
          <div className="mt-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium">No contributors found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 
                `No results found for "${searchTerm}". Please try a different search term.` : 
                'There are no contributors to display.'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
