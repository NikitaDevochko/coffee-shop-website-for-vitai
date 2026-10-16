/**
 * Крошечный «мост» между секциями и формой.
 *
 * Кнопка «Отложить» в ассортименте и «Оформить подписку» — это обычные ссылки
 * на #lead, которые вдобавок сообщают форме, что выбрал человек. Чтобы не тащить
 * в проект стор или лишние зависимости, используем CustomEvent.
 */

import type { CoffeeId } from "@/lib/content/coffee";
import type { LeadIntent } from "@/lib/api";

export const POSITION_EVENT = "kvarta:select-position";
export const INTENT_EVENT = "kvarta:select-intent";

export interface PositionEventDetail {
  position: CoffeeId | null;
  ctaVariant: string;
}

export interface IntentEventDetail {
  intent: LeadIntent;
  ctaVariant: string;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToLead(): void {
  if (typeof document === "undefined") return;
  const target = document.getElementById("lead");
  if (!target) return;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

/** Запомнить выбранную позицию ассортимента и показать форму. */
export function selectPosition(position: CoffeeId | null, ctaVariant = "assortment"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PositionEventDetail>(POSITION_EVENT, { detail: { position, ctaVariant } }),
  );
  scrollToLead();
}

/** Предвыбрать в форме «подписка» / «разово» / «вопрос» и показать форму. */
export function selectIntent(intent: LeadIntent, ctaVariant = "subscription"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<IntentEventDetail>(INTENT_EVENT, { detail: { intent, ctaVariant } }),
  );
  scrollToLead();
}
