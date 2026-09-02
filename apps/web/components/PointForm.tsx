"use client";

import { useEffect, useState } from "react";

import {
  CITY_OPTIONS,
  DEFAULT_MAP_CENTER,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPriorityLabel,
  getShadeLevelLabel,
  HEAT_LEVEL_OPTIONS,
  inferCityFromCoordinates,
  ISSUE_OPTIONS,
  PRIORITY_OPTIONS,
  SHADE_LEVEL_OPTIONS,
} from "@/lib/utils";
import type {
  City,
  HeatLevel,
  IssueType,
  PointFormValues,
  Priority,
  ShadeLevel,
} from "@shadowmap/types";

interface PointFormProps {
  draftLocation: { lat: number; lng: number } | null;
  onCancel: () => void;
  onSubmit: (values: PointFormValues) => void;
}

function createInitialValues(
  draftLocation: { lat: number; lng: number } | null,
): PointFormValues {
  return {
    city: draftLocation
      ? inferCityFromCoordinates(draftLocation.lat, draftLocation.lng)
      : "Salvador",
    neighborhood: "",
    lat: draftLocation?.lat ?? DEFAULT_MAP_CENTER[0],
    lng: draftLocation?.lng ?? DEFAULT_MAP_CENTER[1],
    heatLevel: "high",
    shadeLevel: "low",
    issueType: "low_tree_cover",
    description: "",
    priority: "high",
  };
}

const fieldClassName =
  "mt-2 h-11 w-full rounded-2xl border border-emerald-950/10 bg-white/80 px-4 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:bg-white";

const textAreaClassName =
  "mt-2 min-h-28 w-full rounded-2xl border border-emerald-950/10 bg-white/80 px-4 py-3 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:bg-white";

export default function PointForm({
  draftLocation,
  onCancel,
  onSubmit,
}: PointFormProps) {
  const [values, setValues] = useState<PointFormValues>(() =>
    createInitialValues(draftLocation),
  );

  useEffect(() => {
    setValues(createInitialValues(draftLocation));
  }, [draftLocation]);

  function updateField(field: "city", value: City): void;
  function updateField(field: "heatLevel", value: HeatLevel): void;
  function updateField(field: "shadeLevel", value: ShadeLevel): void;
  function updateField(field: "issueType", value: IssueType): void;
  function updateField(field: "priority", value: Priority): void;
  function updateField(field: "lat" | "lng", value: number): void;
  function updateField(field: "neighborhood" | "description", value: string): void;
  function updateField(field: keyof PointFormValues, value: string | number) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-[22px] bg-emerald-50 px-4 py-3 text-sm text-emerald-950/72">
        {draftLocation
          ? "Coordenadas capturadas pelo clique no mapa. Você pode ajustar manualmente, se necessário."
          : "Abra o formulário livremente ou clique no mapa para preencher latitude e longitude automaticamente."}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-emerald-950">
          Cidade
          <select
            className={fieldClassName}
            value={values.city}
            onChange={(event) =>
              updateField("city", event.target.value as City)
            }
          >
            {CITY_OPTIONS.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-emerald-950">
          Bairro
          <input
            required
            className={fieldClassName}
            placeholder="Ex.: Itapuã"
            value={values.neighborhood}
            onChange={(event) => updateField("neighborhood", event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-emerald-950">
          Latitude
          <input
            required
            type="number"
            step="0.0001"
            className={fieldClassName}
            value={values.lat}
            onChange={(event) =>
              updateField("lat", Number(event.target.value || 0))
            }
          />
        </label>

        <label className="text-sm font-medium text-emerald-950">
          Longitude
          <input
            required
            type="number"
            step="0.0001"
            className={fieldClassName}
            value={values.lng}
            onChange={(event) =>
              updateField("lng", Number(event.target.value || 0))
            }
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-emerald-950">
          Tipo de ocorrência
          <select
            className={fieldClassName}
            value={values.issueType}
            onChange={(event) =>
              updateField("issueType", event.target.value as IssueType)
            }
          >
            {ISSUE_OPTIONS.map((issueType) => (
              <option key={issueType} value={issueType}>
                {getIssueTypeLabel(issueType)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-emerald-950">
          Prioridade
          <select
            className={fieldClassName}
            value={values.priority}
            onChange={(event) =>
              updateField("priority", event.target.value as Priority)
            }
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityLabel(priority)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-emerald-950">
          Nível de calor
          <select
            className={fieldClassName}
            value={values.heatLevel}
            onChange={(event) =>
              updateField("heatLevel", event.target.value as HeatLevel)
            }
          >
            {HEAT_LEVEL_OPTIONS.map((heatLevel) => (
              <option key={heatLevel} value={heatLevel}>
                {getHeatLevelLabel(heatLevel)}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-emerald-950">
          Nível de sombra
          <select
            className={fieldClassName}
            value={values.shadeLevel}
            onChange={(event) =>
              updateField("shadeLevel", event.target.value as ShadeLevel)
            }
          >
            {SHADE_LEVEL_OPTIONS.map((shadeLevel) => (
              <option key={shadeLevel} value={shadeLevel}>
                {getShadeLevelLabel(shadeLevel)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-emerald-950">
        Descrição
        <textarea
          required
          className={textAreaClassName}
          placeholder="Descreva o problema observado e o contexto urbano do local."
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-900 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Salvar ponto
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-emerald-950/10 bg-white/75 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-white"
        >
          Fechar formulário
        </button>
      </div>
    </form>
  );
}
