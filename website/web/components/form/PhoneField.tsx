"use client";

/**
 * Телефон с маской +375 (XX) XXX-XX-XX.
 *
 * Человек может вставить номер как угодно — «80291234567», «+375 29 123 45 67»,
 * «029 123-45-67» — маска сама приведёт его к одному виду. Стирание разделителя
 * (скобки, дефиса) убирает цифру, а не возвращает её обратно.
 */

import { useRef, type ChangeEvent } from "react";

import { FieldError } from "@/components/form/FieldError";
import { formatPhoneInput, nationalDigits, PHONE_TEMPLATE } from "@/lib/validation/phone";

export interface PhoneFieldProps {
  id: string;
  value: string;
  error?: string | null;
  hint: string;
  hintId: string;
  errorId: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  name?: string;
}

function maskValue(raw: string, previous: string): string {
  const rawDigits = nationalDigits(raw);
  const previousDigits = nationalDigits(previous);

  if (raw.length < previous.length && rawDigits === previousDigits) {
    // Стёрли разделитель, а не цифру — убираем последнюю введённую цифру.
    return formatPhoneInput(rawDigits.slice(0, -1));
  }

  return formatPhoneInput(raw);
}

export function PhoneField({
  id,
  value,
  error,
  hint,
  hintId,
  errorId,
  onChange,
  onBlur,
  disabled = false,
  name = "phone",
}: PhoneFieldProps) {
  const previousValueRef = useRef(value);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = maskValue(event.target.value, previousValueRef.current);
    previousValueRef.current = next;
    onChange(next);
  };

  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        Телефон <span className="field__required">*</span>
      </label>
      <input
        id={id}
        name={name}
        className={error ? "field__input field__input--invalid" : "field__input"}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={PHONE_TEMPLATE}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      <p className="field__hint" id={hintId}>
        {hint}
      </p>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
