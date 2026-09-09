# Decisions

## 1. Home Assistant entities are the data boundary
The card consumes entities exposed by Home Assistant/BMS_BLE-HA instead of implementing direct BLE communication. This keeps the card focused on presentation and Lovelace integration.

## 2. Optional data must fail gracefully
BMS installations can expose different sets of entities. Missing or unavailable optional values should not break the whole card.

## 3. Automatic discovery is supported
Where reliable Home Assistant entity/device metadata is available, discovery reduces configuration effort while explicit configuration remains the compatibility path.

## 4. Cell voltage sources are flexible
Cell voltage data may come from the supported configured entity/attribute paths. The card should not assume a fixed cell count or a single BMS vendor.

## 5. Single file, no source/distribution split (updated 2026-09)
There is no build/bundle step, so a separate `src/`/`dist/` split only
added duplication without any real benefit (both files were always
byte-identical). `ha-bms-ble-card.js` now lives at the repo root and is
edited directly; `hacs.json` uses `content_in_root: true` so HACS and
the GitHub release both serve that same file with no copy step.
(Previously: "`src/` is the development source, `dist/` is a
distribution artifact regenerated through the build process" — there
never was a build process, so this was removed.)

## 6. Small changes are preferred
Changes should preserve the existing public configuration and behavior unless the requested feature explicitly requires a breaking change.