"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/app/components/supabase-provider";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return {
    user,
    userId: user?.id ?? null,
    isSignedIn: !!user,
    isLoaded: !isLoading,
    signOut,
  };
}
