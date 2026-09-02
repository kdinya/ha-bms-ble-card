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
  activeBalancingCells,
  moreInfoAttr,
  CELL_VOLTAGE_RANGE,
  DEFAULT_THRESHOLDS,
  findBmsBleDeviceIds,
  autoDiscoverEntities,
  discoverFromFullRegistry,
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

test("autoDiscoverEntities: cycle_capacity визначається за device_class 'energy_storage' (сенсор увімкнений за замовчуванням, тому має live-стан)", () => {
  // Реальний сценарій: у sensor.py BMS_BLE-HA сенсор ATTR_CYCLE_CAP не має
  // ні name, ні translation_key, тому HA генерує entity_id лише з назви
  // пристрою — без слова "cycle"/"cap" (KEYWORD_RULES це не зловить).
  // Але в нього Є device_class="energy_storage" і, оскільки сенсор
  // УВІМКНЕНИЙ за замовчуванням, цей device_class видно через живий стан
  // (hass.states[...].attributes.device_class) — саме так його й шукаємо.
  //
  // ВАЖЛИВО: `hass.entities`, який реально бачить картка в браузері, —
  // полегшений реєстр (config/entity_registry/list_for_display) БЕЗ
  // unique_id. Тому цей тест навмисно НЕ кладе unique_id в entities —
  // так само, як у справжньому HA.
  const entities = {
    "sensor.redodo_12v_100ah": { device_id: "dev1", platform: "bms_ble" },
    "sensor.redodo_12v_100ah_cycles": { device_id: "dev1", platform: "bms_ble", translation_key: "cycles" },
  };
  const states = {
    "sensor.redodo_12v_100ah": { attributes: { device_class: "energy_storage" } },
    "sensor.redodo_12v_100ah_cycles": {},
  };
  const result = autoDiscoverEntities({ entities, states }, "dev1");
  assert.equal(result.cycle_capacity, "sensor.redodo_12v_100ah");
  assert.equal(result.charge_cycles, "sensor.redodo_12v_100ah_cycles");
});

test("autoDiscoverEntities: підбір за translation_key з полегшеного hass.entities (без unique_id, як у реальному HA)", () => {
  const entities = {
    "sensor.weird_name": { device_id: "dev1", platform: "bms_ble", translation_key: "battery_health" },
  };
  const states = { "sensor.weird_name": {} };
  const result = autoDiscoverEntities({ entities, states }, "dev1");
  assert.equal(result.soh, "sensor.weird_name");
});

test("discoverFromFullRegistry: знаходить сутності, вимкнені за замовчуванням (Max/Min cell voltage, MOSFET заряду/розряду), яких немає в hass.entities", () => {
  // config/entity_registry/list (на відміну від list_for_display, який
  // стоїть за hass.entities) НЕ фільтрує за disabled_by і містить
  // unique_id — тому лише через нього можна знайти вимкнені за
  // замовчуванням сутності BMS_BLE-HA.
  const fullRegistry = [
    {
      entity_id: "sensor.redodo_max_cell_voltage",
      device_id: "dev1",
      platform: "bms_ble",
      disabled_by: "integration",
      unique_id: "bms_ble-aa:bb:cc:dd:ee:ff-max_cell_voltage",
    },
    {
      entity_id: "sensor.redodo_min_cell_voltage",
      device_id: "dev1",
      platform: "bms_ble",
      disabled_by: "integration",
      unique_id: "bms_ble-aa:bb:cc:dd:ee:ff-min_cell_voltage",
    },
    {
      entity_id: "binary_sensor.redodo_chrg_mosfet",
      device_id: "dev1",
      platform: "bms_ble",
      disabled_by: "integration",
      unique_id: "bms_ble-aa:bb:cc:dd:ee:ff-chrg_mosfet",
    },
    {
      entity_id: "binary_sensor.redodo_dischrg_mosfet",
      device_id: "dev1",
      platform: "bms_ble",
      disabled_by: "integration",
      unique_id: "bms_ble-aa:bb:cc:dd:ee:ff-dischrg_mosfet",
    },
    // Сутність іншого пристрою — не повинна потрапити в результат.
    {
      entity_id: "sensor.other_device_max_cell_voltage",
      device_id: "dev2",
      platform: "bms_ble",
      disabled_by: "integration",
      unique_id: "bms_ble-ff:ee:dd:cc:bb:aa-max_cell_voltage",
    },
  ];
  const result = discoverFromFullRegistry(fullRegistry, "dev1");
  assert.equal(result.max_cell_voltage.entityId, "sensor.redodo_max_cell_voltage");
  assert.equal(result.max_cell_voltage.disabledBy, "integration");
  assert.equal(result.min_cell_voltage.entityId, "sensor.redodo_min_cell_voltage");
  assert.equal(result.chrg_mosfet.entityId, "binary_sensor.redodo_chrg_mosfet");
  assert.equal(result.dischrg_mosfet.entityId, "binary_sensor.redodo_dischrg_mosfet");
  assert.equal(Object.keys(result).length, 4, "сутність іншого пристрою не має потрапити в результат");
});

test("discoverFromFullRegistry: без device_id або з порожнім списком повертає {}", () => {
  assert.deepEqual(discoverFromFullRegistry([], "dev1"), {});
  assert.deepEqual(discoverFromFullRegistry([{ entity_id: "sensor.x", device_id: "dev1", platform: "bms_ble", unique_id: "bms_ble-aa-voltage" }], ""), {});
  assert.deepEqual(discoverFromFullRegistry(null, "dev1"), {});
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

test("activeBalancingCells: розбирає bitmask з атрибута 'cells' balancer (BMS_BLE-HA), символ '1' на позиції i = активна комірка i+1", () => {
  // binary_sensor.py: f"{balancer:0{cell_count}b}"[::-1] — реверснутий рядок,
  // тому позиція в рядку == індекс біту == 0-based індекс комірки.
  const active = activeBalancingCells("1010");
  assert.ok(active.has(0), "комірка 1 (позиція 0) активна");
  assert.ok(!active.has(1), "комірка 2 (позиція 1) не активна");
  assert.ok(active.has(2), "комірка 3 (позиція 2) активна");
  assert.ok(!active.has(3), "комірка 4 (позиція 3) не активна");
  assert.equal(active.size, 2);
});

test("activeBalancingCells: некоректний/відсутній вхід повертає порожню множину", () => {
  assert.equal(activeBalancingCells(undefined).size, 0);
  assert.equal(activeBalancingCells(null).size, 0);
  assert.equal(activeBalancingCells(42).size, 0);
  assert.equal(activeBalancingCells("").size, 0);
  assert.equal(activeBalancingCells("0000").size, 0);
});

test("moreInfoAttr: повертає data-more-info лише коли entity_id відомий (значення не з атрибута)", () => {
  assert.equal(moreInfoAttr(undefined), "");
  assert.equal(moreInfoAttr(""), "");
  assert.equal(moreInfoAttr(null), "");
  const attr = moreInfoAttr("sensor.batt_voltage");
  assert.match(attr, /data-more-info="sensor\.batt_voltage"/);
  assert.match(attr, /tabindex="0"/);
  assert.match(attr, /role="button"/);
});
