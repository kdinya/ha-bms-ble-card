# Architecture

## Purpose
`ha-bms-ble-card` is a Lovelace card for Home Assistant that visualizes BLE BMS battery data exposed by BMS_BLE-HA.

The card does not communicate with Bluetooth/BMS hardware directly. It consumes Home Assistant entities and state/attribute data.

## Repository areas
- `src/` — application/source logic.
- `test/` — automated regression tests.
- `dist/` — distribution artifacts; avoid manual edits unless a release/distribution task requires them.
- `images/` — project images.
- `.github/workflows/` — CI automation.
- `README.md` / `info.md` — user-facing documentation and integration information.

## Data discovery
The card supports explicit entity configuration and automatic discovery of BMS_BLE-related devices/entities. Cell voltages may be supplied through configured entities or through the supported cell-voltage attribute path. Device Registry information can be used for battery naming/discovery.

## UI/data responsibilities
The card formats Home Assistant state data for display: SOC, voltage/current/power, cell voltages, balancing/status information, link quality and runtime-related values where available.

Missing, unavailable or unknown optional entities should degrade gracefully rather than crash rendering.

## Development flow
Source changes are made in `src/`, regression coverage belongs in `test/`, and tests are run with `npm test`. Distribution files should follow the repository's established build/release process rather than being edited independently.

## Design constraint
Keep the public Lovelace configuration compatible unless a requested feature explicitly changes it. Prefer small, isolated changes over broad refactors.