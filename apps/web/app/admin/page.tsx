"use client";

import { useState, useEffect } from "react";
import type { PointFeature, ModerationStatus } from "@shadowmap/types";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [points, setPoints] = useState<PointFeature[]>([]);
  const [filter, setFilter] = useState<ModerationStatus | "all">("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPoints = async (status?: ModerationStatus) => {
    setLoading(true);
    setError("");
    try {
      const url = status ? `/api/admin?status=${status}` : "/api/admin";
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${btoa(password)}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch points");
      }
      const data = await response.json();
      setPoints(data);
    } catch {
      setError("Erro ao carregar pontos");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    fetchPoints();
  };

  const handleStatusChange = async (id: string, status: ModerationStatus) => {
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(password)}`,
        },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      fetchPoints(filter === "all" ? undefined : filter);
    } catch {
      setError("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ponto?")) return;
    try {
      const response = await fetch(`/api/admin?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${btoa(password)}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete point");
      }
      fetchPoints(filter === "all" ? undefined : filter);
    } catch {
      setError("Erro ao excluir ponto");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPoints(filter === "all" ? undefined : filter);
    }
  }, [filter, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-6 font-[family-name:var(--font-sora)]">
            Painel de Moderação
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/60 border border-line focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="Digite a senha"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-foreground text-white rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-sora)]">
            Painel de Moderação
          </h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Sair
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-foreground text-white"
                  : "bg-white/60 text-foreground hover:bg-white/80"
              }`}
            >
              {status === "all" ? "Todos" : status === "pending" ? "Pendentes" : status === "approved" ? "Aprovados" : "Rejeitados"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-muted">Carregando...</div>
        ) : points.length === 0 ? (
          <div className="text-center py-12 text-muted">Nenhum ponto encontrado</div>
        ) : (
          <div className="space-y-4">
            {points.map((point) => (
              <div
                key={point.id}
                className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{point.neighborhood}</span>
                    <span className="text-sm text-muted">• {point.city}</span>
                  </div>
                  <p className="text-sm text-muted mb-2">{point.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-white/60 rounded-full">
                      {point.issueType.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-1 bg-white/60 rounded-full">
                      Prioridade: {point.priority}
                    </span>
                    <span className="px-2 py-1 bg-white/60 rounded-full">
                      {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(point.id, "approved")}
                    className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleStatusChange(point.id, "rejected")}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                  >
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleDelete(point.id)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
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
