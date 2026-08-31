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

      </style>
      <div class="bms-editor" style="padding:12px;display:flex;flex-direction:column;gap:12px;max-width:100%;overflow-x:hidden;">
        <div class="bms-tabs">
          <button type="button" class="bms-tab ${this._tab === "main" ? "active" : ""}" data-tab="main">Основне</button>
          <button type="button" class="bms-tab ${this._tab === "entities" ? "active" : ""}" data-tab="entities">Сутності</button>
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
    this._wireEntityFields();
    this._mounted = true;
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
    if (!finite.length) return null;
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const delta = max - min;
    return { cells, min, max, delta, minIdx: cells.indexOf(min), maxIdx: cells.indexOf(max) };
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
    if (seconds === undefined || (status.color === "success" && !(Number.isFinite(runtimeNum) && runtimeNum > 0))) {
      const est = estimateEtaSeconds({
        soc, current, designAh: design, storedWh: stored, packVoltage: voltage,
        charging: status.color === "success",
      });
      if (est && est > 0) seconds = est;
    }
    let label = "Залишок (оцінка)";
    if (status.color === "success") label = "До повного заряду";
    else if (status.color === "warning") label = "До розряду";
    return {
      seconds,
      label,
      socPct: Number.isFinite(soc) ? Math.max(0, Math.min(100, soc)) : 0,
    };
  }

  _renderCellsPanel() {
    const st = this._cellStats();
    if (!st) {
      return `<div class="bms-panel"><p class="bms-muted">Немає даних про комірки. Увімкніть Delta cell voltage у BMS_BLE-HA.</p></div>`;
    }
    const rows = st.cells.map((v, i) => {
      const frac = cellVoltageFraction(v);
      const color = this._cellColor(v, st.min, st.max, st.delta);
      return `
        <div class="bms-hbar-row">
          <span class="bms-hbar-lab">C${i + 1}</span>
          <div class="bms-hbar-track">
            <div class="bms-hbar-fill" style="width:${Math.round(frac * 100)}%;background:${color};"></div>
            <div class="bms-hbar-rest"></div>
          </div>
          <span class="bms-hbar-val">${Number.isFinite(v) ? v.toFixed(3) : "—"} V</span>
        </div>`;
    }).join("");
    return `
      <div class="bms-panel bms-cells-panel">
        <div class="bms-panel-title">Комірки (Δ ${st.delta.toFixed(3)}V)</div>
        ${rows}
        <div class="bms-cell-extremes">
          <div class="bms-extreme bms-extreme-max">
            <div class="bms-extreme-v">Макс ${st.max.toFixed(3)} V</div>
            <div class="bms-extreme-s">C${st.maxIdx + 1}</div>
          </div>
          <div class="bms-extreme bms-extreme-min">
            <div class="bms-extreme-v">Мін ${st.min.toFixed(3)} V</div>
            <div class="bms-extreme-s">C${st.minIdx + 1}</div>
          </div>
          <div class="bms-extreme">
            <div class="bms-extreme-v">Δ ${st.delta.toFixed(3)} V</div>
            <div class="bms-extreme-s">Різниця</div>
          </div>
        </div>
      </div>`;
  }

  _renderDiagGrid() {
    const items = [
      ["Балансир", this._e("balancer"), true, "ti-circles-relation", (on) => on ? "Активний" : "Вимкнено"],
      ["MOSFET заряд", this._e("chrg_mosfet"), true, "ti-plug-connected", (on) => on ? "Увімкнено" : "Вимкнено"],
      ["MOSFET розряд", this._e("dischrg_mosfet"), true, "ti-plug-connected", (on) => on ? "Увімкнено" : "Вимкнено"],
      ["Нагрівач", this._e("heater"), true, "ti-flame", (on) => on ? "Увімкнено" : "Вимкнено"],
      ["Проблеми", this._e("problem"), false, "ti-alert-triangle", (on) => on ? "Є" : "Немає"],
    ];
    const status = this._statusInfo();
    const cells = items.map(([label, id, goodWhenOn, icon, fmtVal]) => {
      const state = stateOf(this._hass, id);
      if (state === undefined) return "";
      const on = state === "on" || state === "true";
      let tone = "neutral";
      if (label === "Проблеми") tone = on ? "danger" : "success";
      else tone = (goodWhenOn ? on : !on) ? "success" : "warning";
      const c = this._statusColorVars(tone);
      return `
        <div class="bms-diag-cell">
          <i class="ti ${icon}" style="color:${c.fg}"></i>
          <div class="bms-diag-lab">${label}</div>
          <div class="bms-diag-val" style="color:${c.fg}">${fmtVal(on)}</div>
        </div>`;
    }).filter(Boolean).join("");
    const sc = this._statusColorVars(status.color);
    const modeLabel = status.label === "Заряджається" ? "Заряд"
      : status.label === "Розряджається" ? "Розряд" : status.label;
    cells += `
      <div class="bms-diag-cell">
        <i class="ti ti-activity" style="color:${sc.fg}"></i>
        <div class="bms-diag-lab">Режим</div>
        <div class="bms-diag-val" style="color:${sc.fg}">${modeLabel}</div>
      </div>`;
    return `<div class="bms-panel bms-diag-panel"><div class="bms-diag-grid">${cells}</div></div>`;
  }

  _renderMetric(label, value) {
    return `
      <div class="bms-metric">
        <div class="bms-metric-value">${value}</div>
        <div class="bms-metric-label">${label}</div>
      </div>`;
  }

  _renderCapacityCard(label, entityId) {
    if (!entityId) return "";
    const val = stateOf(this._hass, entityId);
    const unit = attrOf(this._hass, entityId, "unit_of_measurement") || "Ah";
    return `
      <div class="bms-cap-card">
        <div class="bms-cap-label">${label}</div>
        <div class="bms-cap-value">${fmt(val, 1)} <span class="bms-cap-unit">${unit}</span></div>
      </div>`;
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
    const design = stateOf(this._hass, this._e("design_capacity"));
    const status = this._statusInfo();
    const sc = this._statusColorVars(status.color);
    const eta = this._etaInfo();
    const socPct = Number.isFinite(soc) ? Math.max(0, Math.min(100, soc)) : 0;

    // Used / remaining Ah if we have design + daily capacity
    const designN = Number(design);
    const usedToday = this._e("capacity_daily") ? Number(stateOf(this._hass, this._e("capacity_daily"))) : undefined;
    let remainingAh;
    if (Number.isFinite(designN) && Number.isFinite(socPct)) {
      remainingAh = designN * (socPct / 100);
    }

    return `
      <div class="bms-full">
        <div class="bms-header">
          <div class="bms-title-block">
            <div class="bms-title">${this._batteryName()}</div>
            <div class="bms-conn">
              <span class="bms-dot" style="background:${sc.fg}"></span>
              ${status.color === "danger" ? "Проблема" : "Підключено"}
            </div>
          </div>
          <div class="bms-header-right">
            <i class="ti ti-bluetooth bms-bt"></i>
          </div>
        </div>

        <div class="bms-top">
          <div class="bms-col-left">
            <div class="bms-panel bms-battery-panel">
              ${this._renderBatteryShape(soc, "full")}
              <span class="bms-status-pill" style="background:${sc.bg};color:${sc.fg};">
                <i class="ti ${status.icon}"></i> ${status.label}
              </span>
            </div>
            <div class="bms-panel bms-eta-panel">
              <div class="bms-eta-row">
                <i class="ti ti-clock-hour-4"></i>
                <div>
                  <div class="bms-eta-label">${eta.label}</div>
                  <div class="bms-eta-value">${eta.seconds !== undefined ? "~" + secondsToHuman(eta.seconds) : "—"}</div>
                </div>
              </div>
              <div class="bms-soc-bar">
                <div class="bms-soc-fill" style="width:${socPct}%;background:${batteryFillColor(socPct)};"></div>
              </div>
              <div class="bms-soc-bar-lab">${socPct.toFixed(0)}%</div>
            </div>
          </div>

          <div class="bms-col-mid">
            <div class="bms-metric-stack">
              ${this._renderMetric("Напруга", fmt(voltage, 2, " V"))}
              ${this._renderMetric("Струм", fmt(current, 1, " A"))}
              ${this._renderMetric("Потужність", fmt(power, 0, " W"))}
              ${this._renderMetric("Температура", fmt(temp, 1, " °C"))}
            </div>
          </div>

          <div class="bms-col-right">
            ${this._renderCellsPanel()}
            ${this._renderDiagGrid()}
          </div>
        </div>

        <div class="bms-stats-strip">
          ${Number.isFinite(designN) ? `<div class="bms-stat"><span class="bms-stat-l">Ємність</span><span class="bms-stat-v">${fmt(designN, 0)} Ah</span></div>` : ""}
          ${Number.isFinite(usedToday) ? `<div class="bms-stat"><span class="bms-stat-l">Використано</span><span class="bms-stat-v">${fmt(usedToday, 1)} Ah</span></div>` : ""}
          ${remainingAh !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">Залишилось</span><span class="bms-stat-v">${fmt(remainingAh, 1)} Ah</span></div>` : ""}
          ${cycles !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">Цикли</span><span class="bms-stat-v">${fmt(cycles, 0)}</span></div>` : ""}
          ${link !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">Link Quality</span><span class="bms-stat-v">${fmt(link, 0)}%</span></div>` : ""}
          ${rssi !== undefined ? `<div class="bms-stat"><span class="bms-stat-l">RSSI</span><span class="bms-stat-v">${fmt(rssi, 0)} dBm</span></div>` : ""}
        </div>

        <div class="bms-section">
          <div class="bms-section-title">Використано ємності</div>
          ${this._hasCapacityEntities() ? `
          <div class="bms-cap-grid">
            ${this._renderCapacityCard("Сьогодні", this._e("capacity_daily"))}
            ${this._renderCapacityCard("Тиждень", this._e("capacity_weekly"))}
            ${this._renderCapacityCard("Місяць", this._e("capacity_monthly"))}
            ${this._renderCapacityCard("Всього", this._e("capacity_total"))}
          </div>` : `<p class="bms-muted">Сенсори споживання не налаштовані — кнопка в редакторі картки.</p>`}
        </div>

        ${this._hasDischargeEntities() || eta.seconds !== undefined ? `
        <div class="bms-section">
          <div class="bms-section-title">Час роботи до розряду (прогноз)</div>
          <div class="bms-forecast-grid">
            <div class="bms-forecast">
              <i class="ti ti-clock-hour-4"></i>
              <div>
                <div class="bms-forecast-lab">При поточному навантаженні</div>
                <div class="bms-forecast-val">${eta.seconds !== undefined ? secondsToHuman(eta.seconds) : "—"}</div>
              </div>
            </div>
            ${this._e("discharge_time_daily") ? `
            <div class="bms-forecast">
              <i class="ti ti-clock-hour-4"></i>
              <div>
                <div class="bms-forecast-lab">Сьогоднішній розряд</div>
                <div class="bms-forecast-val">~${fmt(stateOf(this._hass, this._e("discharge_time_daily")), 1)} год</div>
              </div>
            </div>` : ""}
            ${this._e("discharge_time_weekly") ? `
            <div class="bms-forecast">
              <i class="ti ti-clock-hour-4"></i>
              <div>
                <div class="bms-forecast-lab">Середній за тиждень</div>
                <div class="bms-forecast-val">~${fmt(stateOf(this._hass, this._e("discharge_time_weekly")), 1)} год</div>
              </div>
            </div>` : ""}
            ${this._e("discharge_time_monthly") ? `
            <div class="bms-forecast">
              <i class="ti ti-clock-hour-4"></i>
              <div>
                <div class="bms-forecast-lab">Середній за місяць</div>
                <div class="bms-forecast-val">~${fmt(stateOf(this._hass, this._e("discharge_time_monthly")), 1)} год</div>
              </div>
            </div>` : ""}
          </div>
        </div>` : ""}

        <div class="bms-section">
          <div class="bms-section-title">Діагностика</div>
          <div class="bms-diag-tiles">
            ${stored !== undefined ? `
            <div class="bms-diag-tile">
              <i class="ti ti-battery-vertical"></i>
              <div class="bms-diag-tile-lab">Stored Energy</div>
              <div class="bms-diag-tile-val">${fmt(stored, 0)} Wh</div>
            </div>` : ""}
            ${stateOf(this._hass, this._e("runtime")) !== undefined ? `
            <div class="bms-diag-tile">
              <i class="ti ti-clock-hour-4"></i>
              <div class="bms-diag-tile-lab">Runtime (BMS)</div>
              <div class="bms-diag-tile-val">${fmt(stateOf(this._hass, this._e("runtime")), 0)} s</div>
              <div class="bms-diag-tile-sub">~${secondsToHuman(Number(stateOf(this._hass, this._e("runtime"))))}</div>
            </div>` : ""}
            ${cycles !== undefined ? `
            <div class="bms-diag-tile">
              <i class="ti ti-refresh"></i>
              <div class="bms-diag-tile-lab">Package Cycles</div>
              <div class="bms-diag-tile-val">${fmt(cycles, 0)}</div>
            </div>` : ""}
            <div class="bms-diag-tile">
              <i class="ti ti-battery"></i>
              <div class="bms-diag-tile-lab">Package Voltage</div>
              <div class="bms-diag-tile-val">${fmt(voltage, 2)} V</div>
            </div>
            <div class="bms-diag-tile">
              <i class="ti ti-wave-sine"></i>
              <div class="bms-diag-tile-lab">Package Current</div>
              <div class="bms-diag-tile-val">${fmt(current, 1)} A</div>
            </div>
            <div class="bms-diag-tile">
              <i class="ti ti-chart-donut"></i>
              <div class="bms-diag-tile-lab">Package SOC</div>
              <div class="bms-diag-tile-val">${fmt(soc, 0)}%</div>
            </div>
          </div>
        </div>
      </div>
    `;
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
          <i class="ti ti-bluetooth bms-bt" style="margin-left:auto;"></i>
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
          --bms-bg: #0e1218;
          --bms-panel: #171c24;
          --bms-panel2: #1c222c;
          --bms-border: rgba(255,255,255,0.06);
          --bms-text: #e8eaed;
          --bms-muted: rgba(232,234,237,0.55);
          --bms-cyan: #38BDF8;
          --bms-green: #22c55e;
          background: var(--bms-bg);
          border-radius: 20px;
          padding: 16px;
          color: var(--bms-text);
          border: 1px solid var(--bms-border);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
          container-type: inline-size;
          container-name: bms;
          max-width: 100%;
          overflow: hidden;
          font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        }
        .bms-header {
          display:flex; align-items:flex-start; justify-content:space-between;
          gap:10px; margin-bottom:14px;
        }
        .bms-title { font-size:16px; font-weight:650; letter-spacing:-0.01em; }
        .bms-conn {
          font-size:12px; color:var(--bms-muted); display:flex; align-items:center; gap:6px; margin-top:4px;
        }
        .bms-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; display:inline-block; }
        .bms-bt { color: var(--bms-cyan); font-size:20px !important; }
        .bms-top {
          display:grid;
          grid-template-columns: 150px 120px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
        }
        .bms-col-left, .bms-col-mid, .bms-col-right { min-width:0; display:flex; flex-direction:column; gap:10px; }
        .bms-panel {
          background: var(--bms-panel);
          border: 1px solid var(--bms-border);
          border-radius: 16px;
          padding: 12px;
        }
        .bms-panel-title {
          font-size:12px; font-weight:600; color:var(--bms-muted); margin-bottom:10px;
        }
        .bms-battery-panel {
          display:flex; flex-direction:column; align-items:center; gap:10px;
          padding: 14px 12px;
        }
        .bms-battery-shape { position:relative; display:flex; align-items:center; justify-content:center; }
        .bms-battery-label {
          position:absolute; inset:0; display:flex; flex-direction:column;
          align-items:center; justify-content:center; pointer-events:none; padding-top:8px;
        }
        .bms-battery-pct {
          font-size:28px; font-weight:750; line-height:1.05;
          text-shadow:0 1px 8px rgba(0,0,0,0.45); color:#fff;
        }
        .bms-battery-shape-full .bms-battery-pct { font-size:32px; }
        .bms-battery-sub { font-size:10px; opacity:0.7; letter-spacing:0.08em; color:#fff; }
        .bms-status-pill {
          font-size:12px; padding:6px 14px; border-radius:999px; white-space:nowrap;
          display:inline-flex; align-items:center; gap:6px; font-weight:600;
        }
        .bms-eta-panel { padding: 12px 14px; }
        .bms-eta-row { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .bms-eta-row .ti { font-size:20px !important; color:var(--bms-muted); }
        .bms-eta-label { font-size:12px; color:var(--bms-muted); }
        .bms-eta-value { font-size:18px; font-weight:700; margin-top:2px; }
        .bms-soc-bar {
          height:8px; border-radius:999px; background:rgba(255,255,255,0.08); overflow:hidden;
        }
        .bms-soc-fill { height:100%; border-radius:999px; }
        .bms-soc-bar-lab { font-size:11px; color:var(--bms-muted); text-align:right; margin-top:4px; }
        .bms-metric-stack { display:flex; flex-direction:column; gap:8px; }
        .bms-metric {
          background: var(--bms-panel);
          border: 1px solid var(--bms-border);
          border-radius: 14px;
          padding: 12px 14px;
          text-align: left;
        }
        .bms-metric-value {
          font-size:17px; font-weight:700; letter-spacing:-0.02em;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .bms-metric-label { font-size:11px; color:var(--bms-muted); margin-top:2px; }
        .bms-hbar-row {
          display:grid; grid-template-columns: 28px minmax(0,1fr) 70px;
          gap:8px; align-items:center; margin-bottom:8px;
        }
        .bms-hbar-lab { font-size:12px; font-weight:600; color:var(--bms-muted); }
        .bms-hbar-track {
          height:12px; border-radius:999px; background:rgba(255,255,255,0.07);
          overflow:hidden; display:flex;
        }
        .bms-hbar-fill { height:100%; border-radius:999px 0 0 999px; }
        .bms-hbar-val { font-size:12px; text-align:right; font-weight:600; }
        .bms-cell-extremes {
          display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px;
        }
        .bms-extreme {
          background: rgba(0,0,0,0.22); border-radius:12px; padding:10px 6px; text-align:center;
        }
        .bms-extreme-v { font-size:12px; font-weight:700; }
        .bms-extreme-s { font-size:11px; color:var(--bms-muted); margin-top:2px; }
        .bms-extreme-max .bms-extreme-v { color: var(--bms-green); }
        .bms-extreme-min .bms-extreme-v { color: #f59e0b; }
        .bms-diag-panel { padding: 10px 8px; }
        .bms-diag-grid {
          display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px 4px;
        }
        .bms-diag-cell { text-align:center; padding:8px 4px; }
        .bms-diag-cell .ti { font-size:18px !important; }
        .bms-diag-lab { font-size:10px; color:var(--bms-muted); margin-top:4px; }
        .bms-diag-val { font-size:12px; font-weight:650; margin-top:2px; }
        .bms-stats-strip {
          display:grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
          gap:0; margin-top:12px;
          background: var(--bms-panel); border:1px solid var(--bms-border);
          border-radius:16px; overflow:hidden;
        }
        .bms-stat {
          padding:12px 8px; text-align:center;
          border-right:1px solid var(--bms-border);
        }
        .bms-stat:last-child { border-right:none; }
        .bms-stat-l { display:block; font-size:10px; color:var(--bms-muted); margin-bottom:4px; }
        .bms-stat-v { display:block; font-size:15px; font-weight:700; }
        .bms-section { margin-top:16px; }
        .bms-section-title {
          font-size:13px; font-weight:600; margin-bottom:10px; color:var(--bms-text);
        }
        .bms-muted { color:var(--bms-muted); font-size:12px; margin:0; }
        .bms-cap-grid {
          display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:10px;
        }
        .bms-cap-card {
          background: var(--bms-panel); border:1px solid var(--bms-border);
          border-radius:16px; padding:14px;
        }
        .bms-cap-label { font-size:12px; color:var(--bms-muted); margin-bottom:6px; }
        .bms-cap-value { font-size:20px; font-weight:700; }
        .bms-cap-unit { font-size:13px; font-weight:500; color:var(--bms-muted); }
        .bms-forecast-grid {
          display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px;
          background: var(--bms-panel); border:1px solid var(--bms-border);
          border-radius:16px; padding:4px;
        }
        .bms-forecast {
          display:flex; align-items:center; gap:10px; padding:12px;
        }
        .bms-forecast .ti { font-size:22px !important; color: var(--bms-cyan); }
        .bms-forecast-lab { font-size:11px; color:var(--bms-muted); }
        .bms-forecast-val { font-size:15px; font-weight:700; margin-top:2px; }
        .bms-diag-tiles {
          display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px;
        }
        .bms-diag-tile {
          background: var(--bms-panel); border:1px solid var(--bms-border);
          border-radius:16px; padding:14px;
        }
        .bms-diag-tile .ti { font-size:20px !important; color: var(--bms-cyan); }
        .bms-diag-tile-lab { font-size:11px; color:var(--bms-muted); margin-top:8px; }
        .bms-diag-tile-val { font-size:16px; font-weight:700; margin-top:4px; }
        .bms-diag-tile-sub { font-size:11px; color:var(--bms-muted); margin-top:2px; }
        .bms-mini { cursor:pointer; outline:none; }
        .bms-mini-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
        .bms-mini-name { font-size:14px; font-weight:600; }
        .bms-mini-body { display:flex; gap:14px; align-items:flex-start; }
        .bms-battery-col { display:flex; flex-direction:column; align-items:center; gap:8px; flex-shrink:0; }
        .bms-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:12px;
          backdrop-filter: blur(6px);
        }
        .bms-overlay-inner {
          background: var(--bms-bg);
          border-radius:20px; max-width:min(960px, 100%); width:100%; max-height:94vh;
          overflow:auto; padding:16px; position:relative;
          border:1px solid var(--bms-border);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .bms-overlay-close {
          position:absolute; top:10px; right:12px; border:none; background:transparent;
          color:var(--bms-text); font-size:18px; cursor:pointer; z-index:2;
          opacity:0.7; padding:4px 8px;
        }
        @container bms (max-width: 560px) {
          .bms-top { grid-template-columns: 1fr; }
          .bms-col-mid .bms-metric-stack {
            display:grid; grid-template-columns:1fr 1fr; gap:8px;
          }
          .bms-diag-grid { grid-template-columns:1fr 1fr; }
        }
        @container bms (min-width: 720px) {
          .bms-top { grid-template-columns: 160px 130px minmax(0, 1fr); gap:14px; }
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
  };
}
