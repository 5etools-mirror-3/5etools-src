import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { useSpellStore } from "../../store/useSpellStore";
import { useSpellFilters } from "../../hooks/useSpellFilters";
import { useSpellSearch } from "../../hooks/useSpellSearch";
import { SpellSearch } from "./SpellSearch";
import { SpellFilters } from "./SpellFilters";
import { SpellList } from "./SpellList";
import { SpellDetail } from "./SpellDetail";

export function SpellListView() {
  const navigate = useNavigate();
  const { spellId } = useParams<{ spellId?: string }>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { spells, loading, error, loadSpells, allClasses, allSources } = useSpellStore();

  // Load spells on mount if not loaded
  useEffect(() => {
    if (spells.length === 0 && !loading) {
      loadSpells();
    }
  }, []);

  const {
    filters,
    filtered,
    hasActiveFilters,
    toggleLevel,
    toggleSchool,
    toggleCastingTime,
    toggleConcentration,
    toggleRitual,
    setClasses,
    setComponents,
    setDamageTypes,
    setSources,
    clearAll,
  } = useSpellFilters(spells);

  const { query, setQuery, results } = useSpellSearch(filtered);

  // Find selected spell
  const selectedSpell = spellId
    ? results.find((s) => s.id === spellId) ?? null
    : null;

  // Keyboard shortcut: "/" focuses search when detail not open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (spellId) return; // detail is open
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [spellId]);

  // Prev / Next navigation
  const selectedIndex = spellId ? results.findIndex((s) => s.id === spellId) : -1;

  function handlePrev() {
    if (selectedIndex > 0) {
      navigate(`/spells/${results[selectedIndex - 1].id}`);
    }
  }

  function handleNext() {
    if (selectedIndex >= 0 && selectedIndex < results.length - 1) {
      navigate(`/spells/${results[selectedIndex + 1].id}`);
    }
  }

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
          Loading spells…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-3"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--accent-danger)" }}>{error}</p>
        <button
          type="button"
          onClick={() => loadSpells()}
          className="px-3 py-1.5 rounded-[2px] text-[13px] cursor-pointer"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: "48px",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <Link
            to="/"
            style={{
              color: "var(--text-secondary)",
              fontSize: "18px",
              textDecoration: "none",
              padding: "4px",
            }}
            aria-label="Back to home"
          >
            ←
          </Link>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              color: "var(--text-primary)",
            }}
          >
            Spells
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {results.length.toLocaleString()} spells
        </span>
      </div>

      {/* Search */}
      <SpellSearch query={query} onQueryChange={setQuery} />

      {/* Filters */}
      <SpellFilters
        filters={filters}
        toggleLevel={toggleLevel}
        toggleSchool={toggleSchool}
        toggleCastingTime={toggleCastingTime}
        toggleConcentration={toggleConcentration}
        toggleRitual={toggleRitual}
        setClasses={setClasses}
        setComponents={setComponents}
        setDamageTypes={setDamageTypes}
        setSources={setSources}
        allClasses={allClasses()}
        allSources={allSources()}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAll}
      />

      {/* Spell list */}
      <SpellList
        spells={results}
        selectedId={spellId ?? null}
        onSelect={(spell) => navigate(`/spells/${spell.id}`)}
      />

      {/* Detail overlay */}
      {selectedSpell && (
        <SpellDetail
          spell={selectedSpell}
          onClose={() => navigate("/spells")}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={selectedIndex < results.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
}
