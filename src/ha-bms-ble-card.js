/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "3.0.0-beta.2";

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

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Картка раніше вантажила іконковий шрифт Tabler з зовнішнього CDN
 * (cdn.jsdelivr.net) прямо в innerHTML. Якщо в інстансу Home Assistant
 * немає виходу в інтернет (типово для HAOS у ізольованій мережі) —
 * шрифт не вантажиться і ВСІ іконки на картці зникають, хоча решта
 * дизайну виглядає нормально. Тому іконки тепер малює власний
 * `<ha-icon>` Home Assistant (Material Design Icons, вже вбудовані у
 * фронтенд, без жодних зовнішніх запитів).
 */
const TI_TO_MDI = {
  "ti-alert-triangle": "mdi:alert",
  "ti-battery": "mdi:battery",
  "ti-battery-vertical-filled": "mdi:battery-high",
  "ti-bluetooth": "mdi:bluetooth",
  "ti-bolt": "mdi:lightning-bolt",
  "ti-bolt-off": "mdi:flash-off",
  "ti-chart-donut-3": "mdi:chart-donut",
  "ti-clock-hour-4": "mdi:clock-outline",
  "ti-flame": "mdi:fire",
  "ti-grid-dots": "mdi:grid",
  "ti-pause": "mdi:pause",
  "ti-plug-connected": "mdi:power-plug",
  "ti-refresh": "mdi:refresh",
  "ti-scale": "mdi:scale-balance",
  "ti-topology-star-3": "mdi:sitemap",
  "ti-wave-sine": "mdi:sine-wave",
};

function tiToMdi(tiClass) {
  return TI_TO_MDI[tiClass] || "mdi:help-circle-outline";
}

function haIcon(tiClass, size, color) {
  const style = [
    color ? `color:${color}` : "",
    size ? `--mdc-icon-size:${size}px;width:${size}px;height:${size}px` : "",
  ].filter(Boolean).join(";");
  return `<ha-icon icon="${tiToMdi(tiClass)}"${style ? ` style="${style}"` : ""}></ha-icon>`;
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
 *  потрібною для класифікації (домен, device_class, object_id, unique_id тощо). */
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
        uniqueId: e.unique_id,
        platform: e.platform,
      };
    })
    .sort((a, b) => a.entityId.localeCompare(b.entityId));
}

/**
 * unique_id сутностей BMS_BLE-HA завжди має вигляд `bms_ble-{mac}-{key}`
 * (див. sensor.py / binary_sensor.py самої інтеграції:
 * `self._attr_unique_id = f"{DOMAIN}-{unique_id}-{descr.key}"`), де
 * {key} — точний внутрішній ключ сенсора. MAC у форматі format_mac()
 * містить двокрапки, а не дефіси, тому останній сегмент після "-" —
 * це завжди {key}, без винятків.
 */
function keyFromUniqueId(uniqueId) {
  if (!uniqueId) return undefined;
  const idx = uniqueId.lastIndexOf("-");
  return idx >= 0 ? uniqueId.slice(idx + 1) : undefined;
}

/**
 * Точна відповідність "внутрішній ключ BMS_BLE-HA" → "ключ конфігу картки".
 * Це надійніший спосіб автовизначення, ніж підбір за словами в entity_id:
 * деякі сенсори (наприклад cycle_capacity) не мають перекладу назви
 * (translation_key) в самій інтеграції, тож їхній entity_id не обов'язково
 * містить очікуване слово — а unique_id завжди містить точний ключ.
 */
const UNIQUE_ID_KEY_MAP = {
  voltage: "voltage",
  battery_level: "soc",
  battery_health: "soh",
  temperature: "temperature",
  current: "current",
  cycle_capacity: "cycle_capacity",
  cycles: "charge_cycles",
  design_capacity: "design_capacity",
  power: "power",
  runtime: "runtime",
  delta_cell_voltage: "delta_cell_voltage",
  max_cell_voltage: "max_cell_voltage",
  min_cell_voltage: "min_cell_voltage",
  rssi: "rssi",
  link_quality: "link_quality",
  battery_charging: "charging",
  balancer: "balancer",
  chrg_mosfet: "chrg_mosfet",
  dischrg_mosfet: "dischrg_mosfet",
  heater: "heater",
  problem: "problem",
};

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
  { key: "cycle_capacity", domain: "sensor", test: (o) => o.includes("cycle") && o.includes("cap") },
  { key: "soh", domain: "sensor", test: (o) => hasWord(o, "soh") || o.includes("battery_health") || (o.includes("health") && !o.includes("unhealthy")) },
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

  // 1) Найточніший прохід: за унікальним ключем із unique_id (працює
  //    навіть для сенсорів без перекладу назви, наприклад cycle_capacity).
  for (const e of list) {
    if (used.has(e.entityId)) continue;
    const rawKey = keyFromUniqueId(e.uniqueId);
    const cardKey = rawKey && UNIQUE_ID_KEY_MAP[rawKey];
    if (cardKey && !result[cardKey]) {
      result[cardKey] = e.entityId;
      used.add(e.entityId);
    }
  }

  // 2) Фолбек за словами в entity_id/device_class — для сутностей без
  //    unique_id у реєстрі (старі версії фронтенду HA) або нетипових
  //    налаштувань.
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
      ["design_capacity", "Номінальна ємність (Ah)", "sensor"],
      ["cycle_capacity", "Stored Energy / Cycle capacity (Wh)", "sensor"],
      ["soh", "SOH / Battery health (%)", "sensor"],
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
    this._maybeFetchDailyHistory();
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
    if (color === "success") return { bg: "#1f3d29", fg: "#1D9E75" };
    if (color === "warning") return { bg: "#3d3320", fg: "#EF9F27" };
    if (color === "danger") return { bg: "rgba(226,75,74,0.15)", fg: "#E24B4A" };
    return { bg: "rgba(139,150,163,0.12)", fg: "#8b96a3" };
  }

  _cellColor(v, min, max, delta) {
    // Як на mockup: мін комірка — бурштинова, решта зелені
    if (Number.isFinite(min) && v === min && delta >= 0.005) return "#EF9F27";
    if (Number.isFinite(max) && v === max && delta >= 0.03) return "#EF9F27";
    return "#1D9E75";
  }

  /* ===== UI matching bms-dashboard.html reference ===== */
  _renderBatteryShape(percent, variant) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    // CSS battery (not SVG) — same structure as reference HTML
    const topPct = Math.max(8, 100 - p);
    return `
      <div class="battery-shell bms-battery-shape-${variant}">
        <div class="battery-nub"></div>
        <div class="battery-fill" style="top:${topPct}%;">
          <div class="pct">${p.toFixed(0)}%</div>
          <div class="soc-label">SOC</div>
        </div>
      </div>`;
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
    return { cells, min, max, delta: max - min, minIdx: cells.indexOf(min), maxIdx: cells.indexOf(max) };
  }

  /**
   * "Stored Energy" (Wh). Пріоритет:
   * 1) sensor cycle_capacity (реальний sensor BMS_BLE-HA, Wh) — офіційно
   *    підтверджено в const.py / aiobmsble: ATTR_CYCLE_CAP = "cycle_capacity" [Wh].
   * 2) оцінка: design_capacity(Ah) × voltage(V) × soc/100, якщо є всі три.
   */
  _storedEnergyWh() {
    const cycleCap = Number(stateOf(this._hass, this._e("cycle_capacity")));
    if (Number.isFinite(cycleCap) && cycleCap > 0) return cycleCap;
    const design = Number(stateOf(this._hass, this._e("design_capacity")));
    const soc = Number(stateOf(this._hass, this._e("soc")));
    const voltage = Number(stateOf(this._hass, this._e("voltage")));
    if (Number.isFinite(design) && design > 0 && Number.isFinite(voltage) && voltage > 0 && Number.isFinite(soc)) {
      return design * voltage * (soc / 100);
    }
    return undefined;
  }

  /**
   * Balance Current (A). У BMS_BLE-HA це НЕ окрема сутність, а атрибут
   * "balance_current" (список з одним числом) на entity струму (sensor.*_current):
   * see sensor.py: {ATTR_BALANCE_CUR: [data.get("balance_current", 0.0)]}.
   * Тому в налаштуваннях картки немає окремого поля для цього — значення
   * завжди береться з атрибута.
   */
  _balanceCurrentA() {
    const attr = attrOf(this._hass, this._e("current"), "balance_current");
    const v = Array.isArray(attr) ? Number(attr[0]) : Number(attr);
    return Number.isFinite(v) ? v : undefined;
  }

  /**
   * Cell Bitmask — у BMS_BLE-HA це атрибут "cells" на entity балансира
   * (binary_sensor.*_balancer), бінарний рядок типу "1111":
   * see binary_sensor.py: {ATTR_CELLS: f"{balancer:0{cell_count}b}"[::-1]}.
   * Зверни увагу: сам entity балансира вимкнений за замовчуванням у HA —
   * користувачу треба ввімкнути його вручну (Налаштування → Сутності).
   * Немає окремого поля в налаштуваннях — значення завжди береться
   * з атрибута.
   */
  _cellBitmask() {
    return attrOf(this._hass, this._e("balancer"), "cells");
  }

  _etaInfo() {
    const status = this._statusInfo();
    const runtimeNum = Number(stateOf(this._hass, this._e("runtime")));
    const soc = Number(stateOf(this._hass, this._e("soc")));
    const current = Number(stateOf(this._hass, this._e("current")));
    const design = stateOf(this._hass, this._e("design_capacity"));
    const stored = this._storedEnergyWh();
    const voltage = stateOf(this._hass, this._e("voltage"));
    let seconds = Number.isFinite(runtimeNum) && runtimeNum > 0 ? runtimeNum : undefined;
    if (seconds === undefined) {
      const est = estimateEtaSeconds({
        soc, current, designAh: design, storedWh: stored, packVoltage: voltage,
        charging: status.color === "success",
      });
      if (est && est > 0) seconds = est;
    }
    let label = "До розряду";
    if (status.color === "success") label = "До повного заряду";
    return { seconds, label, socPct: Number.isFinite(soc) ? Math.max(0, Math.min(100, soc)) : 0 };
  }

  _renderSparkline(seed) {
    const pts = [];
    let y = 18;
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t = (seed * 19 + i * 11) % 13;
      y = Math.max(4, Math.min(32, y + (t - 6) * 1.3));
      pts.push(y);
    }
    const w = 280, h = 36;
    const max = Math.max(...pts), min = Math.min(...pts);
    const step = w / (n - 1);
    const norm = (v) => h - ((v - min) / (max - min || 1)) * h * 0.8 - h * 0.1;
    const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${norm(v).toFixed(1)}`).join(" ");
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="bms-spark"><path d="${d}" fill="none" stroke="#1D9E75" stroke-width="1.6"/></svg>`;
  }

  _renderCapacityCard(label, entityId, designAh) {
    if (!entityId) return "";
    const val = Number(stateOf(this._hass, entityId));
    const unit = attrOf(this._hass, entityId, "unit_of_measurement") || "Ah";
    let pctHtml = "";
    if (Number.isFinite(val) && Number.isFinite(designAh) && designAh > 0) {
      pctHtml = `<div class="p">${((val / designAh) * 100).toFixed(1)}%</div>`;
    }
    const seed = (entityId || "").length + (Number.isFinite(val) ? Math.round(val * 10) : 0);
    return `
      <div class="usage-card">
        <div class="lbl">${label}</div>
        <div class="val-row"><div class="v">${fmt(val, 1)} ${unit}</div>${pctHtml}</div>
        ${this._renderSparkline(seed)}
      </div>`;
  }

  _renderHistoryBars() {
    const entityId = this._e("capacity_daily");
    if (!entityId) return "";
    const days = this._historyDaily;
    if (!days || !days.length) {
      return `
        <h2 class="section-title">Історія використання по днях</h2>
        <p class="muted-note">Історія завантажується або недоступна — потрібна довготривала статистика
          (recorder, long-term statistics) для сенсора добового споживання "${entityId}".</p>`;
    }
    const maxRaw = Math.max(1, ...days.map((x) => x.v));
    const maxV = Math.max(10, Math.ceil(maxRaw / 10) * 10);
    const todayKey = new Date().toISOString().slice(0, 10);
    const cols = days.map((x) => {
      const isToday = x.dateKey === todayKey;
      return `
      <div class="bar-col">
        <div class="bar-val">${x.v.toFixed(1)} Ah</div>
        <div class="bar ${isToday ? "today" : ""}" style="height:${((x.v / maxV) * 100).toFixed(0)}%"></div>
        <div class="bar-date ${isToday ? "today" : ""}">${x.d}</div>
      </div>`;
    }).join("");
    return `
      <h2 class="section-title">Історія використання по днях</h2>
      <div class="history-box">
        <div class="history-chart">
          <div class="yaxis"><span>${maxV} Ah</span><span>${Math.round(maxV / 2)} Ah</span><span>0 Ah</span></div>
          ${cols}
        </div>
      </div>`;
  }

  /**
   * Реальна історія по днях з recorder long-term statistics (НЕ mock).
   * Джерело — entity "capacity_daily" (зазвичай history_stats-сенсор, що
   * рахує Ah спожиті сьогодні й скидається щоночі): беремо приріст ("change")
   * за кожен день за останні 7 днів через WS recorder/statistics_during_period.
   * Якщо в цього сенсора не ввімкнена long-term statistics (немає state_class),
   * WS-виклик поверне порожньо/впаде — тоді просто показуємо muted-підказку,
   * без падіння картки.
   */
  async _maybeFetchDailyHistory() {
    const entityId = this._e("capacity_daily");
    if (!entityId || !this._hass || typeof this._hass.callWS !== "function") return;
    const now = Date.now();
    if (
      this._historyEntityId === entityId &&
      this._historyFetchedAt &&
      now - this._historyFetchedAt < 15 * 60 * 1000
    ) {
      return; // кеш 15хв
    }
    if (this._historyFetchInFlight) return;
    this._historyFetchInFlight = true;
    this._historyEntityId = entityId;
    this._historyFetchedAt = now;
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 8 * 24 * 60 * 60 * 1000);
      const result = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        statistic_ids: [entityId],
        period: "day",
      });
      const rows = (result && result[entityId]) || [];
      const days = rows.slice(-7).map((r) => {
        const d = new Date(r.start);
        let value;
        if (Number.isFinite(r.change)) value = r.change;
        else if (Number.isFinite(r.max) && Number.isFinite(r.min)) value = r.max - r.min;
        else value = Number(r.state);
        return {
          dateKey: d.toISOString().slice(0, 10),
          d: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`,
          v: Number.isFinite(value) ? Math.abs(value) : 0,
        };
      }).filter((x) => Number.isFinite(x.v));
      if (days.length) {
        this._historyDaily = days;
        this._render();
      }
    } catch (e) {
      // recorder/statistics_during_period недоступний для цього сенсора — тихо ігноруємо
    } finally {
      this._historyFetchInFlight = false;
    }
  }

  _renderFullView() {
    const soc = Number(stateOf(this._hass, this._e("soc")));
    const voltage = stateOf(this._hass, this._e("voltage"));
    const current = stateOf(this._hass, this._e("current"));
    const power = stateOf(this._hass, this._e("power"));
    const temp = stateOf(this._hass, this._e("temperature"));
    const cycles = stateOf(this._hass, this._e("charge_cycles"));
    const soh = stateOf(this._hass, this._e("soh"));
    const link = stateOf(this._hass, this._e("link_quality"));
    const rssi = stateOf(this._hass, this._e("rssi"));
    const stored = this._storedEnergyWh();
    const design = stateOf(this._hass, this._e("design_capacity"));
    const balanceCur = this._balanceCurrentA();
    const cellBitmask = this._cellBitmask();
    const status = this._statusInfo();
    const eta = this._etaInfo();
    const socPct = Number.isFinite(soc) ? Math.max(0, Math.min(100, soc)) : 0;
    const designN = Number(design);
    let remainingAh;
    if (Number.isFinite(designN) && Number.isFinite(socPct)) remainingAh = designN * (socPct / 100);
    const usedAh = Number.isFinite(designN) && remainingAh !== undefined ? designN - remainingAh : undefined;

    const st = this._cellStats();
    let cellsHtml = `<div class="cells-box"><div class="cells-title">Комірки</div><p class="bms-muted">Немає даних</p></div>`;
    if (st) {
      const lo = Math.min(st.min - 0.05, 3.05);
      const hi = Math.max(st.max + 0.04, 3.40);
      const rows = st.cells.map((v, i) => {
        let frac = Number.isFinite(v) ? (v - lo) / (hi - lo) : 0;
        frac = Math.max(0.2, Math.min(0.95, frac));
        const warn = v === st.min && st.delta >= 0.005;
        return `<div class="cell-row">
          <div class="cell-name">C${i + 1}</div>
          <div class="cell-track"><div class="cell-fill ${warn ? "warn" : ""}" style="width:${Math.round(frac * 100)}%"></div></div>
          <div class="cell-val">${Number.isFinite(v) ? v.toFixed(3) : "—"} V</div>
        </div>`;
      }).join("");
      cellsHtml = `
        <div class="cells-box">
          <div class="cells-title">Комірки (Δ ${st.delta.toFixed(3)}V)</div>
          ${rows}
          <div class="badges-row">
            <div class="badge green">Макс ${st.max.toFixed(3)} V<b>C${st.maxIdx + 1}</b></div>
            <div class="badge amber">Мін ${st.min.toFixed(3)} V<b>C${st.minIdx + 1}</b></div>
            <div class="badge blue">Δ ${st.delta.toFixed(3)} V<b>Різниця</b></div>
          </div>
        </div>`;
    }

    const func = (icon, label, value, tone) => `
      <div class="func-box">
        <div class="icon-circle">${haIcon(icon, 22, tone)}</div>
        <div class="func-text"><div class="l1">${label}</div><div class="l2" style="color:${tone}">${value}</div></div>
      </div>`;

    const bal = stateOf(this._hass, this._e("balancer"));
    const chrgM = stateOf(this._hass, this._e("chrg_mosfet"));
    const disM = stateOf(this._hass, this._e("dischrg_mosfet"));
    const heat = stateOf(this._hass, this._e("heater"));
    const prob = stateOf(this._hass, this._e("problem"));
    const on = (s) => s === "on" || s === "true";
    const G = "#1D9E75", M = "#8b96a3", A = "#EF9F27", R = "#E24B4A";

    let funcGrid = "";
    if (bal !== undefined) funcGrid += func("ti-topology-star-3", "Балансир", on(bal) ? "Активний" : "Вимкнено", on(bal) ? G : M);
    if (chrgM !== undefined) funcGrid += func("ti-plug-connected", "MOSFET заряд", on(chrgM) ? "Увімкнено" : "Вимкнено", on(chrgM) ? G : M);
    if (disM !== undefined) funcGrid += func("ti-plug-connected", "MOSFET розряд", on(disM) ? "Увімкнено" : "Вимкнено", on(disM) ? G : M);
    if (heat !== undefined) funcGrid += func("ti-flame", "Нагрівач", on(heat) ? "Увімкнено" : "Вимкнено", on(heat) ? A : M);
    if (prob !== undefined) funcGrid += func("ti-alert-triangle", "Проблеми", on(prob) ? "Є" : "Немає", on(prob) ? R : G);
    const modeLabel = status.label === "Заряджається" ? "Заряд" : status.label === "Розряджається" ? "Розряд" : status.label;
    const modeTone = status.color === "success" ? G : status.color === "warning" ? A : M;
    funcGrid += func(status.icon || "ti-bolt", "Режим", modeLabel, modeTone);

    const currentN = Number(current);
    const currentGreen = Number.isFinite(currentN) && Math.abs(currentN) > 0.3;

    return `
      <div class="bms-full">
        <div class="header">
          <div>
            <h1>${this._batteryName()} ${haIcon("ti-bluetooth", 18, "#4b9bf0")}</h1>
            <div class="status"><span class="dot"></span> ${status.color === "danger" ? "Проблема" : "Підключено"}</div>
          </div>
        </div>

        <div class="top-row">
          <div class="battery-box">
            ${this._renderBatteryShape(soc, "full")}
            <div class="charge-badge">
              ${haIcon(status.icon, 16)} ${status.label}
            </div>
          </div>
          <div class="stat-col">
            <div class="stat-box"><div class="val">${fmt(voltage, 2)} V</div><div class="lbl">Напруга</div></div>
            <div class="stat-box"><div class="val ${currentGreen ? "green" : ""}">${fmt(current, 1)} A</div><div class="lbl">Струм</div></div>
            <div class="stat-box"><div class="val ${currentGreen ? "green" : ""}">${fmt(power, 0)} W</div><div class="lbl">Потужність</div></div>
            <div class="stat-box"><div class="val">${fmt(temp, 1)} °C</div><div class="lbl">Температура</div></div>
          </div>
          ${cellsHtml}
        </div>

        <div class="discharge-box">
          <div class="discharge-top">
            <div class="icon-circle">${haIcon("ti-clock-hour-4",20,"#c7d0da")}</div>
            <div class="discharge-text">
              <div class="l1">${eta.label}</div>
              <div class="l2">${eta.seconds !== undefined ? "~" + secondsToHuman(eta.seconds) : "—"}</div>
            </div>
          </div>
          <div class="progress-row">
            <div class="progress-track"><div class="progress-fill" style="width:${socPct}%"></div></div>
            <div class="progress-pct">${socPct.toFixed(0)}%</div>
          </div>
        </div>

        <div class="functions-grid">${funcGrid}</div>

        <div class="metrics-row">
          ${Number.isFinite(designN) ? `<div class="metric"><div class="val">${fmt(designN, 0)} <span>Ah</span></div><div class="lbl">Ємність</div></div>` : ""}
          ${usedAh !== undefined ? `<div class="metric"><div class="val">${fmt(usedAh, 1)} <span>Ah</span></div><div class="lbl">Використано</div></div>` : ""}
          ${remainingAh !== undefined ? `<div class="metric"><div class="val">${fmt(remainingAh, 1)} <span>Ah</span></div><div class="lbl">Залишилось</div></div>` : ""}
          ${cycles !== undefined ? `<div class="metric"><div class="val">${fmt(cycles, 0)}</div><div class="lbl">Цикли</div></div>` : ""}
          ${soh !== undefined ? `<div class="metric"><div class="val">${fmt(soh, 0)}%</div><div class="lbl">SOH</div></div>` : ""}
          ${link !== undefined ? `<div class="metric"><div class="val">${fmt(link, 0)}%</div><div class="lbl">Link Quality</div></div>` : ""}
          ${rssi !== undefined ? `<div class="metric"><div class="val">${fmt(rssi, 0)} <span>dBm</span></div><div class="lbl">RSSI</div></div>` : ""}
        </div>

        <h2 class="section-title">Використано ємності</h2>
        ${this._hasCapacityEntities() ? `
        <div class="usage-grid">
          ${this._renderCapacityCard("Сьогодні", this._e("capacity_daily"), designN)}
          ${this._renderCapacityCard("Тиждень", this._e("capacity_weekly"), designN)}
          ${this._renderCapacityCard("Місяць", this._e("capacity_monthly"), designN)}
          ${this._renderCapacityCard("Всього", this._e("capacity_total"), designN)}
        </div>` : `<p class="bms-muted" style="margin-bottom:24px;">Сенсори споживання не налаштовані.</p>`}

        ${this._hasDischargeEntities() || eta.seconds !== undefined ? `
        <h2 class="section-title">Час роботи до розряду (прогноз)</h2>
        <div class="forecast-row">
          <div class="forecast-card">
            <div class="icon-circle">${haIcon("ti-clock-hour-4",20,"#4b9bf0")}</div>
            <div class="forecast-text"><div class="l1">При поточному навантаженні</div><div class="l2">${eta.seconds !== undefined ? secondsToHuman(eta.seconds) : "—"}</div></div>
          </div>
          ${this._e("discharge_time_daily") ? `<div class="forecast-card"><div class="icon-circle">${haIcon("ti-clock-hour-4",20,"#4b9bf0")}</div><div class="forecast-text"><div class="l1">Сьогоднішній розряд</div><div class="l2">~${fmt(stateOf(this._hass, this._e("discharge_time_daily")), 1)} год</div></div></div>` : ""}
          ${this._e("discharge_time_weekly") ? `<div class="forecast-card"><div class="icon-circle">${haIcon("ti-clock-hour-4",20,"#4b9bf0")}</div><div class="forecast-text"><div class="l1">Середній за тиждень</div><div class="l2">~${fmt(stateOf(this._hass, this._e("discharge_time_weekly")), 1)} год</div></div></div>` : ""}
          ${this._e("discharge_time_monthly") ? `<div class="forecast-card"><div class="icon-circle">${haIcon("ti-clock-hour-4",20,"#4b9bf0")}</div><div class="forecast-text"><div class="l1">Середній за місяць</div><div class="l2">~${fmt(stateOf(this._hass, this._e("discharge_time_monthly")), 1)} год</div></div></div>` : ""}
        </div>` : ""}

        ${this._renderHistoryBars()}

        <h2 class="section-title">Діагностика</h2>
        <div class="diag-grid">
          ${stored !== undefined ? `<div class="diag-card"><div class="diag-icon">${haIcon("ti-battery-vertical-filled",20,"#1D9E75")}</div><div class="diag-text"><div class="l1">Stored Energy</div><div class="l2">${fmt(stored, 0)} Wh</div></div></div>` : ""}
          ${stateOf(this._hass, this._e("runtime")) !== undefined ? `<div class="diag-card"><div class="diag-icon">${haIcon("ti-clock-hour-4",20,"#4b9bf0")}</div><div class="diag-text"><div class="l1">Runtime (BMS)</div><div class="l2">${fmt(stateOf(this._hass, this._e("runtime")), 0)} s / ~${secondsToHuman(Number(stateOf(this._hass, this._e("runtime"))))}</div></div></div>` : ""}
          ${balanceCur !== undefined ? `<div class="diag-card"><div class="diag-icon">${haIcon("ti-scale",20,"#EF9F27")}</div><div class="diag-text"><div class="l1">Balance Current</div><div class="l2">${fmt(balanceCur, 2)} A</div></div></div>` : ""}
          ${cycles !== undefined ? `<div class="diag-card"><div class="diag-icon">${haIcon("ti-refresh",20,"#1D9E75")}</div><div class="diag-text"><div class="l1">Package Cycles</div><div class="l2">${fmt(cycles, 0)}</div></div></div>` : ""}
          <div class="diag-card"><div class="diag-icon">${haIcon("ti-battery",20,"#E24B4A")}</div><div class="diag-text"><div class="l1">Package Voltage</div><div class="l2">${fmt(voltage, 2)} V</div></div></div>
          <div class="diag-card"><div class="diag-icon">${haIcon("ti-wave-sine",20,"#4b9bf0")}</div><div class="diag-text"><div class="l1">Package Current</div><div class="l2">${fmt(current, 1)} A</div></div></div>
          <div class="diag-card"><div class="diag-icon">${haIcon("ti-chart-donut-3",20,"#4b9bf0")}</div><div class="diag-text"><div class="l1">Package SOC</div><div class="l2">${fmt(soc, 0)}%</div></div></div>
          ${cellBitmask !== undefined && cellBitmask !== null && cellBitmask !== "" ? `<div class="diag-card"><div class="diag-icon">${haIcon("ti-grid-dots",20,"#4b9bf0")}</div><div class="diag-text"><div class="l1">Cell Bitmask</div><div class="l2">${cellBitmask}</div></div></div>` : ""}
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
    return `
      <div class="bms-mini" tabindex="0" role="button">
        <div class="header" style="margin-bottom:12px;">
          <div>
            <h1 style="font-size:16px;">${this._batteryName()} ${haIcon("ti-bluetooth",16,"#4b9bf0")}</h1>
            <div class="status"><span class="dot"></span> ${status.label}</div>
          </div>
        </div>
        <div class="top-row">
          <div class="battery-box" style="width:140px;">
            ${this._renderBatteryShape(soc, "mini")}
            <div class="charge-badge" style="font-size:12px;padding:6px 10px;">${status.label}</div>
          </div>
          <div class="stat-col">
            <div class="stat-box"><div class="val">${fmt(voltage, 2)} V</div><div class="lbl">Напруга</div></div>
            <div class="stat-box"><div class="val">${fmt(current, 1)} A</div><div class="lbl">Струм</div></div>
          </div>
          <div class="stat-col">
            <div class="stat-box"><div class="val">${fmt(power, 0)} W</div><div class="lbl">Потужність</div></div>
            <div class="stat-box"><div class="val">${fmt(temp, 1)} °C</div><div class="lbl">Температура</div></div>
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
    /* CSS ported from bms-dashboard.html reference */
    return `
      <style>
        :host { display:block; max-width:100%; }
        * { box-sizing: border-box; }
        ha-card.bms-card, .bms-card {
          --bg:#020608; --card:#050e14; --panel:#0a141c; --border:rgba(255,255,255,0.06);
          --text:#f2f4f7; --muted:#8b96a3; --muted-2:#5f6b78;
          --green:#1D9E75; --green-dim:#1f3d29; --amber:#EF9F27; --blue:#4b9bf0; --red:#E24B4A;
          background: var(--card) !important;
          color: var(--text);
          border-radius: 22px !important;
          border: 1px solid var(--border) !important;
          padding: 22px !important;
          box-shadow: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          max-width: 100%;
          overflow: hidden;
        }
        ha-icon { --mdc-icon-size: 20px; }
        .header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; }
        .header h1 { font-size:22px; margin:0 0 6px 0; font-weight:700; display:flex; align-items:center; gap:8px; }
        .status { display:flex; align-items:center; gap:6px; color:var(--green); font-size:14px; font-weight:500; }
        .dot { width:8px; height:8px; border-radius:50%; background:var(--green); display:inline-block; }

        .top-row { display:flex; gap:14px; margin-bottom:14px; align-items:stretch; flex-wrap:wrap; }
        .battery-box {
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          width:230px; flex-shrink:0; padding:16px; display:flex; flex-direction:column; align-items:center; gap:14px;
        }
        .battery-shell {
          position:relative; width:130px; height:190px; border-radius:14px;
          border:3px solid #3a4650; background:#0a0f14; padding:6px;
        }
        .bms-battery-shape-mini.battery-shell { width:90px; height:130px; }
        .battery-nub {
          position:absolute; top:-10px; left:50%; transform:translateX(-50%);
          width:44px; height:10px; background:#3a4650; border-radius:4px 4px 0 0;
        }
        .battery-fill {
          position:absolute; left:6px; right:6px; bottom:6px; border-radius:8px;
          background:linear-gradient(180deg,#63e07e 0%,#2fae4e 100%);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
        }
        .battery-fill .pct { font-size:30px; font-weight:800; color:#eafff0; line-height:1; }
        .bms-battery-shape-mini .battery-fill .pct { font-size:22px; }
        .battery-fill .soc-label { font-size:12px; color:#eafff0cc; margin-top:2px; font-weight:600; }
        .charge-badge {
          display:flex; align-items:center; gap:6px; background:var(--green-dim); color:var(--green);
          padding:8px 14px; border-radius:10px; font-size:14px; font-weight:600; width:100%; justify-content:center;
        }

        .stat-col { display:flex; flex-direction:column; gap:10px; flex:1; min-width:140px; }
        .stat-box {
          background:var(--panel); border:1px solid var(--border); border-radius:14px;
          padding:12px 16px; flex:1; display:flex; flex-direction:column; justify-content:center;
        }
        .stat-box .val { font-size:20px; font-weight:700; }
        .stat-box .val.green { color:var(--green); }
        .stat-box .lbl { font-size:13px; color:var(--muted); margin-top:2px; }

        .cells-box {
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          padding:16px 18px; flex:1.4; min-width:260px; display:flex; flex-direction:column; gap:12px;
        }
        .cells-title { font-size:15px; color:var(--muted); margin-bottom:2px; }
        .cell-row { display:flex; align-items:center; gap:10px; }
        .cell-name { width:22px; font-size:14px; color:var(--muted); flex-shrink:0; }
        .cell-track { flex:1; height:16px; background:#1a222c; border-radius:8px; overflow:hidden; }
        .cell-fill { height:100%; border-radius:8px; background:linear-gradient(90deg,#2fae4e,#57d976); }
        .cell-fill.warn { background:linear-gradient(90deg,#bf8a1e,#EF9F27); }
        .cell-val { width:62px; text-align:right; font-size:14px; font-weight:600; flex-shrink:0; }

        .badges-row { display:flex; gap:8px; margin-top:2px; }
        .badge {
          flex:1; min-width:0; background:#0f151d; border-radius:10px; padding:9px 8px; font-size:11.5px; color:var(--muted);
          display:flex; flex-direction:column; gap:2px; white-space:nowrap; overflow:hidden;
        }
        .badge b { font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .badge.green b { color:var(--green); }
        .badge.amber b { color:var(--amber); }
        .badge.blue b { color:var(--blue); }

        .discharge-box {
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          padding:16px 18px; margin-bottom:14px; display:flex; flex-direction:column; gap:10px;
        }
        .discharge-top { display:flex; align-items:center; gap:12px; }
        .icon-circle {
          width:40px; height:40px; border-radius:50%; background:#1a222c;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .discharge-text .l1 { font-size:14px; color:var(--muted); }
        .discharge-text .l2 { font-size:20px; font-weight:700; margin-top:2px; }
        .progress-row { display:flex; align-items:center; gap:12px; }
        .progress-track { flex:1; height:9px; background:#1a222c; border-radius:6px; overflow:hidden; }
        .progress-fill { height:100%; background:linear-gradient(90deg,#2fae4e,#57d976); border-radius:6px; }
        .progress-pct { font-size:14px; color:var(--muted); width:36px; text-align:right; }

        .functions-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
        .func-box {
          background:var(--panel); border:1px solid var(--border); border-radius:14px;
          padding:14px 16px; display:flex; align-items:center; gap:12px;
        }
        .func-text .l1 { font-size:13px; color:var(--muted); }
        .func-text .l2 { font-size:15px; font-weight:700; margin-top:2px; }

        .metrics-row {
          display:grid; grid-template-columns:repeat(7,1fr); gap:0;
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          margin-bottom:22px; overflow:hidden;
        }
        .metric { padding:16px 10px; text-align:left; border-right:1px solid var(--border); }
        .metric:last-child { border-right:none; }
        .metric .val { font-size:19px; font-weight:700; }
        .metric .val span { font-size:12px; color:var(--muted); font-weight:500; }
        .metric .lbl { font-size:12.5px; color:var(--muted); margin-top:4px; }

        h2.section-title { font-size:17px; font-weight:700; margin:0 0 12px 2px; color:var(--text); }
        .bms-muted { color:var(--muted); font-size:13px; }

        .usage-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
        .usage-card {
          background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:14px 16px 8px;
        }
        .usage-card .lbl { font-size:13px; color:var(--muted); margin-bottom:6px; }
        .usage-card .val-row { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; }
        .usage-card .val-row .v { font-size:19px; font-weight:700; }
        .usage-card .val-row .p { font-size:13px; color:var(--green); font-weight:600; }
        .usage-card svg, .bms-spark { display:block; width:100%; height:36px; }

        .forecast-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
        .forecast-card {
          background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:14px 16px;
          display:flex; align-items:center; gap:12px;
        }
        .forecast-text .l1 { font-size:12.5px; color:var(--muted); line-height:1.3; }
        .forecast-text .l2 { font-size:17px; font-weight:700; margin-top:3px; }

        .history-box {
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          padding:20px 20px 12px; margin-bottom:24px;
        }
        .muted-note {
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          padding:14px 16px; margin-bottom:24px; font-size:12.5px; color:var(--muted-2);
          line-height:1.4;
        }
        .history-chart {
          display:flex; align-items:flex-end; gap:18px; height:170px; margin-top:10px;
          position:relative; padding-left:32px;
        }
        .yaxis {
          position:absolute; left:0; top:0; bottom:24px; display:flex; flex-direction:column;
          justify-content:space-between; font-size:11px; color:var(--muted-2);
        }
        .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:6px; }
        .bar-val { font-size:12.5px; color:var(--muted); }
        .bar { width:60%; border-radius:6px 6px 0 0; background:#3d4a5a; min-height:4px; }
        .bar.today { background:var(--green); }
        .bar-date { font-size:12px; color:var(--muted-2); margin-top:6px; }
        .bar-date.today { color:var(--green); }

        .diag-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .diag-card {
          background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:14px 16px;
          display:flex; align-items:center; gap:12px;
        }
        .diag-icon {
          width:40px; height:40px; border-radius:10px; background:#1a222c;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .diag-text .l1 { font-size:12.5px; color:var(--muted); }
        .diag-text .l2 { font-size:16px; font-weight:700; margin-top:2px; }

        .bms-mini { cursor:pointer; }
        .bms-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:12px; backdrop-filter:blur(8px);
        }
        .bms-overlay-inner {
          background:var(--card); border-radius:22px; max-width:min(1000px,100%); width:100%;
          max-height:94vh; overflow:auto; padding:22px; position:relative; border:1px solid var(--border);
        }
        .bms-overlay-close {
          position:absolute; top:12px; right:14px; border:none; background:transparent;
          color:var(--text); font-size:18px; cursor:pointer; opacity:0.7;
        }

        @media (max-width:820px) {
          .functions-grid { grid-template-columns:repeat(2,1fr); }
          .metrics-row { grid-template-columns:repeat(4,1fr); }
          .usage-grid, .forecast-row, .diag-grid { grid-template-columns:repeat(2,1fr); }
          .battery-box { width:100%; }
        }
      </style>
    `;
  }

  _render() {
    if (!this._config || !this._hass) return;
    this._resolvedEntities = this._effectiveEntities();

    if (!this._hasAnyData()) {
      this.innerHTML = `
        <ha-card style="padding:16px;border-radius:18px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-weight:600;">
            ${haIcon("ti-bluetooth",16)}
            <span>${this._config.name && this._config.name.trim() ? this._config.name.trim() : "BMS Battery"}</span>
          </div>
          <p style="font-size:13px;opacity:0.75;margin:0;">
            Не вдалося знайти акумулятор BMS_BLE-HA. Перевірте інтеграцію або оберіть пристрій у редакторі картки.
          </p>
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
