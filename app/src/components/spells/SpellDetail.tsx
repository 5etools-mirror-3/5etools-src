import { useEffect } from "react";
import type { SpellData } from "../../data/spellTypes";
import { getSchoolColor } from "../../data/schoolColors";
import { SpellHeader } from "./SpellHeader";
import { SpellStatsGrid } from "./SpellStatsGrid";
import { SpellDescription } from "./SpellDescription";

interface SpellDetailProps {
  spell: SpellData;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export function SpellDetail({ spell, onClose, onPrev, onNext }: SpellDetailProps) {
  const schoolColor = getSchoolColor(spell.schoolIndex);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Backspace") {
        onClose();
      } else if (e.key === "ArrowUp" && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowDown" && onNext) {
        e.preventDefault();
        onNext();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const componentsDisplay = spell.components.join(", ");

  return (
    <>
      {/* Backdrop (desktop only) */}
      <div
        className="hidden lg:block fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[80%] lg:w-[65%] flex flex-col"
        style={{
          background: "var(--bg-base)",
          borderLeft: "1px solid var(--border-subtle)",
          animation: "slideIn 120ms ease-out",
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 flex-shrink-0"
          style={{
            height: "48px",
            background: "var(--bg-base)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center cursor-pointer"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "18px",
                padding: "4px",
              }}
              aria-label="Close"
            >
              ←
            </button>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: "var(--text-primary)",
              }}
            >
              {spell.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: schoolColor,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {spell.school}
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-8">
          {/* School header band */}
          <SpellHeader
            name={spell.name}
            level={spell.level}
            schoolIndex={spell.schoolIndex}
            schoolName={spell.school}
          />

          {/* Stats grid */}
          <div className="mt-3">
            <SpellStatsGrid
              castingTime={spell.castingTime}
              range={spell.range}
              duration={spell.duration}
              components={componentsDisplay}
              material={spell.material}
            />
          </div>

          {/* Divider */}
          <div
            className="mx-4 my-4"
            style={{ height: "1px", background: "var(--border-subtle)" }}
          />

          {/* Description */}
          <div className="px-4">
            <SpellDescription entries={spell.description} schoolColor={schoolColor} />
          </div>

          {/* At Higher Levels */}
          {spell.higherLevel && spell.higherLevel.length > 0 && (
            <div
              className="mx-4 mt-4 p-3"
              style={{
                borderLeft: `2px solid ${schoolColor}`,
                background: "var(--bg-panel)",
              }}
            >
              <div
                style={{
                  color: schoolColor,
                  fontWeight: 700,
                  fontSize: "13px",
                  marginBottom: "6px",
                }}
              >
                At Higher Levels
              </div>
              <SpellDescription entries={spell.higherLevel} schoolColor={schoolColor} />
            </div>
          )}

          {/* Divider */}
          <div
            className="mx-4 my-4"
            style={{ height: "1px", background: "var(--border-subtle)" }}
          />

          {/* Footer */}
          <div className="px-4 flex flex-col gap-2">
            {/* Classes */}
            {spell.classes.length > 0 && (
              <div style={{ fontSize: "13px" }}>
                <span style={{ color: schoolColor, fontWeight: 600 }}>Classes: </span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {spell.classes.join(", ")}
                </span>
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {spell.concentration && (
                <span
                  className="px-2 py-0.5 rounded-[2px] text-[11px] font-medium"
                  style={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Concentration
                </span>
              )}
              {spell.ritual && (
                <span
                  className="px-2 py-0.5 rounded-[2px] text-[11px] font-medium"
                  style={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Ritual
                </span>
              )}
            </div>

            {/* Source */}
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Source: {spell.source}
              {spell.page ? ` p. ${spell.page}` : ""}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
