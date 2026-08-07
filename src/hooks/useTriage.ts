import { useState, useCallback } from "react";
import type { Priority } from "../types/task";

interface TriageResult {
  title: string;
  priority: Priority;
  reasoning: string;
}

export function useTriage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggest = useCallback(async (rawTitle: string): Promise<TriageResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: rawTitle }),
      });
      if (!res.ok) throw new Error("non-ok response");
      const data = await res.json();
      return data as TriageResult;
    } catch (err) {
      console.error("Triage suggestion failed:", err);
      setError(
        "AI suggestion unavailable right now, you can still add the task manually.",
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggest, loading, error };
}
