/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "2.1.0";

console.info(
  `%c HA-BMS-BLE-CARD %c v${CARD_VERSION} `,
  "color: white; background: #0F6E56; font-weight: 700;",
  "color: #0F6E56; background: white; font-weight: 700;"
);

const DEFAULT_THRESHOLDS = {
  cell_delta_warning: 0.02,
  cell_delta_critical: 0.05,
};

// Типовий робочий діапазон напруги комірки LiFePO4, використовується лише
// для візуального заповнення міні-іконки комірки (0% = lo, 100% = hi).
// Це НЕ SOC, а суто орієнтир по напрузі клітинки.
const CELL_VOLTAGE_RANGE = { lo: 2.5, hi: 3.65 };

function fmt(value, digits = 2, unit = "") {
  if (value === undefined || value === null || value === "unknown" || value === "unavailable") {
    return "—";
  }
  const num = Number(value);
  if (Number.isNaN(num)) return `${value}${unit}`;
  return `${num.toFixed(digits)}${unit}`;
}

function stateOf(hass, entityId) {
  if (!entityId || !hass || !hass.states[entityId]) return undefined;
  return hass.states[entityId].state;
}

function attrOf(hass, entityId, attr) {
  if (!entityId || !hass || !hass.states[entityId]) return undefined;
  return hass.states[entityId].attributes[attr];
}

function batteryFillColor(percent) {
  if (percent <= 15) return "#E24B4A";
  if (percent <= 30) return "#EF9F27";
  return "#1D9E75";
}

/**
 * Чиста функція, що відповідає шаблону, який ensureDischargeTemplateSensor
 * підставляє в Template-хелпер: {{ [value, 0] | min | abs }}. Позитивне
 * (заряд) → 0, від'ємне (розряд) → додатне значення. Винесена окремо, щоб
 * можна було юніт-тестом підтвердити, що інтегрування ЦЬОГО (а не сирого
 * знакозмінного power/current) не дає заряду й розряду скасовувати один
 * одного в накопиченій сумі.
 */
function dischargeOnlyTemplate(value) {
  const n = Number(value) || 0;
  return Math.abs(Math.min(n, 0));
}

function secondsToHuman(seconds) {
  if (seconds === undefined || seconds === null || Number.isNaN(Number(seconds))) return "—";
  const s = Number(seconds);
  if (s < 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h <= 0) return `${m} хв`;
  return `${h} год ${m} хв`;
}

/**
 * Оцінка часу до повного / до порожнього.
 * BMS runtime часто unavailable під час заряду — тоді рахуємо з SOC + струм + ємність.
 */
function estimateEtaSeconds({ soc, current, designAh, storedWh, packVoltage, charging }) {
  const s = Number(soc);
  const c = Number(current);
  if (!Number.isFinite(s) || !Number.isFinite(c) || Math.abs(c) < 0.05) return undefined;

  let capacityAh = Number(designAh);
  if (!Number.isFinite(capacityAh) || capacityAh <= 0) {
    const wh = Number(storedWh);
    const v = Number(packVoltage);
    if (Number.isFinite(wh) && Number.isFinite(v) && v > 1 && s > 1) {
      // stored energy ≈ SOC% of full → full Wh = stored / (soc/100), Ah = Wh / V
      capacityAh = (wh / (s / 100)) / v;
    }
  }
  if (!Number.isFinite(capacityAh) || capacityAh <= 0) return undefined;

  if (charging && c > 0) {
    const remainAh = capacityAh * Math.max(0, (100 - s) / 100);
    return (remainAh / c) * 3600;
  }
  if (!charging && c < 0) {
    const remainAh = capacityAh * Math.max(0, s / 100);
    return (remainAh / Math.abs(c)) * 3600;
  }
  return undefined;
}

/**
 * Частка заповнення міні-іконки комірки на основі її абсолютної напруги
 * в типовому робочому діапазоні LiFePO4 (2.50–3.65 В). Клемп 0..1.
 */
function cellVoltageFraction(v) {
  const { lo, hi } = CELL_VOLTAGE_RANGE;
  if (v === undefined || v === null || Number.isNaN(Number(v))) return 0;
  return Math.max(0, Math.min(1, (Number(v) - lo) / (hi - lo)));
}

/* ----------------------------------------------------------------------
 * Автопошук акумулятора та сутностей.
 *
 * Раніше картка вимагала вручну прописати кожен entity_id в entities.*.
 * Якщо користувач помилявся (вказував не той сенсор — наприклад SOC
 * власного BLE-проксі замість SOC акумулятора), картка мовчки показувала
 * дані з чужого сенсора (типовий симптом — SOC завжди 100%, бо сплутаний
 * сенсор ніколи не змінюється).
 *
 * Тепер картка сама знаходить пристрій інтеграції BMS_BLE-HA (домен
 * "bms_ble") і підбирає потрібні сенсори за device_class/entity_id —
 * ручні entities.* (якщо задані) завжди мають пріоритет і потрібні лише
 * для перевизначення в нетипових випадках.
 * -------------------------------------------------------------------- */
const BMS_BLE_DOMAIN = "bms_ble";

function objectIdOf(entityId) {
  const idx = entityId.indexOf(".");
  return idx >= 0 ? entityId.slice(idx + 1).toLowerCase() : entityId.toLowerCase();
}

function hasWord(haystack, word) {
  if (!haystack) return false;
  return new RegExp(`(^|_)${word}(_|$)`).test(haystack);
}

/** Всі зареєстровані ID пристроїв, на яких є хоч одна сутність з
 *  інтеграції BMS_BLE-HA (за платформою реєстру сутностей). */
function findBmsBleDeviceIds(hass) {
  if (!hass || !hass.entities) return [];
  const ids = new Set();
  for (const e of Object.values(hass.entities)) {
    if (e && e.platform === BMS_BLE_DOMAIN && e.device_id) ids.add(e.device_id);
  }
  return Array.from(ids);
}

/** Список сутностей конкретного пристрою з розширеною інформацією,
 *  потрібною для класифікації (домен, device_class, object_id тощо). */
function deviceEntitiesInfo(hass, deviceId) {
  if (!hass || !hass.entities || !deviceId) return [];
  return Object.entries(hass.entities)
    .filter(([, e]) => e && e.device_id === deviceId)
    .map(([entityId, e]) => {
      const state = hass.states && hass.states[entityId];
      return {
        entityId,
        domain: entityId.split(".")[0],
        objectId: objectIdOf(entityId),
        deviceClass: (state && state.attributes && state.attributes.device_class) || e.device_class,
        friendlyName: (state && state.attributes && state.attributes.friendly_name) || "",
      };
    })
    .sort((a, b) => a.entityId.localeCompare(b.entityId));
}

// Ключові слова (специфічні, перевіряються ДО загальних правил за
// device_class, щоб, наприклад, "max_cell_voltage" не забрав собі
// device_class "voltage" раніше за основну напругу пакета).
const KEYWORD_RULES = [
  { key: "delta_cell_voltage", domain: "sensor", test: (o) => o.includes("delta") },
  { key: "max_cell_voltage", domain: "sensor", test: (o) => (o.includes("max") && o.includes("volt")) || o.includes("max_cell") },
  { key: "min_cell_voltage", domain: "sensor", test: (o) => (o.includes("min") && o.includes("volt")) || o.includes("min_cell") },
  { key: "runtime", domain: "sensor", test: (o) => o.includes("runtime") },
  { key: "link_quality", domain: "sensor", test: (o) => o.includes("link_quality") || o.includes("linkquality") },
  { key: "charge_cycles", domain: "sensor", test: (o) => o.includes("cycle") && !o.includes("capacity") && !o.includes("charge") },
  { key: "design_capacity", domain: "sensor", test: (o) => o.includes("design") && o.includes("cap") },
  { key: "stored_energy", domain: "sensor", test: (o) => o.includes("stored") || (o.includes("cycle") && o.includes("cap")) },
  { key: "balancer", domain: "binary_sensor", test: (o) => o.includes("balanc") },
  { key: "chrg_mosfet", domain: "binary_sensor", test: (o) =>
      (o.includes("mosfet") || o.includes("mos_fet") || o.includes("mos")) &&
      (o.includes("chrg") || o.includes("charge") || o.includes("chg")) &&
      !o.includes("dis")
  },
  { key: "dischrg_mosfet", domain: "binary_sensor", test: (o) =>
      (o.includes("mosfet") || o.includes("mos_fet") || o.includes("mos")) &&
      (o.includes("dischrg") || o.includes("discharge") || o.includes("dsg") || o.includes("dis"))
  },
  { key: "heater", domain: "binary_sensor", test: (o) => o.includes("heater") || o.includes("heating") },
];

// Fallback MOSFET if only generic names exist
function refineMosfetDiscovery(list, result, used) {
  if (!result.chrg_mosfet) {
    const m = list.find((e) => !used.has(e.entityId) && e.domain === "binary_sensor" &&
      (e.objectId.includes("chrg_mosfet") || e.objectId.endsWith("_chrg_mosfet") || e.objectId.includes("charging_mosfet")));
    if (m) { result.chrg_mosfet = m.entityId; used.add(m.entityId); }
  }
  if (!result.dischrg_mosfet) {
    const m = list.find((e) => !used.has(e.entityId) && e.domain === "binary_sensor" &&
      (e.objectId.includes("dischrg_mosfet") || e.objectId.includes("discharge_mosfet")));
    if (m) { result.dischrg_mosfet = m.entityId; used.add(m.entityId); }
  }
  // last resort: any mosfet without dis = charge, with dis = discharge
  if (!result.chrg_mosfet || !result.dischrg_mosfet) {
    const mos = list.filter((e) => !used.has(e.entityId) && e.domain === "binary_sensor" && e.objectId.includes("mosfet"));
    for (const e of mos) {
      if (!result.dischrg_mosfet && e.objectId.includes("dis")) {
        result.dischrg_mosfet = e.entityId; used.add(e.entityId);
      } else if (!result.chrg_mosfet && !e.objectId.includes("dis")) {
        result.chrg_mosfet = e.entityId; used.add(e.entityId);
      }
    }
  }
}

// Загальні правила за device_class — застосовуються ДРУГИМ проходом,
// лише до сутностей, які ще нічим не зайняті.
const DEVICE_CLASS_RULES = [
  { key: "soc", domain: "sensor", deviceClass: "battery" },
  { key: "voltage", domain: "sensor", deviceClass: "voltage" },
  { key: "current", domain: "sensor", deviceClass: "current" },
  { key: "power", domain: "sensor", deviceClass: "power" },
  { key: "temperature", domain: "sensor", deviceClass: "temperature" },
  { key: "rssi", domain: "sensor", deviceClass: "signal_strength" },
  { key: "charging", domain: "binary_sensor", deviceClass: "battery_charging" },
  { key: "problem", domain: "binary_sensor", deviceClass: "problem" },
];

/**
 * Повертає мапу entities.* (як у ручному конфізі), автоматично підібрану
 * з реальних сутностей пристрою `deviceId`. Best-effort: жодне поле не
 * гарантоване, якщо конкретна BMS-плата (Redodo/LiTime/JBD/Daly/JK/Seplos)
 * не публікує відповідний сенсор — тоді просто лишається undefined, як і
 * при ручному конфізі, і картка коректно показує "—" замість помилки.
 */
function autoDiscoverEntities(hass, deviceId) {
  if (!hass || !deviceId) return {};
  const list = deviceEntitiesInfo(hass, deviceId);
  const used = new Set();
  const result = {};

  for (const rule of KEYWORD_RULES) {
    const match = list.find(
      (e) => !used.has(e.entityId) && e.domain === rule.domain && rule.test(e.objectId)
    );
    if (match) {
      result[rule.key] = match.entityId;
      used.add(match.entityId);
    }
  }

  for (const rule of DEVICE_CLASS_RULES) {
    const match = list.find(
      (e) => !used.has(e.entityId) && e.domain === rule.domain && e.deviceClass === rule.deviceClass
    );
    if (match) {
      result[rule.key] = match.entityId;
      used.add(match.entityId);
    }
  }

  // rssi — fallback за назвою
  if (!result.rssi) {
    const match = list.find((e) => !used.has(e.entityId) && e.domain === "sensor" && (hasWord(e.objectId, "rssi") || e.objectId.includes("rssi")));
    if (match) {
      result.rssi = match.entityId;
      used.add(match.entityId);
    }
  }

  refineMosfetDiscovery(list, result, used);

  // max/min cell from friendly name if object_id didn't match
  if (!result.max_cell_voltage) {
    const m = list.find((e) => !used.has(e.entityId) && e.domain === "sensor" &&
      /max/i.test(e.friendlyName + e.objectId) && /volt|cell/i.test(e.friendlyName + e.objectId));
    if (m) { result.max_cell_voltage = m.entityId; used.add(m.entityId); }
  }
  if (!result.min_cell_voltage) {
    const m = list.find((e) => !used.has(e.entityId) && e.domain === "sensor" &&
      /min/i.test(e.friendlyName + e.objectId) && /volt|cell/i.test(e.friendlyName + e.objectId));
    if (m) { result.min_cell_voltage = m.entityId; used.add(m.entityId); }
  }

  return result;
}


/* ----------------------------------------------------------------------
 * Setup Wizard — matches HA 2024–2026 config-flow field schemas exactly.
 * history_stats is multi-step (user → state → options).
 * integration: omit unit_prefix (optional; "none" is invalid).
 * utility_meter: cycle, delta_values, periodically_resetting required.
 * -------------------------------------------------------------------- */
const CAPACITY_CYCLES = [
  { key: "capacity_daily", label: "Сьогодні", cycle: "daily" },
  { key: "capacity_weekly", label: "Тиждень", cycle: "weekly" },
  { key: "capacity_monthly", label: "Місяць", cycle: "monthly" },
];

const DISCHARGE_CYCLES = [
  { key: "discharge_time_daily", label: "Сьогодні", days: 1 },
  { key: "discharge_time_weekly", label: "Тиждень", days: 7 },
  { key: "discharge_time_monthly", label: "Місяць", days: 30 },
];

const LAYOUT_BLOCKS = [
  { id: "header", label: "Заголовок" },
  { id: "battery", label: "Батарея + статус + час" },
  { id: "metrics", label: "Метрики (V/A/W/°C)" },
  { id: "cells_batteries", label: "Комірки — акумулятори" },
  { id: "cells_bars", label: "Комірки — смужки" },
  { id: "diagnostics", label: "Діагностика BMS" },
  { id: "stats", label: "Смуга статистики" },
  { id: "capacity", label: "Використано ємності" },
  { id: "discharge_time", label: "Час розряду" },
];

function defaultLayout() {
  return LAYOUT_BLOCKS.map((b) => ({ id: b.id, visible: true, scale: 1 }));
}

class SetupWizard {
  constructor(hass) {
    this.hass = hass;
  }

  get isAdmin() {
    return !!(this.hass && this.hass.user && this.hass.user.is_admin);
  }

  async _initFlow(handler) {
    return this.hass.callApi("POST", "config/config_entries/flow", {
      handler,
      show_advanced_options: false,
    });
  }

  async _submitStep(flowId, userInput) {
    return this.hass.callApi("POST", `config/config_entries/flow/${flowId}`, userInput);
  }

  async _abortFlow(flowId) {
    try {
      await this.hass.callApi("DELETE", `config/config_entries/flow/${flowId}`);
    } catch (e) { /* best effort */ }
  }

  async _existingEntry(title) {
    const entries = await this.hass.callWS({ type: "config_entries/get" });
    return entries.find(
      (e) =>
        ["integration", "utility_meter", "history_stats", "template"].includes(e.domain) &&
        e.title === title
    );
  }

  async _entityForEntry(entryId, attempts = 10, delayMs = 350) {
    for (let i = 0; i < attempts; i++) {
      const regs = await this.hass.callWS({ type: "config/entity_registry/list" });
      const match = regs.find((r) => r.config_entry_id === entryId);
      if (match && match.entity_id) return match.entity_id;
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return undefined;
  }

  async ensureDischargeTemplateSensor(sourceEntity, title, unit, deviceClass) {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("template");
    let step = flow;
    if (step.type === "menu") {
      step = await this._submitStep(step.flow_id, { next_step_id: "sensor" });
    }
    if (step.type !== "form") {
      await this._abortFlow(flow.flow_id);
      throw new Error(`template: неочікуваний крок "${step.type}"`);
    }
    const payload = {
      name: title,
      state: `{{ [ (states('${sourceEntity}') | float(0)), 0 ] | min | abs }}`,
      unit_of_measurement: unit,
      device_class: deviceClass,
      state_class: "measurement",
    };
    let result = await this._submitStep(step.flow_id, payload);
    if (result.type !== "create_entry") {
      // Some HA builds reject unknown optional fields; try minimal set
      result = await this._submitStep(step.flow_id, {
        name: title,
        state: payload.state,
      });
    }
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(
        "template: " + (result.errors ? JSON.stringify(result.errors) : result.type + " " + JSON.stringify(result))
      );
    }
    const entityId = await this._entityForEntry(result.result.entry_id || result.result);
    if (!entityId) throw new Error("template створено, але entity_id не з'явився в registry");
    return { entityId, created: true };
  }

  async ensureIntegral(sourceEntity, title, unitTime = "h") {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("integration");
    // HA schema: name, source, method, round, unit_time; unit_prefix is optional — do NOT send "none"
    const result = await this._submitStep(flow.flow_id, {
      name: title,
      source: sourceEntity,
      method: "trapezoidal",
      round: 2,
      unit_time: unitTime,
    });
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(
        "integration: " + (result.errors ? JSON.stringify(result.errors) : result.type + " " + JSON.stringify(result))
      );
    }
    const entryId = result.result && (result.result.entry_id || result.result);
    const entityId = await this._entityForEntry(entryId);
    if (!entityId) throw new Error("integration створено, але entity_id не з'явився");
    return { entityId, created: true };
  }

  async ensureUtilityMeter(sourceEntity, title, cycle) {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("utility_meter");
    // CONF_METER_TYPE key is "cycle"; source key is "source"
    const result = await this._submitStep(flow.flow_id, {
      name: title,
      source: sourceEntity,
      cycle: cycle,
      offset: 0,
      tariffs: [],
      net_consumption: false,
      delta_values: false,
      periodically_resetting: false,
    });
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(
        "utility_meter: " + (result.errors ? JSON.stringify(result.errors) : result.type + " " + JSON.stringify(result))
      );
    }
    const entryId = result.result && (result.result.entry_id || result.result);
    const entityId = await this._entityForEntry(entryId);
    if (!entityId) throw new Error("utility_meter створено, але entity_id не з'явився");
    return { entityId, created: true };
  }

  /**
   * history_stats config flow is multi-step:
   *   user  → {name, entity_id, type}
   *   state → {state: ["off"]}
   *   options → {duration: {days, hours, minutes, seconds}}
   */
  async ensureHistoryStats(sourceEntity, title, states, days) {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("history_stats");
    let step = flow;
    // Step 1: setup
    step = await this._submitStep(step.flow_id, {
      name: title,
      entity_id: sourceEntity,
      type: "time",
    });
    if (step.type === "form" && step.step_id === "state") {
      step = await this._submitStep(step.flow_id, { state: states });
    }
    // HA requires EXACTLY two of {start, end, duration} → duration + end
    const period = {
      duration: { days: Number(days) || 1, hours: 0, minutes: 0, seconds: 0 },
      end: "{{ now() }}",
    };
    if (step.type === "form") {
      step = await this._submitStep(step.flow_id, period);
    }
    if (step.type !== "create_entry" && step.type === "form") {
      step = await this._submitStep(step.flow_id, period);
    }
    if (step.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(
        "history_stats: " + (step.errors ? JSON.stringify(step.errors) : step.type + " step=" + step.step_id)
      );
    }
    const entryId = step.result && (step.result.entry_id || step.result);
    const entityId = await this._entityForEntry(entryId);
    if (!entityId) throw new Error("history_stats створено, але entity_id не з'явився");
    return { entityId, created: true };
  }

  async run(sourceEntity, sourceKind, chargingEntity, batteryName, onProgress) {
    const log = [];
    const report = (msg) => {
      log.push(msg);
      if (onProgress) onProgress(msg);
    };

    const unit = sourceKind === "current" ? "A" : "W";
    const deviceClass = sourceKind === "current" ? "current" : "power";

    const dischargeTitle = `${batteryName} — розряд (${unit}, без заряду)`;
    report(`Створюю "${dischargeTitle}"…`);
    const discharge = await this.ensureDischargeTemplateSensor(
      sourceEntity, dischargeTitle, unit, deviceClass
    );
    report(discharge.created ? `✓ ${discharge.entityId}` : `↺ вже є: ${discharge.entityId}`);

    const totalTitle = `${batteryName} — накопичена ємність розряду`;
    report(`Створюю "${totalTitle}"…`);
    const total = await this.ensureIntegral(discharge.entityId, totalTitle);
    report(total.created ? `✓ ${total.entityId}` : `↺ вже є: ${total.entityId}`);

    const entities = { capacity_total: total.entityId };
    for (const { key, label, cycle } of CAPACITY_CYCLES) {
      const title = `${batteryName} — використано (${label.toLowerCase()})`;
      report(`Створюю "${title}"…`);
      const meter = await this.ensureUtilityMeter(total.entityId, title, cycle);
      report(meter.created ? `✓ ${meter.entityId}` : `↺ вже є: ${meter.entityId}`);
      entities[key] = meter.entityId;
    }

    if (chargingEntity) {
      for (const { key, label, days } of DISCHARGE_CYCLES) {
        const title = `${batteryName} — час розряду (${label.toLowerCase()})`;
        report(`Створюю "${title}"…`);
        try {
          const hs = await this.ensureHistoryStats(chargingEntity, title, ["off"], days);
          report(hs.created ? `✓ ${hs.entityId}` : `↺ вже є: ${hs.entityId}`);
          entities[key] = hs.entityId;
        } catch (err) {
          report(`⚠ ${title}: ${err.message || err}`);
        }
      }
    } else {
      report("⏱ Час розряду пропущено (немає entities.charging)");
    }

    return { entities, log };
  }
}

const ENTITY_FIELD_GROUPS = [
  {
    title: "Основні",
    fields: [
      ["voltage", "Напруга", "sensor"],
      ["current", "Струм", "sensor"],
      ["power", "Потужність", "sensor"],
      ["soc", "SOC (заряд, %)", "sensor"],
      ["temperature", "Температура", "sensor"],
      ["runtime", "Runtime (прогноз часу роботи)", "sensor"],
    ],
  },
  {
    title: "Комірки (діагностика)",
    fields: [
      ["delta_cell_voltage", "Delta cell voltage", "sensor"],
      ["max_cell_voltage", "Max cell voltage", "sensor"],
      ["min_cell_voltage", "Min cell voltage", "sensor"],
    ],
  },
  {
    title: "Статус і діагностика BMS",
    fields: [
      ["charging", "Заряджається (binary_sensor)", "binary_sensor"],
      ["balancer", "Балансир", "binary_sensor"],
      ["chrg_mosfet", "MOSFET заряду", "binary_sensor"],
      ["dischrg_mosfet", "MOSFET розряду", "binary_sensor"],
      ["heater", "Нагрівач", "binary_sensor"],
      ["problem", "Проблема", "binary_sensor"],
      ["link_quality", "Link quality", "sensor"],
      ["rssi", "RSSI", "sensor"],
      ["charge_cycles", "Цикли заряду", "sensor"],
    ],
  },
  {
    title: "Використана ємність (можна заповнити майстром нижче)",
    fields: [
      ["capacity_daily", "Сьогодні", "sensor"],
      ["capacity_weekly", "Тиждень", "sensor"],
      ["capacity_monthly", "Місяць", "sensor"],
      ["capacity_total", "Всього", "sensor"],
    ],
  },
  {
    title: "Час розряду (можна заповнити майстром нижче)",
    fields: [
      ["discharge_time_daily", "Сьогодні", "sensor"],
      ["discharge_time_weekly", "Тиждень", "sensor"],
      ["discharge_time_monthly", "Місяць", "sensor"],
    ],
  },
];

class HaBmsBleCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._wizardStatus = null;
    this._wizardBusy = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Не робимо повний _render() на кожен hass tick (він приходить часто) —
    // просто освіжаємо .hass у вже змонтованих ha-entity-picker, щоб не
    // губити фокус/курсор користувача під час введення.
    if (this._mounted) {
      this.querySelectorAll("ha-entity-picker, ha-device-picker").forEach((el) => {
        el.hass = hass;
      });
    } else {
      this._render();
    }
  }

  _entities() {
    return (this._config && this._config.entities) || {};
  }

  /** device_id, з якого автопошук бере сутності: ручний вибір у редакторі
   *  має пріоритет, інакше — єдиний знайдений пристрій BMS_BLE-HA. */
  _autoDeviceId() {
    const manual = this._entities().device_id;
    if (manual) return manual;
    if (!this._hass) return undefined;
    const ids = findBmsBleDeviceIds(this._hass);
    return ids.length === 1 ? ids[0] : undefined;
  }

  /** Автовизначені + ручні entities.* — лише для читання (перевірки
   *  готовності майстра, підказки в пікерах). НІКОЛИ не використовувати
   *  як базу для збереження — інакше кожна точкова зміна одного поля
   *  записала б у конфіг усі автовизначені entity_id назавжди. */
  _effectiveEntities() {
    const deviceId = this._autoDeviceId();
    const auto = this._hass && deviceId ? autoDiscoverEntities(this._hass, deviceId) : {};
    return { ...auto, ...this._entities() };
  }

  _hasEntityPicker() {
    return typeof customElements !== "undefined" && !!customElements.get("ha-entity-picker");
  }

  _hasDevicePicker() {
    return typeof customElements !== "undefined" && !!customElements.get("ha-device-picker");
  }

  _wizardEligible() {
    const e = this._effectiveEntities();
    return !!(e.power || e.current);
  }

  _wizardAlreadyConfigured() {
    const e = this._effectiveEntities();
    const capacityDone = !!(e.capacity_daily && e.capacity_weekly && e.capacity_monthly && e.capacity_total);
    if (!e.charging) return capacityDone;
    const dischargeDone = !!(e.discharge_time_daily && e.discharge_time_weekly && e.discharge_time_monthly);
    return capacityDone && dischargeDone;
  }

  async _runWizard() {
    if (!this._hass) return;
    const wizard = new SetupWizard(this._hass);
    if (!wizard.isAdmin) {
      this._wizardStatus = {
        ok: false,
        text: "Потрібні права адміністратора HA, щоб створювати helper-сенсори. Скористайтесь мануальною інструкцією в README.",
      };
      this._render();
      return;
    }
    const e = this._effectiveEntities();
    const source = e.current || e.power;
    const sourceKind = e.current ? "current" : "power";
    if (!source) return;
    const batteryName = (this._config.name && this._config.name.trim()) || "BMS Battery";

    this._wizardBusy = true;
    this._wizardStatus = { ok: true, text: "Запускаю…", lines: [] };
    this._render();

    const progressLines = [];
    try {
      const { entities, log } = await wizard.run(source, sourceKind, e.charging, batteryName, (msg) => {
        progressLines.push(msg);
        this._wizardStatus = { ok: true, text: "Створення…", lines: [...progressLines] };
        this._render();
      });
      this._update("entities", { ...this._entities(), ...entities });
      this._wizardStatus = {
        ok: true,
        text: "Готово! Сенсори додано в конфіг картки.",
        lines: log,
      };
    } catch (err) {
      this._wizardStatus = {
        ok: false,
        text: `Не вдалося створити сенсори автоматично (${err && err.message ? err.message : err}). Скористайтесь мануальною інструкцією в README — розділ "Helper-сенсори вручну".`,
      };
    }
    this._wizardBusy = false;
    this._render();
  }

  _renderWizard() {
    if (this._wizardAlreadyConfigured()) {
      return `<p style="font-size:12px; opacity:0.7; margin:0;">✓ Сенсори споживання${
        this._entities().charging ? " і часу розряду" : ""
      } вже налаштовані.</p>`;
    }
    if (!this._wizardEligible()) {
      return `<p style="font-size:12px; opacity:0.7; margin:0;">Вкажіть Потужність (або Струм) вище, щоб можна було створити сенсори споживання.</p>`;
    }
    const hasCharging = !!this._entities().charging;
    const statusHtml = this._wizardStatus
      ? `<div style="font-size:12px; margin-top:8px; color:${this._wizardStatus.ok ? "var(--primary-text-color)" : "var(--error-color,#E24B4A)"};">
          <div>${this._wizardStatus.text}</div>
          ${(this._wizardStatus.lines || []).map((l) => `<div style="opacity:0.7;">${l}</div>`).join("")}
        </div>`
      : "";
    return `
      <div>
        <button id="wizard-btn" ${this._wizardBusy ? "disabled" : ""}
          style="width:100%; padding:10px; border-radius:8px; border:none; cursor:pointer;
          background: var(--primary-color, #0F6E56); color: white; font-size:13px;">
          ${this._wizardBusy ? "Створюю…" : "Створити сенсори споживання і часу розряду"}
        </button>
        <p style="font-size:11px; opacity:0.6; margin:6px 0 0;">
          Створить helper-сенсори ємності (накопичена + сьогодні/тиждень/місяць)${
            hasCharging
              ? " та часу розряду (сьогодні/тиждень/місяць)"
              : " — для часу розряду вкажіть сенсор \"Заряджається\" у розділі \"Статус і діагностика BMS\" вище"
          } через вбудований механізм Helpers у HA. Потрібні admin-права.
        </p>
        ${statusHtml}
      </div>
    `;
  }

  /** Одне поле вибору сутності: ha-entity-picker, якщо доступний у цій
   *  версії HA, інакше — звичайний текстовий інпут з entity_id (fallback,
   *  щоб редактор не ламався на нетипових/старих фронтендах). */
  _renderEntityField(key, label, domain) {
    const deviceId = this._autoDeviceId();
    const autoMap = this._hass && deviceId ? autoDiscoverEntities(this._hass, deviceId) : {};
    const manual = this._entities()[key] || "";
    const auto = autoMap[key] || "";
    const value = manual || auto || "";
    const hint = auto
      ? (manual
          ? `<div class="bms-auto-hint">вручну (авто було: <code>${auto}</code>)</div>`
          : `<div class="bms-auto-hint">✓ авто: <code>${auto}</code></div>`)
      : `<div class="bms-auto-hint bms-auto-miss">не знайдено автоматично</div>`;
    if (this._hasEntityPicker()) {
      return `
        <div class="bms-field" data-key="${key}" data-domain="${domain}">
          <div class="bms-field-label">${label}</div>
          <ha-entity-picker data-key="${key}"></ha-entity-picker>
          ${hint}
        </div>
      `;
    }
    return `
      <div class="bms-field" data-key="${key}">
        <div class="bms-field-label">${label}</div>
        <input data-key="${key}" type="text" value="${value}" placeholder="entity_id"
          style="width:100%; box-sizing:border-box;" />
        ${hint}
      </div>
    `;
  }

  _deviceLabel(deviceId) {
    const device = this._hass && this._hass.devices && this._hass.devices[deviceId];
    return device ? device.name_by_user || device.name || deviceId : deviceId;
  }

  _renderDevicePicker() {
    const manualDeviceId = this._entities().device_id || "";
    const autoIds = this._hass ? findBmsBleDeviceIds(this._hass) : [];
    const effectiveId = manualDeviceId || (autoIds.length === 1 ? autoIds[0] : "");
    const options = autoIds
      .map((id) => {
        const sel = id === effectiveId ? " selected" : "";
        return `<option value="${id}"${sel}>${this._deviceLabel(id)}</option>`;
      })
      .join("");
    let note;
    if (effectiveId) {
      const auto = this._hass ? autoDiscoverEntities(this._hass, effectiveId) : {};
      const keys = Object.keys(auto).filter((k) => auto[k]);
      note = `✓ Пристрій: <b>${this._deviceLabel(effectiveId)}</b> — автоматично знайдено ${keys.length} сенсорів (SOC, напруга, струм, комірки…). Ручні поля нижче не потрібні.`;
    } else if (autoIds.length > 1) {
      note = `Знайдено ${autoIds.length} акумуляторів BMS_BLE-HA — оберіть потрібний.`;
    } else {
      note = `Акумулятор BMS_BLE-HA не знайдено. Встановіть інтеграцію і підключіть батарею, або вкажіть device_id.`;
    }
    // Always show a clear select of BMS devices (filters to our integration)
    const select = `
      <select id="bms-device-select" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid var(--divider-color,#333);background:var(--card-background-color);color:var(--primary-text-color);">
        <option value="">— оберіть акумулятор —</option>
        ${options}
      </select>`;
    return `
      <div class="bms-field" data-key="device_id">${select}</div>
      <p style="font-size:12px; opacity:0.75; margin:8px 0 0; line-height:1.4;">${note}</p>
    `;
  }

  _renderEntityGroups() {
    return ENTITY_FIELD_GROUPS.map(
      (group) => `
      <details class="bms-group">
        <summary>${group.title}</summary>
        <div class="bms-group-grid">
          ${group.fields.map(([key, label, domain]) => this._renderEntityField(key, label, domain)).join("")}
        </div>
      </details>
    `
    ).join("");
  }

  _cellVoltagesList() {
    const arr = this._entities().cell_voltages;
    return Array.isArray(arr) ? arr : [];
  }

  _renderCellVoltagesGroup() {
    const cells = this._cellVoltagesList();
    const rows = cells
      .map(
        (id, idx) => `
        <div class="bms-cell-row">
          <div class="bms-field" data-key="cell_voltages" data-index="${idx}">
            ${
              this._hasEntityPicker()
                ? `<ha-entity-picker data-cell-index="${idx}"></ha-entity-picker>`
                : `<input data-cell-index="${idx}" type="text" value="${id || ""}" placeholder="entity_id"
                    style="width:100%; box-sizing:border-box;" />`
            }
          </div>
          <button type="button" class="bms-cell-remove" data-cell-index="${idx}" title="Прибрати"
            style="border:none; background:transparent; cursor:pointer; color:var(--error-color,#E24B4A); font-size:16px;">✕</button>
        </div>
      `
      )
      .join("");
    return `
      <details class="bms-group">
        <summary>Окремі сенсори напруги комірок (опційно)</summary>
        <p style="font-size:11px; opacity:0.6; margin:4px 0 8px;">
          Не обов'язково: якщо залишити порожнім, картка сама візьме масив напруг
          з атрибута <code>cell_voltages</code> сенсора Delta cell voltage вище.
        </p>
        <div class="bms-cell-list">${rows}</div>
        <button type="button" id="cell-add-btn"
          style="margin-top:6px; padding:6px 10px; border-radius:6px; border:1px solid var(--divider-color,#333);
          background:transparent; color:var(--primary-text-color); cursor:pointer; font-size:12px;">
          + Додати комірку
        </button>
      </details>
    `;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    this.innerHTML = `
      <style>
        .bms-editor-group-title { font-size:13px; font-weight:500; margin-bottom:8px; }
        details.bms-group { border:1px solid var(--divider-color,#333); border-radius:8px; padding:8px 10px; margin-bottom:8px; }
        details.bms-group summary { cursor:pointer; font-size:13px; font-weight:500; padding:2px 0; }
        .bms-group-grid { display:grid; grid-template-columns:1fr; gap:10px; margin-top:8px; }
        .bms-field label { }
        .bms-cell-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
        .bms-cell-row .bms-field { flex:1; }
        ha-entity-picker { display:block; width:100%; }
        .bms-field-label { font-size:12px; font-weight:500; opacity:0.85; margin-bottom:4px; }
        .bms-auto-hint { font-size:11px; opacity:0.7; margin-top:4px; word-break:break-all; }
        .bms-auto-hint code { font-size:10px; background:rgba(127,127,127,0.15); padding:1px 4px; border-radius:4px; }
        .bms-auto-miss { opacity:0.45; }
        .bms-tabs { display:flex; gap:4px; margin-bottom:12px; flex-wrap:wrap; }
        .bms-tab {
          flex:1; min-width:90px; padding:8px 10px; border-radius:8px; border:1px solid var(--divider-color,#333);
          background:transparent; color:var(--primary-text-color); cursor:pointer; font-size:12px; font-weight:500;
        }
        .bms-tab.active { background:var(--primary-color,#0F6E56); color:#fff; border-color:transparent; }
        .bms-layout-row {
          display:flex; align-items:center; gap:8px; padding:8px; margin-bottom:6px;
          border:1px solid var(--divider-color,#333); border-radius:8px; background:rgba(127,127,127,0.06);
          cursor:grab;
        }
        .bms-layout-row.dragging { opacity:0.5; }
        .bms-layout-row .bms-layout-name { flex:1; font-size:13px; font-weight:500; min-width:0; }
        .bms-layout-row input[type=range] { width:90px; flex-shrink:0; }
        .bms-layout-row button { border:none; background:transparent; cursor:pointer; font-size:14px; padding:4px; color:var(--primary-text-color); opacity:0.7; }

      </style>
      <div class="bms-editor" style="padding:12px;display:flex;flex-direction:column;gap:12px;max-width:100%;overflow-x:hidden;">
        <div class="bms-tabs">
          <button type="button" class="bms-tab ${this._tab === "main" ? "active" : ""}" data-tab="main">Основне</button>
          <button type="button" class="bms-tab ${this._tab === "entities" ? "active" : ""}" data-tab="entities">Сутності</button>
          <button type="button" class="bms-tab ${this._tab === "layout" ? "active" : ""}" data-tab="layout">Розкладка</button>
        </div>
        ${this._tab === "main" ? `
        <div>
          <label style="display:block; font-size:13px; margin-bottom:4px;">Назва (порожньо = автоматично з пристрою)</label>
          <input id="name" type="text" value="${c.name || ""}" placeholder="Автоматично"
            style="width:100%; box-sizing:border-box;" />
        </div>
        <div>
          <label style="display:block; font-size:13px; margin-bottom:4px;">Режим відображення</label>
          <select id="display_mode" style="width:100%;">
            <option value="widget" ${c.display_mode !== "inline" ? "selected" : ""}>Widget + спливаюче вікно</option>
            <option value="inline" ${c.display_mode === "inline" ? "selected" : ""}>Вбудована картка (inline)</option>
          </select>
        </div>
        <div>
          <div class="bms-editor-group-title">Акумулятор</div>
          ${this._renderDevicePicker()}
        </div>
        <div style="border-top:1px solid var(--divider-color,#333); padding-top:12px;">
          <div style="font-size:13px; font-weight:500; margin-bottom:8px;">Сенсори споживання / часу розряду</div>
          ${this._renderWizard()}
        </div>` : ""}
        ${this._tab === "entities" ? `
        <div>
          <div class="bms-editor-group-title">Сутності (авто + ручне перевизначення)</div>
          <p style="font-size:12px; opacity:0.65; margin:0 0 8px; line-height:1.4;">
            Під кожним полем видно, який entity підтягнуто автоматично.
            Змінюйте лише якщо авто-вибір помилковий.
          </p>
          ${this._renderEntityGroups()}
          ${this._renderCellVoltagesGroup()}
        </div>` : ""}
        ${this._tab === "layout" ? this._renderLayoutEditor() : ""}
      </div>
    `;
    this.querySelectorAll(".bms-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._tab = btn.dataset.tab;
        this._render();
      });
    });
    const nameEl = this.querySelector("#name");
    if (nameEl) nameEl.addEventListener("change", (e) => this._update("name", e.target.value));
    const modeEl = this.querySelector("#display_mode");
    if (modeEl) modeEl.addEventListener("change", (e) => this._update("display_mode", e.target.value));
    const devSel = this.querySelector("#bms-device-select");
    if (devSel) {
      devSel.addEventListener("change", (e) => {
        const entities = { ...this._entities() };
        if (e.target.value) entities.device_id = e.target.value;
        else delete entities.device_id;
        this._update("entities", entities);
      });
    }
    const wizardBtn = this.querySelector("#wizard-btn");
    if (wizardBtn) wizardBtn.addEventListener("click", () => this._runWizard());
    this._wireLayoutEditor();
    this._wireEntityFields();
    this._mounted = true;
  }

  _layoutConfig() {
    const raw = (this._config && this._config.layout) || [];
    const byId = Object.fromEntries((Array.isArray(raw) ? raw : []).map((b) => [b.id, b]));
    return LAYOUT_BLOCKS.map((b) => {
      const cur = byId[b.id];
      return {
        id: b.id,
        label: b.label,
        visible: cur && cur.visible === false ? false : true,
        scale: cur && Number(cur.scale) > 0 ? Number(cur.scale) : 1,
      };
    }).sort((a, b) => {
      const rawArr = Array.isArray(raw) ? raw : [];
      const ia = rawArr.findIndex((x) => x.id === a.id);
      const ib = rawArr.findIndex((x) => x.id === b.id);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  _renderLayoutEditor() {
    const rows = this._layoutConfig()
      .map(
        (b, idx) => `
      <div class="bms-layout-row" draggable="true" data-layout-id="${b.id}" data-idx="${idx}">
        <button type="button" data-layout-up title="Вгору">↑</button>
        <button type="button" data-layout-down title="Вниз">↓</button>
        <label style="display:flex;align-items:center;gap:6px;margin:0;">
          <input type="checkbox" data-layout-vis ${b.visible ? "checked" : ""} />
        </label>
        <span class="bms-layout-name">${b.label}</span>
        <span style="font-size:11px;opacity:0.55;">×${b.scale.toFixed(1)}</span>
        <input type="range" min="0.6" max="1.6" step="0.1" value="${b.scale}" data-layout-scale />
      </div>`
      )
      .join("");
    return `
      <div>
        <p style="font-size:12px; opacity:0.7; margin:0 0 10px; line-height:1.4;">
          Порядок блоків (↑↓ або перетягування), видимість і відносний масштаб.
          Масштаб зберігається в конфізі і застосовується пропорційно.
        </p>
        ${rows}
        <button type="button" id="layout-reset"
          style="margin-top:8px;width:100%;padding:8px;border-radius:8px;border:1px solid var(--divider-color,#333);background:transparent;color:var(--primary-text-color);cursor:pointer;font-size:12px;">
          Скинути розкладку
        </button>
      </div>`;
  }

  _wireLayoutEditor() {
    const save = (blocks) => {
      this._update(
        "layout",
        blocks.map(({ id, visible, scale }) => ({ id, visible, scale }))
      );
    };
    const rows = [...this.querySelectorAll(".bms-layout-row")];
    if (!rows.length) return;

    rows.forEach((row) => {
      const id = row.dataset.layoutId;
      row.querySelector("[data-layout-up]")?.addEventListener("click", () => {
        const list = this._layoutConfig();
        const i = list.findIndex((b) => b.id === id);
        if (i > 0) {
          [list[i - 1], list[i]] = [list[i], list[i - 1]];
          save(list);
        }
      });
      row.querySelector("[data-layout-down]")?.addEventListener("click", () => {
        const list = this._layoutConfig();
        const i = list.findIndex((b) => b.id === id);
        if (i >= 0 && i < list.length - 1) {
          [list[i + 1], list[i]] = [list[i], list[i + 1]];
          save(list);
        }
      });
      row.querySelector("[data-layout-vis]")?.addEventListener("change", (e) => {
        const list = this._layoutConfig();
        const b = list.find((x) => x.id === id);
        if (b) b.visible = e.target.checked;
        save(list);
      });
      row.querySelector("[data-layout-scale]")?.addEventListener("change", (e) => {
        const list = this._layoutConfig();
        const b = list.find((x) => x.id === id);
        if (b) b.scale = Number(e.target.value);
        save(list);
      });
      row.addEventListener("dragstart", (e) => {
        row.classList.add("dragging");
        e.dataTransfer.setData("text/plain", id);
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (e) => e.preventDefault());
      row.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        const toId = id;
        if (!fromId || fromId === toId) return;
        const list = this._layoutConfig();
        const fi = list.findIndex((b) => b.id === fromId);
        const ti = list.findIndex((b) => b.id === toId);
        if (fi < 0 || ti < 0) return;
        const [item] = list.splice(fi, 1);
        list.splice(ti, 0, item);
        save(list);
      });
    });
    this.querySelector("#layout-reset")?.addEventListener("click", () => {
      this._update("layout", defaultLayout());
    });
  }

  /** Підключає ha-entity-picker (або текстові fallback-інпути) до значень
   *  entities/cell_voltages у конфізі картки, без повного _render() на
   *  кожну зміну — інакше редактор губив би фокус під час набору тексту. */
  _wireEntityFields() {
    const entities = this._entities();
    // Для показу значення в пікері беремо ефективні (авто+ручні) сутності,
    // щоб було видно, що саме автоматично підхоплено — але збереження
    // (_updateEntity) завжди пише лише в ручний блок entities.*.
    const displayEntities = this._effectiveEntities();

    const devWrap = this.querySelector('.bms-field[data-key="device_id"]');
    if (devWrap) {
      const devPicker = devWrap.querySelector("ha-device-picker");
      if (devPicker) {
        devPicker.hass = this._hass;
        devPicker.value = entities.device_id || "";
        devPicker.label = "Акумулятор (BMS_BLE-HA)";
        devPicker.addEventListener("value-changed", (ev) => {
          ev.stopPropagation();
          this._updateEntity("device_id", ev.detail.value || undefined);
        });
      } else {
        const devInput = devWrap.querySelector("input[data-key='device_id']");
        if (devInput) {
          devInput.addEventListener("change", (ev) =>
            this._updateEntity("device_id", ev.target.value.trim() || undefined)
          );
        }
      }
    }

    this.querySelectorAll(".bms-field[data-key]:not([data-index])").forEach((wrap) => {
      const key = wrap.dataset.key;
      if (key === "device_id") return;
      const domain = wrap.dataset.domain;
      const picker = wrap.querySelector("ha-entity-picker");
      if (picker) {
        picker.hass = this._hass;
        picker.value = displayEntities[key] || "";
        picker.label = ENTITY_FIELD_GROUPS.flatMap((g) => g.fields).find((f) => f[0] === key)?.[1] || key;
        if (domain) picker.includeDomains = [domain];
        picker.allowCustomEntity = true;
        picker.addEventListener("value-changed", (ev) => {
          ev.stopPropagation();
          this._updateEntity(key, ev.detail.value || undefined);
        });
      } else {
        const input = wrap.querySelector("input[data-key]");
        if (input) {
          input.addEventListener("change", (ev) => this._updateEntity(key, ev.target.value.trim() || undefined));
        }
      }
    });

    this.querySelectorAll("ha-entity-picker[data-cell-index]").forEach((picker) => {
      const idx = Number(picker.dataset.cellIndex);
      picker.hass = this._hass;
      picker.value = this._cellVoltagesList()[idx] || "";
      picker.label = `Комірка ${idx + 1}`;
      picker.includeDomains = ["sensor"];
      picker.allowCustomEntity = true;
      picker.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        this._updateCellVoltage(idx, ev.detail.value);
      });
    });
    this.querySelectorAll("input[data-cell-index]").forEach((input) => {
      const idx = Number(input.dataset.cellIndex);
      input.addEventListener("change", (ev) => this._updateCellVoltage(idx, ev.target.value.trim()));
    });
    this.querySelectorAll(".bms-cell-remove").forEach((btn) => {
      btn.addEventListener("click", () => this._removeCellVoltage(Number(btn.dataset.cellIndex)));
    });
    const addBtn = this.querySelector("#cell-add-btn");
    if (addBtn) addBtn.addEventListener("click", () => this._addCellVoltage());
  }

  _updateEntity(key, value) {
    const entities = { ...this._entities() };
    if (value) entities[key] = value;
    else delete entities[key];
    this._update("entities", entities, { skipRender: true });
  }

  _updateCellVoltage(idx, value) {
    const list = [...this._cellVoltagesList()];
    list[idx] = value || "";
    this._updateEntity("cell_voltages", list.filter((v) => v));
  }

  _addCellVoltage() {
    const entities = { ...this._entities() };
    entities.cell_voltages = [...this._cellVoltagesList(), ""];
    this._update("entities", entities);
  }

  _removeCellVoltage(idx) {
    const entities = { ...this._entities() };
    const list = [...this._cellVoltagesList()];
    list.splice(idx, 1);
    entities.cell_voltages = list;
    this._update("entities", entities);
  }

  _update(key, value, opts) {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
    // Для точкових змін в entities (введення тексту, вибір у пікері) не
    // перерендерюємо весь редактор одразу — це губило б фокус/курсор.
    // Повний _render() спрацює на наступний виклик setConfig() ззовні,
    // і при явних структурних змінах (додати/прибрати комірку тощо).
    if (!opts || !opts.skipRender) this._render();
  }
}
customElements.define("ha-bms-ble-card-editor", HaBmsBleCardEditor);

class HaBmsBleCard extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._expanded = false;
    this._uid = Math.random().toString(36).slice(2, 9);
    this._resolvedEntities = {};
  }

  static getConfigElement() {
    return document.createElement("ha-bms-ble-card-editor");
  }

  static getStubConfig() {
    return { display_mode: "widget" };
  }

  setConfig(config) {
    this._config = { display_mode: "widget", ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return this._config && this._config.display_mode === "inline" ? 6 : 3;
  }

  connectedCallback() {
    window.addEventListener("orientationchange", this._onOrient = () => {
      if (this._expanded) this._render();
    });
  }

  disconnectedCallback() {
    if (this._onOrient) window.removeEventListener("orientationchange", this._onOrient);
  }

  _resolvedDeviceId() {
    if (this._config && this._config.entities && this._config.entities.device_id) {
      return this._config.entities.device_id;
    }
    if (!this._hass) return undefined;
    const ids = findBmsBleDeviceIds(this._hass);
    return ids.length === 1 ? ids[0] : undefined;
  }

  _autoEntities() {
    const deviceId = this._resolvedDeviceId();
    return deviceId && this._hass ? autoDiscoverEntities(this._hass, deviceId) : {};
  }

  _effectiveEntities() {
    return { ...this._autoEntities(), ...((this._config && this._config.entities) || {}) };
  }

  _e(key) {
    return this._resolvedEntities ? this._resolvedEntities[key] : undefined;
  }

  _hasAnyData() {
    return !!(this._e("soc") || this._e("voltage") || this._e("current") || this._e("power"));
  }

  _batteryName() {
    if (this._config.name && this._config.name.trim()) return this._config.name.trim();
    const deviceId = this._resolvedDeviceId();
    if (deviceId && this._hass && this._hass.devices) {
      const device = this._hass.devices[deviceId];
      if (device) {
        const deviceName = device.name_by_user || device.name;
        if (deviceName) return deviceName;
      }
    }
    const anchorEntity = this._e("soc") || this._e("voltage") || this._e("current") || this._e("power");
    if (anchorEntity && this._hass) {
      const friendly = attrOf(this._hass, anchorEntity, "friendly_name");
      if (friendly) {
        const stripped = friendly
          .replace(/\s*(voltage|напруга|current|струм|power|потужність|soc|заряд).*$/i, "")
          .trim();
        if (stripped) return stripped;
      }
    }
    return "BMS Battery";
  }

  _cellVoltages() {
    const explicit = this._e("cell_voltages");
    if (Array.isArray(explicit) && explicit.length) {
      return explicit.map((id) => Number(stateOf(this._hass, id)));
    }
    const deltaEntity = this._e("delta_cell_voltage");
    const arr = attrOf(this._hass, deltaEntity, "cell_voltages");
    if (Array.isArray(arr)) return arr.map(Number);
    return [];
  }

  _statusInfo() {
    const problem = stateOf(this._hass, this._e("problem"));
    const charging = stateOf(this._hass, this._e("charging"));
    const current = Number(stateOf(this._hass, this._e("current")));
    if (problem === "on") return { label: "Проблема", icon: "ti-alert-triangle", color: "danger" };
    if (charging === "on" || current > 0.3) return { label: "Заряджається", icon: "ti-bolt", color: "success" };
    if (current < -0.3) return { label: "Розряджається", icon: "ti-bolt-off", color: "warning" };
    return { label: "У простої", icon: "ti-pause", color: "neutral" };
  }

  _statusColorVars(color) {
    if (color === "success") return { bg: "rgba(29,158,117,0.18)", fg: "#1D9E75" };
    if (color === "warning") return { bg: "rgba(239,159,39,0.18)", fg: "#EF9F27" };
    if (color === "danger") return { bg: "rgba(226,75,74,0.18)", fg: "#E24B4A" };
    return { bg: "rgba(127,127,127,0.12)", fg: "var(--secondary-text-color,#888)" };
  }

  _cellColor(v, min, max, delta) {
    const th = { ...DEFAULT_THRESHOLDS, ...((this._config && this._config.thresholds) || {}) };
    if (delta >= th.cell_delta_critical) {
      if (v === min || v === max) return "#E24B4A";
    }
    if (delta >= th.cell_delta_warning) {
      if (v === min || v === max) return "#EF9F27";
    }
    return "#1D9E75";
  }

  /* ===== Battery shape (mockup: filled body + % inside) ===== */
  _renderBatteryShape(percent, variant) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const color = batteryFillColor(p);
    const clipId = `bms-fill-clip-${this._uid}-${variant}`;
    const isMini = variant === "mini";
    const w = isMini ? 72 : 120;
    const h = isMini ? 120 : 180;
    const wall = isMini ? 3 : 4;
    const bodyX = 8, bodyY = 14, bodyW = w - 16, bodyH = h - 22, radius = 14;
    const termW = w * 0.38, termH = 8, termX = (w - termW) / 2;
    const pad = 5;
    const fillH = Math.max(0, (bodyH - pad * 2) * (p / 100));
    const fillY = bodyY + pad + (bodyH - pad * 2 - fillH);

    return `
      <div class="bms-battery-shape bms-battery-shape-${variant}">
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs>
            <linearGradient id="bms-grad-${this._uid}-${variant}" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
              <stop offset="100%" stop-color="${color}" stop-opacity="0.75"/>
            </linearGradient>
            <clipPath id="${clipId}">
              <rect x="${bodyX + 2}" y="${bodyY + 2}" width="${bodyW - 4}" height="${bodyH - 4}" rx="${radius - 2}"/>
            </clipPath>
          </defs>
          <rect x="${termX}" y="${bodyY - termH}" width="${termW}" height="${termH + 3}" rx="3"
            fill="none" stroke="rgba(160,170,180,0.7)" stroke-width="${wall}"/>
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${radius}"
            fill="rgba(20,24,28,0.35)" stroke="rgba(160,170,180,0.7)" stroke-width="${wall}"/>
          <rect x="${bodyX + pad}" y="${fillY}" width="${bodyW - pad * 2}" height="${fillH}"
            fill="url(#bms-grad-${this._uid}-${variant})" clip-path="url(#${clipId})" rx="6"/>
        </svg>
        <div class="bms-battery-label">
          <span class="bms-battery-pct">${p.toFixed(0)}%</span>
          <span class="bms-battery-sub">SOC</span>
        </div>
      </div>
    `;
  }

  /* ===== Cell as filled rounded rect (mockup style) ===== */
  _renderCellBatteryMini(v, idx, color) {
    const frac = cellVoltageFraction(v);
    const w = 44, h = 64;
    const bodyX = 6, bodyY = 10, bodyW = w - 12, bodyH = h - 16, radius = 7;
    const termW = w * 0.36, termH = 5, termX = (w - termW) / 2;
    const pad = 3;
    const fillH = Math.max(0, (bodyH - pad * 2) * frac);
    const fillY = bodyY + pad + (bodyH - pad * 2 - fillH);
    const clipId = `bms-cell-clip-${this._uid}-${idx}`;
    return `
      <div class="bms-cell-batt" title="C${idx + 1}: ${Number.isFinite(v) ? v.toFixed(3) : "—"} V">
        <div class="bms-cell-v">${Number.isFinite(v) ? v.toFixed(3) : "—"}</div>
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs>
            <clipPath id="${clipId}">
              <rect x="${bodyX + 1}" y="${bodyY + 1}" width="${bodyW - 2}" height="${bodyH - 2}" rx="${radius - 1}"/>
            </clipPath>
          </defs>
          <rect x="${termX}" y="${bodyY - termH}" width="${termW}" height="${termH + 2}" rx="2"
            fill="none" stroke="rgba(160,170,180,0.65)" stroke-width="2"/>
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${radius}"
            fill="rgba(0,0,0,0.25)" stroke="rgba(160,170,180,0.65)" stroke-width="2"/>
          <rect x="${bodyX + pad}" y="${fillY}" width="${bodyW - pad * 2}" height="${fillH}"
            fill="${color}" clip-path="url(#${clipId})" rx="3"/>
        </svg>
        <div class="bms-cell-name">C${idx + 1}</div>
      </div>
    `;
  }

  _renderMetric(label, value, icon, color) {
    return `
      <div class="bms-metric">
        ${icon ? `<div class="bms-metric-icon" style="color:${color || "var(--primary-color,#38BDF8)"}"><i class="ti ${icon}"></i></div>` : ""}
        <div class="bms-metric-value">${value}</div>
        <div class="bms-metric-label">${label}</div>
      </div>
    `;
  }

  _renderCapacityCard(label, entityId, icon) {
    if (!entityId) return "";
    const val = stateOf(this._hass, entityId);
    const unit = attrOf(this._hass, entityId, "unit_of_measurement") || "Ah";
    return this._renderMetric(label, `${fmt(val, 1)} ${unit}`, icon || "ti-battery-2", "#38BDF8");
  }

  _renderDischargeCard(label, entityId) {
    if (!entityId) return "";
    const val = stateOf(this._hass, entityId);
    return this._renderMetric(label, `${fmt(val, 1)} год`, "ti-clock-hour-4", "#38BDF8");
  }

  _renderDiagBadge(label, entityId, goodWhenOn) {
    const state = stateOf(this._hass, entityId);
    if (state === undefined) return "";
    const on = state === "on" || state === "true";
    const good = goodWhenOn ? on : !on;
    const c = this._statusColorVars(good ? "success" : "warning");
    return `
      <div class="bms-diag-badge" style="background:${c.bg}; color:${c.fg};">
        <div class="bms-diag-badge-label">${label}</div>
        <div class="bms-diag-badge-value">${on ? "Так" : "Ні"}</div>
      </div>
    `;
  }

  _hasCapacityEntities() {
    return !!(this._e("capacity_daily") || this._e("capacity_weekly") || this._e("capacity_monthly") || this._e("capacity_total"));
  }

  _hasDischargeEntities() {
    return !!(this._e("discharge_time_daily") || this._e("discharge_time_weekly") || this._e("discharge_time_monthly"));
  }

  _cellStats() {
    const cells = this._cellVoltages();
    if (!cells.length) return null;
    const finite = cells.filter(Number.isFinite);
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const delta = max - min;
    return { cells, min, max, delta, minIdx: cells.indexOf(min), maxIdx: cells.indexOf(max) };
  }

  _renderCellBatteries() {
    const st = this._cellStats();
    if (!st) {
      return `<div class="bms-panel"><p class="bms-muted">Немає даних про комірки. Увімкніть Delta cell voltage (diagnostic) у BMS_BLE-HA.</p></div>`;
    }
    const batts = st.cells.map((v, i) => this._renderCellBatteryMini(v, i, this._cellColor(v, st.min, st.max, st.delta))).join("");
    return `
      <div class="bms-panel bms-cells-panel">
        <div class="bms-section-title"><span>Комірки — акумулятори (Δ ${st.delta.toFixed(3)}V)</span></div>
        <div class="bms-cell-batts">${batts}</div>
        <div class="bms-cell-extremes">
          <div class="bms-extreme" style="color:#1D9E75">Макс ${st.max.toFixed(3)} V<br><span class="bms-muted">C${st.maxIdx + 1}</span></div>
          <div class="bms-extreme" style="color:#EF9F27">Мін ${st.min.toFixed(3)} V<br><span class="bms-muted">C${st.minIdx + 1}</span></div>
          <div class="bms-extreme">Δ ${st.delta.toFixed(3)} V<br><span class="bms-muted">Різниця</span></div>
        </div>
      </div>`;
  }

  _renderCellBars() {
    const st = this._cellStats();
    if (!st) return "";
    const rows = st.cells.map((v, i) => {
      const frac = cellVoltageFraction(v);
      const color = this._cellColor(v, st.min, st.max, st.delta);
      return `
        <div class="bms-hbar-row">
          <span class="bms-hbar-lab">C${i + 1}</span>
          <div class="bms-hbar-track">
            <div class="bms-hbar-fill" style="width:${Math.round(frac * 100)}%;background:${color};"></div>
          </div>
          <span class="bms-hbar-val">${Number.isFinite(v) ? v.toFixed(3) : "—"} V</span>
        </div>`;
    }).join("");
    return `
      <div class="bms-panel bms-cells-panel">
        <div class="bms-section-title"><span>Комірки — смужки</span></div>
        <div class="bms-cell-bars">${rows}</div>
      </div>`;
  }

  _renderDiagGrid() {
    const items = [
      ["Балансир", this._e("balancer"), true, "ti-circles-relation"],
      ["MOSFET заряд", this._e("chrg_mosfet"), true, "ti-plug-connected"],
      ["MOSFET розряд", this._e("dischrg_mosfet"), true, "ti-plug-connected"],
      ["Нагрівач", this._e("heater"), true, "ti-flame"],
      ["Проблеми", this._e("problem"), false, "ti-alert-triangle"],
    ];
    const status = this._statusInfo();
    const cells = items.map(([label, id, goodWhenOn, icon]) => {
      const state = stateOf(this._hass, id);
      if (state === undefined) return "";
      const on = state === "on" || state === "true";
      const good = goodWhenOn ? on : !on;
      let tone = "neutral";
      if (label === "Проблеми") tone = on ? "danger" : "success";
      else tone = good ? "success" : "warning";
      const c = this._statusColorVars(tone);
      let value;
      if (label === "Проблеми") value = on ? "Є" : "Немає";
      else if (label === "Балансир") value = on ? "Активний" : "Вимкнено";
      else value = on ? "Увімкнено" : "Вимкнено";
      return `
        <div class="bms-diag-cell">
          <i class="ti ${icon}" style="color:${c.fg}"></i>
          <div class="bms-diag-badge-label">${label}</div>
          <div class="bms-diag-badge-value" style="color:${c.fg}">${value}</div>
        </div>`;
    }).filter(Boolean).join("");
    const sc = this._statusColorVars(status.color);
    const modeLabel = status.label === "Заряджається" ? "Заряд"
      : status.label === "Розряджається" ? "Розряд" : status.label;
    const mode = `
      <div class="bms-diag-cell">
        <i class="ti ti-activity" style="color:${sc.fg}"></i>
        <div class="bms-diag-badge-label">Режим</div>
        <div class="bms-diag-badge-value" style="color:${sc.fg}">${modeLabel}</div>
      </div>`;
    return `<div class="bms-diag-grid">${cells}${mode}</div>`;
  }

  _layoutBlocks() {
    const raw = (this._config && this._config.layout) || [];
    const byId = Object.fromEntries((Array.isArray(raw) ? raw : []).map((b) => [b.id, b]));
    const ordered = [];
    if (Array.isArray(raw) && raw.length) {
      for (const b of raw) {
        const meta = LAYOUT_BLOCKS.find((x) => x.id === b.id);
        if (!meta) continue;
        ordered.push({
          id: b.id,
          visible: b.visible !== false,
          scale: Number(b.scale) > 0 ? Number(b.scale) : 1,
        });
      }
    }
    for (const meta of LAYOUT_BLOCKS) {
      if (!ordered.find((x) => x.id === meta.id)) {
        ordered.push({ id: meta.id, visible: true, scale: 1 });
      }
    }
    return ordered;
  }

  _wrapBlock(id, scale, html) {
    if (!html) return "";
    const s = scale && scale !== 1 ? `style="zoom:${scale};"` : "";
    return `<div class="bms-block bms-block-${id}" data-block="${id}" ${s}>${html}</div>`;
  }

  _etaInfo() {
    const status = this._statusInfo();
    const runtimeRaw = stateOf(this._hass, this._e("runtime"));
    const runtimeNum = Number(runtimeRaw);
    const soc = Number(stateOf(this._hass, this._e("soc")));
    const current = Number(stateOf(this._hass, this._e("current")));
    const design = stateOf(this._hass, this._e("design_capacity"));
    const stored = stateOf(this._hass, this._e("stored_energy"));
    const voltage = stateOf(this._hass, this._e("voltage"));

    let seconds = Number.isFinite(runtimeNum) && runtimeNum > 0 ? runtimeNum : undefined;
    // Під час заряду runtime BMS часто unavailable — оцінюємо
    if (seconds === undefined || (status.color === "success" && !(Number.isFinite(runtimeNum) && runtimeNum > 0))) {
      const est = estimateEtaSeconds({
        soc,
        current,
        designAh: design,
        storedWh: stored,
        packVoltage: voltage,
        charging: status.color === "success",
      });
      if (est && est > 0) seconds = est;
    }

    let label = "Залишок (оцінка)";
    if (status.color === "success") label = "До повного заряду";
    else if (status.color === "warning") label = "До розряду";

    return { seconds, label, socPct: Number.isFinite(soc) ? Math.max(0, Math.min(100, soc)) : 0 };
  }

  _renderFullView() {
    const soc = Number(stateOf(this._hass, this._e("soc")));
    const voltage = stateOf(this._hass, this._e("voltage"));
    const current = stateOf(this._hass, this._e("current"));
    const power = stateOf(this._hass, this._e("power"));
    const temp = stateOf(this._hass, this._e("temperature"));
    const cycles = stateOf(this._hass, this._e("charge_cycles"));
    const link = stateOf(this._hass, this._e("link_quality"));
    const rssi = stateOf(this._hass, this._e("rssi"));
    const stored = stateOf(this._hass, this._e("stored_energy"));
    const status = this._statusInfo();
    const sc = this._statusColorVars(status.color);
    const eta = this._etaInfo();
    const capDaily = this._e("capacity_daily");

    const parts = {
      header: `
        <div class="bms-header">
          <div class="bms-title-block">
            <div class="bms-title">${this._batteryName()}</div>
            <div class="bms-conn"><span class="bms-dot" style="background:${sc.fg}"></span>
              ${status.color === "danger" ? "Проблема" : "Підключено"}</div>
          </div>
          <i class="ti ti-bluetooth" style="color:#38BDF8;font-size:20px;"></i>
        </div>`,
      battery: `
        <div class="bms-panel bms-battery-panel">
          ${this._renderBatteryShape(soc, "full")}
          <span class="bms-status-pill" style="background:${sc.bg};color:${sc.fg};">
            <i class="ti ${status.icon}"></i> ${status.label}
          </span>
          ${eta.seconds !== undefined ? `
          <div class="bms-runtime-inline">
            <div class="bms-runtime-head"><i class="ti ti-clock-hour-4"></i><span>${eta.label}</span></div>
            <div class="bms-runtime-val">~${secondsToHuman(eta.seconds)}</div>
            <div class="bms-soc-bar"><div class="bms-soc-fill" style="width:${eta.socPct}%;background:${batteryFillColor(eta.socPct)};"></div></div>
          </div>` : `
          <div class="bms-runtime-inline">
            <div class="bms-runtime-head"><i class="ti ti-clock-hour-4"></i><span>${eta.label}</span></div>
            <div class="bms-runtime-val">—</div>
            <p class="bms-muted" style="margin-top:4px;font-size:11px;">Немає runtime / недостатньо даних для оцінки (потрібні SOC, струм і ємність)</p>
          </div>`}
        </div>`,
      metrics: `
        <div class="bms-metric-stack">
          ${this._renderMetric("Напруга", fmt(voltage, 2, " V"))}
          ${this._renderMetric("Струм", fmt(current, 1, " A"))}
          ${this._renderMetric("Потужність", fmt(power, 0, " W"))}
          ${this._renderMetric("Температура", fmt(temp, 1, " °C"))}
        </div>`,
      cells_batteries: this._renderCellBatteries(),
      cells_bars: this._renderCellBars(),
      diagnostics: `<div class="bms-panel">${this._renderDiagGrid()}</div>`,
      stats: `
        <div class="bms-stats-strip">
          ${stored !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">Stored</span><span class="bms-stat-v">${fmt(stored, 1)}</span></div>` : ""}
          ${capDaily ? `<div class="bms-stat"><span class="bms-stat-l">Сьогодні</span><span class="bms-stat-v">${fmt(stateOf(this._hass, capDaily), 1)} ${attrOf(this._hass, capDaily, "unit_of_measurement") || "Ah"}</span></div>` : ""}
          ${cycles !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">Цикли</span><span class="bms-stat-v">${fmt(cycles, 0)}</span></div>` : ""}
          ${link !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">Link</span><span class="bms-stat-v">${fmt(link, 0)}%</span></div>` : ""}
          ${rssi !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">RSSI</span><span class="bms-stat-v">${fmt(rssi, 0)} dBm</span></div>` : ""}
        </div>`,
      capacity: `
        <div class="bms-section">
          <div class="bms-section-title"><span>Використано ємності</span></div>
          ${this._hasCapacityEntities() ? `
          <div class="bms-capacity-grid">
            ${this._renderCapacityCard("Сьогодні", this._e("capacity_daily"), "ti-calendar-event")}
            ${this._renderCapacityCard("Тиждень", this._e("capacity_weekly"), "ti-calendar-week")}
            ${this._renderCapacityCard("Місяць", this._e("capacity_monthly"), "ti-calendar-month")}
            ${this._renderCapacityCard("Всього", this._e("capacity_total"), "ti-sum")}
          </div>` : `<p class="bms-muted">Сенсори споживання не налаштовані — кнопка в редакторі.</p>`}
        </div>`,
      discharge_time: this._hasDischargeEntities() ? `
        <div class="bms-section">
          <div class="bms-section-title"><span>Час розряду</span></div>
          <div class="bms-capacity-grid">
            ${this._renderDischargeCard("Сьогодні", this._e("discharge_time_daily"))}
            ${this._renderDischargeCard("Тиждень", this._e("discharge_time_weekly"))}
            ${this._renderDischargeCard("Місяць", this._e("discharge_time_monthly"))}
          </div>
        </div>` : "",
    };

    // Default visual: header, then grid of battery|metrics|cells, then rest
    const blocks = this._layoutBlocks().filter((b) => b.visible !== false);
    const topIds = ["battery", "metrics", "cells_batteries"];
    const top = blocks.filter((b) => topIds.includes(b.id));
    const rest = blocks.filter((b) => !topIds.includes(b.id));

    const topHtml = top.length
      ? `<div class="bms-main-grid">${top.map((b) => this._wrapBlock(b.id, b.scale, parts[b.id])).join("")}</div>`
      : "";
    const restHtml = rest.map((b) => this._wrapBlock(b.id, b.scale, parts[b.id])).join("");

    // Always include header first if visible
    const headerBlock = blocks.find((b) => b.id === "header");
    const headerHtml = headerBlock ? this._wrapBlock("header", headerBlock.scale, parts.header) : "";

    return `<div class="bms-full">${headerHtml}${topHtml}${restHtml}</div>`;
  }

  _renderMiniView() {
    const soc = stateOf(this._hass, this._e("soc"));
    const voltage = stateOf(this._hass, this._e("voltage"));
    const current = stateOf(this._hass, this._e("current"));
    const power = stateOf(this._hass, this._e("power"));
    const temp = stateOf(this._hass, this._e("temperature"));
    const status = this._statusInfo();
    const sc = this._statusColorVars(status.color);
    return `
      <div class="bms-mini" tabindex="0" role="button" aria-label="Відкрити деталі батареї">
        <div class="bms-mini-header">
          <span class="bms-dot" style="background:${sc.fg}"></span>
          <span class="bms-mini-name">${this._batteryName()}</span>
          <i class="ti ti-bluetooth" style="color:#38BDF8;margin-left:auto;"></i>
        </div>
        <div class="bms-mini-body">
          <div class="bms-battery-col">
            ${this._renderBatteryShape(soc, "mini")}
            <span class="bms-status-pill" style="background:${sc.bg};color:${sc.fg};">
              <i class="ti ${status.icon}"></i> ${status.label}
            </span>
          </div>
          <div class="bms-metric-stack">
            ${this._renderMetric("Напруга", fmt(voltage, 2, " V"))}
            ${this._renderMetric("Струм", fmt(current, 1, " A"))}
            ${this._renderMetric("Потужність", fmt(power, 0, " W"))}
            ${this._renderMetric("Температура", fmt(temp, 1, " °C"))}
          </div>
        </div>
      </div>
    `;
  }

  _toggleOverlay(open) {
    this._expanded = open;
    this._render();
  }

  _styles() {
    return `
      <style>
        :host { display:block; max-width:100%; }
        * { box-sizing: border-box; }
        .ti { font-size:15px; vertical-align:-2px; }
        .bms-card {
          --bms-panel: color-mix(in srgb, var(--secondary-background-color, #1e2430) 92%, #0b0f14);
          --bms-border: color-mix(in srgb, var(--divider-color, #2a3140) 80%, transparent);
          background: var(--ha-card-background, var(--card-background-color, #12161e));
          border-radius: 18px; padding: 14px;
          color: var(--primary-text-color, #e8eaed);
          border: 1px solid var(--bms-border);
          box-shadow: 0 8px 28px rgba(0,0,0,0.22);
          container-type: inline-size; container-name: bms;
          max-width: 100%; overflow: hidden;
        }
        .bms-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .bms-title { font-size:15px; font-weight:650; letter-spacing:-0.01em; }
        .bms-conn { font-size:11px; opacity:0.7; display:flex; align-items:center; gap:6px; margin-top:2px; }
        .bms-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; display:inline-block; }
        .bms-main-grid {
          display:grid; grid-template-columns: auto minmax(100px, 140px) minmax(0, 1fr);
          gap: 10px; align-items: start;
        }
        .bms-left-col, .bms-mid-col, .bms-right-col { min-width: 0; }
        .bms-panel {
          background: var(--bms-panel); border: 1px solid var(--bms-border);
          border-radius: 14px; padding: 12px;
        }
        .bms-battery-panel { display:flex; flex-direction:column; align-items:center; gap:10px; }
        .bms-battery-shape { position:relative; display:flex; align-items:center; justify-content:center; }
        .bms-battery-label {
          position:absolute; inset:0; display:flex; flex-direction:column;
          align-items:center; justify-content:center; pointer-events:none; padding-top:6px;
        }
        .bms-battery-pct { font-size:26px; font-weight:750; line-height:1.05; text-shadow:0 1px 6px rgba(0,0,0,0.4); }
        .bms-battery-shape-full .bms-battery-pct { font-size:30px; }
        .bms-battery-sub { font-size:10px; opacity:0.65; letter-spacing:0.05em; }
        .bms-status-pill {
          font-size:11px; padding:5px 12px; border-radius:999px; white-space:nowrap;
          display:inline-flex; align-items:center; gap:5px; font-weight:600;
        }
        .bms-metric-stack { display:flex; flex-direction:column; gap:8px; }
        .bms-metric {
          background: var(--bms-panel); border: 1px solid var(--bms-border);
          border-radius: 12px; padding: 10px 12px;
          display:flex; flex-direction:column; gap:2px; min-width:0;
        }
        .bms-metric-icon { font-size:14px; line-height:1; }
        .bms-metric-value { font-size:16px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:-0.02em; }
        .bms-metric-label { font-size:10px; opacity:0.55; }
        .bms-runtime-panel, .bms-runtime-inline { margin-top:10px; width:100%; }
        .bms-runtime-inline { text-align:center; }
        .bms-block { margin-bottom: 10px; }
        .bms-block-header { margin-bottom: 12px; }
        .bms-main-grid > .bms-block { margin-bottom: 0; }
        .bms-runtime-head { display:flex; align-items:center; gap:6px; font-size:12px; opacity:0.8; }
        .bms-runtime-val { font-size:18px; font-weight:700; margin:6px 0 8px; }
        .bms-soc-bar { height:8px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden; }
        .bms-soc-fill { height:100%; border-radius:999px; }
        .bms-soc-bar-lab { font-size:11px; opacity:0.6; text-align:right; margin-top:4px; }
        .bms-section-title { display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:600; opacity:0.9; margin-bottom:10px; }
        .bms-muted { opacity:0.55; font-size:12px; margin:0; }
        .bms-cell-batts {
          display:flex; flex-wrap:wrap; gap:10px; justify-content:flex-start; margin-bottom:12px;
        }
        .bms-cell-batt {
          display:flex; flex-direction:column; align-items:center; gap:3px;
          background: rgba(0,0,0,0.15); border-radius:12px; padding:6px 6px 4px;
          border: 1px solid var(--bms-border);
        }
        .bms-cell-v { font-size:11px; font-weight:700; }
        .bms-cell-name { font-size:10px; opacity:0.55; }
        .bms-cell-bars { margin-top:2px; }
        .bms-hbar-row { display:grid; grid-template-columns: 28px minmax(0,1fr) 64px; gap:8px; align-items:center; margin-bottom:7px; }
        .bms-hbar-lab { font-size:11px; opacity:0.7; font-weight:600; }
        .bms-hbar-track { height:10px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden; }
        .bms-hbar-fill { height:100%; border-radius:999px; }
        .bms-hbar-val { font-size:11px; text-align:right; font-weight:600; opacity:0.9; }
        .bms-cell-extremes { display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:10px; }
        .bms-extreme { background: rgba(0,0,0,0.18); border-radius:10px; padding:8px 6px; text-align:center; font-size:12px; font-weight:650; line-height:1.35; }
        .bms-diag-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .bms-diag-cell { text-align:center; padding:6px 4px; }
        .bms-diag-badge-label { font-size:10px; opacity:0.65; margin-top:2px; }
        .bms-diag-badge-value { font-size:12px; font-weight:650; }
        .bms-stats-strip {
          display:grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr));
          gap:0; margin-top:12px; background: var(--bms-panel); border:1px solid var(--bms-border);
          border-radius:14px; overflow:hidden;
        }
        .bms-stat { padding:10px 8px; text-align:center; border-right:1px solid var(--bms-border); }
        .bms-stat:last-child { border-right:none; }
        .bms-stat-l { display:block; font-size:10px; opacity:0.55; margin-bottom:2px; }
        .bms-stat-v { display:block; font-size:14px; font-weight:700; }
        .bms-section { margin-top:14px; }
        .bms-capacity-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:8px; }
        .bms-capacity-grid .bms-metric { align-items:center; text-align:center; }
        .bms-mini { cursor:pointer; outline:none; }
        .bms-mini-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .bms-mini-name { font-size:14px; font-weight:600; }
        .bms-mini-body { display:flex; gap:12px; align-items:flex-start; }
        .bms-battery-col { display:flex; flex-direction:column; align-items:center; gap:8px; flex-shrink:0; }
        .bms-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:12px;
          backdrop-filter: blur(4px);
        }
        .bms-overlay-inner {
          background: var(--ha-card-background, var(--card-background-color, #12161e));
          border-radius:18px; max-width:min(920px, 100%); width:100%; max-height:94vh;
          overflow:auto; padding:14px; position:relative;
          border:1px solid var(--bms-border); box-shadow: 0 16px 48px rgba(0,0,0,0.45);
        }
        .bms-overlay-close {
          position:absolute; top:8px; right:10px; border:none; background:transparent;
          color:var(--primary-text-color); font-size:18px; cursor:pointer; z-index:2;
          opacity:0.7; padding:4px 8px;
        }
        @container bms (max-width: 520px) {
          .bms-main-grid { grid-template-columns: 1fr; }
          .bms-mid-col .bms-metric-stack { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          .bms-diag-grid { grid-template-columns:1fr 1fr; }
        }
        @container bms (min-width: 700px) {
          .bms-main-grid { grid-template-columns: 150px 130px minmax(0, 1fr); gap:12px; }
        }
      </style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
    `;
  }

  _render() {
    if (!this._config || !this._hass) return;
    this._resolvedEntities = this._effectiveEntities();

    if (!this._hasAnyData()) {
      this.innerHTML = `
        <ha-card style="padding:16px;border-radius:18px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-weight:600;">
            <i class="ti ti-bluetooth" style="font-size:16px;"></i>
            <span>${this._config.name && this._config.name.trim() ? this._config.name.trim() : "BMS Battery"}</span>
          </div>
          <p style="font-size:13px;opacity:0.75;margin:0;">
            Не вдалося знайти акумулятор BMS_BLE-HA. Перевірте інтеграцію або оберіть пристрій у редакторі картки.
          </p>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
        </ha-card>`;
      return;
    }

    const style = this._styles();

    if (this._config.display_mode === "inline") {
      this.innerHTML = `${style}<ha-card class="bms-card">${this._renderFullView()}</ha-card>`;
      return;
    }

    const isLandscape = window.innerWidth > window.innerHeight;
    this.innerHTML = `
      ${style}
      <ha-card class="bms-card">${this._renderMiniView()}</ha-card>
      ${this._expanded ? `
        <div class="bms-overlay ${isLandscape ? "landscape" : "portrait"}">
          <div class="bms-overlay-inner">
            <button class="bms-overlay-close" aria-label="Закрити">✕</button>
            <div class="bms-card" style="padding:0;border:none;box-shadow:none;">${this._renderFullView()}</div>
          </div>
        </div>` : ""}
    `;

    const miniEl = this.querySelector(".bms-mini");
    if (miniEl) {
      miniEl.addEventListener("click", () => this._toggleOverlay(true));
      miniEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") this._toggleOverlay(true);
      });
    }
    const overlayEl = this.querySelector(".bms-overlay");
    const closeBtn = this.querySelector(".bms-overlay-close");
    if (overlayEl) {
      overlayEl.addEventListener("click", (e) => {
        if (e.target === overlayEl) this._toggleOverlay(false);
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", () => this._toggleOverlay(false));
  }
}

customElements.define("ha-bms-ble-card", HaBmsBleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-bms-ble-card",
  name: "BMS BLE Battery Card",
  description: "Картка для BLE BMS-акумуляторів (Redodo/LiTime/JBD/Daly/JK/Seplos) через BMS_BLE-HA",
  preview: true,
});

// Чисті допоміжні функції винесені для юніт-тестів (Node, CommonJS).
// У браузері `module` не визначений, тому цей блок там просто не спрацює.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fmt,
    secondsToHuman,
    estimateEtaSeconds,
    batteryFillColor,
    dischargeOnlyTemplate,
    cellVoltageFraction,
    CELL_VOLTAGE_RANGE,
    DEFAULT_THRESHOLDS,
    BMS_BLE_DOMAIN,
    findBmsBleDeviceIds,
    autoDiscoverEntities,
    LAYOUT_BLOCKS,
    defaultLayout,
  };
}
