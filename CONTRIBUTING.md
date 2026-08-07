# Contributing

This is a no-build static site. Keep changes focused, run the smoke test, and
preserve the accessible keyboard interactions and safe text rendering.

## Fleet workflow

The repository uses named automation roles:

- **Jules** handles routine UI, responsive, accessibility, and documentation
  cleanup.
- **Bolt** handles performance work.
- **Sentinel** handles security hardening.

`.github/workflows/fleet-analyze.yml` analyzes the current goal,
`fleet-dispatch.yml` requests bounded work, and `fleet-label.yml` applies the
repository's existing routing labels. Scheduled Fleet merges are disabled;
`fleet-merge.yml` requires an explicit maintainer dispatch. Human PRs should
still receive normal review and pass the smoke workflow before they are
considered for `fleet-merge-ready`.

The intended protection policy for `main` is at least one human approval plus
the `Smoke tests / smoke` required status check, with administrators prevented
from bypassing those checks for routine fleet merges. GitHub branch-protection
settings are repository administration rather than checked-in code; apply and
verify them in Settings → Rules → Rulesets (or the branch protection API).

## Goals and journals

Fleet goals live in `.fleet/goals/*.md`. A goal should state the objective,
scope, acceptance criteria, and constraints. Add a new file rather than
editing the generated placeholder. The `.jules/*.md` files are security and
performance journals: they record durable lessons for future automated work,
not raw logs or secrets.

## Pull requests

Keep PRs small enough to review, include tests or a smoke-test explanation,
and document any external setup required (Supabase policies, GitHub settings,
or secrets). Do not weaken CSP, RLS, or escaping behavior to make a test pass.
