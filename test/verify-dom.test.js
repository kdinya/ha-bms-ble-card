const assert = require("assert");
const path = require("path");

// Mock minimal environment
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
global.customElements = { define() {}, get() {} };
global.window = global;
global.document = { createElement: () => new global.HTMLElement() };
global.console = console;

const cardPath = path.join(__dirname, "..", "ha-bms-ble-card.js");
const mod = require(cardPath);

console.log("Running DOM verification tests...");

// --- 1. Verify Manual 30-Day Stats Button Lifecycle ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._uid = "test-uid";
  card._lang = "uk";
  card._t = (k) => mod.I18N.uk[k] || k;
  card._e = (k) => (k === "current" ? "sensor.current" : null);
  card._statsPeriod = "today";
  card._statsSections = { discharge: true, charge: false };
  card._statsData = { period: "today", discharge: { sum: 10 } };
  card._statsAllTimeDuration = undefined;
  card._statsAllTimeDurationInFlight = false;

  const html = card._renderStatsPeriodSection("discharge");
  assert.ok(html.includes("bms-btn-calc-30d"), "Кнопка .bms-btn-calc-30d має бути в розмірці");
  assert.ok(html.includes(mod.I18N.uk.stats_calc_30d), "Кнопка має текст 'Розрахувати за 30 днів'");

  // In-flight state
  card._statsAllTimeDurationInFlight = true;
  const inFlightHtml = card._renderStatsPeriodSection("discharge");
  assert.ok(inFlightHtml.includes("disabled"), "Під час запиту кнопка має бути disabled");
  assert.ok(inFlightHtml.includes(mod.I18N.uk.stats_calculating), "Під час запиту кнопка показує 'Розрахунок...'");

  // Error state
  card._statsAllTimeDurationInFlight = false;
  card._statsAllTimeDurationError = true;
  const errorHtml = card._renderStatsPeriodSection("discharge");
  assert.ok(errorHtml.includes(mod.I18N.uk.stats_calc_error), "Помилка розрахунку відображається користувачеві");

  console.log("  ✓ Manual 30-day stats button lifecycle test passed");
}

// --- 2. Verify Fast Patch in Widget Mini View ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._uid = "test-uid";
  card._lang = "en";
  card._t = (k) => mod.I18N.en[k] || k;
  card._e = (k) => `sensor.${k}`;
  card._batteryName = () => "Test BMS";
  card._statusInfo = () => ({ label: "Idle", icon: "ti-battery", color: "neutral" });
  card._hass = {
    states: {
      "sensor.soc": { state: "85", attributes: {} },
      "sensor.voltage": { state: "13.32", attributes: {} },
      "sensor.current": { state: "0.0", attributes: {} },
      "sensor.power": { state: "0", attributes: {} },
      "sensor.temperature": { state: "22.5", attributes: {} },
    }
  };

  const miniHtml = card._renderMiniView();
  assert.ok(miniHtml.includes('class="bms-mini"'), "Рендериться контейнер .bms-mini");
  assert.ok(miniHtml.includes('data-metric-key="voltage"'), "voltage має data-metric-key");
  assert.ok(miniHtml.includes('data-metric-key="current"'), "current має data-metric-key");
  assert.ok(miniHtml.includes('data-metric-key="power"'), "power має data-metric-key");
  assert.ok(miniHtml.includes('data-metric-key="temperature"'), "temperature має data-metric-key");

  // _canFastPatch() check
  card.querySelector = (sel) => {
    if (sel === ".bms-card") return new global.HTMLElement();
    if (sel === ".bms-mini") return new global.HTMLElement();
    return null;
  };
  assert.strictEqual(card._canFastPatch(), true, "_canFastPatch() повертає true для .bms-mini");

  console.log("  ✓ Widget mini view DOM structure & fast-patch compatibility passed");
}

// --- 3. Verify Fast Patch in Home Full View (Metrics & Cells) ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._uid = "test-uid";
  card._lang = "uk";
  card._t = (k) => mod.I18N.uk[k] || k;
  card._e = (k) => `sensor.${k}`;
  card._batteryName = () => "Test BMS";
  card._statusInfo = () => ({ label: "Розряджання", icon: "ti-battery", color: "warning" });
  card._currentStatus = () => ({ label: "Розряджання", icon: "ti-battery", color: "warning" });
  card._statusColorVars = () => ({ bg: "#fff", fg: "#000" });
  card._balancingActive = () => false;
  card._cellsStats = () => ({
    min: 3.25, max: 3.35, delta: 0.1, minIdx: 0, maxIdx: 3,
    cells: [3.25, 3.30, 3.32, 3.35]
  });
  card._etaInfo = () => ({ seconds: 3600 });
  card._hass = {
    states: {
      "sensor.soc": { state: "50", attributes: {} },
      "sensor.voltage": { state: "13.2", attributes: {} },
      "sensor.current": { state: "-10.0", attributes: {} },
      "sensor.power": { state: "-132", attributes: {} },
      "sensor.temperature": { state: "25.0", attributes: {} },
      "sensor.soh": { state: "99", attributes: {} },
      "sensor.charge_cycles": { state: "42", attributes: {} },
      "sensor.delta_cell_voltage": { state: "0.1", attributes: { cell_voltages: [3.25, 3.30, 3.32, 3.35] } },
    }
  };

  const fullHtml = card._renderFullView();
  // Cell rows must have data-cell-idx
  assert.ok(fullHtml.includes('data-cell-idx="0"'), "Комірки мають data-cell-idx='0'");
  assert.ok(fullHtml.includes('data-cell-idx="3"'), "Комірки мають data-cell-idx='3'");

  // Badges row
  assert.ok(fullHtml.includes('class="badges-row"'), "badges-row присутній");

  // Metric cards must have data-metric-key
  assert.ok(fullHtml.includes('data-metric-key="voltage"'), "voltage metric-card має data-metric-key");
  assert.ok(fullHtml.includes('data-metric-key="current"'), "current metric-card має data-metric-key");
  assert.ok(fullHtml.includes('data-metric-key="power"'), "power metric-card має data-metric-key");
  assert.ok(fullHtml.includes('data-metric-key="temperature"'), "temperature metric-card має data-metric-key");
  assert.ok(fullHtml.includes('data-metric-key="soh"'), "soh metric-card має data-metric-key");
  assert.ok(fullHtml.includes('data-metric-key="cycles"'), "cycles metric-card має data-metric-key");

  console.log("  ✓ Home full view data-cell-idx & data-metric-key presence passed");
}

// --- 4. Generic i18n Crawler: Zero Cyrillic in English mode ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._uid = "test-uid";
  card._lang = "en";
  card._t = (k) => mod.I18N.en[k] || k;
  card._e = (k) => `sensor.${k}`;
  card._batteryName = () => "Test BMS";
  card._statusInfo = () => ({ label: "Discharging", icon: "ti-battery", color: "warning" });
  card._hass = {
    states: {
      "sensor.soc": { state: "80", attributes: {} },
      "sensor.voltage": { state: "13.2", attributes: {} },
      "sensor.current": { state: "-5.0", attributes: {} },
      "sensor.power": { state: "-66", attributes: {} },
      "sensor.temperature": { state: "20.0", attributes: {} },
    }
  };

  const miniEn = card._renderMiniView();
  const cyrillicRegex = /[а-яіїєґА-ЯІЇЄҐ]/;
  assert.ok(!cyrillicRegex.test(miniEn), "Mini view в English режимі не містить кирилиці");

  // Check fallback message
  const fallback = card._t("error_no_bms_device");
  assert.ok(!cyrillicRegex.test(fallback), "Повідомлення error_no_bms_device англійською не містить кирилиці");

  // Check close button aria-label
  const closeBtn = card._t("btn_close");
  assert.ok(!cyrillicRegex.test(closeBtn), "btn_close англійською не містить кирилиці");

  console.log("  ✓ Generic i18n crawler passed without Cyrillic strings in EN mode");
}

// --- 5. I18N Key Parity Check ---
{
  const ukKeys = Object.keys(mod.I18N.uk).sort();
  const enKeys = Object.keys(mod.I18N.en).sort();
  assert.deepStrictEqual(ukKeys, enKeys, "Усі ключі uk та en словників повністю збігаються");
  console.log("  ✓ I18N dictionary parity passed (100% keys match)");
}

console.log("ALL DOM VERIFICATION CHECKS PASSED SUCCESSFULLY!");
