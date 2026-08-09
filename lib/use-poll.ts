"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";

interface PollResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  // ms timestamp of the last successful fetch
  lastUpdated: number | null;
  // true while the tab is visible and the interval is running
  live: boolean;
  refresh: () => void;
}

/**
 * Poll an API call on an interval, pausing while the tab is hidden and
 * refetching immediately when it becomes visible again. Aborts in-flight
 * requests on unmount and never sets state after teardown.
 */
export function usePoll<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  intervalMs = 5000,
  deps: unknown[] = [],
): PollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const fnRef = useRef(fn);
  fnRef.current = fn;
  const mounted = useRef(true);
  const inFlight = useRef<AbortController | null>(null);

  const tick = useCallback(async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    try {
      const d = await fnRef.current(controller.signal);
      if (!mounted.current) return;
      setData(d);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 401) return;
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      setLive(true);
      void tick();
      timer = setInterval(() => void tick(), intervalMs);
    };
    const stop = () => {
      setLive(false);
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (typeof document !== "undefined" && document.hidden) {
      // Hidden on mount: do nothing until visible.
      setLive(false);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mounted.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) clearInterval(timer);
      inFlight.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);

  const refresh = useCallback(() => void tick(), [tick]);

  return { data, error, loading, lastUpdated, live, refresh };
}
