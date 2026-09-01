# Changelog

## 3.0.0-beta.2

- Fix HACS installation by including the frontend entry file at repository root.
- Ensure beta tags are created from `bms-v3-auto-discovery`, never `main`.
- Keep the v3 implementation under `src/` while exposing a HACS-compatible entry point.
- Keep the release asset available for HACS/release consumers.

## 3.0.0-beta.1

- Automatic discovery of BMS_BLE-HA devices by device registry.
- Automatic mapping of the requested battery entities without hard-coded entity IDs.
- Automatic cell-voltage display from the BMS_BLE-HA `cell_voltages` attribute.
- Optional display of additional BMS attributes when exposed by the integration.
- Real Home Assistant Recorder power history for discharge-energy statistics.
- Dedicated beta release workflow for HACS-installable pre-releases.
- Existing stable `main` branch remains unchanged.

## 2.1.2

Виправлення після реальної перевірки рендера (попередні ітерації перевірялись лише на рівні коду/тестів, без фактичного рендеру — це й було причиною, що дизайн не відповідав макету):

- **Прибрано зовнішню залежність від CDN для іконок** (`cdn.jsdelivr.net` з шрифтом Tabler Icons). Тепер іконки малює вбудований `<ha-icon icon="mdi:...">` Home Assistant.
- Виправлено перенесення тексту в бейджах Макс/Мін/Δ комірок.
- Виправлено структуру верхнього блоку метрик.
- Фон картки й панелей ще трохи темніший, ближче до макета.
- Перевірено реальним рендером верхній блок.

## 2.1.1

- Уніфіковано кольорову палітру статусів.
- Виправлено smoke-render test.
- `smoke-render.test.js` підключено до `npm test`.

## 2.1.0

- Повний дизайн під mockup-скріни: темна тема, батарея SOC, метрики, комірки-смужки, max/min/Δ, діагностика, статистика, ємність, прогноз часу.
- Авто-підказки entity_id у редакторі; ETA заряд/розряд.

## 2.0.0

- Автовибір BMS-пристрою, комірки з cell_voltages, editor 1 col.
