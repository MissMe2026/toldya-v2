import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Artist, Call, Profile } from "@/lib/toldya";

type Ctx = { user: User | null; ready: boolean };
const AuthCtx = createContext<Ctx>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ user: null, ready: false });
  const qc = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, ready: true });
      if (event === "SIGNED_IN" || event === "USER_UPDATED") qc.invalidateQueries();
      if (event === "SIGNED_OUT") qc.clear();
    });
    supabase.auth.getSession().then(({ data: s }) => setState({ user: s.session?.user ?? null, ready: true }));
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

export function useArtists() {
  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase.from("artists").select("*").order("created_at");
      if (error) throw error;
      return data as unknown as Artist[];
    },
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data as unknown as Profile | null;
    },
  });
}

export function useMyCalls() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["calls", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("calls").select("*").eq("user_id", user!.id).order("called_at", { ascending: false });
      if (error) throw error;
      return data as Call[];
    },
  });
}

export async function updateProfile(id: string, patch: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", id);
  if (error) throw error;
}
