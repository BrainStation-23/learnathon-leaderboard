
import React, { useRef, useCallback } from 'react';
import { useIndividualContributors } from '@/hooks/useIndividualContributors';
import { ContributorCard } from '@/components/contributors/ContributorCard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Users, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ContributorSearchAndFilters from '@/components/contributors/ContributorSearchAndFilters';

export default function IndividualContributors() {
  const { 
    contributors, 
    loading, 
    hasMore, 
    loadMore,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder
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
