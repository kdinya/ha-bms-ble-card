# ha-bms-ble-card

[Українська версія (Ukrainian)](README_UA.md)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/default)
[![GitHub Release](https://img.shields.io/github/v/release/kdinya/ha-bms-ble-card)](https://github.com/kdinya/ha-bms-ble-card/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, informative, and responsive Lovelace card for Home Assistant designed to monitor and visualize batteries with BLE BMS (Redodo, LiTime, JBD, Daly, JK, Seplos, and others) integrated via [BMS_BLE-HA](https://github.com/patman15/BMS_BLE-HA).

![Card Screenshot](images/screenshot.png)

---

## Features

- **Interactive State Animation**: Real-time flow visualization for charging and discharging, dynamic battery jar graphic, and estimated time to full charge or discharge (ETA).
- **Per-Cell Monitoring**: Individual cell voltage bars with automatic detection of maximum, minimum, and voltage delta, plus active balancing cell highlighting.
- **Consumption & Duration Statistics**: Dedicated tracking of capacity used (Ah) and energy (Wh/kWh), alongside active charge and discharge runtimes across periods (today, yesterday, week, month, year, custom range).
- **Zero-Config Auto-Discovery**: Select your battery device in the visual card editor — all relevant entities, including disabled-by-default sensors, are automatically populated.
- **One-Click Setup Wizard**: Automatically creates the required Home Assistant helper sensors directly from the visual card editor for accurate statistics.
- **Bilingual Interface (UA / EN)**: Seamless in-card language switcher on the Settings tab without requiring a browser reload.

---

## Installation

### Method 1: HACS (Recommended)

1. Open **HACS** → **Integrations / Frontend** → three dots in the top right → **Custom repositories**.
2. Enter repository URL: `https://github.com/kdinya/ha-bms-ble-card`
3. Select Type: **Lovelace (Dashboard)** and click **Add**.
4. Search for **BMS BLE Battery Card** and click **Download**.
5. Refresh your browser page.

### Method 2: Manual

1. Download `ha-bms-ble-card.js` from the [latest release](https://github.com/kdinya/ha-bms-ble-card/releases).
2. Copy the file into your Home Assistant directory: `config/www/ha-bms-ble-card.js`.
3. In Home Assistant, go to **Settings** → **Dashboards** → three dots in the top right → **Resources** and add:
   - URL: `/local/ha-bms-ble-card.js`
   - Resource type: `JavaScript Module`

---

## Quick Start

1. Ensure your battery is connected via the [BMS_BLE-HA](https://github.com/patman15/BMS_BLE-HA) integration.
2. Add the card via the dashboard visual editor or use YAML:

```yaml
type: custom:ha-bms-ble-card
device_id: YOUR_BMS_BLE_DEVICE_ID
```

*(The card automatically resolves all sensors tied to the device).*

---

## Statistics & Helper Sensors

To accurately calculate cycle capacity and charge/discharge durations, the card relies on helper sensors. You can set them up in seconds:
1. Open the card in **Edit** mode.
2. Click the **Setup Wizard** button.
3. Follow the guided prompt to automatically create and bind the helpers.

*(If you prefer manual YAML configuration, see the [Manual Helper Setup Guide](docs/manual-helpers.md)).*

---

## Testing & Quality Assurance

```bash
# Verify JavaScript syntax
node --check ha-bms-ble-card.js

# Run test suite
npm test
```

## License

This project is licensed under the [MIT License](LICENSE).
