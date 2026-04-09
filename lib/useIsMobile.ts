"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px)";

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** SSR / first paint: assume desktop so HTML matches a typical wide layout. */
function getServerSnapshot() {
  return false;
}

function subscribe(onStoreChange: () => void) {
  const mq = window.matchMedia(QUERY);
  const listener = () => onStoreChange();
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }
  mq.addListener(listener);
  return () => mq.removeListener(listener);
}

/**
 * Live viewport: mobile below 768px. Uses `useSyncExternalStore` so the value
 * updates on the client immediately (no `useEffect` / stuck `null`).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
