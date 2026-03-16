interface ToggleProps {
  label: string;
  active: boolean;
  onClick: () => void;
  title?: string;
}

export function Toggle({ label, active, onClick, title }: ToggleProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-0.5 text-[11px] font-medium border rounded-[2px] transition-colors duration-[120ms] cursor-pointer
        ${
          active
            ? "active bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-primary)]"
            : "bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
        }`}
    >
      {label}
    </button>
  );
}
