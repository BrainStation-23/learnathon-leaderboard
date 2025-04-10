
import { useState, useEffect, useCallback } from 'react';
import { fetchIndividualContributors, IndividualContributor } from '@/services/contributors/contributorsService';
import { useToast } from '@/hooks/use-toast';

export function useIndividualContributors(initialPageSize = 20) {
  const [contributors, setContributors] = useState<IndividualContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const loadContributors = useCallback(async (pageNumber: number) => {
    try {
      setLoading(true);
      const { data, hasMore: moreAvailable } = await fetchIndividualContributors(pageNumber, initialPageSize);
      
      if (pageNumber === 1) {
        setContributors(data);
      } else {
        setContributors(prev => [...prev, ...data]);
      }
      
      setHasMore(moreAvailable);
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
  }, [initialPageSize, toast]);

  // Load initial data
  useEffect(() => {
    loadContributors(1);
  }, [loadContributors]);

  // Function to load more contributors
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadContributors(nextPage);
    }
  }, [loading, hasMore, page, loadContributors]);

  return {
    contributors,
    loading,
    error,
    hasMore,
    loadMore
  };
}
