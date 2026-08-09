"use client";

import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that only updates after it has stayed unchanged for
 * `delayMs`. Used to throttle search-as-you-type into a single API call per
 * pause rather than one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
