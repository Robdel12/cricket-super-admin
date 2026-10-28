# Contributor guide

Read [VISION.md](VISION.md) before product or architecture changes,
[DESIGN.md](DESIGN.md) before UI or copy changes, and [README.md](README.md)
for integration contracts.

## Code

Use pnpm, plain ES modules and `let`. Prefer small functions, explicit inputs
and outputs, and side effects at the app boundary. Keep module definitions
immutable. Keep server exports separate from browser code and styles.

Apps own routes, permissions, persistence and commands. Shared screens use
plugin schemas; custom pages use their own endpoints and contracts. Keep these
choices visible in code and update the matching docs when they change.

## Checks

Run `pnpm run check` and `pnpm test` for code changes. Test the real Cricket HTTP
boundary and pure module composition. Product database and browser workflows
belong in consuming apps. Mock only external services, time or randomness.
Avoid arbitrary sleeps and polling in app code and tests.

Write short, concrete docs and UI copy. Start commit subjects with a gitmoji.
Do not add co-author or AI attribution.
