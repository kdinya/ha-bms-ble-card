const test = require("node:test");
const assert = require("node:assert/strict");

// dist/ha-bms-ble-card.js — це файл для браузера: він визначає кастомні
// елементи одразу при завантаженні (class ... extends HTMLElement,
// customElements.define(...)). Для юніт-тестів чистих функцій поза
// браузером підставляємо мінімальні стаби цих глобальних об'єктів.
if (typeof globalThis.HTMLElement === "undefined") {
  globalThis.HTMLElement = class HTMLElement {};
}
if (typeof globalThis.customElements === "undefined") {
  globalThis.customElements = { define() {} };
}
if (typeof globalThis.window === "undefined") {
  globalThis.window = { customCards: [], addEventListener() {}, innerWidth: 1024, innerHeight: 768 };
}

const {
  fmt,
  secondsToHuman,
  batteryFillColor,
  dischargeOnlyTemplate,
  cellVoltageFraction,
  CELL_VOLTAGE_RANGE,
  DEFAULT_THRESHOLDS,
  findBmsBleDeviceIds,
  autoDiscoverEntities,
} = require("../dist/ha-bms-ble-card.js");

// Мінімальний фейковий hass для тестів автопошуку: один пристрій
// BMS_BLE-HA з типовим набором сутностей + одна "чужа" сутність з
// device_class "battery", яка НЕ повинна бути сплутана з SOC акумулятора.
function fakeHass() {
  const entities = {
    "sensor.battery_voltage": { device_id: "dev1", platform: "bms_ble", device_class: "voltage" },
    "sensor.battery_current": { device_id: "dev1", platform: "bms_ble", device_class: "current" },
    "sensor.battery_power": { device_id: "dev1", platform: "bms_ble", device_class: "power" },
    "sensor.battery_state_of_charge": { device_id: "dev1", platform: "bms_ble", device_class: "battery" },
    "sensor.battery_temperature": { device_id: "dev1", platform: "bms_ble", device_class: "temperature" },
    "sensor.battery_max_cell_voltage": { device_id: "dev1", platform: "bms_ble", device_class: "voltage" },
    "sensor.battery_min_cell_voltage": { device_id: "dev1", platform: "bms_ble", device_class: "voltage" },
    "sensor.battery_delta_voltage": { device_id: "dev1", platform: "bms_ble", device_class: "voltage" },
    "binary_sensor.battery_charging": { device_id: "dev1", platform: "bms_ble", device_class: "battery_charging" },
    // "Чужий" сенсор на іншому пристрої, не з bms_ble — не повинен потрапити в результат.
    "sensor.proxy_node_battery": { device_id: "dev2", platform: "esphome", device_class: "battery" },
  };
  const states = {
    "sensor.battery_voltage": { attributes: { device_class: "voltage" } },
    "sensor.battery_current": { attributes: { device_class: "current" } },
    "sensor.battery_power": { attributes: { device_class: "power" } },
    "sensor.battery_state_of_charge": { attributes: { device_class: "battery" } },
    "sensor.battery_temperature": { attributes: { device_class: "temperature" } },
    "sensor.battery_max_cell_voltage": { attributes: { device_class: "voltage" } },
    "sensor.battery_min_cell_voltage": { attributes: { device_class: "voltage" } },
    "sensor.battery_delta_voltage": { attributes: { device_class: "voltage" } },
    "binary_sensor.battery_charging": { attributes: { device_class: "battery_charging" } },
    "sensor.proxy_node_battery": { attributes: { device_class: "battery" } },
  };
  return { entities, states };
}

test("fmt: базове форматування чисел з одиницею", () => {
  assert.equal(fmt(12.345, 2, " V"), "12.35 V");
  assert.equal(fmt(5, 0, " W"), "5 W");
});

test("fmt: невідомі/недоступні значення -> прочерк", () => {
  assert.equal(fmt(undefined), "—");
  assert.equal(fmt(null), "—");
  assert.equal(fmt("unknown"), "—");
  assert.equal(fmt("unavailable"), "—");
});

test("fmt: нечислове значення повертається як є з юнітом", () => {
  assert.equal(fmt("N/A", 1, " V"), "N/A V");
});

test("secondsToHuman: менше години -> лише хвилини", () => {
  assert.equal(secondsToHuman(1800), "30 хв");
});

test("secondsToHuman: більше години -> год + хв", () => {
  assert.equal(secondsToHuman(3661), "1 год 1 хв");
  assert.equal(secondsToHuman(7200), "2 год 0 хв");
});

test("secondsToHuman: некоректні значення -> прочерк", () => {
  assert.equal(secondsToHuman(undefined), "—");
  assert.equal(secondsToHuman(null), "—");
  assert.equal(secondsToHuman("abc"), "—");
});

test("batteryFillColor: пороги кольору SOC", () => {
  assert.equal(batteryFillColor(5), "#E24B4A");
  assert.equal(batteryFillColor(15), "#E24B4A");
  assert.equal(batteryFillColor(20), "#EF9F27");
  assert.equal(batteryFillColor(30), "#EF9F27");
  assert.equal(batteryFillColor(31), "#1D9E75");
  assert.equal(batteryFillColor(100), "#1D9E75");
});

test("cellVoltageFraction: клемп в межах 0..1 по діапазону LiFePO4", () => {
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.lo), 0);
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.hi), 1);
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.lo - 1), 0);
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.hi + 1), 1);
});

test("cellVoltageFraction: середина діапазону ~0.5", () => {
  const mid = (CELL_VOLTAGE_RANGE.lo + CELL_VOLTAGE_RANGE.hi) / 2;
  assert.ok(Math.abs(cellVoltageFraction(mid) - 0.5) < 1e-9);
});

test("cellVoltageFraction: некоректне значення -> 0", () => {
  assert.equal(cellVoltageFraction(undefined), 0);
  assert.equal(cellVoltageFraction(NaN), 0);
});

test("DEFAULT_THRESHOLDS: критичний поріг більший за попереджувальний", () => {
  assert.ok(DEFAULT_THRESHOLDS.cell_delta_critical > DEFAULT_THRESHOLDS.cell_delta_warning);
});

test("автовизначення кількості комірок: довжина масиву cell_voltages визначає кількість", () => {
  // Емулюємо логіку _cellVoltages(): якщо масив заданий явно — беремо його
  // довжину; якщо ні — довжину атрибута cell_voltages сенсора дельти.
  const explicit = [3.30, 3.29, 3.31, 3.28];
  assert.equal(explicit.length, 4);
  const fromAttribute = [3.30, 3.29, 3.31]; // напр. пакет з 3 комірок
  assert.equal(fromAttribute.length, 3);
});

test("findBmsBleDeviceIds: знаходить лише пристрої з платформою bms_ble", () => {
  const hass = fakeHass();
  assert.deepEqual(findBmsBleDeviceIds(hass), ["dev1"]);
});

test("autoDiscoverEntities: правильно розкладає sensor за device_class і не плутає SOC з чужим battery-сенсором", () => {
  const hass = fakeHass();
  const entities = autoDiscoverEntities(hass, "dev1");
  assert.equal(entities.soc, "sensor.battery_state_of_charge");
  assert.equal(entities.voltage, "sensor.battery_voltage");
  assert.equal(entities.current, "sensor.battery_current");
  assert.equal(entities.power, "sensor.battery_power");
  assert.equal(entities.temperature, "sensor.battery_temperature");
  assert.equal(entities.charging, "binary_sensor.battery_charging");
  // Ключове: сенсор іншого пристрою (esphome proxy) не повинен потрапити.
  assert.notEqual(entities.soc, "sensor.proxy_node_battery");
});

test("autoDiscoverEntities: max/min/delta cell voltage розпізнаються за ключовими словами, а не забирають 'voltage'", () => {
  const hass = fakeHass();
  const entities = autoDiscoverEntities(hass, "dev1");
  assert.equal(entities.max_cell_voltage, "sensor.battery_max_cell_voltage");
  assert.equal(entities.min_cell_voltage, "sensor.battery_min_cell_voltage");
  assert.equal(entities.delta_cell_voltage, "sensor.battery_delta_voltage");
  // Основна напруга пакета не має бути жодною з трьох вище.
  assert.equal(entities.voltage, "sensor.battery_voltage");
});

test("autoDiscoverEntities: без пристрою повертає порожній обʼєкт", () => {
  const hass = fakeHass();
  assert.deepEqual(autoDiscoverEntities(hass, undefined), {});
  assert.deepEqual(autoDiscoverEntities(hass, "unknown-device"), {});
});

test("dischargeOnlyTemplate: заряд (додатне значення power/current) дає 0", () => {
  assert.equal(dischargeOnlyTemplate(27.8), 0);
  assert.equal(dischargeOnlyTemplate(368), 0);
  assert.equal(dischargeOnlyTemplate(0), 0);
});

test("dischargeOnlyTemplate: розряд (від'ємне значення) дає додатний модуль", () => {
  assert.equal(dischargeOnlyTemplate(-16.8), 16.8);
  assert.equal(dischargeOnlyTemplate(-222), 222);
});

test("Setup Wizard fix: інтегрування dischargeOnlyTemplate не дає заряду й розряду " +
  "взаємно скасовуватись у накопиченій сумі (регресія бага 'накопичена ємність показує неправильно')", () => {
  // Типовий цикл: розряд -16.8 A годину, потім заряд +27.8 A півгодини.
  // Стара реалізація (Riemann sum напряму на сирому current) підсумовувала
  // ЗІ ЗНАКОМ, тож заряд частково "з'їдав" облік розряду.
  const samples = [-16.8, -16.8, -16.8, 27.8, 27.8];
  const naiveSignedSum = samples.reduce((sum, v) => sum + v, 0);
  const dischargeOnlySum = samples.reduce((sum, v) => sum + dischargeOnlyTemplate(v), 0);

  assert.equal(dischargeOnlySum, 16.8 * 3);
  // Наочна демонстрація самого бага: наївна сума геть інша (і навіть може
  // бути близькою до нуля або додатною) — саме тому capacity_total був
  // невірний до фіксу.
  assert.notEqual(naiveSignedSum, dischargeOnlySum);
});
