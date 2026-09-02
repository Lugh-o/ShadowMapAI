import { Flame, MapPin, Plus, Trees } from "lucide-react";

import PointForm from "@/components/PointForm";
import {
  formatCoordinates,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPriorityLabel,
  getShadeLevelLabel,
} from "@/lib/utils";
import type { PointFeature, PointFormValues } from "@shadowmap/types";

interface SidebarProps {
  selectedPoint: PointFeature | null;
  criticalPoints: PointFeature[];
  draftLocation: { lat: number; lng: number } | null;
  totalPoints: number;
  isFormOpen: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  onSelectPoint: (pointId: string) => void;
  onSubmitPoint: (values: PointFormValues) => void;
}

export default function Sidebar({
  selectedPoint,
  criticalPoints,
  draftLocation,
  totalPoints,
  isFormOpen,
  onOpenForm,
  onCloseForm,
  onSelectPoint,
  onSubmitPoint,
}: SidebarProps) {
  return (
    <aside className="glass-panel flex h-full flex-col gap-4 rounded-[30px] p-4 md:p-5">
      <section className="card-strong rounded-[24px] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Painel operacional
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-emerald-950">
              Monitoramento ativo
            </h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            {totalPoints} registros
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-emerald-950/72">
          Use o mapa para explorar zonas de calor, selecionar ocorrências e
          registrar novos pontos de desconforto térmico urbano.
        </p>
      </section>

      <section className="card-strong rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Detalhes do ponto
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-emerald-950">
              {selectedPoint ? selectedPoint.neighborhood : "Nenhum ponto ativo"}
            </h3>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-900">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        {selectedPoint ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 text-sm text-emerald-950/78">
              <InfoBadge label="Cidade" value={selectedPoint.city} />
              <InfoBadge
                label="Ocorrência"
                value={getIssueTypeLabel(selectedPoint.issueType)}
              />
              <InfoBadge
                label="Prioridade"
                value={getPriorityLabel(selectedPoint.priority)}
              />
              <InfoBadge
                label="Calor"
                value={getHeatLevelLabel(selectedPoint.heatLevel)}
              />
              <InfoBadge
                label="Sombra"
                value={getShadeLevelLabel(selectedPoint.shadeLevel)}
              />
              <InfoBadge
                label="Coordenadas"
                value={formatCoordinates(selectedPoint.lat, selectedPoint.lng)}
              />
            </div>

            <p className="rounded-[20px] bg-white/75 px-4 py-3 text-sm leading-6 text-emerald-950/78">
              {selectedPoint.description}
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-[20px] bg-white/75 px-4 py-3 text-sm leading-6 text-emerald-950/72">
            Selecione um marcador no mapa para ver o contexto do ponto
            registrado.
          </p>
        )}
      </section>

      <section className="card-strong rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Cadastro rápido
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-emerald-950">
              Novo ponto
            </h3>
          </div>

          {!isFormOpen && (
            <button
              type="button"
              onClick={onOpenForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Plus className="h-4 w-4" />
              Abrir
            </button>
          )}
        </div>

        {draftLocation ? (
          <p className="mt-3 rounded-[20px] bg-amber-50 px-4 py-3 text-sm text-amber-950/82">
            Coordenada selecionada no mapa:{" "}
            {formatCoordinates(draftLocation.lat, draftLocation.lng)}
          </p>
        ) : null}

        <div className="mt-4">
          {isFormOpen ? (
            <PointForm
              draftLocation={draftLocation}
              onCancel={onCloseForm}
              onSubmit={onSubmitPoint}
            />
          ) : (
            <div className="rounded-[20px] bg-white/75 px-4 py-4 text-sm leading-6 text-emerald-950/72">
              Clique em <strong>Adicionar ponto</strong> ou selecione qualquer
              local no mapa para preencher latitude e longitude automaticamente.
            </div>
          )}
        </div>
      </section>

      <section className="card-strong rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-950/55">
              Resumo prioritário
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-emerald-950">
              Pontos mais críticos
            </h3>
          </div>
          <div className="flex gap-2 text-emerald-900">
            <Flame className="h-5 w-5" />
            <Trees className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {criticalPoints.length ? (
            criticalPoints.map((point) => (
              <button
                key={point.id}
                type="button"
                onClick={() => onSelectPoint(point.id)}
                className="w-full rounded-[20px] bg-white/78 px-4 py-4 text-left transition hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">
                      {point.neighborhood}
                    </p>
                    <p className="text-xs text-emerald-950/55">{point.city}</p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    {getPriorityLabel(point.priority)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-emerald-950/75">
                  {getIssueTypeLabel(point.issueType)}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-[20px] bg-white/75 px-4 py-4 text-sm text-emerald-950/72">
              Nenhum ponto encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

interface InfoBadgeProps {
  label: string;
  value: string;
}

function InfoBadge({ label, value }: InfoBadgeProps) {
  return (
    <div className="rounded-[18px] bg-white/78 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-emerald-950/45">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-emerald-950">{value}</p>
    </div>
  );
}
