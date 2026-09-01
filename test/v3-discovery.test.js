const test = require("node:test");
const assert = require("node:assert/strict");
const { discoverEntities, etaSeconds, FIELDS, DOMAIN } = require("../src/ha-bms-ble-card-v3.js");

function fixture() {
  const ids = [
    ["sensor.r_12140bnnh19_b03168_battery", "sensor", "battery"],
    ["binary_sensor.r_12140bnnh19_b03168_charging", "binary_sensor", "battery_charging"],
    ["sensor.r_12140bnnh19_b03168_power", "sensor", "power"],
    ["sensor.r_12140bnnh19_b03168_stored_energy", "sensor", "energy"],
    ["sensor.r_12140bnnh19_b03168_voltage", "sensor", "voltage"],
    ["sensor.r_12140bnnh19_b03168_temperature", "sensor", "temperature"],
    ["sensor.r_12140bnnh19_b03168_current", "sensor", "current"],
    ["sensor.r_12140bnnh19_b03168_battery_health", "sensor", "battery"],
    ["sensor.r_12140bnnh19_b03168_cycles", "sensor", ""],
    ["sensor.r_12140bnnh19_b03168_runtime", "sensor", "duration"],
    ["binary_sensor.r_12140bnnh19_b03168_problem", "binary_sensor", "problem"],
    ["sensor.r_12140bnnh19_b03168_signal_strength", "sensor", "signal_strength"],
    ["binary_sensor.r_12140bnnh19_b03168_balancer", "binary_sensor", ""],
    ["sensor.r_12140bnnh19_b03168_delta_cell_voltage", "sensor", "voltage"],
    ["sensor.r_12140bnnh19_b03168_design_capacity", "sensor", "energy"],
    ["binary_sensor.r_12140bnnh19_b03168_heater", "binary_sensor", ""],
    ["sensor.r_12140bnnh19_b03168_highest_cell_voltage", "sensor", "voltage"],
    ["sensor.r_12140bnnh19_b03168_link_quality", "sensor", ""],
    ["sensor.r_12140bnnh19_b03168_lowest_cell_voltage", "sensor", "voltage"],
  ];
  const entities = {};
  const states = {};
  for (const [entityId, domain, deviceClass] of ids) {
    entities[entityId] = { device_id: "battery-device", platform: DOMAIN, device_class: deviceClass };
    states[entityId] = { state: "0", attributes: { device_class: deviceClass, friendly_name: entityId.split(".")[1] } };
  }
  return { entities, states, devices: { "battery-device": { name: "Redodo" } } };
}

test("v3 discovers all user-provided BMS entities", () => {
  const found = discoverEntities(fixture(), "battery-device");
  for (const key of ["soc", "charging", "power", "stored_energy", "voltage", "temperature", "current", "battery_health", "cycles", "runtime", "problem", "signal_strength", "balancer", "delta_cell_voltage", "design_capacity", "heater", "highest_cell_voltage", "link_quality", "lowest_cell_voltage"]) {
    assert.ok(found[key], `missing ${key}`);
  }
  assert.equal(found.stored_energy, "sensor.r_12140bnnh19_b03168_stored_energy");
  assert.equal(found.highest_cell_voltage, "sensor.r_12140bnnh19_b03168_highest_cell_voltage");
  assert.equal(found.lowest_cell_voltage, "sensor.r_12140bnnh19_b03168_lowest_cell_voltage");
});

test("v3 does not require manual entity ids", () => {
  const found = discoverEntities(fixture(), "battery-device");
  assert.ok(Object.keys(found).length >= 19);
  assert.equal(FIELDS.voltage.domain, "sensor");
});

test("ETA uses positive current for charging and negative for discharge", () => {
  assert.equal(Math.round(etaSeconds(50, 10, 100, true)), 1800);
  assert.equal(Math.round(etaSeconds(50, -10, 100, false)), 1800);
  assert.equal(etaSeconds(50, 0, 100, false), undefined);
});
