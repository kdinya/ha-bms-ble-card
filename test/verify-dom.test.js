const assert = require("assert");
const path = require("path");

// Mock environment for DOM testing
class MockElement {
  constructor(tagName = "div") {
    this.tagName = tagName;
    this.children = [];
    this._listeners = {};
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.innerHTML = "";
    this.textContent = "";
    const classes = new Set();
    this.classList = {
      toggle: (c, force) => {
        const shouldHave = force === undefined ? !classes.has(c) : !!force;
        if (shouldHave) classes.add(c); else classes.delete(c);
        return shouldHave;
      },
      add: (...cs) => cs.forEach((c) => classes.add(c)),
      remove: (...cs) => cs.forEach((c) => classes.delete(c)),
      contains: (c) => classes.has(c),
    };
  }
  addEventListener(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }
  removeEventListener(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  }
  dispatchEvent(event) {
    const list = this._listeners[event.type || event] || [];
    list.forEach(fn => fn(event));
    return true;
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  appendChild(child) { this.children.push(child); return child; }
  removeChild(child) {
    this.children = this.children.filter(c => c !== child);
    return child;
  }
  querySelector(sel) {
    return this._mockQuery(sel);
  }
  querySelectorAll(sel) {
    const res = this._mockQueryAll(sel);
    return res;
  }
  _mockQuery(sel) {
    // Basic selector match
    if (sel.startsWith(".")) {
      const cls = sel.slice(1).split("[")[0].split(" ")[0];
      if (this.className && this.className.includes(cls)) return this;
    }
    for (const c of this.children) {
      if (c._mockQuery) {
        const found = c._mockQuery(sel);
        if (found) return found;
      }
    }
    return new MockElement();
  }
  _mockQueryAll(sel) {
    const results = [];
    if (sel.startsWith(".")) {
      const cls = sel.slice(1).split("[")[0].split(" ")[0];
      if (this.className && this.className.includes(cls)) results.push(this);
    }
    for (const c of this.children) {
      if (c._mockQueryAll) {
        results.push(...c._mockQueryAll(sel));
      }
    }
    return results;
  }
}

global.HTMLElement = MockElement;
global.customElements = { define() {}, get() {} };
global.window = global;
global.document = {
  createElement: (tag) => new MockElement(tag)
};
global.console = console;

const cardPath = path.join(__dirname, "..", "ha-bms-ble-card.js");
const mod = require(cardPath);

console.log("Running comprehensive DOM & runtime verification tests...");

// --- 1. Verify No Template String Literals in I18N Dictionaries ---
{
  for (const lang of ["uk", "en"]) {
    const dict = mod.I18N[lang];
    for (const [key, val] of Object.entries(dict)) {
      assert.ok(typeof val === "string", `${lang}.${key} must be a string`);
      assert.ok(!val.includes("${"), `${lang}.${key} contains unresolved template expression '\${': ${val}`);
    }
  }
  assert.ok(mod.I18N.uk.error_no_bms_device.includes("BMS_BLE-HA"), "uk.error_no_bms_device has correct message");
  assert.ok(mod.I18N.en.error_no_bms_device.includes("BMS_BLE-HA"), "en.error_no_bms_device has correct message");
  console.log("  ✓ No unresolved template strings in I18N dictionaries");
}

// --- 2. I18N Key Parity Check ---
{
  const ukKeys = Object.keys(mod.I18N.uk).sort();
  const enKeys = Object.keys(mod.I18N.en).sort();
  assert.deepStrictEqual(ukKeys, enKeys, "Усі ключі uk та en словників повністю збігаються");
  console.log("  ✓ I18N dictionary parity passed (100% keys match)");
}

// --- 3. Verify Manual 30-Day Stats Button & Click Lifecycle ---
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

  // Test click triggers fetch
  let fetchTriggered = false;
  card._maybeFetchStatsAllTimeDuration = (force) => {
    if (force) fetchTriggered = true;
  };

  const btn = new MockElement("button");
  btn.className = "bms-btn-calc-30d";
  card.querySelectorAll = (sel) => {
    if (sel.includes(".bms-btn-calc-30d")) return [btn];
    return [];
  };

  card._wireStatsPaneEvents();
  assert.strictEqual(btn._listeners["click"]?.length, 1, "Клік обробник прив'язаний до кнопки");
  btn.dispatchEvent({ type: "click", stopPropagation() {}, preventDefault() {} });
  assert.strictEqual(fetchTriggered, true, "Клік викликає _maybeFetchStatsAllTimeDuration(true)");

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

  console.log("  ✓ Manual 30-day stats button lifecycle & event dispatch passed");
}

// --- 4. Runtime Execution: _updateDynamicDom() must NOT throw ---
{
  const card = Object.create(mod.HaBmsBleCard.prototype);
  card._uid = "test-uid";
  card._lang = "uk";
  card._config = { display_mode: "inline" };
  card._t = (k) => mod.I18N.uk[k] || k;
  card._e = (k) => `sensor.${k}`;
  card._batteryName = () => "Test BMS";
  card._statusInfo = () => ({ label: "Розряджання", icon: "ti-battery", color: "warning" });
  card._currentStatus = () => ({ label: "Розряджання", icon: "ti-battery", color: "warning" });
  card._statusColorVars = () => ({ bg: "#fff", fg: "#000" });
  card._storedEnergyWh = () => 2500;
  card._cellsStats = () => ({ min: 3.25, max: 3.35, delta: 0.1, minIdx: 0, maxIdx: 3, cells: [3.25, 3.30, 3.32, 3.35] });
  card._activeTab = "home";
  card._hass = {
    states: {
      "sensor.soc": { state: "50", attributes: {} },
      "sensor.voltage": { state: "13.2", attributes: {} },
      "sensor.current": { state: "-10.0", attributes: {} },
      "sensor.power": { state: "-132", attributes: {} },
      "sensor.temperature": { state: "25.0", attributes: {} },
      "sensor.soh": { state: "99", attributes: {} },
      "sensor.charge_cycles": { state: "42", attributes: {} },
      "sensor.design_capacity": { state: "100", attributes: {} },
      "sensor.cycle_capacity": { state: "2500", attributes: {} },
      "sensor.delta_cell_voltage": { state: "0.1", attributes: { cell_voltages: [3.25, 3.30, 3.32, 3.35] } },
    }
  };

  // Mock DOM tree queries for full view
  card.querySelector = (sel) => {
    const el = new MockElement();
    el.className = sel.replace(".", "");
    return el;
  };
  card.querySelectorAll = (sel) => {
    return [new MockElement()];
  };

  // Verify runtime execution in full mode
  assert.doesNotThrow(() => {
    card._updateDynamicDom();
  }, "card._updateDynamicDom() runs without throwing in full mode");

  // Verify runtime execution in widget mode
  card._config.display_mode = "widget";
  assert.doesNotThrow(() => {
    card._updateDynamicDom();
  }, "card._updateDynamicDom() runs without throwing in widget mode");

  console.log("  ✓ Runtime execution of _updateDynamicDom() verified without errors");
}

// --- 5. Verify Fast Patch in Widget Mini View Structure ---
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

  // Zero Cyrillic in English mini view
  const cyrillicRegex = /[а-яіїєґА-ЯІЇЄҐ]/;
  assert.ok(!cyrillicRegex.test(miniHtml), "Mini view в English режимі не містить кирилиці");

  console.log("  ✓ Widget mini view structure and English localization passed");
}

console.log("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
