import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LiveStream } from './useLiveRealtime';
import { CategoryId } from '@/components/CategoryFilter';

interface UseLivesProps {
  category?: CategoryId;
  activeOnly?: boolean;
}

export function useLives({ category, activeOnly = true }: UseLivesProps = {}) {
  const [lives, setLives] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLives = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('lives')
      .select(`
        *,
        streamer:profiles!lives_streamer_id_fkey (
          id, username, display_name, avatar_url, is_vip
        )
      `)
      .order('viewers_count', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    if (category) {
      query = query.contains('categories', [category]);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching lives:', fetchError);
      setError(fetchError.message);
      setLives([]);
    } else {
      setLives((data as unknown as LiveStream[]) || []);
    }

    setLoading(false);
  }, [category, activeOnly]);

  // Subscribe to realtime updates for active lives
  useEffect(() => {
    fetchLives();

    const channel = supabase
      .channel('lives-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lives',
        },
        () => {
          fetchLives();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLives]);

  return {
    lives,
    loading,
    error,
    refetch: fetchLives,
  };
}
