"use client";

import { useId, useState } from "react";
import { parsePointForm, POINT_TEXT_LIMITS } from "@/lib/point-validation";
import type { PointFormDraft } from "@/lib/point-validation";
import {
  CITY_OPTIONS,
  derivePriority,
  getHeatLevelLabel,
  getIssueTypeLabel,
  getPriorityLabel,
  getShadeLevelLabel,
  HEAT_LEVEL_OPTIONS,
  ISSUE_OPTIONS,
  SHADE_LEVEL_OPTIONS,
} from "@/lib/utils";
import type {
  City,
  HeatLevel,
  IssueType,
  PointFormValues,
  ShadeLevel,
} from "@shadowmap/types";

interface PointFormProps {
  draftLocation: { lat: number; lng: number } | null;
  values: PointFormDraft;
  onValuesChange: (values: PointFormDraft) => void;
  aiAssisted?: boolean;
  onCancel: () => void;
  onSubmit: (values: PointFormValues, aiAssisted: boolean) => void;
}

const fieldClassName =
  "mt-1 h-9 w-full min-w-0 rounded-lg border border-emerald-950/10 bg-white/80 px-2 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:bg-white";

const textAreaClassName =
  "mt-1 min-h-20 w-full rounded-lg border border-emerald-950/10 bg-white/80 p-2 text-sm text-emerald-950 outline-none transition focus:border-emerald-700 focus:bg-white";

export default function PointForm({
  draftLocation,
  values,
  onValuesChange,
  aiAssisted = false,
  onCancel,
  onSubmit,
}: PointFormProps) {
  const priority = derivePriority(values.heatLevel, values.shadeLevel);
  const [showErrors, setShowErrors] = useState(false);
  const errorId = useId();
  const errors = showErrors ? parsePointForm(values).errors : {};

  function fieldError(field: "neighborhood" | "description" | "lat" | "lng") {
    return errors[field] ? (
      <span id={`${errorId}-${field}`} className="mt-1 block text-xs text-rose-800">
        {errors[field]}
      </span>
    ) : null;
  }

  function updateField(field: "city", value: City): void;
  function updateField(field: "heatLevel", value: HeatLevel): void;
  function updateField(field: "shadeLevel", value: ShadeLevel): void;
  function updateField(field: "issueType", value: IssueType): void;
  function updateField(field: "lat" | "lng", value: string): void;
  function updateField(
    field: "neighborhood" | "description",
    value: string,
  ): void;
  function updateField(field: keyof PointFormDraft, value: string | number) {
    const nextValues = {
      ...values,
      [field]: value,
    };
    onValuesChange({
      ...nextValues,
      priority: derivePriority(nextValues.heatLevel, nextValues.shadeLevel),
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parsePointForm(values);
    setShowErrors(true);
    if (!result.values) {
      const field = Object.keys(result.errors)[0];
      const input = event.currentTarget.elements.namedItem(field);
      if (input instanceof HTMLElement) input.focus();
      return;
    }
    onSubmit({ ...result.values, priority }, aiAssisted);
  }

  return (
    <form noValidate className="space-y-2.5 text-sm" onSubmit={handleSubmit}>
      {aiAssisted ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs leading-4 text-amber-950">
          Sugestão da IA. Revise os campos antes de salvar. A prioridade é
          calculada por uma regra fixa, não pela IA.
          {!draftLocation ? " Clique no mapa para marcar o local." : ""}
        </div>
      ) : null}

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs leading-4 text-amber-950">
        Simulação: o ponto aparece nesta sessão, sem gravar ou enviar dados.
      </div>

      <p className="text-xs leading-4 text-emerald-950/65">
        {draftLocation
          ? "Coordenadas capturadas no mapa; ajuste se necessário."
          : "Clique no mapa para preencher as coordenadas ou edite os campos."}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-sm font-medium text-emerald-950">
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

        <div className="min-w-0 text-sm font-medium text-emerald-950">
          <label className="block" htmlFor={`${errorId}-neighborhood-input`}>Bairro</label>
          <input
            required
            id={`${errorId}-neighborhood-input`}
            name="neighborhood"
            maxLength={POINT_TEXT_LIMITS.neighborhood}
            aria-invalid={Boolean(errors.neighborhood)}
            aria-describedby={errors.neighborhood ? `${errorId}-neighborhood` : undefined}
            className={fieldClassName}
            placeholder="Ex.: Itapuã"
            value={values.neighborhood}
            onChange={(event) =>
              updateField("neighborhood", event.target.value)
            }
          />
          {fieldError("neighborhood")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 text-sm font-medium text-emerald-950">
          <label className="block" htmlFor={`${errorId}-lat-input`}>Latitude</label>
          <input
            required
            id={`${errorId}-lat-input`}
            name="lat"
            type="text"
            inputMode="decimal"
            aria-invalid={Boolean(errors.lat)}
            aria-describedby={errors.lat ? `${errorId}-lat` : undefined}
            className={fieldClassName}
            value={values.lat}
            onChange={(event) =>
              updateField("lat", event.target.value)
            }
          />
          {fieldError("lat")}
        </div>

        <div className="min-w-0 text-sm font-medium text-emerald-950">
          <label className="block" htmlFor={`${errorId}-lng-input`}>Longitude</label>
          <input
            required
            id={`${errorId}-lng-input`}
            name="lng"
            type="text"
            inputMode="decimal"
            aria-invalid={Boolean(errors.lng)}
            aria-describedby={errors.lng ? `${errorId}-lng` : undefined}
            className={fieldClassName}
            value={values.lng}
            onChange={(event) =>
              updateField("lng", event.target.value)
            }
          />
          {fieldError("lng")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-sm font-medium text-emerald-950">
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

        <div className="min-w-0 text-sm font-medium text-emerald-950">
          <p id="point-priority-label">Prioridade calculada</p>
          <output
            aria-labelledby="point-priority-label"
            className="mt-1 flex h-9 items-center rounded-lg border border-emerald-950/10 bg-emerald-50 px-2 font-semibold text-emerald-900"
          >
            {getPriorityLabel(priority)}
          </output>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-sm font-medium text-emerald-950">
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

        <label className="min-w-0 text-sm font-medium text-emerald-950">
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

      <p className="text-xs leading-4 text-emerald-950/65">
        A prioridade é calculada automaticamente pelos níveis de calor e sombra.
      </p>

      <div className="text-sm font-medium text-emerald-950">
        <label className="block" htmlFor={`${errorId}-description-input`}>Descrição</label>
        <textarea
          required
          id={`${errorId}-description-input`}
          name="description"
          maxLength={POINT_TEXT_LIMITS.description}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? `${errorId}-description` : undefined}
          className={textAreaClassName}
          placeholder="Descreva o problema observado e o contexto urbano do local."
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
        {fieldError("description")}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          type="submit"
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-900 px-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          Adicionar ponto
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-emerald-950/10 bg-white/75 px-2 text-sm font-semibold text-emerald-950 transition hover:bg-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
