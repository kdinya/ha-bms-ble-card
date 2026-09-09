# Architecture

## Purpose
`ha-bms-ble-card` is a Lovelace card for Home Assistant that visualizes BLE BMS battery data exposed by BMS_BLE-HA.

The card does not communicate with Bluetooth/BMS hardware directly. It consumes Home Assistant entities and state/attribute data.

## Repository areas
- `ha-bms-ble-card.js` — the entire card: one file, edited directly (no
  build/bundle step — this file is exactly what ships to users, and what
  HACS/the GitHub release serve; there is no separate `src/`/`dist/` split).
- `test/` — automated regression tests.
- `.github/workflows/` — CI automation.
- `README.md` / `info.md` — user-facing documentation and integration information.

## Data discovery
The card supports explicit entity configuration and automatic discovery of BMS_BLE-related devices/entities. Cell voltages may be supplied through configured entities or through the supported cell-voltage attribute path. Device Registry information can be used for battery naming/discovery.

## UI/data responsibilities
The card formats Home Assistant state data for display: SOC, voltage/current/power, cell voltages, balancing/status information, link quality and runtime-related values where available.

Missing, unavailable or unknown optional entities should degrade gracefully rather than crash rendering.

## Development flow
Changes are made directly in `ha-bms-ble-card.js`, regression coverage belongs in `test/`, and tests are run with `npm test`.

## Design constraint
Keep the public Lovelace configuration compatible unless a requested feature explicitly changes it. Prefer small, isolated changes over broad refactors.