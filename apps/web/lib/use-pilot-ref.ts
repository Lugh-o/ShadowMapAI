"use client";

import { useEffect, useState } from "react";

const PILOT_REF_STORAGE_KEY = "sm_ref";

let pilotRefsPromise: Promise<string[]> | null = null;

function loadPilotRefs(): Promise<string[]> {
  if (!pilotRefsPromise) {
    pilotRefsPromise = fetch("/api/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("config_failed");

        const data: unknown = await response.json();

        if (
          typeof data !== "object" ||
          data === null ||
          !("pilotRefs" in data) ||
          !Array.isArray(data.pilotRefs)
        ) {
          return [];
        }

        return data.pilotRefs.filter(
          (value): value is string => typeof value === "string",
        );
      })
      .catch((error: unknown) => {
        pilotRefsPromise = null;
        throw error;
      });
  }

  return pilotRefsPromise;
}

/**
 * Lê `?ref=<slug>` da URL, valida contra a lista pública de aplicadores e
 * guarda o valor em `localStorage`. Slugs inválidos são ignorados.
 */
export function usePilotRef(): string | null {
  const [pilotRef, setPilotRef] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolvePilotRef() {
      const candidate =
        new URLSearchParams(window.location.search).get("ref")?.trim().toLowerCase() ??
        "";

      let refs: string[] | null = null;

      try {
        refs = await loadPilotRefs();
      } catch {
        refs = null;
      }

      if (cancelled) return;

      if (candidate && refs?.includes(candidate)) {
        window.localStorage.setItem(PILOT_REF_STORAGE_KEY, candidate);
        setPilotRef(candidate);
        return;
      }

      const stored = window.localStorage.getItem(PILOT_REF_STORAGE_KEY);

      if (!stored) {
        setPilotRef(null);
        return;
      }

      if (!refs) {
        // Sem resposta do servidor, mantém o valor já guardado.
        setPilotRef(stored);
        return;
      }

      if (refs.includes(stored)) {
        setPilotRef(stored);
        return;
      }

      window.localStorage.removeItem(PILOT_REF_STORAGE_KEY);
      setPilotRef(null);
    }

    void resolvePilotRef();

    return () => {
      cancelled = true;
    };
  }, []);

  return pilotRef;
}
