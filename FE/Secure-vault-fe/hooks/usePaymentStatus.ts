"use client";

import { useEffect, useState } from "react";
import { fetchPaymentStatus, PaymentStatus } from "@/lib/api/status";

export function usePaymentStatus(address?: string) {
  const [data, setData] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetchPaymentStatus(address);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [address]);

  const isPaid = data?.status === "active";

  return { data, isPaid, loading, error };
}
