"use client";

import { useEffect, useRef } from "react";

/**
 * Native <dialog> + showModal(). That gives focus trapping, Escape-to-close and
 * inertness of the background for free — a hand-rolled div modal gets all three
 * wrong, and this panel is small enough that the native element's styling
 * limits never bite.
 *
 * The safe action holds initial focus; the destructive one is text-signal.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      cancelRef.current?.focus();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Escape fires `cancel`/`close` natively; keep React state in step with it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = (e) => {
      e.preventDefault();
      onCancel?.();
    };
    el.addEventListener("cancel", handle);
    return () => el.removeEventListener("cancel", handle);
  }, [onCancel]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      className="w-[min(28rem,calc(100vw-2.5rem))] border border-(--line) bg-(--raised) p-0 text-(--text) backdrop:bg-(--overlay)"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-[1.25rem] font-semibold tracking-[-0.02em] text-(--text)">
          {title}
        </h2>
        {body && <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-mute)">{body}</p>}

        <div className="mt-7 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="label-mono border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="label-mono border border-signal px-4 py-2.5 text-signal transition-colors hover:bg-signal hover:text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
