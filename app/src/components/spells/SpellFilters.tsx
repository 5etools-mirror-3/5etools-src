import { useState } from "react";
import { Toggle } from "../ui/Toggle";
import { MultiDropdown } from "../ui/MultiDropdown";
import { SCHOOL_DISPLAY_ABBR } from "../../data/schools";
import type { FilterState } from "../../hooks/useSpellFilters";
import type { CastingTimeCategory } from "../../data/spellTypes";

const LEVELS = [
  { label: "C", value: 0, title: "Cantrip" },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
];

const SCHOOLS = Object.entries(SCHOOL_DISPLAY_ABBR).map(([index, abbr]) => ({
  index,
  abbr,
}));

const CASTING_TIMES: { label: string; value: CastingTimeCategory }[] = [
  { label: "Action", value: "action" },
  { label: "Bonus", value: "bonus" },
  { label: "Reaction", value: "reaction" },
  { label: "Minute+", value: "minute+" },
];

const DAMAGE_TYPES = [
  "acid",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "poison",
  "psychic",
  "radiant",
  "thunder",
];

interface SpellFiltersProps {
  filters: FilterState;
  toggleLevel: (level: number) => void;
  toggleSchool: (school: string) => void;
  toggleCastingTime: (ct: CastingTimeCategory) => void;
  toggleConcentration: () => void;
  toggleRitual: () => void;
  setClasses: (classes: string[]) => void;
  setComponents: (components: string[]) => void;
  setDamageTypes: (damageTypes: string[]) => void;
  setSources: (sources: string[]) => void;
  allClasses: string[];
  allSources: string[];
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function SpellFilters({
  filters,
  toggleLevel,
  toggleSchool,
  toggleCastingTime,
  toggleConcentration,
  toggleRitual,
  setClasses,
  setComponents,
  setDamageTypes,
  setSources,
  allClasses,
  allSources,
  hasActiveFilters,
  onClearAll,
}: SpellFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const selectedClasses = filters.classes ? Array.from(filters.classes) : [];
  const selectedComponents = filters.components ? Array.from(filters.components) : [];
  const selectedDamageTypes = filters.damageTypes ? Array.from(filters.damageTypes) : [];
  const selectedSources = filters.sources ? Array.from(filters.sources) : [];

  return (
    <div
      className="px-4 py-2 flex flex-col gap-1.5 border-b flex-shrink-0"
      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-base)", position: "relative", zIndex: 10 }}
    >
      {/* Row 1: Level */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "32px" }}
        >
          Level
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {LEVELS.map(({ label, value, title }) => (
            <Toggle
              key={value}
              label={label}
              active={filters.levels?.has(value) ?? false}
              onClick={() => toggleLevel(value)}
              title={title}
            />
          ))}
        </div>
      </div>

      {/* Row 2: School | Time */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: "11px", color: "var(--text-muted)", minWidth: "32px" }}>
            School
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {SCHOOLS.map(({ index, abbr }) => (
              <Toggle
                key={index}
                label={abbr}
                active={filters.schools?.has(index) ?? false}
                onClick={() => toggleSchool(index)}
                title={index.charAt(0).toUpperCase() + index.slice(1)}
              />
            ))}
          </div>
        </div>

        <div
          className="w-px self-stretch"
          style={{ background: "var(--border-subtle)" }}
        />

        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Time</span>
          <div className="flex items-center gap-1 flex-wrap">
            {CASTING_TIMES.map(({ label, value }) => (
              <Toggle
                key={value}
                label={label}
                active={filters.castingTimes?.has(value) ?? false}
                onClick={() => toggleCastingTime(value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Class dropdown | Conc. | Ritual | More | Clear All */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiDropdown
          label="Class"
          options={allClasses}
          selected={selectedClasses}
          onChange={setClasses}
        />
        <Toggle
          label="Conc."
          active={filters.concentration === true}
          onClick={toggleConcentration}
          title="Concentration"
        />
        <Toggle
          label="Ritual"
          active={filters.ritual === true}
          onClick={toggleRitual}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 py-0.5 text-[11px] font-medium border rounded-[2px] bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] cursor-pointer"
        >
          {expanded ? "Less ▴" : "More ▾"}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto px-2 py-0.5 text-[11px] font-medium border rounded-[2px] border-[var(--accent-danger)] text-[var(--accent-danger)] bg-transparent hover:bg-[var(--bg-panel)] cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Expanded row: Components | Damage | Source */}
      {expanded && (
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Comp.</span>
          <div className="flex items-center gap-1">
            {["V", "S", "M"].map((comp) => (
              <Toggle
                key={comp}
                label={comp}
                active={selectedComponents.includes(comp)}
                onClick={() => {
                  const next = selectedComponents.includes(comp)
                    ? selectedComponents.filter((c) => c !== comp)
                    : [...selectedComponents, comp];
                  setComponents(next);
                }}
                title={
                  comp === "V" ? "Verbal" : comp === "S" ? "Somatic" : "Material"
                }
              />
            ))}
          </div>

          <MultiDropdown
            label="Damage"
            options={DAMAGE_TYPES}
            selected={selectedDamageTypes}
            onChange={setDamageTypes}
          />

          <MultiDropdown
            label="Source"
            options={allSources}
            selected={selectedSources}
            onChange={setSources}
          />
        </div>
      )}
    </div>
  );
}
