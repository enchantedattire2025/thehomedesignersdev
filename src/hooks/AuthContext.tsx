import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isDesigner: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDesigner, setIsDesigner] = useState(false);
  const mountedRef = useRef(true);
  const currentUserIdRef = useRef<string | null>(null);

  const checkUserRoles = async (userId: string) => {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: designerData } = await supabase
      .from('designers')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (!mountedRef.current) return;

    setIsAdmin(!!adminData);
    setIsDesigner(!!designerData);
  };

  useEffect(() => {
    mountedRef.current = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mountedRef.current) return;

      const sessionUserId = session?.user?.id ?? null;
      currentUserIdRef.current = sessionUserId;
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkUserRoles(session.user.id);
      } else {
        setIsAdmin(false);
        setIsDesigner(false);
      }

      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;

        const sessionUserId = session?.user?.id ?? null;

        // Supabase fires onAuthStateChange on browser tab visibility changes
        // with the same user ID but a new object reference. Skip the state
        // update entirely when the user ID hasn't changed to prevent
        // every page from re-fetching its data on tab switches.
        if (sessionUserId === currentUserIdRef.current) {
          setLoading(false);
          return;
        }

        currentUserIdRef.current = sessionUserId;
        setUser(session?.user ?? null);

        (async () => {
          if (session?.user) {
            await checkUserRoles(session.user.id);
          } else {
            setIsAdmin(false);
            setIsDesigner(false);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();

      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    } catch (error) {
      console.error('Error signing out:', error);
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isDesigner, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
