
import { useState, useEffect, useCallback } from 'react';
import { fetchIndividualContributors, IndividualContributor } from '@/services/contributors/contributorsService';
import { useToast } from '@/hooks/use-toast';

export function useIndividualContributors(initialPageSize = 20) {
  const [contributors, setContributors] = useState<IndividualContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();

  // Function to estimate total pages based on current page and hasMore
  const estimateTotalPages = useCallback((currentPage: number, moreAvailable: boolean) => {
    return moreAvailable ? Math.max(currentPage + 1, totalPages) : currentPage;
  }, [totalPages]);

  const loadContributors = useCallback(async (pageNumber: number, isNewSearch = false) => {
    try {
      setLoading(true);
      const { data, hasMore: moreAvailable } = await fetchIndividualContributors(
        pageNumber, 
        initialPageSize,
        searchTerm,
        sortOrder
      );
      
      if (pageNumber === 1 || isNewSearch) {
        setContributors(data);
      } else {
        setContributors(prev => [...prev, ...data]);
      }
      
      setHasMore(moreAvailable);
      setTotalPages(estimateTotalPages(pageNumber, moreAvailable));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load contributors'));
      toast({
        title: 'Error',
        description: 'Failed to load contributors. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [initialPageSize, toast, searchTerm, sortOrder, estimateTotalPages]);

  // Load initial data when component mounts or when search/sort/page changes
  useEffect(() => {
    loadContributors(page, true);
  }, [loadContributors, searchTerm, sortOrder, page]);

  // Function to load more contributors
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
    }
  }, [loading, hasMore, page]);

  return {
    contributors,
    loading,
    error,
    hasMore,
    loadMore,
    searchTerm,
    setSearchTerm,
    sortOrder,
    setSortOrder,
    page,
    setPage,
    totalPages
  };
}
