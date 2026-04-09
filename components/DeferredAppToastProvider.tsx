"use client";

import { useEffect, useState } from "react";
import { AppToastProvider } from "./AppToastProvider";

/** Mounts toasts only on the client to avoid SSR/react-toastify chunk issues. */
export function DeferredAppToastProvider() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return <AppToastProvider />;
}
