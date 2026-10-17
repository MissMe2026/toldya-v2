import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { prepareDemo } from "@/lib/demo.functions";

export function useTryDemo() {
  const demo = useServerFn(prepareDemo);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const tryDemo = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const creds = await demo();
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) throw error;
      await qc.invalidateQueries();
      await navigate({ to: "/", replace: true });
      return true;
    } catch {
      toast.error("The demo didn't load. Try again in a moment.");
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { tryDemo, busy };
}