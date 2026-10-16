"use client";

/**
 * Отправка заявки: один idempotency-ключ на форму, защита от двойного клика и
 * разбор всех ответов API в понятные состояния.
 *
 * Требования брифа, которые здесь живут:
 *  - двойной клик по кнопке не создаёт вторую заявку (client_request_id + isSubmitting);
 *  - при 429/5xx и сетевой ошибке введённые значения не теряются (мы их не чистим);
 *  - при 422 текст ошибки и `error.fields` попадают в конкретные поля.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  submitLead,
  type LeadFieldErrors,
  type LeadIntent,
  type LeadPayload,
  type LeadSubmitOutcome,
} from "@/lib/api";
import { collectSource } from "@/lib/analytics/attribution";
import type { CoffeeId } from "@/lib/content/coffee";
import { normalizePhone } from "@/lib/validation/phone";

export interface LeadFormValues {
  name: string;
  phone: string;
  intent: LeadIntent;
  comment: string;
  position: CoffeeId | null;
}

export type LeadSubmitStatus =
  | "idle"
  | "submitting"
  | "success"
  | "duplicate"
  | "validation_error"
  | "error";

export interface LeadSubmitState {
  status: LeadSubmitStatus;
  message: string | null;
  fields: LeadFieldErrors;
  id: number | null;
}

const INITIAL_STATE: LeadSubmitState = {
  status: "idle",
  message: null,
  fields: {},
  id: null,
};

export interface UseLeadSubmitOptions {
  formId?: string;
  ctaVariant?: string;
}

export interface UseLeadSubmitResult {
  state: LeadSubmitState;
  isSubmitting: boolean;
  /** Вернёт null, если клик пришёл, пока предыдущая отправка ещё идёт. */
  submit: (values: LeadFormValues) => Promise<LeadSubmitState | null>;
  /** Новый разговор: чистим состояние и выдаём новый client_request_id. */
  reset: () => void;
}

export function useLeadSubmit(options: UseLeadSubmitOptions = {}): UseLeadSubmitResult {
  const { formId, ctaVariant } = options;

  const [state, setState] = useState<LeadSubmitState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestIdRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const ensureRequestId = useCallback((): string => {
    if (!requestIdRef.current) {
      requestIdRef.current = createRequestId();
    }
    return requestIdRef.current;
  }, []);

  const submit = useCallback(
    async (values: LeadFormValues): Promise<LeadSubmitState | null> => {
      // Синхронная проверка: второй клик до ре-рендера не проходит.
      if (inFlightRef.current) return null;
      inFlightRef.current = true;

      if (mountedRef.current) {
        setIsSubmitting(true);
        setState({ status: "submitting", message: null, fields: {}, id: null });
      }

      const payload: LeadPayload = {
        name: values.name.trim(),
        // На сервер уходит нормализованный +375XXXXXXXXX; если номер битый —
        // отдаём как есть, чтобы сервер ответил своей подсказкой.
        phone: normalizePhone(values.phone) ?? values.phone.trim(),
        intent: values.intent,
        comment: values.comment.trim() ? values.comment.trim() : null,
        position: values.position ?? null,
        client_request_id: ensureRequestId(),
        source: collectSource({ formId, ctaVariant }),
      };

      const outcome = await submitLead(payload);
      const next = toState(outcome);

      inFlightRef.current = false;
      if (mountedRef.current) {
        setState(next);
        setIsSubmitting(false);
      }
      return next;
    },
    [ctaVariant, ensureRequestId, formId],
  );

  const reset = useCallback(() => {
    requestIdRef.current = null;
    inFlightRef.current = false;
    setState(INITIAL_STATE);
    setIsSubmitting(false);
  }, []);

  return { state, isSubmitting, submit, reset };
}

function toState(outcome: LeadSubmitOutcome): LeadSubmitState {
  switch (outcome.status) {
    case "created":
      return { status: "success", message: outcome.message, fields: {}, id: outcome.id };
    case "duplicate":
      return { status: "duplicate", message: outcome.message, fields: {}, id: outcome.id };
    case "validation":
      return {
        status: "validation_error",
        message: outcome.message,
        fields: outcome.fields,
        id: null,
      };
    default:
      return { status: "error", message: outcome.message, fields: {}, id: null };
  }
}

/**
 * UUID заявки. `crypto.randomUUID` доступен только в защищённом контексте
 * (https или localhost), поэтому на всякий случай собираем v4 вручную.
 */
export function createRequestId(): string {
  const cryptoApi = typeof crypto !== "undefined" ? crypto : undefined;

  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }

  return `kv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
