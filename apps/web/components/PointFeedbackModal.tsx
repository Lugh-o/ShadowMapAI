"use client";

import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";

import { cn } from "@/lib/utils";

const RATINGS = [
  { value: 1, label: "Muito ruim" },
  { value: 2, label: "Ruim" },
  { value: 3, label: "Regular" },
  { value: 4, label: "Bom" },
  { value: 5, label: "Muito bom" },
] as const;

interface PointFeedbackModalProps {
  isOpen: boolean;
  pointId: string | null;
  pilotRef: string | null;
  onClose: () => void;
}

export default function PointFeedbackModal({
  isOpen,
  pointId,
  pilotRef,
  onClose,
}: PointFeedbackModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedRating = RATINGS.find((option) => option.value === rating);

  async function sendFeedback() {
    if (!rating) {
      setError("Escolha uma nota de 1 a 5.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "point_submitted",
          targetId: pointId || undefined,
          rating,
          comment: comment.trim() || undefined,
          ref: pilotRef ?? undefined,
        }),
      });

      if (response.status === 401) {
        setError("Entre na sua conta para enviar feedback.");
        setStatus("idle");
        return;
      }

      if (response.status === 429) {
        setError("Você enviou muitos feedbacks na última hora. Tente mais tarde.");
        setStatus("idle");
        return;
      }

      if (!response.ok) {
        setError("Não foi possível enviar o feedback. Tente novamente.");
        setStatus("idle");
        return;
      }

      setStatus("sent");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setStatus("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-[1050] flex items-end justify-center bg-emerald-950/55 p-3 backdrop-blur-sm md:items-center md:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="point-feedback-title"
        className="glass-panel w-full max-w-lg rounded-[28px] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Avaliação do piloto
            </p>
            <h2
              id="point-feedback-title"
              className="mt-1 font-display text-xl font-semibold text-emerald-950"
            >
              Como foi usar o ShadowMap?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-950 transition hover:bg-white"
            aria-label="Fechar avaliação"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === "sent" ? (
          <div className="mt-5 space-y-4">
            <p className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              Obrigado! Seu feedback ajuda a equipe a melhorar o ShadowMap para
              os próximos moradores.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex gap-2">
                {RATINGS.map((option) => {
                  const isSelected = rating === option.value;
                  const isFilled = rating !== null && option.value <= rating;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setRating(option.value);
                        setError(null);
                      }}
                      aria-label={`Nota ${option.value}: ${option.label}`}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border transition",
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-emerald-950/10 bg-white/80 hover:bg-emerald-50",
                      )}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5",
                          isFilled
                            ? "fill-amber-400 text-amber-500"
                            : "text-emerald-950/35",
                        )}
                      />
                      <span className="text-xs font-semibold text-emerald-950">
                        {option.value}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-emerald-950/60">
                {selectedRating
                  ? `Sua nota: ${selectedRating.value} — ${selectedRating.label}`
                  : "Escolha uma nota de 1 (muito ruim) a 5 (muito bom)."}
              </p>
            </div>

            <div>
              <label
                htmlFor="point-feedback-comment"
                className="block text-sm font-medium text-emerald-950"
              >
                Comentário (opcional)
              </label>
              <textarea
                id="point-feedback-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value.slice(0, 500))}
                rows={3}
                maxLength={500}
                placeholder="O que funcionou bem? O que poderia ser mais fácil?"
                className="mt-1 w-full rounded-xl border border-emerald-950/10 bg-white px-3 py-2 text-sm text-emerald-950 placeholder:text-emerald-950/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="mt-1 text-right text-xs text-emerald-950/45">
                {comment.length}/500
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                type="button"
                onClick={sendFeedback}
                disabled={status === "sending"}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {status === "sending" ? "Enviando..." : "Enviar avaliação"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-100 px-4 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-200"
              >
                Agora não
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
