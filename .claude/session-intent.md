# Session Intent Contract

**Created:** 2026-08-11

## Job Statement
Improve the re-encoded-vocab site (single-file app, `index.html` + `data/`) across five fronts:
1. Replace forced/weak illustrative examples with better ones, sourced from the user's own coding-book EPUBs (`\\wsl.localhost\Ubuntu\home\adamjroder\projects\zzcleanup\codingbooks`) and https://eloquentjavascript.net/.
2. Fix and rework the Code Lab / code-tutorial feature — currently "a bit broken" — including a clean way to bracket/modulate code snippets between languages/contexts.
3. Improve overall UI/layout (close to right, needs polish).
4. Flesh out a new **Philosophy** context/lens in depth — user has domain background here and will fact-check accuracy directly, so this is the highest-stakes content area.
5. Brainstorm and propose additional context lenses beyond the current 8 (medical/sports/fandom/ttrpg/cooking/millennial/f1/gaming).

## Success Criteria
- Working solution: changes are live and functional in the running site.
- Clear understanding: even for parts not fully built this round, next steps are concrete.
- Production-ready: polish and correctness bar, not a rough draft.

## Boundaries
- High stakes on Philosophy content accuracy — user will personally fact-check, so claims must be sourced/defensible, not hand-waved analogies.
- Preserve the existing single-file/data-driven architecture (`LENS_OPTIONS`, `data/*.json`, entries with `lenses:{}` per term) rather than a rewrite.
- Must account for existing recent work on this branch (`agent/performance-smoke-metrics`): accessibility/abuse safeguards, browser smoke checks, control-name audit — don't regress those.

## Context (from intake)
- Goal: Review/improve existing
- Knowledge level: Some familiarity (wants a fresh audit before fixing, not just blind execution)
- Success: Working solution + Clear understanding + Production-ready
- Constraints: High stakes (Philosophy accuracy)
