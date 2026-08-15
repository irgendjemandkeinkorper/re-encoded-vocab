# Session Plan

**Created:** 2026-08-11
**Intent Contract:** See .claude/session-intent.md

## What You'll End Up With
A materially improved re-encoded-vocab site: sharper, less-forced examples across existing lenses; a working, well-structured Code Lab tutorial with a real snippet-bracketing mechanism; a UI/layout polish pass; a deeply developed, fact-checkable **Philosophy** lens; and a scoped shortlist of new context lenses to add next — with new-example content partially sourced from your coding-book EPUBs and Eloquent JavaScript.

## How We'll Get There

### Phase Weights
- **Discover: 30%** — Audit current examples/lenses for "forced" spots and catalog why; inventory Code Lab's actual breakage; extract candidate examples/explanations from the EPUB coding books and eloquentjavascript.net; survey what a "Philosophy" lens needs (branches, canonical vocab) since you're the domain expert here.
- **Define: 15%** — Lock which examples get replaced and with what; define the code-snippet bracketing UX/format (how a snippet is delimited and swapped per language/context); scope the Philosophy lens's initial term coverage; shortlist 3-5 new context-lens candidates for your approval.
- **Develop: 35%** — Implement: rewrite weak examples, fix Code Lab bugs and build the bracketing mechanism, apply UI/layout fixes, author the Philosophy lens content across existing terms, scaffold approved new lenses.
- **Deliver: 20%** — Cross-browser smoke check (this branch already has smoke-check infra — extend, don't bypass it), review Philosophy content against your fact-check, verify Code Lab across the language/context matrix, confirm no regression to the recent accessibility/abuse-safeguard work.

### Execution Commands
To execute this plan, run:
```bash
/octo:embrace "improve re-encoded-vocab: examples, Code Lab, UI, Philosophy lens, new contexts"
```

Or execute phases individually:
- `/octo:discover` (Discover is 30%, > 20% threshold)
- `/octo:define` (Define is 15%, below threshold — can fold into Discover output)
- `/octo:develop` (Develop is 35%, > 20% threshold)
- `/octo:deliver` (Deliver is 20%, at threshold)

## Provider Requirements
🔴 Codex CLI: Available ✓
🟡 Gemini CLI: Available ✓
🧭 Antigravity CLI: Not installed ✗
🟤 OpenCode: Not installed ✗
🟢 Copilot CLI: Available ✓
🟠 Qwen CLI: Not installed ✗
⚫ Ollama: Not installed ✗
🔵 Claude: Available ✓
🟣 Perplexity: Not configured ✗

## Debate Checkpoints
🔸 After Define: "Is the proposed snippet-bracketing format for the Code Lab the right one, and are the shortlisted new lenses/Philosophy scope right?" — 1-round adversarial debate on design risk, since this is a high-stakes content area.

## Success Criteria
- Working solution, clear next-step understanding for anything deferred, production-ready polish.
- Philosophy content must be defensible/sourced, not forced analogies — this is the explicit bar the user set.

## Notes for Execution
- EPUB source directory (Windows/WSL path, needs `wslpath`-style access from this Linux session):
  `\\wsl.localhost\Ubuntu\home\adamjroder\projects\zzcleanup\codingbooks`
  → from within this WSL session that likely resolves to `/home/adamjroder/projects/zzcleanup/codingbooks` — verify path exists before the Discover phase tries to read it.
- External source: https://eloquentjavascript.net/ — use `ctx_fetch_and_index` per the project's context-mode rules, not raw `curl`.
- Current lens set to extend: medical (base), sports, fandom (pop fantasy), ttrpg, cooking, millennial, f1, gaming — Philosophy is net-new; new-lens brainstorm should avoid overlap with these.
- Recent branch commits already cover: accessibility/abuse safeguards, browser smoke checks, control-name audit — Deliver phase should run the existing smoke-check tooling, not reinvent it.

## Next Steps
1. Review this plan.
2. Adjust if needed (re-run /octo:plan).
3. Execute with /octo:embrace when ready.
