import { useRef, useState, useEffect } from "react";

interface MultiDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiDropdown({
  label,
  options,
  selected,
  onChange,
}: MultiDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  function toggleOption(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-0.5 text-[11px] font-medium border rounded-[2px] bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] cursor-pointer flex items-center gap-1"
      >
        {label}
        {selected.length > 0 && (
          <span className="ml-1 px-1 rounded bg-[var(--accent-primary)] text-[var(--text-primary)]">
            {selected.length}
          </span>
        )}
        <span className="ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--bg-panel)] border border-[var(--border-subtle)] max-h-[240px] overflow-y-auto min-w-[140px]">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 px-3 py-1 text-[12px] cursor-pointer hover:bg-[var(--bg-raised)]"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
