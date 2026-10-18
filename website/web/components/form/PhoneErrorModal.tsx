"use client";

/**
 * Модальное окно с ошибкой телефона.
 *
 * По стайлгайду при неверном номере показываем окно, а не подсказку под полем.
 * Закрывается крестиком, клавишей Esc и кликом по затемнённому фону.
 */

import { useEffect, useId, useRef } from "react";

export interface PhoneErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function PhoneErrorModal({ isOpen, message, onClose }: PhoneErrorModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    // Пока окно открыто, страница не должна скроллиться под ним.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal__dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          className="modal__close"
          type="button"
          onClick={onClose}
          aria-label="Закрыть окно"
          ref={closeRef}
        >
          ×
        </button>
        <p className="modal__text" id={titleId}>
          {message}
        </p>
      </div>
    </div>
  );
}
