import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

let cachedUserId: string | null = null;
let cachedHasDesigner = false;
let cachedHasCustomer = false;
let cachedPromise: Promise<void> | null = null;

export const useUserRegistrationStatus = () => {
  const { user } = useAuth();
  const [hasDesignerProfile, setHasDesignerProfile] = useState(false);
  const [hasCustomerProject, setHasCustomerProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const checkRegistrationStatus = async () => {
      if (!user) {
        cachedUserId = null;
        cachedPromise = null;
        cachedHasDesigner = false;
        cachedHasCustomer = false;
        setHasDesignerProfile(false);
        setHasCustomerProject(false);
        setLoading(false);
        return;
      }

      if (cachedUserId === user.id) {
        setHasDesignerProfile(cachedHasDesigner);
        setHasCustomerProject(cachedHasCustomer);
        setLoading(false);
        return;
      }

      if (cachedPromise) {
        await cachedPromise;
        if (!mountedRef.current) return;
        setHasDesignerProfile(cachedHasDesigner);
        setHasCustomerProject(cachedHasCustomer);
        setLoading(false);
        return;
      }

      cachedUserId = user.id;

      cachedPromise = (async () => {
        const { data: designerData } = await supabase
          .from('designers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        cachedHasDesigner = !!designerData;

        if (!designerData) {
          const { data: customerData } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          cachedHasCustomer = !!customerData;
        } else {
          cachedHasCustomer = false;
        }
      })();

      await cachedPromise;
      cachedPromise = null;
      if (!mountedRef.current) return;
      setHasDesignerProfile(cachedHasDesigner);
      setHasCustomerProject(cachedHasCustomer);
      setLoading(false);
    };

    checkRegistrationStatus();
    return () => { mountedRef.current = false; };
  }, [user]);

  return {
    hasDesignerProfile,
    hasCustomerProject,
    hasAnyRegistration: hasDesignerProfile || hasCustomerProject,
    loading
  };
};