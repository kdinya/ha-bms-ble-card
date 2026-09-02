# Decisions

## 1. Home Assistant entities are the data boundary
The card consumes entities exposed by Home Assistant/BMS_BLE-HA instead of implementing direct BLE communication. This keeps the card focused on presentation and Lovelace integration.

## 2. Optional data must fail gracefully
BMS installations can expose different sets of entities. Missing or unavailable optional values should not break the whole card.

## 3. Automatic discovery is supported
Where reliable Home Assistant entity/device metadata is available, discovery reduces configuration effort while explicit configuration remains the compatibility path.

## 4. Cell voltage sources are flexible
Cell voltage data may come from the supported configured entity/attribute paths. The card should not assume a fixed cell count or a single BMS vendor.

## 5. Source and distribution are separated
`src/` is the development source. `dist/` is treated as a distribution artifact and should be regenerated through the established project process when required.

## 6. Small changes are preferred
Changes should preserve the existing public configuration and behavior unless the requested feature explicitly requires a breaking change.