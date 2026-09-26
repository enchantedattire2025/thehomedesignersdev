import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { Designer } from '../lib/supabase';

let cachedDesigner: Designer | null = null;
let cachedDesignerUserId: string | null = null;
let cachedDesignerPromise: Promise<void> | null = null;

export const useDesignerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchDesignerProfile = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!userId) {
      cachedDesigner = null;
      cachedDesignerUserId = null;
      cachedDesignerPromise = null;
      setDesigner(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (cachedDesignerUserId === userId && cachedDesignerPromise) {
      await cachedDesignerPromise;
      if (!mountedRef.current) return;
      setDesigner(cachedDesigner);
      setLoading(false);
      return;
    }

    if (cachedDesignerUserId === userId) {
      setDesigner(cachedDesigner);
      setLoading(false);
      return;
    }

    cachedDesignerUserId = userId;
    cachedDesigner = null;

    cachedDesignerPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('designers')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          setError(error.message);
          cachedDesigner = null;
        } else {
          cachedDesigner = data;
        }
      } catch (err: any) {
        setError(err.message);
        cachedDesigner = null;
      }
    })();

    await cachedDesignerPromise;
    if (!mountedRef.current) return;
    setDesigner(cachedDesigner);
    setLoading(false);
  }, [userId, authLoading]);

  useEffect(() => {
    mountedRef.current = true;
    fetchDesignerProfile();
    return () => { mountedRef.current = false; };
  }, [fetchDesignerProfile]);

  const updateDesignerProfile = async (updates: Partial<Designer>) => {
    if (!user || !designer) {
      return { error: 'No designer profile found or user not authenticated' };
    }

    try {
      const { data: existingDesigner, error: checkError } = await supabase
        .from('designers')
        .select('*')
        .eq('id', designer.id)
        .eq('user_id', user.id)
        .single();

      if (checkError) {
        return { error: 'Cannot verify designer ownership: ' + checkError.message };
      }

      if (!existingDesigner) {
        return { error: 'Designer profile not found or access denied' };
      }

      const { data, error } = await supabase
        .from('designers')
        .update(updates)
        .eq('id', designer.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      cachedDesigner = data;
      setDesigner(data);
      return { error: null, data };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const createDesignerProfile = async (profileData: Omit<Designer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      return { error: 'User not authenticated' };
    }

    try {
      const { data: existingDesigner } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingDesigner) {
        return { error: 'Designer profile already exists for this user' };
      }

      const dataToInsert = {
        ...profileData,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('designers')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        throw error;
      }

      cachedDesigner = data;
      cachedDesignerUserId = user.id;
      setDesigner(data);
      return { error: null, data };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return {
    designer,
    loading,
    error,
    isDesigner: !!designer,
    updateDesignerProfile,
    createDesignerProfile,
    refreshProfile: fetchDesignerProfile
  };
};