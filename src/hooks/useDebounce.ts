"use client";

import { useEffect } from "react";

export function useDebounce<T>(value: T, delay: number, callback: (val: T) => void) {
  useEffect(() => {
    const timer = setTimeout(() => callback(value), delay);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
}
