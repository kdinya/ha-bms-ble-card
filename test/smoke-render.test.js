
const assert = require("assert");
const path = require("path");
const fs = require("fs");

// DOM stubs so the web-component file can load in Node
global.HTMLElement = class HTMLElement {
  constructor() { this._listeners = {}; }
  addEventListener() {}
  removeEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  setAttribute() {}
  getAttribute() { return null; }
  appendChild() {}
  removeChild() {}
  dispatchEvent() { return true; }
};
global.customElements = {
  define() {},
  get() { return undefined; },
};
global.window = global;
global.document = { createElement: () => new global.HTMLElement() };
global.console = console;

const file = path.join(__dirname, "..", "dist", "ha-bms-ble-card.js");
const mod = require(file);

assert.ok(mod.fmt, "fmt exported");
assert.ok(mod.secondsToHuman, "secondsToHuman exported");
assert.ok(mod.batteryFillColor, "batteryFillColor exported");
assert.ok(mod.estimateEtaSeconds, "estimateEtaSeconds exported");
assert.ok(mod.autoDiscoverEntities, "autoDiscoverEntities exported");
assert.ok(mod.HaBmsBleCardEditor, "HaBmsBleCardEditor exported");

assert.strictEqual(mod.fmt(13.24, 2, " V"), "13.24 V");
assert.ok(mod.secondsToHuman(45000).includes("год"));
assert.strictEqual(mod.batteryFillColor(81), "#1D9E75");
assert.strictEqual(mod.batteryFillColor(10), "#E24B4A");

const etaCharge = mod.estimateEtaSeconds({
  soc: 81, current: 16.8, designAh: 140, storedWh: 1786, packVoltage: 13.24, charging: true,
});
assert.ok(etaCharge > 0, "charge eta positive");

const etaDis = mod.estimateEtaSeconds({
  soc: 81, current: -16.8, designAh: 140, storedWh: 1786, packVoltage: 13.24, charging: false,
});
assert.ok(etaDis > 0, "discharge eta positive");

const deviceId = "dev1";
const mockHass = {
  entities: {
    "sensor.bat_soc": { platform: "bms_ble", device_id: deviceId, device_class: "battery" },
    "sensor.bat_voltage": { platform: "bms_ble", device_id: deviceId, device_class: "voltage" },
    "sensor.bat_current": { platform: "bms_ble", device_id: deviceId, device_class: "current" },
    "sensor.bat_power": { platform: "bms_ble", device_id: deviceId, device_class: "power" },
    "sensor.bat_temp": { platform: "bms_ble", device_id: deviceId, device_class: "temperature" },
    "sensor.bat_delta_cell_voltage": { platform: "bms_ble", device_id: deviceId },
    "sensor.bat_max_cell_voltage": { platform: "bms_ble", device_id: deviceId },
    "sensor.bat_min_cell_voltage": { platform: "bms_ble", device_id: deviceId },
    "sensor.bat_runtime": { platform: "bms_ble", device_id: deviceId },
    "binary_sensor.bat_charging": { platform: "bms_ble", device_id: deviceId, device_class: "battery_charging" },
    "binary_sensor.bat_chrg_mosfet": { platform: "bms_ble", device_id: deviceId },
    "binary_sensor.bat_dischrg_mosfet": { platform: "bms_ble", device_id: deviceId },
    "binary_sensor.bat_balancer": { platform: "bms_ble", device_id: deviceId },
    "binary_sensor.bat_problem": { platform: "bms_ble", device_id: deviceId, device_class: "problem" },
  },
  states: {
    "sensor.bat_soc": { state: "81", attributes: { device_class: "battery", friendly_name: "SOC" } },
    "sensor.bat_voltage": { state: "13.24", attributes: { device_class: "voltage" } },
    "sensor.bat_current": { state: "-16.8", attributes: { device_class: "current" } },
    "sensor.bat_power": { state: "-222", attributes: { device_class: "power" } },
    "sensor.bat_temp": { state: "26.9", attributes: { device_class: "temperature" } },
    "sensor.bat_delta_cell_voltage": { state: "0.014", attributes: { cell_voltages: [3.319, 3.310, 3.305, 3.319] } },
    "sensor.bat_max_cell_voltage": { state: "3.319", attributes: {} },
    "sensor.bat_min_cell_voltage": { state: "3.305", attributes: {} },
    "sensor.bat_runtime": { state: "45000", attributes: {} },
    "binary_sensor.bat_charging": { state: "on", attributes: { device_class: "battery_charging" } },
    "binary_sensor.bat_chrg_mosfet": { state: "on", attributes: {} },
    "binary_sensor.bat_dischrg_mosfet": { state: "on", attributes: {} },
    "binary_sensor.bat_balancer": { state: "on", attributes: {} },
    "binary_sensor.bat_problem": { state: "off", attributes: { device_class: "problem" } },
  },
  devices: { [deviceId]: { name: "Redodo 12V 140Ah" } },
};

const ids = mod.findBmsBleDeviceIds(mockHass);
assert.deepStrictEqual(ids, [deviceId]);

const discovered = mod.autoDiscoverEntities(mockHass, deviceId);
assert.ok(discovered.soc, "soc discovered");
assert.ok(discovered.voltage, "voltage discovered");
assert.ok(discovered.max_cell_voltage, "max cell discovered: " + JSON.stringify(discovered));
assert.ok(discovered.min_cell_voltage, "min cell discovered");
assert.ok(discovered.chrg_mosfet, "chrg mosfet: " + JSON.stringify(discovered));
assert.ok(discovered.dischrg_mosfet, "dischrg mosfet");

const src = fs.readFileSync(file, "utf8");
assert.ok(!/const cells[\s\S]{0,800}cells \+=/.test(src), "no const cells then cells +=");
assert.ok(!/const\s+(\w+)\s*=[\s\S]{0,400}\1\s*\+=/.test(src), "no const then +=");

// Instantiate card and call render with mock data
const Card = customElements.get && customElements.get("ha-bms-ble-card");
// Class is defined via customElements.define - grab from registry if we stored it
// Instead: evaluate render by creating element after define
const el = new (class extends global.HTMLElement {})();
// The define already ran - we need the class reference from module
// Not exported. Call full view via DOM after register:
// Re-require won't help. The two generic const-then-+= checks above already
// cover this invariant regardless of which method/variable name the render
// logic for the diagnostics section currently uses.

console.log("All smoke tests passed.");
console.log("Discovered:", Object.keys(discovered).sort().join(", "));

// --- Editor: назва поля НЕ повинна дублюватись у розмітці, коли доступний
// ha-entity-picker (він сам малює свій floating label; раніше поруч
// малювався ще й статичний .bms-field-label з тим самим текстом — саме
// це й давало видиме дублювання назви в налаштуваннях картки). ---
{
  const savedGet = global.customElements.get;
  global.customElements.get = (name) => (name === "ha-entity-picker" ? function HaEntityPickerStub() {} : undefined);

  const editor = Object.create(mod.HaBmsBleCardEditor.prototype);
  editor._config = { entities: {} };
  editor._hass = mockHass;

  const soc = mod.ENTITY_FIELD_GROUPS.flatMap((g) => g.fields).find(([key]) => key === "soc");
  assert.ok(soc, "soc field exists in ENTITY_FIELD_GROUPS");
  const [socKey, socLabel, socDomain] = soc;
  const fieldHtml = editor._renderEntityField(socKey, socLabel, socDomain);
  const occurrences = fieldHtml.split(socLabel).length - 1;
  assert.strictEqual(
    occurrences,
    0,
    `label "${socLabel}" must not be statically rendered when ha-entity-picker is available (it sets its own label) — got ${occurrences} occurrence(s) in: ${fieldHtml}`
  );
  assert.ok(fieldHtml.includes("<ha-entity-picker"), "picker element still rendered");

  // Явно не мають існувати як окремі конфігуровані поля — вони не є
  // окремими сутностями в BMS_BLE-HA (лише атрибути) або є legacy/дублем.
  const allKeys = mod.ENTITY_FIELD_GROUPS.flatMap((g) => g.fields).map(([key]) => key);
  for (const removed of ["balance_current", "cell_bitmask", "stored_energy"]) {
    assert.ok(!allKeys.includes(removed), `"${removed}" must be removed from ENTITY_FIELD_GROUPS`);
  }

  global.customElements.get = savedGet;
  console.log("Editor label-duplication regression test passed.");
}

// --- Editor: автопошук вимкнених за замовчуванням сутностей (Max/Min cell
// voltage, MOSFET заряду/розряду тощо) через повний реєстр
// (config/entity_registry/list), якого немає в полегшеному hass.entities. ---
(async () => {
  const editor = Object.create(mod.HaBmsBleCardEditor.prototype);
  editor._config = { entities: { device_id: "dev1" } };
  editor._mounted = false; // без реального DOM для рендеру
  editor._hass = {
    entities: {}, // полегшений реєстр — вимкнені сутності тут відсутні
    states: {},
    callWS: async (msg) => {
      assert.strictEqual(msg.type, "config/entity_registry/list");
      return [
        {
          entity_id: "sensor.batt_max_cell_voltage",
          device_id: "dev1",
          platform: "bms_ble",
          disabled_by: "integration",
          unique_id: "bms_ble-aa:bb:cc:dd:ee:ff-max_cell_voltage",
        },
      ];
    },
  };

  const before = editor._effectiveEntities();
  assert.ok(!before.max_cell_voltage, "до завершення запиту поле ще не заповнене");

  // Даємо мікрозадачам (.then у _ensureFullRegistryFetch) відпрацювати.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  const after = editor._effectiveEntities();
  assert.equal(after.max_cell_voltage, "sensor.batt_max_cell_voltage", "після завершення запиту поле підтягується з повного реєстру");

  console.log("Editor full-registry (disabled-by-default entities) discovery test passed.");
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

// --- Картка (не редактор): клікабельні значення (data-more-info) і
// підсвітка активного балансування комірок за bitmask з атрибута
// balancer.cells. Натхнення — jk-bms-card ("клік по сутності = історія"
// + підсвітка активних комірок замість анімації наосліп). ---
{
  const hassWithBalancing = {
    ...mockHass,
    states: {
      ...mockHass.states,
      "binary_sensor.bat_balancer": { state: "on", attributes: { cells: "1010" } },
    },
  };
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._hass = hassWithBalancing;
  card._config = { entities: {} };
  card._resolvedEntities = mod.autoDiscoverEntities(hassWithBalancing, deviceId);

  const html = card._renderFullView();

  assert.match(html, /data-more-info="sensor\.bat_voltage"/, "voltage stat-box clickable");
  assert.match(html, /data-more-info="sensor\.bat_soc"/, "battery-box (SOC) clickable");
  assert.match(html, /data-more-info="binary_sensor\.bat_balancer"/, "balancer func-box clickable");

  // bitmask "1010" (реверснутий рядок з binary_sensor.py) → активні комірки
  // з 0-based індексами 0 і 2, тобто C1 і C3.
  const c1Row = html.match(/<div class="cell-row[^"]*"[^>]*>\s*<div class="cell-name">C1<\/div>/);
  assert.ok(c1Row && c1Row[0].includes("balancing"), "C1 має клас balancing: " + (c1Row && c1Row[0]));
  const c2Row = html.match(/<div class="cell-row[^"]*"[^>]*>\s*<div class="cell-name">C2<\/div>/);
  assert.ok(c2Row && !c2Row[0].includes("balancing"), "C2 НЕ має класу balancing: " + (c2Row && c2Row[0]));
  const c3Row = html.match(/<div class="cell-row[^"]*"[^>]*>\s*<div class="cell-name">C3<\/div>/);
  assert.ok(c3Row && c3Row[0].includes("balancing"), "C3 має клас balancing: " + (c3Row && c3Row[0]));

  assert.match(html, /balance-badge/, "показано бейдж \"Балансування\", коли balancer активний");

  // Коли balancer вимкнений — жодна комірка не підсвічується, навіть якщо
  // застарілий bitmask ще лежить в атрибуті.
  const hassNoBalancing = {
    ...mockHass,
    states: {
      ...mockHass.states,
      "binary_sensor.bat_balancer": { state: "off", attributes: { cells: "1010" } },
    },
  };
  card._hass = hassNoBalancing;
  card._resolvedEntities = mod.autoDiscoverEntities(hassNoBalancing, deviceId);
  const htmlOff = card._renderFullView();
  assert.ok(!htmlOff.includes("balancing"), "без активного balancer підсвітки немає, навіть зі старим bitmask");
  assert.ok(!htmlOff.includes("balance-badge"), "без активного balancer бейджа немає");

  console.log("Card more-info + balancing-highlight regression test passed.");
}

// --- Editor: коли поле дійсно ВІДСУТНЄ (перевірили і hass.entities, і
// повний реєстр — статус "done", нічого не знайдено), для апаратно-
// залежних полів (MOSFET, Balancer, Heater, SOH, Design capacity)
// показуємо пояснення про можливу відсутність підтримки в конкретній
// BMS-платі, а не загальне "не знайдено автоматично". ---
{
  const editor = Object.create(mod.HaBmsBleCardEditor.prototype);
  editor._config = { entities: { device_id: "dev1" } };
  editor._mounted = false;
  editor._hass = { entities: {}, states: {} };
  // Симулюємо ВЖЕ завершений запит повного реєстру, який нічого не знайшов
  // (типова ситуація для батареї, чий драйвер не звітує MOSFET-статус).
  editor._fullRegistry = { deviceId: "dev1", status: "done", map: {} };

  const chrgHint = editor._renderEntityField("chrg_mosfet", "MOSFET заряду", "binary_sensor");
  assert.match(chrgHint, /не передає ці дані по BLE/, "апаратно-залежне поле пояснює можливу відсутність підтримки");
  assert.match(chrgHint, /JK BMS/, "згадка конкретного відомого прикладу (JK BMS) для довіри до пояснення");

  const dischrgHint = editor._renderEntityField("dischrg_mosfet", "MOSFET розряду", "binary_sensor");
  assert.match(dischrgHint, /не передає ці дані по BLE/);

  // Звичайне (не апаратно-залежне) поле в тій самій ситуації — просто
  // "не знайдено автоматично", без спекуляцій про причину.
  const voltageHint = editor._renderEntityField("voltage", "Напруга (V)", "sensor");
  assert.match(voltageHint, /не знайдено автоматично/);
  assert.ok(!voltageHint.includes("BLE"), "для звичайного поля не додаємо апаратне пояснення");

  console.log("Editor hardware-dependent-field hint regression test passed.");
}

// --- Картка: анімація потоку заряду/розряду на батареї (реально
// зазначена користувачем відсутня фіча — не плутати з підсвіткою
// балансування комірок вище, це окрема анімація на самій батареї). ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._config = { entities: {} };

  // 1) charging: on → статус "Заряджається" → клас bms-flow-charging.
  const hassCharging = {
    ...mockHass,
    states: { ...mockHass.states, "binary_sensor.bat_charging": { state: "on", attributes: {} } },
  };
  card._hass = hassCharging;
  card._resolvedEntities = mod.autoDiscoverEntities(hassCharging, deviceId);
  const htmlCharging = card._renderFullView();
  assert.match(htmlCharging, /battery-fill bms-flow-charging/, "заряд: клас анімації потоку на battery-fill");
  assert.match(htmlCharging, /battery-shell[^"]*bms-flow-charging/, "заряд: клас анімації світіння на battery-shell");
  assert.ok(!htmlCharging.includes("bms-flow-discharging"), "під час заряду немає класу розряду");

  // 2) charging: off, струм явно від'ємний → статус "Розряджається" → bms-flow-discharging.
  const hassDischarging = {
    ...mockHass,
    states: {
      ...mockHass.states,
      "binary_sensor.bat_charging": { state: "off", attributes: {} },
      "sensor.bat_current": { state: "-16.8", attributes: { device_class: "current" } },
    },
  };
  card._hass = hassDischarging;
  card._resolvedEntities = mod.autoDiscoverEntities(hassDischarging, deviceId);
  const htmlDischarging = card._renderFullView();
  assert.match(htmlDischarging, /battery-fill bms-flow-discharging/, "розряд: клас анімації потоку на battery-fill");
  assert.ok(!htmlDischarging.includes("bms-flow-charging"), "під час розряду немає класу заряду");

  // 3) простій (струм ~0, charging off) → жодної анімації.
  const hassIdle = {
    ...mockHass,
    states: {
      ...mockHass.states,
      "binary_sensor.bat_charging": { state: "off", attributes: {} },
      "sensor.bat_current": { state: "0.05", attributes: { device_class: "current" } },
    },
  };
  card._hass = hassIdle;
  card._resolvedEntities = mod.autoDiscoverEntities(hassIdle, deviceId);
  const htmlIdle = card._renderFullView();
  assert.ok(!htmlIdle.includes("bms-flow-charging") && !htmlIdle.includes("bms-flow-discharging"), "у простої анімації немає");

  // Те саме має працювати і в компактному (mini) вигляді картки.
  card._hass = hassCharging;
  card._resolvedEntities = mod.autoDiscoverEntities(hassCharging, deviceId);
  const miniCharging = card._renderMiniView();
  assert.match(miniCharging, /bms-flow-charging/, "заряд відображається і в mini-вигляді");

  console.log("Card charge/discharge flow-animation regression test passed.");
}
