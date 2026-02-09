import { toast } from "sonner";

/**
 * Show a Sonner-based confirmation toast with primary and cancel actions.
 *
 * @param {Object} options
 * @param {string} options.message - Main confirmation message
 * @param {string} [options.description] - Optional description / helper text
 * @param {string} [options.confirmLabel="Confirm"] - Label for confirm action
 * @param {string} [options.cancelLabel="Cancel"] - Label for cancel action
 * @param {() => void | Promise<void>} options.onConfirm - Called when user confirms
 * @param {() => void | Promise<void>} [options.onCancel] - Called when user cancels
 */
export function showConfirmToast({
  message,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  toast.custom((t) => (
    <div
      className="
    flex flex-col gap-2 max-w-xs
    rounded-lg
    bg-[var(--surface)]
    border border-[var(--border)]
    shadow-lg
    px-4 py-3
  "
    >
      <div className="flex flex-col gap-2 max-w-xs">
        <div className="text-sm font-semibold text-[var(--text)]">{message}</div>
        {description && (
          <div className="text-xs text-[var(--text-muted)]">{description}</div>
        )}
        <div className="flex justify-end gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              if (onCancel) onCancel();
            }}
            className="px-2.5 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--hover)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              if (onConfirm) await onConfirm();
            }}
            className="px-3 py-1 text-xs rounded-md bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>));
}


