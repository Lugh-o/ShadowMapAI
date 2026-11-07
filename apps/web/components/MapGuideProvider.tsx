"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { MapGuideAction } from "@/lib/guide-actions";

interface MapGuideRequest {
  id: number;
  action: MapGuideAction;
}

interface MapGuideContextValue {
  pendingAction: MapGuideRequest | null;
  requestAction: (action: MapGuideAction) => void;
  completeAction: (id: number) => void;
}

const MapGuideContext = createContext<MapGuideContextValue | null>(null);

export default function MapGuideProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pendingAction, setPendingAction] = useState<MapGuideRequest | null>(
    null,
  );
  const requestIdRef = useRef(0);

  const requestAction = useCallback((action: MapGuideAction) => {
    requestIdRef.current += 1;
    setPendingAction({ id: requestIdRef.current, action });
  }, []);

  const completeAction = useCallback((id: number) => {
    setPendingAction((current) => (current?.id === id ? null : current));
  }, []);

  const value = useMemo(
    () => ({ pendingAction, requestAction, completeAction }),
    [pendingAction, requestAction, completeAction],
  );

  return <MapGuideContext value={value}>{children}</MapGuideContext>;
}

export function useMapGuide() {
  const context = useContext(MapGuideContext);
  if (!context) throw new Error("useMapGuide requires MapGuideProvider");
  return context;
}
