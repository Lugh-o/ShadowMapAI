"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import type { ModerationStatus, PointFeature } from "@shadowmap/types";

const FILTERS: Array<{ value: ModerationStatus | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Rejeitados" },
];

const STATUS_LABELS: Record<ModerationStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

export default function AdminPage() {
  const { status } = useSession();
  const [points, setPoints] = useState<PointFeature[]>([]);
  const [filter, setFilter] = useState<ModerationStatus | "all">("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const url =
          filter === "all" ? "/api/admin" : `/api/admin?status=${filter}`;
        const response = await fetch(url, { signal: controller.signal });

        if (response.status === 403) {
          setForbidden(true);
          setPoints([]);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch points");
        }

        setForbidden(false);
        setPoints((await response.json()) as PointFeature[]);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") {
          return;
        }

        setError("Erro ao carregar pontos.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filter, status, reloadToken]);

  async function handleStatusChange(id: string, nextStatus: ModerationStatus) {
    setError("");

    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      if (response.status === 403) {
        setForbidden(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setReloadToken((value) => value + 1);
    } catch {
      setError("Erro ao atualizar status.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este ponto?")) return;

    setError("");

    try {
      const response = await fetch(`/api/admin?id=${id}`, {
        method: "DELETE",
      });

      if (response.status === 403) {
        setForbidden(true);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete point");
      }

      setReloadToken((value) => value + 1);
    } catch {
      setError("Erro ao excluir ponto.");
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-muted">
        Carregando...
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8">
          <h1 className="mb-4 font-[family-name:var(--font-sora)] text-2xl font-bold text-foreground">
            Painel de Moderação
          </h1>
          <p className="mb-6 text-sm text-muted">
            Entre na sua conta para acessar a moderação.
          </p>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-foreground px-4 text-white transition-colors hover:bg-foreground/90"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md rounded-2xl p-8">
          <h1 className="mb-4 font-[family-name:var(--font-sora)] text-2xl font-bold text-foreground">
            Painel de Moderação
          </h1>
          <p className="text-sm text-red-700">Sem permissão.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold text-foreground">
            Painel de Moderação
          </h1>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === item.value
                  ? "bg-foreground text-white"
                  : "bg-white/60 text-foreground hover:bg-white/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="py-12 text-center text-muted">Carregando...</div>
        ) : points.length === 0 ? (
          <div className="py-12 text-center text-muted">
            Nenhum ponto encontrado
          </div>
        ) : (
          <div className="space-y-4">
            {points.map((point) => (
              <div
                key={point.id}
                className="glass-panel flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center"
              >
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {point.neighborhood}
                    </span>
                    <span className="text-sm text-muted">• {point.city}</span>
                    <span className="rounded-full bg-white/60 px-2 py-1 text-xs">
                      {point.moderationStatus
                        ? STATUS_LABELS[point.moderationStatus]
                        : "—"}
                    </span>
                    <span className="rounded-full bg-white/60 px-2 py-1 text-xs">
                      Origem:{" "}
                      {point.dataOrigin === "collected"
                        ? "Coletado"
                        : "Simulado"}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-muted">{point.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/60 px-2 py-1">
                      {point.issueType.replace(/_/g, " ")}
                    </span>
                    <span className="rounded-full bg-white/60 px-2 py-1">
                      Prioridade: {point.priority}
                    </span>
                    <span className="rounded-full bg-white/60 px-2 py-1">
                      {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                    </span>
                    <span className="rounded-full bg-white/60 px-2 py-1">
                      Apoio da IA: {point.aiAssisted ? "Sim" : "Não"}
                    </span>
                    <span className="rounded-full bg-white/60 px-2 py-1">
                      Aplicador: {point.ref || "—"}
                    </span>
                    <span className="rounded-full bg-white/60 px-2 py-1">
                      Data:{" "}
                      {point.submittedAt
                        ? new Date(point.submittedAt).toLocaleString("pt-BR")
                        : "—"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(point.id, "approved")}
                    className="rounded-lg bg-green-100 px-3 py-1.5 text-sm text-green-700 transition-colors hover:bg-green-200"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleStatusChange(point.id, "rejected")}
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-200"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleDelete(point.id)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
