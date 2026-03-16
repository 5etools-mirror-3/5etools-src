import { useEffect } from "react";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="p-6 max-w-sm w-full mx-4 rounded-[2px]"
        style={{
          background: "var(--bg-panel)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p style={{ fontSize: "15px", color: "var(--text-primary)", margin: 0 }}>
          {message}
        </p>

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-1.5 rounded-[2px] cursor-pointer text-[13px]"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 rounded-[2px] cursor-pointer text-[13px]"
            style={{
              background: "var(--accent-danger)",
              border: "1px solid var(--accent-danger)",
              color: "var(--text-primary)",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
