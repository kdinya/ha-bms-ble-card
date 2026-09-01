/*
 * HACS entry point for BMS BLE Battery Card v3.
 * Keep the implementation in src so development remains maintainable.
 */
import("./src/ha-bms-ble-card-v3.js").catch((error) => {
  console.error("HA-BMS-BLE-CARD v3 failed to load", error);
});
