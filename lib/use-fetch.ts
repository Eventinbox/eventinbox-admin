"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface UseFetchResult<T> extends FetchState<T> {
  refetch: () => void;
  setData: (updater: (prev: T | null) => T | null) => void;
}

/**
 * Run an async API call on mount (and whenever `deps` change), exposing
 * loading / error / data plus a manual refetch. Aborts in-flight requests on
 * unmount or dep change so we never set state after teardown.
 */
export function useFetch<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): UseFetchResult<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((updater: (prev: T | null) => T | null) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    fn(controller.signal)
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        // The 401 path already redirects; swallow its message here.
        if (err instanceof ApiError && err.status === 401) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setState({ data: null, error: message, loading: false });
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  return { ...state, refetch, setData };
}
