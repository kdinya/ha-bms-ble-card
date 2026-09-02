# ha-bms-ble-card — Claude instructions

## Project
Lovelace card for Home Assistant that visualizes BLE BMS batteries provided by BMS_BLE-HA.

## Core rules
- Preserve existing behavior and backward compatibility unless explicitly requested otherwise.
- Prefer the smallest safe change that solves the task.
- Do not refactor unrelated code.
- Do not add dependencies unless clearly required.
- Do not change the public card configuration/API without an explicit requirement.
- Do not change visual design, labels, thresholds or defaults unless explicitly requested.
- Treat `src/` as source logic and `test/` as the regression safety net.
- Avoid editing generated `dist/` files unless the task explicitly requires a distribution update.
- Do not invent Home Assistant APIs; follow existing project patterns and verify assumptions.
- Optional or unavailable entities must not make the card fail unless required by the feature.
- Never expose credentials, tokens or secrets in source, issues, commits or logs.

## Testing
Run `npm test` after relevant changes. Check `package.json` before assuming the exact test list.

## Multi-agent workflow
1. ARCHITECT — investigates and produces a minimal implementation plan. No code changes.
2. DEVELOPER — implements only the approved plan, tests it, reviews the diff and commits.
3. REVIEWER — reviews the latest diff/commit and reports PASS or concrete required fixes. No code changes.

Git history, GitHub issues/PRs and `docs/` are shared project memory. Prefer concise artifacts over repeating large context.

## Communication
Be concise. Report changed files, tests, commit and concrete risks. Do not paste large files into responses.