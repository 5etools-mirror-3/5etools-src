# Personal Modification Registry

Every edit to a core (upstream-tracked) file must be logged here before the next upstream pull.
Run `grep -rn "\[PERSONAL\]" js/ scss/ data/` to cross-check.

| File | Line(s) | Date | Description | Upstream Conflict Risk |
|------|---------|------|-------------|------------------------|
| `scss/main.scss` | 44 | 2026-03-24 | Added `@use "includes/personal"` import | Low — bottom of file, rarely edited upstream |
