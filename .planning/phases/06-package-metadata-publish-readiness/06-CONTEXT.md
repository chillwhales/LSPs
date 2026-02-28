# Phase 6: Package Metadata & Publish Readiness - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Every `@chillwhales/*` package has complete metadata and is ready for its first npm publish. This means: LICENSE file included in each tarball, README with description/install/usage, complete package.json fields (files, engines, repository, keywords), and correct viem peer dependency declarations. No new code features — this is purely publish preparation.

</domain>

<decisions>
## Implementation Decisions

### README content & depth
- Shared template with optional sections — core sections mandatory (description, install, usage), packages can include/omit extras based on complexity
- One realistic code snippet per main export (~10-20 lines showing real-world usage, not just import + call)
- No API reference table — TypeScript types serve that role in-editor, avoids maintenance burden on every new function
- Optional sections when relevant: peer dependency callouts (for viem-using packages) and link to the relevant LSP specification
- MIT license badge (shields.io) near the top of each README

### License & attribution
- Copyright holder: "Chillwhales contributors"
- Single LICENSE file at repo root, copied into each package directory at prepublish time (standard monorepo approach)
- Fixed copyright year: "2026" — no annual updates
- MIT license (already declared in all package.json files)

### Engine & compatibility targets
- Minimum Node.js version: `"node": ">=22"` — packages are tested on Node 22 and 24
- Advisory enforcement only (npm warns on mismatch, doesn't fail install)
- Explicit `"type": "module"` in each package.json
- ESM-only — no CJS build output, no dual-package hazard

### Keyword & discoverability strategy
- Base keywords shared across all packages: `chillwhales`, `lukso`, `lsp`
- Standard-specific keywords per package matching the LSP standard (e.g., lsp4 gets `digital-asset`, `metadata`, `lsp7`, `lsp8`)
- Include LUKSO brand terms where relevant: `universal-profile` (lsp3), `digital-asset` (lsp4), `key-manager` (lsp6), etc.
- `chillwhales` included in every package for org-level discoverability
- Set once during this phase, no ongoing keyword maintenance process

### Claude's Discretion
- Exact README template markdown structure and section ordering
- Specific keywords chosen per package (within the strategy above)
- `repository` field format and exact `files` array contents
- Prepublish script implementation for LICENSE copying
- How to handle the `config` package (internal, may not need full publish treatment)

</decisions>

<specifics>
## Specific Ideas

- README code examples should be realistic enough that a LUKSO developer can get started without reading the LSP spec — the snippet should show the actual use case, not just prove the function exists
- Peer dependency callouts in README should be prominent — peer dep confusion is the #1 install headache for scoped packages
- The `utils` package description is currently just "Utility functions" — needs a proper description like the other packages

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-package-metadata-publish-readiness*
*Context gathered: 2026-02-28*
