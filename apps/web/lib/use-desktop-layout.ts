"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const media = window.matchMedia("(min-width: 64rem)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function useDesktopLayout() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 64rem)").matches,
    () => false,
  );
}
