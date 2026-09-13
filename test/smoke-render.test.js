
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

const file = path.join(__dirname, "..", "ha-bms-ble-card.js");
const mod = require(file);

assert.ok(mod.fmt, "fmt exported");
assert.ok(mod.secondsToHuman, "secondsToHuman exported");
assert.ok(mod.estimateEtaSeconds, "estimateEtaSeconds exported");
assert.ok(mod.autoDiscoverEntities, "autoDiscoverEntities exported");
assert.ok(mod.HaBmsBleCardEditor, "HaBmsBleCardEditor exported");

assert.strictEqual(mod.fmt(13.24, 2, " V"), "13.24 V");
assert.ok(mod.secondsToHuman(45000).includes("год"));

// fmtWh: менше 1 кВт·год -> Вт-години (без десяткових), інакше -> кВт-години (2 знаки)
assert.strictEqual(mod.fmtWh(350), "350 Wh");
assert.strictEqual(mod.fmtWh(999), "999 Wh");
assert.strictEqual(mod.fmtWh(1000), "1.00 kWh");
assert.strictEqual(mod.fmtWh(2543), "2.54 kWh");
console.log("fmtWh threshold (Wh below 1 kWh, kWh above) test passed.");

// statsPeriodRange("yesterday"): рівно попередня доба (00:00 вчора .. 00:00 сьогодні)
{
  const { start, end, groupBy } = mod.statsPeriodRange("yesterday");
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  assert.strictEqual(end.getTime(), todayMidnight.getTime(), "кінець періоду \"вчора\" = опівночі сьогодні");
  assert.strictEqual(todayMidnight.getTime() - start.getTime(), 24 * 3600 * 1000, "\"вчора\" триває рівно 24 години");
  assert.strictEqual(groupBy, "hour", "\"вчора\" групується погодинно");
  console.log("statsPeriodRange(\"yesterday\") regression test passed.");
}

// fetchLoadChargeSeconds: простій (|струм| <= порогу) не рахується ні в
// розряд, ні в заряд — саме те, що користувач вимагав явно ("!!!").
const _idleExclusionPromise = (async () => {
  const start = new Date("2026-09-10T00:00:00Z");
  const end = new Date("2026-09-10T04:00:00Z");
  const hass = {
    callWS: async () => ({
      "sensor.current": [
        { s: "-5.0", lu: Math.floor(new Date("2026-09-10T00:00:00Z").getTime() / 1000) }, // 1г розряд
        { s: "0.01", lu: Math.floor(new Date("2026-09-10T01:00:00Z").getTime() / 1000) }, // 1г простій (майже 0)
        { s: "3.0", lu: Math.floor(new Date("2026-09-10T02:00:00Z").getTime() / 1000) }, // 1г заряд
        { s: "0", lu: Math.floor(new Date("2026-09-10T03:00:00Z").getTime() / 1000) }, // 1г простій (точний 0)
      ],
    }),
  };
  const res = await mod.fetchLoadChargeSeconds(hass, "sensor.current", start, end);
  assert.ok(Math.abs(res.dischargeSeconds - 3600) < 1, `розряд має бути рівно 1г (3600с), отримали ${res.dischargeSeconds}`);
  assert.ok(Math.abs(res.chargeSeconds - 3600) < 1, `заряд має бути рівно 1г (3600с), отримали ${res.chargeSeconds}`);
  // Разом розряд+заряд = 2г з 4г діапазону — решта 2г простою свідомо не порахована ні туди, ні сюди.
  assert.ok(res.dischargeSeconds + res.chargeSeconds < 4 * 3600 - 1, "простій (2 год) не порахований ні в розряд, ні в заряд");
  console.log("fetchLoadChargeSeconds idle-exclusion (\"в режимі простою нічого не рахуємо\") test passed.");
})();
_idleExclusionPromise.catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

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
  // Батарея в повному (flow) вигляді тепер — скляна SVG-банка (glass jar),
  // а не CSS battery-fill; анімація потоку живе на з'єднувальних стрілках
  // (обидва з'єднувачі — Мережа->Батарея і Батарея->Навантаження —
  // прості анімовані стрілки flowArrowSvg).
  assert.match(htmlCharging, /class="battery-svg jar-battery"/, "повний вигляд: фотореалістична банка-батарея присутня");
  assert.match(htmlCharging, /flow-arrow-path flow-arrow-active[\s\S]{0,200}stroke="#1D9E75"/, "заряд: активна (зелена) стрілка до батареї");

  // 2) charging: off, струм явно від'ємний → статус "Розряджається".
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
  assert.match(htmlDischarging, /flow-arrow-path flow-arrow-active[\s\S]{0,200}stroke="#EF9F27"/, "розряд: активна (бурштинова) стрілка від батареї");

  // 3) простій (струм ~0, charging off) → жодна стрілка не анімована.
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
  assert.ok(!htmlIdle.includes("flow-arrow-active"), "у простої анімація стрілок відсутня");

  // Те саме має працювати і в компактному (mini) вигляді картки — той самий
  // jarBatterySvg(), що й повний вигляд (стару окрему CSS-батарею для mini
  // прибрано повністю, нічого від неї не лишилось).
  card._hass = hassCharging;
  card._resolvedEntities = mod.autoDiscoverEntities(hassCharging, deviceId);
  const miniCharging = card._renderMiniView();
  assert.match(miniCharging, /class="battery-svg jar-battery"/, "mini-вигляд використовує ту саму фотореалістичну банку, що й повний");
  assert.match(miniCharging, /charge-badge[^>]*>Заряджається/, "статус заряду видно поруч із банкою в mini-вигляді");

  console.log("Card charge/discharge flow-animation regression test passed.");
}

// --- Картка: flow-діаграма заряд/розряд (іконка -- пунктирна лінія --
// НАША БАТАРЕЯ замість кола -- пунктирна лінія -- іконка), і повне
// видалення блоків "Використано ємності" та "Час роботи до розряду
// (прогноз)", як просив користувач. ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._config = { entities: {} };

  const hassCharging = {
    ...mockHass,
    states: { ...mockHass.states, "binary_sensor.bat_charging": { state: "on", attributes: {} } },
  };
  card._hass = hassCharging;
  card._resolvedEntities = mod.autoDiscoverEntities(hassCharging, deviceId);
  const htmlCharging = card._renderFullView();

  assert.match(htmlCharging, /class="flow-row"/, "flow-row присутній");
  // Вузли джерела/споживача тепер підписані як "МЕРЕЖА"/"НАВАНТАЖЕННЯ"
  // (точна копія референсного прев'ю), а не Заряд/Розряд з іконкою-колом.
  assert.match(htmlCharging, /class="node-lbl">МЕРЕЖА</, "лівий вузол підписаний МЕРЕЖА");
  assert.match(htmlCharging, /class="node-lbl">НАВАНТАЖЕННЯ</, "правий вузол підписаний НАВАНТАЖЕННЯ");
  // Обидва з'єднувачі (Мережа→Батарея і Батарея→Навантаження) — прості
  // анімовані стрілки (flowArrowSvg).
  const arrowMatches = [...htmlCharging.matchAll(/<svg class="flow-arrow (flow-arrow-h|flow-arrow-v)"[\s\S]*?<\/svg>/g)];
  assert.equal(arrowMatches.length, 4, "по 2 SVG (h+v) на кожен з двох конекторів = 4 всього");
  const activeArrows = arrowMatches.filter((m) => m[0].includes("flow-arrow-active"));
  assert.equal(activeArrows.length, 2, "активні (заряд) — рівно h+v пара одного конектора");
  assert.ok(activeArrows.every((m) => m[0].includes('stroke="#1D9E75"')), "активна (зелена) стрілка заряду");
  // Батарея тепер саме в flow-row (клас flow-battery), і це скляна SVG-банка.
  assert.match(htmlCharging, /<div class="flow-battery"[^>]*>[\s\S]{0,80}<div class="battery-svg jar-battery">/, "батарея (фото-банка) відрендерена всередині flow-battery");
  assert.ok(!htmlCharging.includes('class="battery-box"'), "старого окремого battery-box більше немає");

  // Нижня навігація: Головна/Інформація/Статистика/Налаштування — реальні
  // перемикачі вмісту картки.
  assert.match(htmlCharging, /class="nav-bar"/, "нижня навігація присутня");
  ["home", "info", "stats", "settings"].forEach((tab) => {
    assert.ok(htmlCharging.includes(`data-tab="${tab}"`), `вкладка ${tab} присутня в nav-bar`);
    assert.ok(htmlCharging.includes(`data-pane="${tab}"`), `панель контенту ${tab} присутня`);
  });
  assert.match(htmlCharging, /nav-item active" data-tab="home"/, "за замовчуванням активна вкладка Головна");
  // Порядок вкладок у нав-барі саме такий: Головна, Інформація, Статистика,
  // Налаштування (а не якийсь інший).
  const navBarSection = htmlCharging.slice(htmlCharging.indexOf('class="nav-bar"'));
  const navBarOrder = [...navBarSection.matchAll(/data-tab="(home|info|stats|settings)"/g)].map((m) => m[1]);
  assert.deepStrictEqual(navBarOrder, ["home", "info", "stats", "settings"], "порядок вкладок: Головна, Інформація, Статистика, Налаштування");

  // Вкладка "Інформація" розбита на 3 акордеон-секції: Комірки (відкрита
  // за замовчуванням), Всі показники і Функції (обидві згорнуті).
  const infoAccordionSections = [...htmlCharging.matchAll(/<details class="info-accordion-section" data-section="(\w+)"( open)?>\s*<summary class="info-accordion-title">([^<]*)<\/summary>/g)];
  assert.strictEqual(infoAccordionSections.length, 3, "рівно 3 акордеон-секції у вкладці Інформація");
  assert.strictEqual(infoAccordionSections[0][1], "cells", "перша секція має data-section=cells");
  assert.ok(infoAccordionSections[0][2] === " open", "секція Комірки відкрита за замовчуванням");
  assert.strictEqual(infoAccordionSections[0][3], "Комірки", "перша секція — Комірки");
  assert.strictEqual(infoAccordionSections[1][1], "indicators", "друга секція має data-section=indicators");
  assert.ok(!infoAccordionSections[1][2], "секція Всі показники згорнута за замовчуванням");
  assert.strictEqual(infoAccordionSections[1][3], "Всі показники", "друга секція — Всі показники");
  assert.strictEqual(infoAccordionSections[2][1], "functions", "третя секція має data-section=functions");
  assert.ok(!infoAccordionSections[2][2], "секція Функції згорнута за замовчуванням");
  assert.strictEqual(infoAccordionSections[2][3], "Функції", "третя секція — Функції");

  // Заголовок "Історія" не повинен висіти сиротою, коли capacity_daily
  // не налаштований (_renderHistoryBars() у такому разі повертає "").
  assert.ok(!htmlCharging.includes(">Історія<"), "немає порожнього заголовка 'Історія' без даних");

  // Видалені за проханням користувача блоки не повинні з'являтися взагалі.
  assert.ok(!htmlCharging.includes("Використано ємності"), "блок 'Використано ємності' видалено");
  assert.ok(!htmlCharging.includes("Час роботи до розряду"), "блок 'Час роботи до розряду (прогноз)' видалено");
  assert.ok(!htmlCharging.includes("usage-grid"), "розмітка usage-grid видалена");
  assert.ok(!htmlCharging.includes("forecast-row"), "розмітка forecast-row видалена");

  console.log("Card flow-diagram + removed-sections regression test passed.");
}

// --- Картка: перемикання мови інтерфейсу (uk/en) на вкладці
// "Налаштування" — перевіряємо, що this._lang миттєво змінює переклад
// видимих підписів у _renderFullView() (без потреби перезавантажувати
// сторінку), а внутрішня логіка (chargeFlowState тощо) не залежить
// від мови. ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._config = { entities: {} };
  card._hass = mockHass;
  card._resolvedEntities = mod.autoDiscoverEntities(mockHass, deviceId);

  card._lang = "uk";
  const htmlUk = card._renderFullView();
  assert.match(htmlUk, /<span>ГОЛОВНА<\/span>/, "uk: пункт навігації Головна");
  assert.match(htmlUk, /<span>ІНФОРМАЦІЯ<\/span>/, "uk: пункт навігації Інформація");
  assert.match(htmlUk, /<span>НАЛАШТ\.<\/span>/, "uk: пункт навігації Налаштування");
  assert.match(htmlUk, /class="node-lbl">МЕРЕЖА</, "uk: підпис вузла МЕРЕЖА");
  assert.match(htmlUk, /lang-btn active" data-lang="uk"/, "uk: кнопка мови 'Українська' активна");

  card._lang = "en";
  const htmlEn = card._renderFullView();
  assert.match(htmlEn, /<span>HOME<\/span>/, "en: пункт навігації HOME");
  assert.match(htmlEn, /<span>INFO<\/span>/, "en: пункт навігації INFO");
  assert.match(htmlEn, /<span>SETTINGS<\/span>/, "en: пункт навігації SETTINGS");
  assert.match(htmlEn, /class="node-lbl">GRID</, "en: підпис вузла GRID");
  assert.match(htmlEn, /lang-btn active" data-lang="en"/, "en: кнопка мови 'English' активна");
  assert.ok(!htmlEn.includes("МЕРЕЖА"), "en: україномовний текст не лишається на екрані");

  console.log("Card language switch (uk/en) regression test passed.");
}

// --- Банка-батарея: перевірка 0% SOC та наявності оригінального дизайну photo-jar ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._config = { entities: {} };
  card._uid = "test-uid";

  // При 0% SOC: рідина відсутня (нема жодного <path fill=color>), просто
  // порожня банка з фото; відображається число 0.
  const html0 = mod.jarBatterySvg("test-0", 0);
  assert.ok(html0.includes('class="jar-battery-img"'), "WebP фото банки присутнє");
  assert.ok(!html0.includes('fill="#20df14"') && !html0.includes('fill="#ff9d12"') && !html0.includes('fill="#ff2419"'), "жодного кольору рідини при 0%");
  assert.match(html0, />0<\/tspan>/, "число 0 відображається");

  // При 50% SOC: рідина присутня відповідного зеленого кольору (#20df14), а не помаранчевого/червоного
  const html50 = mod.jarBatterySvg("test-50", 50);
  assert.ok(html50.includes('fill="#20df14"'), "при 50% колір рідини зелений (#20df14)");
  assert.match(html50, />50<\/tspan>/, "число 50 відображається");

  // При 15% SOC: колір рідини червоний (#ff2419), і ніякого зеленого чи помаранчевого
  const html15 = mod.jarBatterySvg("test-15", 15);
  assert.ok(html15.includes('fill="#ff2419"'), "при 15% колір рідини червоний (#ff2419)");
  assert.ok(!html15.includes('fill="#20df14"') && !html15.includes('fill="#ff9d12"'), "жодних зелених/помаранчевих слідів на червоній батареї");

  console.log("Jar battery 0%/15%/50% regression test passed.");
}

// --- Банка-батарея та mini-віджет: SOC недоступний (null) -> "N/A", а не "0%" ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._config = { entities: {} };
  card._uid = "test-uid";

  const htmlNull = mod.jarBatterySvg("test-na", null);
  assert.match(htmlNull, />N\/A<\/tspan>/, "SOC null -> текст N/A замість 0%");
  assert.ok(!htmlNull.includes(">0</tspan>"), "SOC null не повинен рендеритись як число 0");
  assert.ok(
    !htmlNull.includes('fill="#20df14"') && !htmlNull.includes('fill="#ff9d12"') && !htmlNull.includes('fill="#ff2419"'),
    "SOC null -> жодної рідини (банка порожня)"
  );

  // normalizeSoc(unknown/unavailable) -> null -> той самий N/A-рендер
  assert.equal(mod.normalizeSoc("unknown"), null);
  assert.equal(mod.normalizeSoc("unavailable"), null);
  assert.equal(mod.normalizeSoc(0), 0, "0% — валідний заряд, не null");

  const htmlZero = mod.jarBatterySvg("test-zero", mod.normalizeSoc(0));
  assert.match(htmlZero, />0<\/tspan>/, "нормалізований 0 і далі рендериться як '0', не як N/A");

  console.log("Jar battery N/A (SOC unavailable) regression test passed.");
}

// --- Регресія: бейджі Макс/Мін/Різниця в секції "Комірки" (Інформація)
// раніше не мали ЖОДНОГО CSS і склеювали "V" з міткою комірки без
// пробілу ("3.245 VC4"). Перевіряємо: (1) значення й мітка розділені
// окремими <span>/<b> вузлами (не голий текст впритул); (2) .badge
// styling присутній (кольорові чіпи, а не голий текст). ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._hass = { states: {} };
  card._resolvedEntities = {};
  card._config = { entities: {} };
  card._lang = "uk";
  card._cellStats = () => ({
    cells: [3.212, 3.230, 3.198],
    min: 3.198, max: 3.245, minIdx: 1, maxIdx: 0, delta: 0.047,
  });
  card._cellVoltageEntityIds = () => ["sensor.c1", "sensor.c2", "sensor.c3"];

  const html = card._renderFullView();
  assert.match(html, /<span>Макс 3\.245 V<\/span><b>C1<\/b>/, "Макс: значення й мітка комірки в окремих вузлах, без склеювання");
  assert.match(html, /<span>Мін 3\.198 V<\/span><b>C2<\/b>/, "Мін: значення й мітка комірки в окремих вузлах");
  assert.match(html, /<span>Δ 0\.047 V<\/span><b>Різниця<\/b>/, "Різниця: значення й підпис в окремих вузлах");
  assert.ok(!/V<b>/.test(html), "\"V\" більше ніколи не приклеєна впритул до <b> (немає пробілу)");
  const style = card._styles();
  assert.match(style, /\.badges-row\s*{/, "для рядка бейджів є CSS (раніше не було жодного)");
  assert.match(style, /\.badge\s*{/, "для самих бейджів є CSS (раніше не було жодного)");

  console.log("Cell max/min/diff badges spacing+styling regression test passed.");
}

// --- Вкладка "Статистика": спільний вибір періоду (Сьогодні/Тиждень/
// Місяць/Рік/Довільний) над Розрядом і Зарядом, одне число (сума за
// період) + крива за один WS-запит (тут мокнуто через _statsData, бо
// сам WS-виклик — асинхронний і живе в _maybeFetchStatsPeriod). Заряд
// лишається "поки не налаштовано", бо своїх сенсорів у схемі ще нема. ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._hass = {
    states: {
      "sensor.cap_total": { state: "15230" },
      "sensor.current": { state: "-4.2" },
    },
  };
  card._resolvedEntities = {
    capacity_total: "sensor.cap_total",
    current: "sensor.current",
  };
  card._lang = "uk";
  card._statsPeriod = "today";
  card._statsData = {
    loading: false, error: false, period: "today", groupBy: "hour",
    duration: { dischargeSeconds: 3.5 * 3600, chargeSeconds: 0 },
    durationAllTime: { dischargeSeconds: 128 * 3600, chargeSeconds: 96 * 3600 },
    discharge: { sum: 42.5, points: [{ t: new Date().toISOString(), v: 42.5 }] },
    charge: { sum: 0, points: [] },
    avgVoltage: 52,
    whDischarge: 42.5 * 52,
    whCharge: undefined,
  };

  const html = card._renderStatsPane();
  assert.match(html, /data-stats-section="discharge"( open)?>/, "секція Розряд присутня");
  assert.match(html, /data-stats-section="charge">/, "секція Заряд присутня (згорнута за замовчуванням)");
  // Порядок: Розряд перед Заряд.
  assert.ok(html.indexOf('data-stats-section="discharge"') < html.indexOf('data-stats-section="charge"'), "Розряд йде перед Заряд");
  assert.match(html, /class="stats-period-btn active" data-period="today"/, "кнопка періоду \"Сьогодні\" активна за замовчуванням");
  assert.match(html, /42\.5<\/span><span class="p">Ah/, "сума Ah за обраний період показує реальне значення");
  assert.match(html, /class="usage-grid stats-summary-grid"/, "використано .usage-grid для підсумкових карток статистики");
  assert.match(html, /stats_wh_approx|≈ енергія/, "показано наближену оцінку Вт-годин (Ah × середня напруга)");
  assert.match(html, /3 год 30 хв/, "час під навантаженням за обраний період показано (3.5 год)");
  assert.match(html, /128 год/, "час під навантаженням за весь час показано");
  assert.match(html, /За весь час/, "підпис \"за весь час\" присутній для часу під навантаженням");
  assert.match(html, /Статистика заряду поки не налаштована/, "у Заряді — чесна підказка про відсутність сенсорів, без вигаданих цифр");
  assert.ok(!/Заряд[\s\S]{0,300}fill="#20df14"/.test(html), "жодних вигаданих значень у секції Заряд");

  // Без жодних сенсорів (нічого не налаштовано) — Розряд показує "Немає даних", без падінь.
  const cardEmpty = Object.create(mod.HaBmsBleCard.prototype);
  cardEmpty._hass = { states: {} };
  cardEmpty._resolvedEntities = {};
  cardEmpty._lang = "uk";
  const htmlEmpty = cardEmpty._renderStatsPane();
  assert.match(htmlEmpty, /Немає даних/, "без сенсорів Розряд показує graceful-фолбек, а не помилку");

  // Поки дані ще не прийшли (немає _statsData) — акуратний "завантаження", без падінь.
  const cardLoading = Object.create(mod.HaBmsBleCard.prototype);
  cardLoading._hass = { states: { "sensor.cap_total": { state: "15230" } } };
  cardLoading._resolvedEntities = { capacity_total: "sensor.cap_total" };
  cardLoading._lang = "uk";
  const htmlLoading = cardLoading._renderStatsPane();
  assert.match(htmlLoading, /Завантаження статистики/, "поки WS-запит ще не відповів — показуємо \"завантаження\", а не порожньо/помилку");

  // recorder/statistics_during_period недоступний для цього сенсора — чесна підказка, без падіння.
  const cardErr = Object.create(mod.HaBmsBleCard.prototype);
  cardErr._hass = { states: { "sensor.cap_total": { state: "15230" } } };
  cardErr._resolvedEntities = { capacity_total: "sensor.cap_total" };
  cardErr._lang = "uk";
  cardErr._statsPeriod = "today";
  cardErr._statsData = { loading: false, error: true, period: "today", groupBy: "hour" };
  const htmlErr = cardErr._renderStatsPane();
  assert.match(htmlErr, /потрібна довготривала статистика/, "немає long-term statistics — чесна підказка замість поламаної картки");

  console.log("Statistics tab (period selector + discharge/charge sections) regression test passed.");
}

// --- Регресія: recorder/statistics_during_period без явного "types" міг
// не повертати "change", і код падав на "сирий" стан (весь накопичений
// Ah за все життя лічильника) як ніби це дельта за одну годину/день —
// звідси нереальні цифри. Перевіряємо: (1) types запитується явно;
// (2) при відсутньому change коректно береться дельта сусідніх sum, а не
// сирий state; (3) сирий state НІКОЛИ не потрапляє в суму як є.
// (Промис, а не top-level await — файл лишається звичайним CommonJS.) ---
const _statsWsRegressionPromise = (async () => {
  const card = Object.create(mod.HaBmsBleCard.prototype);
  let capturedRequest = null;
  card._hass = {
    states: { "sensor.cap_total": { state: "15230.4" } },
    callWS: async (req) => {
      capturedRequest = req;
      // recorder навмисно НЕ повертає "change" (як буває без явного types) —
      // лише сирий накопичений "state"/"sum". Дельта має братись із sum.
      return {
        "sensor.cap_total": [
          { start: "2026-09-08T00:00:00Z", sum: 15100.0, state: 15100.0 },
          { start: "2026-09-09T00:00:00Z", sum: 15115.0, state: 15115.0 },
          { start: "2026-09-10T00:00:00Z", sum: 15130.4, state: 15130.4 },
        ],
      };
    },
  };
  card._resolvedEntities = { capacity_total: "sensor.cap_total" };
  card._render = () => {};
  card._statsPeriod = "week";
  await card._maybeFetchStatsPeriod();

  assert.ok(Array.isArray(capturedRequest.types) && capturedRequest.types.includes("change") && capturedRequest.types.includes("sum"),
    "явно запитуємо types (change/sum), щоб recorder гарантовано повернув дельту, а не тільки сирий стан");

  const d = card._statsData.discharge;
  assert.ok(d.sum < 100, `сума за тиждень має бути реалістичною дельтою (~30 Ah), а не сирим станом 15230: отримали ${d.sum}`);
  // Перший бакет: попередній sum невідомий (до початку діапазону) → 0, а не сирий state.
  assert.strictEqual(d.points[0].v, 0, "для першого бакету без опорного sum беремо 0, а не сирий state 15100");
  assert.ok(Math.abs(d.points[1].v - 15.0) < 0.01, "друга точка = дельта sum (15115.0-15100.0=15.0), не сирий стан");
  assert.ok(Math.abs(d.points[2].v - 15.4) < 0.01, "третя точка = дельта sum (15130.4-15115.0=15.4), не сирий стан");

  console.log("Statistics WS query regression (change/sum, never raw state, as bucket delta) test passed.");
})();
_statsWsRegressionPromise.catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


// --- Вибір періоду статистики (stats-period-bar) має лишитись ТІЛЬКИ
// у вкладці "Статистика" — у вкладці "Інформація" його немає взагалі.
// Графіків більше немає в жодній вкладці (прибрані за проханням
// користувача — "зараз вони відображаються фігово"). ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._config = { entities: {} };
  card._hass = { ...mockHass, states: { ...mockHass.states, "sensor.cap_total": { state: "3.5" } } };
  card._resolvedEntities = { ...mod.autoDiscoverEntities(mockHass, deviceId), capacity_total: "sensor.cap_total" };
  card._lang = "uk";
  card._statsPeriod = "today";
  card._statsData = {
    loading: false, error: false, period: "today", groupBy: "hour",
    discharge: { sum: 3.5, points: [] },
    charge: { sum: 0, points: [] },
  };

  const html = card._renderFullView();
  const infoPane = html.match(/data-pane="info">([\s\S]*?)<div class="bms-tab-pane[^>]*data-pane="stats"/);
  const statsPane = html.match(/data-pane="stats">([\s\S]*?)<div class="bms-tab-pane[^>]*data-pane="settings"/);
  assert.ok(infoPane, "панель Інформація знайдена");
  assert.ok(statsPane, "панель Статистика знайдена");
  assert.ok(!infoPane[1].includes("stats-period-bar"), "у вкладці Інформація немає вибору періоду статистики");
  assert.ok(statsPane[1].includes("stats-period-bar"), "у вкладці Статистика є спільний вибір періоду");
  assert.ok(!html.includes("stats-curve"), "графіка (кривої) більше немає ніде в картці");
  assert.ok(statsPane[1].includes('data-period="yesterday"'), "серед кнопок періоду є \"Вчора\"");

  console.log("Period selector stays in Statistics tab only, charts removed — regression test passed.");

}

