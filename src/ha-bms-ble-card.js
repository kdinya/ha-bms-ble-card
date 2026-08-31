/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.6.0";

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
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h <= 0) return `${m} хв`;
  return `${h} год ${m} хв`;
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
  { key: "delta_cell_voltage", domain: "sensor", test: (o) => hasWord(o, "delta") },
  { key: "max_cell_voltage", domain: "sensor", test: (o) => o.includes("max") && o.includes("volt") },
  { key: "min_cell_voltage", domain: "sensor", test: (o) => o.includes("min") && o.includes("volt") },
  { key: "runtime", domain: "sensor", test: (o) => hasWord(o, "runtime") },
  { key: "link_quality", domain: "sensor", test: (o) => o.includes("link_quality") || o.includes("linkquality") },
  { key: "charge_cycles", domain: "sensor", test: (o) => o.includes("cycle") },
  { key: "balancer", domain: "binary_sensor", test: (o) => o.includes("balanc") },
  { key: "chrg_mosfet", domain: "binary_sensor", test: (o) => o.includes("mosfet") && !o.includes("dis") },
  { key: "dischrg_mosfet", domain: "binary_sensor", test: (o) => o.includes("mosfet") && o.includes("dis") },
  { key: "heater", domain: "binary_sensor", test: (o) => hasWord(o, "heater") || hasWord(o, "heating") },
];

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

  // rssi — fallback за назвою, якщо BMS не проставляє device_class
  // "signal_strength" на своєму сенсорі RSSI.
  if (!result.rssi) {
    const match = list.find((e) => !used.has(e.entityId) && e.domain === "sensor" && hasWord(e.objectId, "rssi"));
    if (match) {
      result.rssi = match.entityId;
      used.add(match.entityId);
    }
  }

  return result;
}

/* ----------------------------------------------------------------------
 * Setup Wizard: creates the helper entities needed for consumption /
 * runtime tracking through HA's own config-entries "helper" flows — the
 * same mechanism used by Settings → Devices & services → Helpers →
 * + Add helper. Two families of helpers are created:
 *
 *  1) Використана ємність (Riemann-sum integral over `power`, Ah/Wh,
 *     lifetime) + 3x Utility Meter (daily/weekly/monthly reset) —
 *     "скільки ємності ми взяли з акумулятора".
 *  2) Час розряду (History Stats over the `charging` binary_sensor,
 *     rolling window per cycle) — "скільки АКБ пропрацював, віддаючи
 *     енергію". Це наближення: рахується час, коли сенсор заряду має
 *     стан "off" в межах вікна (доба/тиждень/місяць), тобто включає й час
 *     простою без навантаження, не лише активний розряд — точний час
 *     "під навантаженням" BMS_BLE-HA не публікує як окрему сутність.
 *
 * This talks to internal-but-stable HA REST/WS endpoints exposed on
 * `hass` via hass.callApi()/callWS(). Field names follow the
 * `integration`, `utility_meter` and `history_stats` helper config flows
 * as of HA 2024–2026. If a future core release renames a field, creation
 * fails gracefully and the card points the user at the manual YAML
 * instructions in the README — nothing here is required for the card to
 * keep working with entities configured by hand.
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
    } catch (e) {
      /* best effort */
    }
  }

  async _existingEntry(title) {
    const entries = await this.hass.callWS({ type: "config_entries/get" });
    return entries.find(
      (e) =>
        (e.domain === "integration" ||
          e.domain === "utility_meter" ||
          e.domain === "history_stats" ||
          e.domain === "template") &&
        e.title === title
    );
  }

  /**
   * Creates (or reuses) a Template sensor helper that isolates only the
   * discharge portion of a signed power/current entity:
   * value = abs(min(source, 0)) — 0 while charging or idle, positive while
   * discharging. This is exactly the approach the BMS_BLE-HA README
   * recommends for Energy Dashboard integration (see "Energy Dashboard
   * Integration" section: two template sensors + two integration
   * sensors, one pair per direction). Integrating the raw signed
   * power/current directly (as earlier releases of this card did) makes
   * charge and discharge cancel out in the Riemann sum, so accumulated
   * capacity/energy is silently wrong — this sensor is what fixes that.
   *
   * The Template helper flow starts with a menu step ("user") where the
   * frontend picks a sensor type by submitting {next_step_id: "sensor"};
   * this mirrors that exactly.
   */
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
      throw new Error(`template flow: неочікуваний крок "${step.type}"`);
    }
    const result = await this._submitStep(step.flow_id, {
      name: title,
      state: `{{ [ (states('${sourceEntity}') | float(0)), 0 ] | min | abs }}`,
      unit_of_measurement: unit,
      device_class: deviceClass,
      state_class: "measurement",
    });
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(result.errors ? JSON.stringify(result.errors) : "template flow не завершився");
    }
    const entityId = await this._entityForEntry(result.result.entry_id);
    return { entityId, created: true };
  }

  async _entityForEntry(entryId) {
    const regs = await this.hass.callWS({ type: "config/entity_registry/list" });
    const match = regs.find((r) => r.config_entry_id === entryId);
    return match ? match.entity_id : undefined;
  }

  /** Creates (or reuses) the lifetime Riemann-sum integral sensor for a source entity. */
  async ensureIntegral(sourceEntity, title, unitTime = "h") {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("integration");
    const result = await this._submitStep(flow.flow_id, {
      name: title,
      source: sourceEntity,
      round: 2,
      unit_prefix: "none",
      unit_time: unitTime,
      method: "trapezoidal",
    });
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(result.errors ? JSON.stringify(result.errors) : "integration flow не завершився");
    }
    const entityId = await this._entityForEntry(result.result.entry_id);
    return { entityId, created: true };
  }

  /** Creates (or reuses) a Utility Meter helper on top of an existing integral sensor. */
  async ensureUtilityMeter(sourceEntity, title, cycle) {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("utility_meter");
    const result = await this._submitStep(flow.flow_id, {
      name: title,
      source: sourceEntity,
      cycle,
      offset: 0,
      net_consumption: false,
      delta_values: false,
      // Наше джерело — сенсор накопиченої (lifetime) ємності: він ніколи
      // сам не скидається в 0, тож periodically_resetting: false, інакше
      // сучасна (2024+) схема utility_meter НЕ приймає крок форми (flow
      // повертає "form" з errors замість "create_entry"), і майстер падав
      // з помилкою "utility_meter flow не завершився" / "Не вдалося
      // створити сенсори" — саме це й було причиною помилки в редакторі.
      periodically_resetting: false,
      tariffs: [],
    });
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(result.errors ? JSON.stringify(result.errors) : "utility_meter flow не завершився");
    }
    const entityId = await this._entityForEntry(result.result.entry_id);
    return { entityId, created: true };
  }

  /**
   * Creates (or reuses) a History Stats helper that measures how long a
   * binary source entity spent in a given state within a rolling window
   * (e.g. останні 24 год). Used to approximate "час розряду".
   */
  async ensureHistoryStats(sourceEntity, title, states, days) {
    const existing = await this._existingEntry(title);
    if (existing) {
      const entityId = await this._entityForEntry(existing.entry_id);
      if (entityId) return { entityId, created: false };
    }
    const flow = await this._initFlow("history_stats");
    const result = await this._submitStep(flow.flow_id, {
      name: title,
      entity_id: sourceEntity,
      state: states,
      type: "time",
      duration: { days, hours: 0, minutes: 0, seconds: 0 },
    });
    if (result.type !== "create_entry") {
      await this._abortFlow(flow.flow_id);
      throw new Error(result.errors ? JSON.stringify(result.errors) : "history_stats flow не завершився");
    }
    const entityId = await this._entityForEntry(result.result.entry_id);
    return { entityId, created: true };
  }

  /**
   * Full run: 1 template sensor (discharge-only power/current) → 1
   * lifetime integral (capacity_total) → 3 utility meters
   * (capacity_daily/weekly/monthly), і, якщо переданий chargingEntity —
   * 3 history_stats helpers (discharge_time_daily/weekly/monthly).
   * Повертає мапу entity_id + людський лог подій, щоб можна було показати
   * прогрес і одразу підставити результат у конфіг картки.
   *
   * sourceKind визначає одиниці: "current" → Ah (як на скріншотах),
   * "power" → Wh, якщо entities.current не вказано.
   */
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
    const discharge = await this.ensureDischargeTemplateSensor(sourceEntity, dischargeTitle, unit, deviceClass);
    report(discharge.created ? `✓ Створено ${discharge.entityId}` : `✓ Вже існує: ${discharge.entityId}`);

    const totalTitle = `${batteryName} — накопичена ємність розряду`;
    report(`Створюю "${totalTitle}"…`);
    const total = await this.ensureIntegral(discharge.entityId, totalTitle);
    report(total.created ? `✓ Створено ${total.entityId}` : `✓ Вже існує: ${total.entityId}`);

    const entities = { capacity_total: total.entityId };
    for (const { key, label, cycle } of CAPACITY_CYCLES) {
      const title = `${batteryName} — використано (${label.toLowerCase()})`;
      report(`Створюю "${title}"…`);
      const meter = await this.ensureUtilityMeter(total.entityId, title, cycle);
      report(meter.created ? `✓ Створено ${meter.entityId}` : `✓ Вже існує: ${meter.entityId}`);
      entities[key] = meter.entityId;
    }

    if (chargingEntity) {
      for (const { key, label, days } of DISCHARGE_CYCLES) {
        const title = `${batteryName} — час розряду (${label.toLowerCase()})`;
        report(`Створюю "${title}"…`);
        const hs = await this.ensureHistoryStats(chargingEntity, title, ["off"], days);
        report(hs.created ? `✓ Створено ${hs.entityId}` : `✓ Вже існує: ${hs.entityId}`);
        entities[key] = hs.entityId;
      }
    } else {
      report(
        `⚠ Пропущено хелпери часу розряду: не вказано entities.charging у конфізі картки.`
      );
    }

    return { entities, log };
  }
}

/* ------------------------------------------------------------------ */

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
    const value = this._effectiveEntities()[key] || "";
    if (this._hasEntityPicker()) {
      return `
        <div class="bms-field" data-key="${key}" data-domain="${domain}">
          <ha-entity-picker data-key="${key}"></ha-entity-picker>
        </div>
      `;
    }
    return `
      <div class="bms-field" data-key="${key}">
        <label style="display:block; font-size:12px; opacity:0.75; margin-bottom:2px;">${label}</label>
        <input data-key="${key}" type="text" value="${value}" placeholder="entity_id"
          style="width:100%; box-sizing:border-box;" />
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
    let note;
    if (manualDeviceId) {
      note = `✓ Обрано вручну: ${this._deviceLabel(manualDeviceId)}`;
    } else if (autoIds.length === 1) {
      note = `✓ Автоматично визначено: ${this._deviceLabel(autoIds[0])}`;
    } else if (autoIds.length > 1) {
      note = `Знайдено декілька акумуляторів BMS_BLE-HA — оберіть потрібний вище.`;
    } else {
      note = `Акумулятор BMS_BLE-HA не знайдено автоматично. Перевірте, що інтеграція встановлена і акумулятор підключений, або оберіть пристрій вручну.`;
    }
    const field = this._hasDevicePicker()
      ? `<ha-device-picker data-key="device_id"></ha-device-picker>`
      : `<input data-key="device_id" type="text" value="${manualDeviceId}" placeholder="device_id (опційно)"
          style="width:100%; box-sizing:border-box;" />`;
    return `
      <div class="bms-field" data-key="device_id">${field}</div>
      <p style="font-size:11px; opacity:0.6; margin:4px 0 0;">${note}</p>
    `;
  }

  _renderEntityGroups() {
    return ENTITY_FIELD_GROUPS.map(
      (group, i) => `
      <details class="bms-group" ${i === 0 ? "open" : ""}>
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
        .bms-group-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px; }
        .bms-field label { }
        .bms-cell-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
        .bms-cell-row .bms-field { flex:1; }
        ha-entity-picker { display:block; width:100%; }
      </style>
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 12px;">
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
        <div>
          <div class="bms-editor-group-title">Сутності (entities) — ручне перевизначення</div>
          <p style="font-size:11px; opacity:0.6; margin:0 0 8px;">
            Якщо вище знайдено акумулятор, картка вже сама підставила
            потрібні сенсори — поля нижче не обов'язкові й потрібні лише
            щоб виправити щось вручну (наприклад, якщо конкретна BMS-плата
            публікує сенсор нетипово).
          </p>
          ${this._renderEntityGroups()}
          ${this._renderCellVoltagesGroup()}
        </div>
        <div style="border-top:1px solid var(--divider-color,#333); padding-top:12px;">
          <div style="font-size:13px; font-weight:500; margin-bottom:8px;">Сенсори споживання / часу розряду</div>
          ${this._renderWizard()}
        </div>
      </div>
    `;
    this.querySelector("#name").addEventListener("change", (e) => this._update("name", e.target.value));
    this.querySelector("#display_mode").addEventListener("change", (e) => this._update("display_mode", e.target.value));
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
    this._uid = Math.random().toString(36).slice(2, 9);
  }

  static getConfigElement() {
    return document.createElement("ha-bms-ble-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:ha-bms-ble-card",
      display_mode: "widget",
      entities: {},
      thresholds: DEFAULT_THRESHOLDS,
    };
  }

  setConfig(config) {
    // "entities" тепер опційний: якщо не вказано (або вказано частково),
    // картка сама спробує знайти акумулятор BMS_BLE-HA і підтягнути
    // сутності автоматично (див. autoDiscoverEntities). Ручні entities.*
    // лишаються і завжди мають пріоритет над автовизначеними.
    this._config = {
      display_mode: "widget",
      thresholds: DEFAULT_THRESHOLDS,
      entities: {},
      ...(config || {}),
      thresholds: { ...DEFAULT_THRESHOLDS, ...((config && config.thresholds) || {}) },
    };
    this._expanded = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return this._config && this._config.display_mode === "inline" ? 7 : 3;
  }

  connectedCallback() {
    // Only orientation of the *viewport* matters here (for the fullscreen
    // overlay). Card-width layout adapts purely via CSS container queries
    // on .bms-card, so no ResizeObserver / re-render is needed for that.
    this._onResize = () => {
      if (this._expanded) this._render();
    };
    window.addEventListener("resize", this._onResize);
  }

  disconnectedCallback() {
    if (this._onResize) window.removeEventListener("resize", this._onResize);
  }

  /**
   * ID пристрою для автопошуку: explicit entities.device_id з конфіга
   * (обрано вручну в редакторі) має пріоритет; інакше — якщо в системі
   * рівно один пристрій з інтеграції BMS_BLE-HA, беремо його автоматично.
   * Якщо знайдено декілька — не вгадуємо, користувач має обрати вручну.
   */
  _resolvedDeviceId() {
    const explicit = this._config && this._config.entities && this._config.entities.device_id;
    if (explicit) return explicit;
    if (!this._hass) return undefined;
    const ids = findBmsBleDeviceIds(this._hass);
    return ids.length === 1 ? ids[0] : undefined;
  }

  /** Автовизначені entities.* для поточного пристрою (порожньо, якщо
   *  пристрій не вдалось однозначно визначити). */
  _autoEntities() {
    const deviceId = this._resolvedDeviceId();
    return deviceId && this._hass ? autoDiscoverEntities(this._hass, deviceId) : {};
  }

  /** Ефективні entities.*: автовизначені + ручні (ручні перемагають). */
  _effectiveEntities() {
    return { ...this._autoEntities(), ...((this._config && this._config.entities) || {}) };
  }

  _e(key) {
    return this._resolvedEntities ? this._resolvedEntities[key] : undefined;
  }

  _hasAnyData() {
    return !!(this._e("soc") || this._e("voltage") || this._e("current") || this._e("power"));
  }

  /**
   * Назва батареї: якщо вказана в config.name — override користувача.
   * Інакше автоматично береться з Device Registry (назва пристрою, до якого
   * прив'язана інтеграція BMS_BLE-HA), і як останній fallback — з
   * friendly_name сенсора, з обрізаним суфіксом ("... Voltage"/"... Напруга").
   * Нічого не прошито жорстко.
   */
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

  /**
   * Напруги комірок. Кількість комірок НЕ конфігурується явно — картка
   * автоматично бере довжину масиву (з entities.cell_voltages, або, якщо
   * той не заданий, з атрибута cell_voltages сенсора delta_cell_voltage).
   */
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
    if (problem === "on") {
      const code = attrOf(this._hass, this._e("problem"), "problem_code");
      return { label: `Проблема${code ? ` (${code})` : ""}`, color: "danger", icon: "ti-alert-triangle" };
    }
    const charging = stateOf(this._hass, this._e("charging"));
    if (charging === "on") return { label: "Заряджається", color: "success", icon: "ti-bolt" };
    const power = Number(stateOf(this._hass, this._e("power")));
    if (!Number.isNaN(power) && power < -1) return { label: "Розряджається", color: "warning", icon: "ti-battery-2" };
    return { label: "Очікування", color: "neutral", icon: "ti-battery-4" };
  }

  _statusColorVars(color) {
    switch (color) {
      case "success":
        return { bg: "rgba(15,110,86,0.18)", fg: "#1D9E75" };
      case "warning":
        return { bg: "rgba(186,117,23,0.18)", fg: "#EF9F27" };
      case "danger":
        return { bg: "rgba(226,75,74,0.18)", fg: "#E24B4A" };
      default:
        return { bg: "rgba(136,135,128,0.18)", fg: "#888780" };
    }
  }

  _cellBarColor(v, min, delta) {
    const { cell_delta_warning, cell_delta_critical } = this._config.thresholds;
    const dev = Math.abs(v - min);
    if (delta >= cell_delta_critical || dev >= cell_delta_critical) return "#E24B4A";
    if (delta >= cell_delta_warning || dev >= cell_delta_warning) return "#EF9F27";
    return "#1D9E75";
  }

  /**
   * Справжня форма акумулятора (корпус з клемою зверху), заповнення знизу
   * вгору відповідно до SOC%, колір заповнення залежить від рівня заряду.
   * variant "full" — головна ілюстрація (збільшена, з крупнішим написом
   * і більшою відносною площею заповнення), "mini" — для widget-режиму.
   */
  _renderBatteryShape(percent, variant) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const color = batteryFillColor(p);
    const clipId = `bms-fill-clip-${this._uid}`;
    const isMini = variant === "mini";
    // Головну (full) ілюстрацію збільшено ~25% і зроблено тонші стінки
    // корпусу, щоб саме заповнення (рівень заряду) виглядало більшим.
    const w = isMini ? 58 : 150;
    const h = isMini ? 92 : 232;
    const wallThickness = isMini ? 2 : 3;
    const bodyX = 5, bodyY = 12, bodyW = w - 10, bodyH = h - 17, radius = 9;
    const termW = w * 0.36, termH = 7;
    const termX = (w - termW) / 2;
    const innerPad = isMini ? 3 : 4;
    const fillH = (bodyH - innerPad * 2) * (p / 100);
    const fillY = bodyY + innerPad + (bodyH - innerPad * 2 - fillH);

    return `
      <div class="bms-battery-shape bms-battery-shape-${variant}">
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs>
            <clipPath id="${clipId}">
              <rect x="${bodyX + innerPad - 1}" y="${bodyY + innerPad - 1}" width="${bodyW - (innerPad - 1) * 2}" height="${bodyH - (innerPad - 1) * 2}" rx="${radius - innerPad}"/>
            </clipPath>
          </defs>
          <rect x="${termX}" y="${bodyY - termH}" width="${termW}" height="${termH + 2}" rx="2"
            fill="none" stroke="var(--secondary-text-color,#888)" stroke-width="${wallThickness}"/>
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${radius}"
            fill="none" stroke="var(--secondary-text-color,#888)" stroke-width="${wallThickness}"/>
          <rect x="${bodyX + innerPad}" y="${fillY}" width="${bodyW - innerPad * 2}" height="${fillH}"
            fill="${color}" clip-path="url(#${clipId})">
            <animate attributeName="y" from="${bodyY + bodyH - innerPad}" to="${fillY}" dur="0.6s" fill="freeze"/>
            <animate attributeName="height" from="0" to="${fillH}" dur="0.6s" fill="freeze"/>
          </rect>
        </svg>
        <div class="bms-battery-label">
          <span class="bms-battery-pct">${p.toFixed(0)}%</span>
          <span class="bms-battery-sub">SOC</span>
        </div>
      </div>
    `;
  }

  /**
   * Мала іконка-батарейка для однієї комірки (замість смужки-прогресбару).
   * Заповнення — за абсолютною напругою в типовому діапазоні LiFePO4,
   * колір заповнення — за ступенем дисбалансу відносно порогів картки.
   */
  _renderCellBattery(v, idx, color) {
    const w = 60, h = 96;
    const bodyX = 8, bodyY = 16, bodyW = w - 16, bodyH = h - 24, radius = 10;
    const termW = w * 0.4, termH = 8;
    const termX = (w - termW) / 2;
    const frac = cellVoltageFraction(v);
    const innerPad = 4;
    const fillH = (bodyH - innerPad * 2) * frac;
    const fillY = bodyY + innerPad + (bodyH - innerPad * 2 - fillH);
    const clipId = `bms-cell-clip-${this._uid}-${idx}`;

    return `
      <div class="bms-cell-battery" title="Комірка ${idx + 1}: ${Number.isFinite(v) ? v.toFixed(3) : "—"} V">
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs>
            <clipPath id="${clipId}">
              <rect x="${bodyX + 1}" y="${bodyY + 1}" width="${bodyW - 2}" height="${bodyH - 2}" rx="${radius - 1}"/>
            </clipPath>
          </defs>
          <rect x="${termX}" y="${bodyY - termH}" width="${termW}" height="${termH + 1}" rx="2"
            fill="none" stroke="var(--secondary-text-color,#888)" stroke-width="2.5"/>
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${radius}"
            fill="none" stroke="var(--secondary-text-color,#888)" stroke-width="2.5"/>
          <rect x="${bodyX + innerPad}" y="${fillY}" width="${bodyW - innerPad * 2}" height="${fillH}"
            fill="${color}" clip-path="url(#${clipId})"/>
        </svg>
        <span class="bms-cell-battery-idx">${idx + 1}</span>
        <span class="bms-cell-battery-val">${Number.isFinite(v) ? v.toFixed(3) : "—"}V</span>
      </div>
    `;
  }

  _renderMetricCard(label, value) {
    return `
      <div class="bms-metric">
        <div class="bms-metric-label">${label}</div>
        <div class="bms-metric-value">${value}</div>
      </div>
    `;
  }

  _renderCapacityCard(label, entityId) {
    if (!entityId) return "";
    const val = stateOf(this._hass, entityId);
    const unit = attrOf(this._hass, entityId, "unit_of_measurement") || "Ah";
    return `
      <div class="bms-metric">
        <div class="bms-metric-label">${label}</div>
        <div class="bms-metric-value">${fmt(val, 1)} ${unit}</div>
      </div>
    `;
  }

  _renderDischargeCard(label, entityId) {
    if (!entityId) return "";
    const val = stateOf(this._hass, entityId);
    // history_stats у режимі "time" повертає значення в годинах
    return `
      <div class="bms-metric">
        <div class="bms-metric-label">${label}</div>
        <div class="bms-metric-value">${fmt(val, 1, " год")}</div>
      </div>
    `;
  }

  _renderDiagBadge(label, entityId, positiveIsGood) {
    if (!entityId) return "";
    const state = stateOf(this._hass, entityId);
    const on = state === "on";
    const good = positiveIsGood ? on : !on;
    const color = state === undefined ? "neutral" : good ? "success" : "warning";
    const c = this._statusColorVars(color);
    return `
      <div class="bms-diag-badge" style="background:${c.bg}; color:${c.fg};">
        <div class="bms-diag-badge-label">${label}</div>
        <div class="bms-diag-badge-value">${state === undefined ? "—" : on ? "Так" : "Ні"}</div>
      </div>
    `;
  }

  _renderCellBars() {
    const cells = this._cellVoltages();
    if (!cells.length) return "<p style='opacity:0.6; font-size:12px;'>Немає даних про комірки. Додайте entities.cell_voltages або delta_cell_voltage.</p>";
    const min = Math.min(...cells);
    const max = Math.max(...cells);
    const delta = max - min;
    return `
      <div class="bms-section-title">
        <span>Напруга комірок (${cells.length})</span>
        <span class="bms-muted">Δ ${delta.toFixed(3)} V</span>
      </div>
      <div class="bms-cell-grid">
        ${cells
          .map((v, i) => this._renderCellBattery(v, i, this._cellBarColor(v, min, delta)))
          .join("")}
      </div>
    `;
  }

  _hasCapacityEntities() {
    return !!(this._e("capacity_daily") || this._e("capacity_weekly") || this._e("capacity_monthly") || this._e("capacity_total"));
  }

  _hasDischargeEntities() {
    return !!(this._e("discharge_time_daily") || this._e("discharge_time_weekly") || this._e("discharge_time_monthly"));
  }

  _renderFullView() {
    const soc = stateOf(this._hass, this._e("soc"));
    const voltage = stateOf(this._hass, this._e("voltage"));
    const current = stateOf(this._hass, this._e("current"));
    const power = stateOf(this._hass, this._e("power"));
    const temp = stateOf(this._hass, this._e("temperature"));
    const runtime = stateOf(this._hass, this._e("runtime"));
    const cycles = stateOf(this._hass, this._e("charge_cycles"));
    const linkQuality = stateOf(this._hass, this._e("link_quality"));
    const rssi = stateOf(this._hass, this._e("rssi"));
    const status = this._statusInfo();
    const statusColors = this._statusColorVars(status.color);

    return `
      <div class="bms-full">
        <div class="bms-header">
          <div class="bms-title"><i class="ti ti-bluetooth" style="color:${statusColors.fg};"></i>
            <span>${this._batteryName()}</span></div>
        </div>

        <div class="bms-top-row">
          <div class="bms-battery-col">
            ${this._renderBatteryShape(soc, "full")}
            <span class="bms-status-pill" style="background:${statusColors.bg}; color:${statusColors.fg};">
              <i class="ti ${status.icon}"></i> ${status.label}
            </span>
          </div>
          <div class="bms-metric-grid">
            ${this._renderMetricCard("Напруга", fmt(voltage, 2, " V"))}
            ${this._renderMetricCard("Струм", fmt(current, 1, " A"))}
            ${this._renderMetricCard("Потужність", fmt(power, 0, " W"))}
            ${this._renderMetricCard("Температура", fmt(temp, 1, " °C"))}
          </div>
        </div>

        ${runtime !== undefined ? `
        <div class="bms-runtime">
          <i class="ti ti-clock"></i>
          <div>
            <div class="bms-muted" style="font-size:11px;">До розряду (поточне навантаження)</div>
            <div style="font-weight:500;">${secondsToHuman(runtime)}</div>
          </div>
        </div>` : ""}

        <div class="bms-body">
          <div class="bms-section bms-section-cells">${this._renderCellBars()}</div>

          <div class="bms-section bms-section-diag">
            <div class="bms-section-title"><span>Діагностика</span></div>
            <div class="bms-diag-grid">
              ${this._renderDiagBadge("Балансир", this._e("balancer"), true)}
              ${this._renderDiagBadge("MOSFET заряд", this._e("chrg_mosfet"), true)}
              ${this._renderDiagBadge("MOSFET розряд", this._e("dischrg_mosfet"), true)}
              ${this._renderDiagBadge("Нагрівач", this._e("heater"), true)}
            </div>
            <div class="bms-diag-grid bms-diag-grid-plain">
              <div class="bms-plain-stat"><span class="bms-muted">Цикли</span><span>${fmt(cycles, 0)}</span></div>
              <div class="bms-plain-stat"><span class="bms-muted">Link Q.</span><span>${fmt(linkQuality, 0, "%")}</span></div>
              <div class="bms-plain-stat"><span class="bms-muted">RSSI</span><span>${fmt(rssi, 0, " dBm")}</span></div>
            </div>
          </div>

          <div class="bms-section bms-section-capacity">
            ${this._hasCapacityEntities() ? `
            <div class="bms-section-title"><span>Використано ємності</span></div>
            <div class="bms-diag-grid bms-capacity-grid">
              ${this._renderCapacityCard("Сьогодні", this._e("capacity_daily"))}
              ${this._renderCapacityCard("Тиждень", this._e("capacity_weekly"))}
              ${this._renderCapacityCard("Місяць", this._e("capacity_monthly"))}
              ${this._renderCapacityCard("Всього", this._e("capacity_total"))}
            </div>` : `
            <p class="bms-muted" style="font-size:12px;">
              Сенсори споживання не налаштовані. Відкрийте редактор картки —
              там є кнопка автоматичного створення, або див. README.
            </p>`}
          </div>

          ${this._hasDischargeEntities() ? `
          <div class="bms-section bms-section-discharge">
            <div class="bms-section-title"><span>Час розряду</span></div>
            <div class="bms-diag-grid bms-capacity-grid">
              ${this._renderDischargeCard("Сьогодні", this._e("discharge_time_daily"))}
              ${this._renderDischargeCard("Тиждень", this._e("discharge_time_weekly"))}
              ${this._renderDischargeCard("Місяць", this._e("discharge_time_monthly"))}
            </div>
          </div>` : ""}
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
    const statusColors = this._statusColorVars(status.color);
    return `
      <div class="bms-mini" tabindex="0" role="button" aria-label="Відкрити детальну картку батареї">
        <div class="bms-mini-header">
          <i class="ti ti-bluetooth" style="color:${statusColors.fg}; font-size:13px;"></i>
          <span>${this._batteryName()}</span>
        </div>
        <div class="bms-mini-body">
          <div class="bms-battery-col">
            ${this._renderBatteryShape(soc, "mini")}
          </div>
          <div class="bms-mini-right">
            <div class="bms-metric-grid bms-metric-grid-mini">
              ${this._renderMetricCard("Напруга", fmt(voltage, 2, " V"))}
              ${this._renderMetricCard("Струм", fmt(current, 1, " A"))}
              ${this._renderMetricCard("Потужність", fmt(power, 0, " W"))}
              ${this._renderMetricCard("Темп.", fmt(temp, 1, " °C"))}
            </div>
            <span class="bms-status-pill" style="background:${statusColors.bg}; color:${statusColors.fg};">
              <i class="ti ${status.icon}"></i> ${status.label}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  _toggleOverlay(open) {
    this._expanded = open;
    this._render();
  }

  _render() {
    if (!this._config || !this._hass) return;

    // Обчислюємо ефективні сутності один раз на рендер (автовизначені +
    // ручні перекриття) — усі виклики _e() нижче та в дочірніх методах
    // читають саме з цього кешу.
    this._resolvedEntities = this._effectiveEntities();

    if (!this._hasAnyData()) {
      this.innerHTML = `
        <ha-card style="padding:16px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; font-weight:500;">
            <i class="ti ti-bluetooth" style="font-size:16px;"></i>
            <span>${this._config.name && this._config.name.trim() ? this._config.name.trim() : "BMS Battery"}</span>
          </div>
          <p style="font-size:13px; opacity:0.75; margin:0;">
            Не вдалося автоматично знайти акумулятор BMS_BLE-HA або визначити
            його сенсори. Перевірте, що інтеграція
            <a href="https://github.com/patman15/BMS_BLE-HA" target="_blank" rel="noopener">BMS_BLE-HA</a>
            встановлена і акумулятор підключений, або оберіть пристрій/сенсори
            вручну в редакторі картки.
          </p>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
        </ha-card>
      `;
      return;
    }

    const style = `
      <style>
        :host { display:block; }
        .ti { font-size:15px; vertical-align:-2px; }
        .bms-card {
          background: var(--ha-card-background, var(--card-background-color, #fff));
          border-radius: var(--ha-card-border-radius, 12px);
          padding: 12px; color: var(--primary-text-color);
          /* Layout below reacts to the CARD's own width, not the viewport,
             so it stays compact no matter how wide the dashboard column is. */
          container-type: inline-size;
          container-name: bms;
        }
        .bms-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .bms-title { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:500; }
        .bms-status-pill { font-size:11px; padding:3px 8px; border-radius:7px; white-space:nowrap; }
        .bms-top-row { display:flex; align-items:flex-start; gap:14px; margin-bottom:10px; }
        .bms-battery-col { display:flex; flex-direction:column; align-items:center; gap:6px; flex-shrink:0; }
        .bms-battery-shape { position:relative; display:flex; align-items:center; justify-content:center; }
        .bms-battery-label { position:absolute; top:36%; display:flex; flex-direction:column; align-items:center; }
        .bms-battery-pct { font-size:14px; font-weight:600; }
        .bms-battery-shape-full .bms-battery-pct { font-size:32px; }
        .bms-battery-shape-full .bms-battery-sub { font-size:12px; }
        .bms-battery-sub { font-size:8px; opacity:0.6; }
        .bms-metric-grid { flex:1; display:grid; grid-template-columns:repeat(auto-fit, minmax(96px, 1fr)); gap:6px; min-width:0; max-width:320px; }
        .bms-metric-grid-mini { grid-template-columns:repeat(2, minmax(80px, 1fr)); max-width:220px; }
        .bms-metric { background: var(--secondary-background-color, rgba(127,127,127,0.08)); border-radius:7px; padding:6px 8px; min-width:0; max-width:170px; }
        .bms-metric-label { font-size:10px; opacity:0.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bms-metric-value { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bms-runtime { display:flex; align-items:center; gap:8px; background: var(--secondary-background-color, rgba(127,127,127,0.08));
          border-radius:7px; padding:7px 10px; margin-bottom:10px; }
        .bms-body { display:block; }
        .bms-section { border-top:0.5px solid var(--divider-color,#333); padding-top:8px; margin-top:8px; }
        .bms-section-title { display:flex; justify-content:space-between; font-size:11px; opacity:0.75; margin-bottom:6px; }
        .bms-muted { opacity:0.6; }
        .bms-cell-grid { display:flex; flex-wrap:wrap; gap:14px; }
        .bms-cell-battery { display:flex; flex-direction:column; align-items:center; gap:2px; }
        .bms-cell-battery-idx { font-size:12px; opacity:0.55; }
        .bms-cell-battery-val { font-size:12px; }
        .bms-diag-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .bms-diag-grid-plain { grid-template-columns:1fr 1fr 1fr; margin-top:6px; }
        .bms-diag-badge { border-radius:7px; padding:6px 8px; }
        .bms-diag-badge-label { font-size:10px; opacity:0.85; }
        .bms-diag-badge-value { font-size:12px; font-weight:500; }
        .bms-plain-stat { display:flex; flex-direction:column; gap:1px; font-size:12px; }
        .bms-mini { display:flex; flex-direction:column; gap:10px; cursor:pointer; }
        .bms-mini-header { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; }
        .bms-mini-body { display:flex; gap:10px; align-items:center; }
        .bms-mini-right { flex:1; display:flex; flex-direction:column; gap:6px; min-width:0; }
        .bms-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box; }
        .bms-overlay-inner { background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
          border-radius:12px; max-width:480px; width:100%; max-height:90vh; overflow-y:auto; padding:12px; position:relative; }
        .bms-overlay.landscape .bms-overlay-inner { max-width:760px; }
        .bms-overlay-close { position:absolute; top:6px; right:6px; background:transparent; border:none;
          color:var(--primary-text-color); font-size:18px; cursor:pointer; padding:6px; }

        /* --- Adaptive layout: driven by the card's own rendered width --- */
        @container bms (min-width: 460px) {
          .bms-capacity-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @container bms (min-width: 560px) {
          .bms-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 12px;
            grid-template-areas:
              "cells diag"
              "capacity capacity"
              "discharge discharge";
          }
          .bms-section-cells { grid-area: cells; border-top:none; margin-top:0; padding-top:0; }
          .bms-section-diag { grid-area: diag; border-top:none; margin-top:0; padding-top:0;
            border-left:0.5px solid var(--divider-color,#333); padding-left:12px; }
          .bms-section-capacity { grid-area: capacity; }
          .bms-section-discharge { grid-area: discharge; }
        }
        @container bms (min-width: 760px) {
          .bms-top-row { gap:24px; }
          .bms-metric-grid { grid-template-columns: repeat(4, 1fr); }
        }
      </style>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css">
    `;

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
            <div class="bms-card" style="padding:0;">${this._renderFullView()}</div>
          </div>
        </div>
      ` : ""}
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
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this._toggleOverlay(false));
    }
  }
}

customElements.define("ha-bms-ble-card", HaBmsBleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-bms-ble-card",
  name: "BMS BLE Battery Card",
  description: "Картка для BLE BMS-акумуляторів (Redodo/LiTime/JBD/Daly/JK/Seplos) через інтеграцію BMS_BLE-HA",
  preview: true,
});

// Чисті допоміжні функції винесені для юніт-тестів (Node, CommonJS).
// У браузері `module` не визначений, тому цей блок там просто не спрацює.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fmt,
    secondsToHuman,
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
