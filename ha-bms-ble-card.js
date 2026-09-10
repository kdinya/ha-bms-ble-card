/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.5";

console.info(
  `%c HA-BMS-BLE-CARD %c v${CARD_VERSION} `,
  "color: white; background: #0F6E56; font-weight: 700;",
  "color: #0F6E56; background: white; font-weight: 700;"
);

/** Словник перекладів інтерфейсу картки. За замовчуванням — українська
 *  (`uk`), як і було раніше; `en` — англійська. Мова зберігається в
 *  localStorage і перемикається на вкладці "Налаштування" без
 *  перезавантаження сторінки (просто перерендерює картку). */
const I18N = {
  uk: {
    nav_home: "ГОЛОВНА",
    nav_info: "ІНФОРМАЦІЯ",
    nav_stats: "СТАТИСТИКА",
    nav_settings: "НАЛАШТ.",
    status_connected: "Підключено",
    node_grid: "МЕРЕЖА",
    node_load: "НАВАНТАЖЕННЯ",
    status_charging: "Заряджається",
    status_discharging: "Розряджається",
    status_problem: "Проблема",
    status_idle: "У простої",
    balancing: "Балансування",
    eta_to_discharge: "До розряду",
    eta_to_full_charge: "До повного заряду",
    func_balancer: "Балансир",
    func_charge_mosfet: "MOSFET заряд",
    func_discharge_mosfet: "MOSFET розряд",
    func_heater: "Нагрівач",
    func_problem: "Проблеми",
    func_mode: "Режим",
    state_active: "Активний",
    state_disabled: "Вимкнено",
    state_enabled: "Увімкнено",
    state_yes: "Є",
    state_no: "Немає",
    mode_charge: "Заряд",
    mode_discharge: "Розряд",
    cells_title: "Комірки",
    cells_no_data: "Немає даних",
    cell_max: "Макс",
    cell_min: "Мін",
    cell_diff: "Різниця",
    section_cells: "Комірки",
    section_indicators: "Всі показники",
    section_functions: "Функції",
    section_history: "Історія",
    stats_discharge_title: "Розряд",
    stats_charge_title: "Заряд",
    stats_ah_used: "Використано ємності",
    stats_discharge_duration: "Час під навантаженням",
    stats_today: "Сьогодні",
    stats_week: "Тиждень",
    stats_month: "Місяць",
    stats_total: "Всього",
    stats_charge_unavailable: "Статистика заряду поки не налаштована. Потрібні окремі сенсори обсягу заряду (аналогічно розряду) — додамо їх у Setup Wizard окремим кроком.",
    lbl_voltage: "Напруга",
    lbl_current: "Струм",
    lbl_power: "Потужність",
    lbl_temperature: "Температура",
    lbl_soc: "Заряд (SOC)",
    lbl_soh: "SOH",
    lbl_capacity: "Ємність",
    lbl_used: "Використано",
    lbl_remaining: "Залишилось",
    lbl_cycles: "Цикли",
    lbl_stored_energy: "Запасена енергія",
    lbl_runtime: "Час роботи (BMS)",
    lbl_balance_current: "Струм балансування",
    lbl_cell_bitmask: "Бітова маска комірок",
    lbl_link_quality: "Якість звʼязку",
    lbl_rssi: "RSSI",
    lbl_cell_count: "Кількість комірок",
    lbl_cell_delta: "Різниця комірок (Δ)",
    lbl_cell_max: "Макс. напруга комірки",
    lbl_cell_min: "Мін. напруга комірки",
    settings_language: "Мова",
    settings_language_hint: "Мова інтерфейсу картки",
    lang_uk: "Українська",
    lang_en: "English",
  },
  en: {
    nav_home: "HOME",
    nav_info: "INFO",
    nav_stats: "STATS",
    nav_settings: "SETTINGS",
    status_connected: "Connected",
    node_grid: "GRID",
    node_load: "LOAD",
    status_charging: "Charging",
    status_discharging: "Discharging",
    status_problem: "Problem",
    status_idle: "Idle",
    balancing: "Balancing",
    eta_to_discharge: "Until discharged",
    eta_to_full_charge: "Until fully charged",
    func_balancer: "Balancer",
    func_charge_mosfet: "Charge MOSFET",
    func_discharge_mosfet: "Discharge MOSFET",
    func_heater: "Heater",
    func_problem: "Problems",
    func_mode: "Mode",
    state_active: "Active",
    state_disabled: "Disabled",
    state_enabled: "Enabled",
    state_yes: "Yes",
    state_no: "None",
    mode_charge: "Charge",
    mode_discharge: "Discharge",
    cells_title: "Cells",
    cells_no_data: "No data",
    cell_max: "Max",
    cell_min: "Min",
    cell_diff: "Diff",
    section_cells: "Cells",
    section_indicators: "All indicators",
    section_functions: "Functions",
    section_history: "History",
    stats_discharge_title: "Discharge",
    stats_charge_title: "Charge",
    stats_ah_used: "Capacity used",
    stats_discharge_duration: "Time under load",
    stats_today: "Today",
    stats_week: "Week",
    stats_month: "Month",
    stats_total: "Total",
    stats_charge_unavailable: "Charge statistics aren't set up yet. Separate charge-capacity sensors (mirroring discharge) are needed — we'll add them as another Setup Wizard step.",
    lbl_voltage: "Voltage",
    lbl_current: "Current",
    lbl_power: "Power",
    lbl_temperature: "Temperature",
    lbl_soc: "Charge (SOC)",
    lbl_soh: "SOH",
    lbl_capacity: "Capacity",
    lbl_used: "Used",
    lbl_remaining: "Remaining",
    lbl_cycles: "Cycles",
    lbl_stored_energy: "Stored Energy",
    lbl_runtime: "Runtime (BMS)",
    lbl_balance_current: "Balance Current",
    lbl_cell_bitmask: "Cell Bitmask",
    lbl_link_quality: "Link Quality",
    lbl_rssi: "RSSI",
    lbl_cell_count: "Cell Count",
    lbl_cell_delta: "Cell Delta (Δ)",
    lbl_cell_max: "Max Cell Voltage",
    lbl_cell_min: "Min Cell Voltage",
    settings_language: "Language",
    settings_language_hint: "Card interface language",
    lang_uk: "Українська",
    lang_en: "English",
  },
};
const I18N_LANG_KEY = "ha-bms-ble-card-lang";

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

/** Потужність (Вт) у кВт з одним десятковим знаком, для вузлів
 *  "Мережа"/"Навантаження" у flow-row. */
function fmtKw(watts) {
  const num = Number(watts);
  if (!Number.isFinite(num)) return "—";
  return (Math.abs(num) / 1000).toFixed(1);
}

/* ----------------------------------------------------------------------
 * SOC / стан батареї — математика та нормалізація.
 * -------------------------------------------------------------------- */

/**
 * Єдина точка нормалізації SOC (заряду акумулятора) у картці. Раніше
 * кожне місце, що показує SOC (текст %, заливка mini-віджета, банка,
 * ETA, stored-energy), робило власний `Number(x)` + власний clamp —
 * деякі як `Number(x) || 0` (тихо ховає "unknown" за 0%), інші як
 * `Number.isFinite(x) ? clamp(x) : 0`. Тепер усі вони спершу проганяють
 * сире значення сенсора через normalizeSoc() і далі користуються лише
 * цим одним числом.
 *
 * Контракт:
 *   - null/undefined/""/"unknown"/"unavailable"/NaN → null (немає
 *     заряду, який можна показати — виклик має вивести "—"/"N/A" і не
 *     малювати заливку, а не мовчки підставляти 0%).
 *   - число < 0 → 0, число > 100 → 100 (обрізання діапазону).
 *   - валідне число в діапазоні 0..100 повертається як є (без
 *     округлення — округлення до цілого для тексту "%" робить лише
 *     сам виклик, що показує значення).
 */
function normalizeSoc(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "" || s === "unknown" || s === "unavailable") return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

function stateOf(hass, entityId) {
  if (!entityId || !hass || !hass.states[entityId]) return undefined;
  return hass.states[entityId].state;
}

function attrOf(hass, entityId, attr) {
  if (!entityId || !hass || !hass.states[entityId]) return undefined;
  return hass.states[entityId].attributes[attr];
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
  "ti-transmission-tower": "mdi:transmission-tower",
  "ti-home-bolt": "mdi:home-lightning-bolt",
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
  const totalMinutes = Math.round(s / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} хв`;
  return `${h} год ${m} хв`;
}

/**
 * Оцінка часу до повного / до порожнього.
 * BMS runtime часто unavailable під час заряду — тоді рахуємо з SOC + струм + ємність.
 */
function estimateEtaSeconds({ soc, current, designAh, storedWh, packVoltage, charging }) {
  if (soc === null || soc === undefined) return undefined;
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

/**
 * Розбирає bitmask активного балансування з атрибута "cells" бінарного
 * сенсора balancer у BMS_BLE-HA — див. binary_sensor.py:
 * `{ATTR_CELLS: f"{data.get(ATTR_BALANCER, 0):0{data.get(ATTR_CELL_COUNT, 8)}b}"[::-1]}`.
 * Рядок РЕВЕРСНУТИЙ відносно звичайного бінарного запису, тому символ
 * на позиції i відповідає біту i вихідного числа — тобто комірці №(i+1).
 * Повертає множину 0-based індексів комірок, які зараз балансуються.
 * Натхнення з jk-bms-card: там balancer_status_bitmask підсвічує активні
 * комірки замість анімації "від найвищої до найнижчої" наосліп.
 */
function activeBalancingCells(bitmaskStr) {
  const result = new Set();
  if (typeof bitmaskStr !== "string") return result;
  for (let i = 0; i < bitmaskStr.length; i++) {
    if (bitmaskStr[i] === "1") result.add(i);
  }
  return result;
}

/**
 * HTML-атрибути, які роблять елемент клікабельним для відкриття
 * стандартного діалогу історії/деталей сутності Home Assistant (подія
 * "hass-more-info", яку слухає дашборд). Натхнення — головна фішка
 * jk-bms-card: "clicking on an entity to see the history". Повертає
 * порожній рядок, якщо entity_id невідомий (немає окремої сутності —
 * наприклад значення взяте з атрибута).
 */
function moreInfoAttr(entityId) {
  return entityId ? ` data-more-info="${entityId}" tabindex="0" role="button"` : "";
}

/**
 * Двоколірна анімована стрілка потоку енергії (Мережа<->Батарея,
 * Батарея<->Навантаження). У стані спокою — сірий, нерухомий контур
 * стрілки; коли ця сторона активна (заряд/розряд), стрілка набуває
 * кольору відповідного напряму (зелений заряд / оранжевий розряд) і
 * пунктир рухається вздовж лінії до вістря. Форма — плавний
 * однократний вигин (як і раніше), стрілка завжди йде в бік батареї
 * чи навантаження від джерела потоку.
 */
function flowArrowSvg(vertical, active, colorHex, flip) {
  const stroke = active ? colorHex : "#3a4650";
  const dashClass = active ? "flow-arrow-active" : "";
  if (vertical) {
    // flip: дзеркально по вертикалі (100 - y), щоб права стрілка
    // (Батарея->Навантаження) йшла вниз-до-виходу, симетрично лівій.
    if (flip) {
      return `<svg class="flow-arrow flow-arrow-v" viewBox="0 0 50 100" preserveAspectRatio="none" aria-hidden="true">
        <path class="flow-arrow-path ${dashClass}" d="M14,96 C14,72 36,72 36,50 L36,22" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round"/>
        <polygon class="flow-arrow-head" points="25,23 36,2 47,23" fill="${stroke}"/>
      </svg>`;
    }
    return `<svg class="flow-arrow flow-arrow-v" viewBox="0 0 50 100" preserveAspectRatio="none" aria-hidden="true">
      <path class="flow-arrow-path ${dashClass}" d="M14,4 C14,28 36,28 36,50 L36,78" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round"/>
      <polygon class="flow-arrow-head" points="25,77 36,98 47,77" fill="${stroke}"/>
    </svg>`;
  }
  // flip: дзеркально по вертикалі (50 - y) — ліва стрілка йде знизу
  // вгору (Мережа->Батарея), права тепер симетрично йде згори вниз
  // (Батарея->Навантаження), а не повторює той самий підйом.
  if (flip) {
    return `<svg class="flow-arrow flow-arrow-h" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
      <path class="flow-arrow-path ${dashClass}" d="M4,14 C28,14 28,36 50,36 L78,36" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round"/>
      <polygon class="flow-arrow-head" points="77,25 98,36 77,47" fill="${stroke}"/>
    </svg>`;
  }
  return `<svg class="flow-arrow flow-arrow-h" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
    <path class="flow-arrow-path ${dashClass}" d="M4,36 C28,36 28,14 50,14 L78,14" fill="none" stroke="${stroke}" stroke-width="5.5" stroke-linecap="round"/>
    <polygon class="flow-arrow-head" points="77,3 98,14 77,25" fill="${stroke}"/>
  </svg>`;
}

/**
 * Колір рідини в "скляній банці" залежно від SOC — три пороги, як у
 * референсному прев'ю (>50% зелений, >20% бурштиновий, інакше червоний).
 */
/**
 * Скляна банка-акумулятор (LiFePO4 jar) — точна SVG-копія референсного
 * прев'ю (ковпачок, скло, рідина з меніском і підсвіткою поверхні).
 * Усі id всередині <defs> namespaced через `uid` (this._uid картки) —
 * інакше кілька екземплярів картки на одному дашборді конфліктували б
 * через дублікати id ґрадієнтів/clipPath у спільному DOM.
 */
/**
 * Фотореалістична банка-батарея з анімацією — узята з референсного
 * макета користувача (animated_battery_75_charging_sections.html):
 * базова художня робота (скляна банка, кришка, відблиски) лишається
 * растровим зображенням (WebP, стиснуте з ~107 КБ JPEG до ~11 КБ),
 * а рівень/колір рідини, номер відсотка та риски секцій — прозорий
 * SVG-оверлей поверх нього, що перераховується при кожному рендері
 * картки за тими самими формулами, що й оригінальний JS (setCharge),
 * тільки одноразово (без requestAnimationFrame — реальний SOC і так
 * оновлюється через hass). Декоративного "sweep"-блиску немає — на
 * прохання користувача жодної постійної анімації на батареї, коли
 * вона не заряджається й не розряджається (лише рівень/колір рідини
 * змінюються при зміні SOC).
 */
const JAR_BATTERY_IMG = "data:image/webp;base64,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6d6e995u9bl/brcyx2vpqf/koqvrus91frad2eacTff5/LrP59fn168/fv36XJH7VAZ0HWZmX7v3Wnv37m4gVBQKBEJCKlHqUMZxnsZxrFWsYiCKvMzD7rjfbw/bw2kuQDADJC8uFXODhMcSABAUBckFQE6AInw5SXWRBPllYwICxN23JJV8oShC+GF9FIAcAC24lXwo2RUe/rflp2eX6/VytVy1dRVCAODeWtv3dbvt9Ja9O51OwAjSO907e++9mkWEImutdRzH83j8PH/+WleXilBTVBBut8+9VZ90b+VqW2apy75cn6qj42fHtjRK88jD5vnbn//D3/76t7/9D3//8+tzX1FRhC/V0oiQQiFFlFrHcZwO4zhO4zhUQeZp2O3324fN/nQctpMHNinFYBAkh6RSHOYGAZLwgwIhinA43OEGJ6R2gIGE8KvGtkEqEMxMhCzdGUDEYwEQ8f9UkkuSS6CR8I2zAERszp+uztbr9Wq1fj5NtYTACNO7e69rXetaa+21dqc7HQMIXZr2NEWzd5tGEJGLAOpy7ZztsI1ts7NltsbYlJCaxtpmz9xun27dbjfP/nyezbPNZrnu194WCC5diigqhWXVGGOIoQ7DNIzDMNQy1CLh3tbry+V6ubx+2u03d6epuELTtHWVosFoBAHIJcjldIM+ToEQfpCAuwSIAoJnOFpjSDrkF4G0LQW2mG2XkBQJiQQIoPCD+gEJeuwud7nkPrlZggMEaSSNMR6eng7H8/np6fT09fM8D6OK16HTHdK9+3r2da117b1nz8w0M1OFCQFUURNTxXWDSoKZv7gIHefMe2by3hDMz3HK5WslS9dHj1VjjDHHMcZxHPM4xlqjlujZtvV2fb1eL9frcrldPl62lpAURUGsuypaVVVGIwmA+iiKywMgCIBESIAIgALkgkMylwmFZQxCwi8bZN1UVJ3tn46TCio6dhlTKFQaEYtO/3USkkrnf/1f/vk//u3bt++//en7t/fzOOZQjLxO7732Pl/v8319vd/nPmdmqqiartNQEcFgHmPzcyQx92CHY2j5mJAAkoAg3lKWVTXGHKNqjDHnHGOOOcZY61hr0TQz5/l6//Pr7//8/ff//Pvv//zX//2f88z8tt9+o7o9xXTkvJexcJF5TSHNVQJZZZwu22azzf4Ica1yhT43ftYeKBWSzymHw3KGVB1k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vbq66AKdLlh39cl1GL786rvZUsT/y5KAv0C4rq68Z/M0jtMwnqbp9NAztt0q+jy7B6lYe3lz9cmTepznW1arn1ysV23SfBqmAotBS+ZMtova4J7L7MUhUARokEyEQhLgfGhS1pxzzHmc5zwej2Mex3ykk6R7zDlLku6k9z73nj3z3nt3vt/V1a17u263j19uSyjyHrTYsNciJMJaLtd6PJ8/Z805z+Oc53mcc8w5qrwDdDpb623ft21b1731nt0NUUrUUqJEKREB3dn3nt0gQBrdGMtgdbQIDcf98VScsapsPh769w+jg+0nV1eX5ylIUhHby5sny3z39TcPOSSDSAJCErBQi1+0t+r1lYDgDjt9+005f3H1E/Uf3j9ABgolGKbd+7e/2czuCO3l89WqW9TIecpjnuciQFWsqwAVLy5JIEmjPaIsAEMUIOmkd+fj+Xw+1+ePGuc45nkccx5zjBqKEkno7prNzHnu2fvc+35e//z58/l07+d+brr/uDfjPk/V858oxlH6r3M6/T/3uU6qu7vPOtbxOB7rWGsd61hjjFE1KAsg2b1779VrXet6Pve9NfdMSyGFFAoUkbIRCGEV9z1tFwBSAbLuoosBuYzzOM0OAu7z6fjubii0kM6fX16crxIouQv1+bOnrW9//c3744RKJZISQCRA0ED8NbbrUhI2AJDogODTw9v28vnTy0/RJ88FNMIFYzne3j58tckALbVnT85Wi6byPI7DNLlcQAxVCAb/CB4hO0EVEOY+sQNN6ALI6u50NwGraowx5zzmnMccc4wqURGwq9Lz3rr33s/ndvvci1RPotxTVOqcc91dX/p0VBdAEpROOt177b2udV3XWte11/58rrWtiDrMUUJRJAWSjELCckellFBvS7ciAgjCnFXddsxzKWAKmKdxOPb3d/u5iKzOfnpxtl52kYLLGeru6qorD+/evt+PbiFI+Kggkk4IFYBYoJQa5k0CBEQBZXJWzeWLpxfN2VmlDEJ0FQDK/ebu/tvtBJIWuovL5apLlofTmLMXOWAhhmjBSKMZNZlZKSE6MkZpaOh0DMZRYAtJ90530h3oCJSjjrXW8TzW43gct+fMGTZGUFj+YpfnNIgww95M07629+xzXevqvVev53Ov7qTVUFpjVo1VoVAERFgSKiKCdMYQinRr67aXoZTAYUA0I6syZAspxTxs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";
const JAR_TOP_Y = 200;
const JAR_FLOOR_Y = 790;
// Найглибша точка округленого дна банки (нижче JAR_FLOOR_Y) — рідина
// ніколи не малюється нижче прямої частини скла, лише сама крива дна
// спускається сюди для природного заокруглення калюжі.
const JAR_APEX_Y = 858;
const JAR_LEFT_X = 45;
const JAR_RIGHT_X = 455;
const JAR_CX = (JAR_LEFT_X + JAR_RIGHT_X) / 2;

function jarBatteryColorFor(p) {
  if (p < 20) return { main: "#ff2419", bright: "#ff5a45" };
  if (p < 50) return { main: "#ff9d12", bright: "#ffc04a" };
  return { main: "#20df14", bright: "#42ff25" };
}

/** Банка-акумулятор: заряд лежить ОКРЕМИМ шаром ПІД корпусом банки.
 *  DOM-порядок (перший = найнижчий шар):
 *    1) <svg class="jar-battery-overlay"> — сам рідинний заряд (у
 *       clip-path точно по формі внутрішньої порожнини банки, тож
 *       фізично не може вийти за контур/дно).
 *    2) <img class="jar-battery-img"> — фото скляної банки з
 *       прозорим фоном і напівпрозорою центральною (внутрішньою)
 *       частиною, накладене absolute зверху. Тому кольоровий заряд
 *       просвічує крізь скло знизу, а кришка/обідки/відблиски скла
 *       завжди лишаються повністю видимими поверх рідини — так і
 *       виглядає, що банка "наповнюється" при зміні SOC. */
function jarBatterySvg(uid, percent, voltageLabel) {
  // percent тепер очікується вже нормалізованим через normalizeSoc()
  // (число 0..100 або null = даних немає — тоді банка порожня і замість
  // числа показуємо "N/A", а не вводить в оману "0%").
  const hasData = percent !== null && percent !== undefined && Number.isFinite(Number(percent));
  const p = hasData ? Math.max(0, Math.min(100, Number(percent))) : 0;
  const c = jarBatteryColorFor(p);
  const id = (name) => `${name}-${uid}`;
  const y = JAR_FLOOR_Y - (JAR_FLOOR_Y - JAR_TOP_Y) * (p / 100);
  const half = (JAR_RIGHT_X - JAR_LEFT_X) / 2;

  const liquidD = `M${JAR_LEFT_X} ${y + 2} Q${JAR_CX} ${y - 16} ${JAR_RIGHT_X} ${y - 3} L${JAR_RIGHT_X} ${JAR_APEX_Y - 30} Q${JAR_CX} ${JAR_APEX_Y} ${JAR_LEFT_X} ${JAR_APEX_Y - 30} Z`;

  const sectionOpacity = (sectionY) => (sectionY >= y && p > 0 ? "0.35" : "0");

  const liquidMarkup = p > 0 ? `
      <g>
        <path fill="${c.main}" opacity=".92" d="${liquidD}"/>
        <ellipse cx="${JAR_CX}" cy="${y - 2}" rx="${half - 3}" ry="16" fill="${c.bright}" opacity=".85"/>
        <ellipse cx="${JAR_CX}" cy="${y - 2}" rx="${half - 8}" ry="12" fill="${c.main}" opacity=".45"/>
      </g>
      <g fill="none" stroke-linecap="round" pointer-events="none">
        <path d="M${JAR_LEFT_X} 340 Q${JAR_CX} 357 ${JAR_RIGHT_X} 340" stroke="${c.bright}" stroke-width="3" opacity="${sectionOpacity(340)}"/>
        <path d="M${JAR_LEFT_X} 522 Q${JAR_CX} 539 ${JAR_RIGHT_X} 522" stroke="${c.bright}" stroke-width="2.4" opacity="${sectionOpacity(522)}"/>
        <path d="M${JAR_LEFT_X} 700 Q${JAR_CX} 717 ${JAR_RIGHT_X} 700" stroke="${c.main}" stroke-width="3" opacity="${sectionOpacity(700)}"/>
      </g>` : "";

  return `
    <div class="battery-svg jar-battery">
      <svg class="jar-battery-overlay" viewBox="0 0 500 940" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <clipPath id="${id("innerBatteryClip")}">
            <path d="M${JAR_LEFT_X} ${JAR_TOP_Y - 10} Q${JAR_CX} ${JAR_TOP_Y + 8} ${JAR_RIGHT_X} ${JAR_TOP_Y - 10} L${JAR_RIGHT_X} ${JAR_APEX_Y - 34} Q${JAR_CX} ${JAR_APEX_Y + 4} ${JAR_LEFT_X} ${JAR_APEX_Y - 34} Z"/>
          </clipPath>
        </defs>
        <g clip-path="url(#${id("innerBatteryClip")})" pointer-events="none">
          ${liquidMarkup}
        </g>
        <text x="${JAR_CX}" y="460" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="white" style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.6));">
          ${hasData
            ? `<tspan font-size="170" font-weight="700" fill="white">${Math.round(p)}</tspan><tspan font-size="95" font-weight="400" dx="2" fill="white">%</tspan>`
            : `<tspan font-size="120" font-weight="700" fill="#aeb8c2">N/A</tspan>`}
        </text>
        ${voltageLabel !== undefined && voltageLabel !== null && voltageLabel !== "—" ? `<text x="${JAR_CX}" y="591" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-size="92" font-weight="600" fill="white" opacity=".92" style="filter:drop-shadow(0 2px 5px rgba(0,0,0,0.6));">${voltageLabel} V</text>` : ""}
      </svg>
      <img class="jar-battery-img" src="${JAR_BATTERY_IMG}" alt=""/>
    </div>`;
}


function gridPylonSvg() {
  return `
    <svg class="node-icon" viewBox="0 0 100 100" aria-hidden="true">
      <g stroke="#9fb3c4" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M50 8 L50 88"/>
        <path d="M38 8 L62 8"/>
        <path d="M20 30 L80 30"/>
        <path d="M28 50 L72 50"/>
        <path d="M50 8 L20 30 M50 8 L80 30"/>
        <path d="M50 30 L28 50 M50 30 L72 50"/>
        <path d="M50 50 L34 88 M50 50 L66 88"/>
        <path d="M22 88 L78 88"/>
        <path d="M14 22 L26 22 M74 22 L86 22"/>
        <path d="M14 22 L20 30 M26 22 L20 30 M74 22 L80 30 M86 22 L80 30"/>
      </g>
    </svg>`;
}

/** Іконка будинку для вузла "Навантаження" у flow-row — точна копія
 *  графіки з референсного прев'ю. */
function houseLoadSvg() {
  return `
    <svg class="node-icon" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 12 L92 46 L84 46 L84 88 L16 88 L16 46 L8 46 Z" fill="#33414c" stroke="#1c2830" stroke-width="2" stroke-linejoin="round"/>
      <rect x="60" y="14" width="10" height="16" fill="#33414c" stroke="#1c2830" stroke-width="1.5"/>
      <rect x="30" y="56" width="22" height="22" rx="2" fill="#f4b942" stroke="#7a5b17" stroke-width="1.5"/>
      <line x1="41" y1="56" x2="41" y2="78" stroke="#7a5b17" stroke-width="1.5"/>
      <line x1="30" y1="67" x2="52" y2="67" stroke="#7a5b17" stroke-width="1.5"/>
      <rect x="58" y="66" width="14" height="22" rx="1.5" fill="#20262b" stroke="#101418" stroke-width="1.5"/>
      <circle cx="68" cy="77" r="1.3" fill="#8a97a2"/>
    </svg>`;
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
 *  потрібною для класифікації (домен, device_class, object_id,
 *  translation_key тощо).
 *
 *  ВАЖЛИВО: `hass.entities`, який картка отримує в браузері, — це НЕ повний
 *  реєстр сутностей. Фронтенд HA підписується на полегшену версію
 *  (`config/entity_registry/list_for_display`), і в ній: (1) немає поля
 *  `unique_id` взагалі; (2) сутності, вимкнені за замовчуванням
 *  (`disabled_by` не null), НЕ включаються в цей список — бекенд явно
 *  фільтрує їх (`entry.disabled_by is None`). Це стосується, зокрема,
 *  Max/Min cell voltage, MOSFET заряду/розряду, Balancer, Heater, RSSI,
 *  Link quality — всі вони в BMS_BLE-HA вимкнені за замовчуванням.
 *  Тому автопошук нижче для них нічого не знайде через `hass.entities`,
 *  доки користувач вручну не увімкне сутність у HA — і жодна евристика
 *  за словами/device_class/translation_key це не обійде, бо сутності
 *  просто немає в даних, які бачить картка. Для таких сутностей є окремий
 *  запит через `config/entity_registry/list` (без цього фільтра) —
 *  див. `HaBmsBleCardEditor._ensureFullRegistryFetch`.
 */
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
        translationKey: e.translation_key,
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
 * це завжди {key}, без винятків. Використовується лише з повним
 * реєстром (`config/entity_registry/list`), де unique_id реально є.
 */
function keyFromUniqueId(uniqueId) {
  if (!uniqueId) return undefined;
  const idx = uniqueId.lastIndexOf("-");
  return idx >= 0 ? uniqueId.slice(idx + 1) : undefined;
}

/**
 * Точна відповідність "внутрішній ключ BMS_BLE-HA" → "ключ конфігу
 * картки". Внутрішній ключ — це одне й те саме значення, яке в самій
 * інтеграції є і `key`, і (де воно задане) `translation_key` сенсора,
 * і завжди останній сегмент `unique_id`. Використовується у двох
 * місцях: (1) підбір за `translation_key` з полегшеного `hass.entities`
 * (працює лише для сенсорів, де в BMS_BLE-HA задано translation_key —
 * не всі його мають, див. коментар нижче); (2) підбір за `unique_id`
 * з повного реєстру (працює для всіх сутностей, увімкнених і вимкнених).
 */
const BMS_BLE_KEY_MAP = {
  battery_health: "soh",
  cycles: "charge_cycles",
  design_capacity: "design_capacity",
  delta_cell_voltage: "delta_cell_voltage",
  max_cell_voltage: "max_cell_voltage",
  min_cell_voltage: "min_cell_voltage",
  rssi: "rssi",
  link_quality: "link_quality",
  runtime: "runtime",
  current: "current",
  balancer: "balancer",
  chrg_mosfet: "chrg_mosfet",
  dischrg_mosfet: "dischrg_mosfet",
  heater: "heater",
  // Ці ключі НЕ мають translation_key в самій інтеграції (тому через
  // полегшений hass.entities не підберуться), але мають unique_id —
  // придатні лише для підбору через повний реєстр:
  voltage: "voltage",
  battery_level: "soc",
  power: "power",
  battery_charging: "charging",
  problem: "problem",
  cycle_capacity: "cycle_capacity",
};

/**
 * Розбирає результат `hass.callWS({ type: "config/entity_registry/list" })`
 * (повний реєстр, БЕЗ фільтра за disabled_by — на відміну від полегшеного
 * `hass.entities`) на мапу ключів конфігу картки, підбираючи сутності
 * конкретного пристрою за точним ключем з `unique_id`. Це єдиний спосіб
 * автоматично підхопити сутності, вимкнені за замовчуванням.
 */
function discoverFromFullRegistry(entries, deviceId) {
  const result = {};
  if (!Array.isArray(entries) || !deviceId) return result;
  for (const e of entries) {
    if (!e || e.device_id !== deviceId || e.platform !== BMS_BLE_DOMAIN) continue;
    const rawKey = keyFromUniqueId(e.unique_id);
    const cardKey = rawKey && BMS_BLE_KEY_MAP[rawKey];
    if (cardKey && !result[cardKey]) {
      result[cardKey] = { entityId: e.entity_id, disabledBy: e.disabled_by || null };
    }
  }
  return result;
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
  // cycle_capacity в BMS_BLE-HA не має translation_key (тому не підбирається
  // проходом 1 нижче), але має device_class "energy_storage" — і, на
  // відміну від max/min cell voltage тощо, цей сенсор УВІМКНЕНИЙ за
  // замовчуванням, тож у нього є live-стан і device_class з нього доступний.
  { key: "cycle_capacity", domain: "sensor", deviceClass: "energy_storage" },
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

  // 1) За translation_key з полегшеного hass.entities — працює лише для
  //    сенсорів, які мають translation_key в самій інтеграції (більшість,
  //    окрім voltage/battery_level/power/battery_charging/problem/
  //    cycle_capacity — для них є проходи 2-3 нижче). ВАЖЛИВО: сутності,
  //    вимкнені за замовчуванням (max/min cell voltage, MOSFET заряду/
  //    розряду, balancer, heater, rssi, link_quality), у hass.entities
  //    взагалі відсутні (бекенд HA відфільтровує їх з полегшеного
  //    реєстру) — цей прохід їх знайде, лише якщо користувач уже увімкнув
  //    їх у HA вручну. Для пошуку вимкнених сутностей без ручного
  //    втручання дивись HaBmsBleCardEditor._ensureFullRegistryFetch.
  for (const e of list) {
    if (used.has(e.entityId)) continue;
    const cardKey = e.translationKey && BMS_BLE_KEY_MAP[e.translationKey];
    if (cardKey && !result[cardKey]) {
      result[cardKey] = e.entityId;
      used.add(e.entityId);
    }
  }

  // 2) Фолбек за словами в entity_id — для сутностей без translation_key
  //    у реєстрі (нетипові інтеграції) або коли ключ не входить у мапу.
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

/**
 * Ключі полів, чиї СУТНОСТІ в BMS_BLE-HA створюються, лише якщо конкретний
 * BMS-чіп/плата фактично повідомляє ці дані по BLE (у самій інтеграції —
 * `if descr.key not in bms.data: continue` для ВСІХ binary_sensor, і
 * `if descr.optional and descr.key not in bms.data: continue` для
 * помічених optional=True сенсорів). Це не "вимкнено за замовчуванням"
 * (як max/min cell voltage) — сутності може не бути ВЗАГАЛІ, назавжди,
 * якщо ваш конкретний драйвер aiobmsble для вашої моделі батареї просто
 * не вміє читати цей параметр. Підтверджено, зокрема, офіційним issue
 * (patman15/aiobmsble#7): для JK BMS статус MOSFET заряду/розряду
 * недоступний. Коли поле з цього списку не знайдено НІДЕ (ні в
 * hass.entities, ні в повному реєстрі), показуємо саме це пояснення —
 * а не загальне "не знайдено автоматично", яке виглядає як баг картки.
 */
const HARDWARE_DEPENDENT_FIELDS = new Set(["balancer", "chrg_mosfet", "dischrg_mosfet", "heater", "soh", "design_capacity"]);

/**
 * Наскільки барвиста анімація "потоку" всередині батареї відповідає
 * поточному режиму (заряд/розряд), визначеному в `_statusInfo()`. Винесено
 * як чисту функцію заради юніт-тесту — конкретні підписи статусу лишаються
 * єдиним джерелом істини, замість дублювання умов current>0/charging="on".
 * Натхнення — анімація потоку в jk-bms-card (там вона для балансування;
 * тут ми додаємо саме заряд/розряд, якого явно просив користувач).
 */
function chargeFlowState(statusLabel) {
  if (statusLabel === "Заряджається") return "charging";
  if (statusLabel === "Розряджається") return "discharging";
  return null;
}

class HaBmsBleCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._wizardStatus = null;
    this._wizardBusy = false;
    this._fullRegistry = null;
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
    this._ensureFullRegistryFetch(deviceId);
    const fromRegistry = {};
    const registryMap = this._fullRegistryMap(deviceId);
    for (const [k, info] of Object.entries(registryMap)) fromRegistry[k] = info.entityId;
    return { ...auto, ...fromRegistry, ...this._entities() };
  }

  /** Мапа, зібрана з повного реєстру сутностей (config/entity_registry/list)
   *  для поточного deviceId, якщо вона вже завантажена — інакше {}. */
  _fullRegistryMap(deviceId) {
    return this._fullRegistry && this._fullRegistry.deviceId === deviceId ? this._fullRegistry.map : {};
  }

  /**
   * `hass.entities`, доступний картці в браузері, — це полегшений реєстр
   * (`config/entity_registry/list_for_display`), який HA явно фільтрує:
   * сутності з `disabled_by !== null` у нього не потрапляють (і в нього
   * немає навіть unique_id). У BMS_BLE-HA вимкнені за замовчуванням саме
   * Max/Min cell voltage, MOSFET заряду/розряду, Balancer, Heater, RSSI,
   * Link quality — тому звичайний автопошук (`autoDiscoverEntities`) їх
   * ніколи не знайде, скільки евристик не додавай.
   *
   * Єдиний спосіб побачити такі сутності — окремо запросити ПОВНИЙ реєстр
   * командою `config/entity_registry/list` (без фільтра за disabled_by,
   * доступна без прав адміністратора) і підібрати сутності пристрою за
   * точним ключем з їхнього unique_id. Робимо це один раз на deviceId і
   * кешуємо результат; коли відповідь прийде, перерендерюємо форму.
   */
  _ensureFullRegistryFetch(deviceId) {
    if (!this._hass || !deviceId || typeof this._hass.callWS !== "function") return;
    if (this._fullRegistry && this._fullRegistry.deviceId === deviceId && this._fullRegistry.status !== "error") {
      return;
    }
    this._fullRegistry = { deviceId, status: "loading", map: {} };
    this._hass
      .callWS({ type: "config/entity_registry/list" })
      .then((entries) => {
        if (this._autoDeviceId() !== deviceId) return; // користувач встиг обрати інший пристрій
        this._fullRegistry = { deviceId, status: "done", map: discoverFromFullRegistry(entries, deviceId) };
        if (this._mounted) this._render();
      })
      .catch(() => {
        // Стара версія HA без цієї команди (малоймовірно) — лишаємось на
        // базовому автопошуку через hass.entities.
        this._fullRegistry = { deviceId, status: "error", map: {} };
      });
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

/**
 * Одне поле вибору сутності: ha-entity-picker, якщо доступний у цій
 * версії HA, інакше — звичайний текстовий інпут з entity_id (fallback,
 * щоб редактор не ламався на нетипових/старих фронтендах).
 */
  _renderEntityField(key, label, domain) {
    const deviceId = this._autoDeviceId();
    const autoMap = this._hass && deviceId ? autoDiscoverEntities(this._hass, deviceId) : {};
    this._ensureFullRegistryFetch(deviceId);
    const registryInfo = this._fullRegistryMap(deviceId)[key];
    const manual = this._entities()[key] || "";
    const auto = autoMap[key] || (registryInfo && registryInfo.entityId) || "";
    const value = manual || auto || "";
    const registryChecked = this._fullRegistry && this._fullRegistry.deviceId === deviceId && this._fullRegistry.status === "done";
    let hint;
    if (manual) {
      hint = auto
        ? `<div class="bms-auto-hint">вручну (авто було: <code>${auto}</code>)</div>`
        : `<div class="bms-auto-hint">вручну</div>`;
    } else if (auto && !autoMap[key] && registryInfo && registryInfo.disabledBy) {
      // Знайдено лише через повний реєстр, і сутність вимкнена за
      // замовчуванням у HA — сама по собі вона не даватиме значень, доки
      // користувач її не увімкне.
      hint = `<div class="bms-auto-hint bms-auto-miss">знайдено <code>${auto}</code>, але сутність вимкнена за замовчуванням — увімкніть її в HA (Налаштування → Пристрої та сервіси → Сутності), щоб бачити значення</div>`;
    } else if (auto) {
      hint = `<div class="bms-auto-hint">✓ авто: <code>${auto}</code></div>`;
    } else if (this._fullRegistry && this._fullRegistry.deviceId === deviceId && this._fullRegistry.status === "loading") {
      hint = `<div class="bms-auto-hint">пошук…</div>`;
    } else if (registryChecked && HARDWARE_DEPENDENT_FIELDS.has(key)) {
      // Перевірили і в hass.entities, і в повному реєстрі (config/entity_registry/list,
      // без фільтра за disabled_by) — сутності немає ЗОВСІМ. Для цих полів
      // це майже завжди означає, що ваша конкретна модель BMS не передає
      // цей параметр по BLE, і сутність у BMS_BLE-HA просто не створюється.
      hint = `<div class="bms-auto-hint bms-auto-miss">сутність не створена — ваша BMS-плата (драйвер aiobmsble), ймовірно, не передає ці дані по BLE. Це нормально: не всі виробники підтримують цю функцію (підтверджено, наприклад, для JK BMS). Можете лишити поле порожнім.</div>`;
    } else {
      hint = `<div class="bms-auto-hint bms-auto-miss">не знайдено автоматично</div>`;
    }
    if (this._hasEntityPicker()) {
      // ha-entity-picker сам малює свій label (Material floating label,
      // виставляється нижче через picker.label у _wireEntityFields) —
      // якщо додати тут ще й статичний .bms-field-label з тим самим
      // текстом, назва поля буде видно ДВІЧІ поспіль. Тому для варіанту
      // з picker-ом статичний підпис не рендеримо.
      return `
        <div class="bms-field" data-key="${key}" data-domain="${domain}">
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
    this._activeTab = "home";
    this._uid = Math.random().toString(36).slice(2, 9);
    this._resolvedEntities = {};
    this._visible = true;
    let storedLang;
    try { storedLang = window.localStorage.getItem(I18N_LANG_KEY); } catch (e) { storedLang = null; }
    this._lang = storedLang === "en" ? "en" : "uk";
  }

  /** Переклад одного рядка інтерфейсу за ключем словника I18N, з
   *  фолбеком на українську, якщо ключа немає в поточній мові. */
  _t(key) {
    const dict = I18N[this._lang] || I18N.uk;
    return dict[key] || I18N.uk[key] || key;
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
    if (this._visible === false) return;
    // Поки триває демо-анімація розряду/заряду банки (довге утримання),
    // не перерендерюємо картку на кожне оновлення hass — це стерло б
    // DOM, який анімація оновлює напряму через jarBatterySvg(). Після
    // завершення анімація сама викликає _render() і надолужує стан.
    if (this._batteryAnimating) return;
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
    // Коли картка закрита/поза екраном (проскрольована, згорнута
    // вкладка тощо) — зупиняємо анімації й перестаємо перерендерювати
    // на кожне оновлення hass, щоб не навантажувати ПК даремно.
    // Працює лише коли картка видима більш ніж на 39% (або відкритий
    // fullscreen-попап, який завжди вважаємо активним видом).
    if (typeof IntersectionObserver !== "undefined") {
      this._io = new IntersectionObserver((entries) => {
        const ratio = entries[entries.length - 1].intersectionRatio;
        const nowVisible = ratio > 0.39 || this._expanded;
        if (nowVisible === this._visible) return;
        this._visible = nowVisible;
        if (this.classList) this.classList.toggle("bms-idle", !this._visible);
        if (this._visible) {
          this._maybeFetchDailyHistory();
          this._render();
        }
      }, { threshold: [0, 0.39, 1] });
      this._io.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._onOrient) window.removeEventListener("orientationchange", this._onOrient);
    if (this._io) { this._io.disconnect(); this._io = undefined; }
    this._stopBatteryDemoAnimation();
    if (this._batteryPressTimer) { clearTimeout(this._batteryPressTimer); this._batteryPressTimer = null; }
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

  /** entity_id окремих комірок, якщо вони налаштовані явно (список у
   *  entities.cell_voltages) — на відміну від значень, отриманих з
   *  атрибута cell_voltages сенсора Delta cell voltage, у яких немає
   *  власного entity_id для відкриття історії. */
  _cellVoltageEntityIds() {
    const explicit = this._e("cell_voltages");
    return Array.isArray(explicit) && explicit.length ? explicit : undefined;
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
    const soc = normalizeSoc(stateOf(this._hass, this._e("soc")));
    const voltage = Number(stateOf(this._hass, this._e("voltage")));
    if (Number.isFinite(design) && design > 0 && Number.isFinite(voltage) && voltage > 0 && soc !== null) {
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
    const soc = normalizeSoc(stateOf(this._hass, this._e("soc")));
    const current = Number(stateOf(this._hass, this._e("current")));
    const design = stateOf(this._hass, this._e("design_capacity"));
    const stored = this._storedEnergyWh();
    const voltage = stateOf(this._hass, this._e("voltage"));
    // Рахуємо від поточного заряду (SOC) і поточного струму — це відповідає
    // реальному режиму (заряд/розряд) зараз. Сирий сенсор BMS "runtime" не
    // завжди перераховується під поточний режим (напр. лишається зі старого
    // розряду під час заряду), тому він лише запасний варіант, коли
    // розрахунок неможливий (немає ємності/SOC чи струм близький до нуля).
    let seconds = estimateEtaSeconds({
      soc, current, designAh: design, storedWh: stored, packVoltage: voltage,
      charging: status.color === "success",
    });
    if (!(seconds > 0) && Number.isFinite(runtimeNum) && runtimeNum > 0) {
      seconds = runtimeNum;
    }
    let label = "До розряду";
    if (status.color === "success") label = "До повного заряду";
    return { seconds, label, socPct: soc !== null ? soc : 0 };
  }

  /**
   * Вкладка "Статистика" (нижня навігація): окремо Розряд і Заряд, за
   * проханням користувача. Розряд використовує вже наявні сенсори з
   * Setup Wizard (capacity_daily/weekly/monthly/total — Ah використано;
   * discharge_time_daily/weekly/monthly — час під навантаженням, у
   * годинах з history_stats) — та ж сама щоденна історія (кілька днів),
   * що вже показана у вкладці "Інформація". Заряд поки не має власних
   * сенсорів у схемі (Setup Wizard створює лише розрядні хелпери), тому
   * замість вигаданих цифр — чесна підказка.
   */
  _renderStatsPane() {
    const statsSections = this._statsSections || (this._statsSections = { discharge: true, charge: false });

    const ahCard = (label, entityKey) => {
      const entityId = this._e(entityKey);
      const v = Number(stateOf(this._hass, entityId));
      if (!entityId || !Number.isFinite(v)) return "";
      return `<div class="usage-card"${moreInfoAttr(entityId)}>
        <div class="lbl">${label}</div>
        <div class="val-row"><span class="v">${fmt(v, 1)}</span><span class="p">Ah</span></div>
      </div>`;
    };
    const timeCard = (label, entityKey) => {
      const entityId = this._e(entityKey);
      const hours = Number(stateOf(this._hass, entityId));
      if (!entityId || !Number.isFinite(hours)) return "";
      return `<div class="usage-card"${moreInfoAttr(entityId)}>
        <div class="lbl">${label}</div>
        <div class="val-row"><span class="v">${secondsToHuman(hours * 3600)}</span></div>
      </div>`;
    };

    const ahCards = [
      ahCard(this._t("stats_today"), "capacity_daily"),
      ahCard(this._t("stats_week"), "capacity_weekly"),
      ahCard(this._t("stats_month"), "capacity_monthly"),
      ahCard(this._t("stats_total"), "capacity_total"),
    ].filter(Boolean).join("");
    const timeCards = [
      timeCard(this._t("stats_today"), "discharge_time_daily"),
      timeCard(this._t("stats_week"), "discharge_time_weekly"),
      timeCard(this._t("stats_month"), "discharge_time_monthly"),
    ].filter(Boolean).join("");

    const dischargeBody = ahCards || timeCards || this._e("capacity_daily")
      ? `
        ${ahCards ? `<h2 class="section-title">${this._t("stats_ah_used")}</h2><div class="usage-grid">${ahCards}</div>` : ""}
        ${timeCards ? `<h2 class="section-title">${this._t("stats_discharge_duration")}</h2><div class="usage-grid">${timeCards}</div>` : ""}
        ${this._renderHistoryBars()}
      `
      : `<p class="bms-muted">${this._t("cells_no_data")}</p>`;

    return `
      <details class="info-accordion-section" data-stats-section="discharge"${statsSections.discharge ? " open" : ""}>
        <summary class="info-accordion-title">${this._t("stats_discharge_title")}</summary>
        <div class="info-accordion-body">
          ${dischargeBody}
        </div>
      </details>

      <details class="info-accordion-section" data-stats-section="charge"${statsSections.charge ? " open" : ""}>
        <summary class="info-accordion-title">${this._t("stats_charge_title")}</summary>
        <div class="info-accordion-body">
          <p class="bms-muted">${this._t("stats_charge_unavailable")}</p>
        </div>
      </details>`;
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
    const activeTab = this._activeTab || "home";
    const infoSections = this._infoSections || (this._infoSections = { cells: true, indicators: false, functions: false });
    const soc = normalizeSoc(stateOf(this._hass, this._e("soc")));
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
    const statusSc = this._statusColorVars(status.color);
    const flowState = chargeFlowState(status.label);
    const eta = this._etaInfo();
    const showEta = status.color === "success" || status.color === "warning";
    const socPct = soc !== null ? soc : 0;
    const designN = Number(design);
    let remainingAh;
    if (Number.isFinite(designN) && Number.isFinite(socPct)) remainingAh = designN * (socPct / 100);
    const usedAh = Number.isFinite(designN) && remainingAh !== undefined ? designN - remainingAh : undefined;

    const t = (k) => this._t(k);
    const statusLabelText = (s) => (
      s.color === "success" ? t("status_charging")
      : s.color === "warning" ? t("status_discharging")
      : s.color === "danger" ? t("status_problem")
      : t("status_idle")
    );
    const etaLabelText = status.color === "success" ? t("eta_to_full_charge") : t("eta_to_discharge");

    const st = this._cellStats();
    const cellEntityIds = this._cellVoltageEntityIds();
    const bal = stateOf(this._hass, this._e("balancer"));
    const on = (s) => s === "on" || s === "true";
    const balancingOn = on(bal);
    const activeCells = balancingOn ? activeBalancingCells(cellBitmask) : new Set();
    let cellsHtml = `<div class="cells-box"><div class="cells-title">${t("cells_title")}</div><p class="bms-muted">${t("cells_no_data")}</p></div>`;
    if (st) {
      const lo = Math.min(st.min - 0.05, 3.05);
      const hi = Math.max(st.max + 0.04, 3.40);
      const rows = st.cells.map((v, i) => {
        let frac = Number.isFinite(v) ? (v - lo) / (hi - lo) : 0;
        frac = Math.max(0.2, Math.min(0.95, frac));
        const warn = v === st.min && st.delta >= 0.005;
        const isBalancing = activeCells.has(i);
        const cellEntity = (cellEntityIds && cellEntityIds[i]) || this._e("delta_cell_voltage");
        return `<div class="cell-row ${isBalancing ? "balancing" : ""}"${moreInfoAttr(cellEntity)}>
          <div class="cell-name">C${i + 1}</div>
          <div class="cell-track"><div class="cell-fill ${warn ? "warn" : ""}" style="width:${Math.round(frac * 100)}%"></div></div>
          <div class="cell-val">${Number.isFinite(v) ? v.toFixed(3) : "—"} V${isBalancing ? ` ${haIcon("ti-topology-star-3", 12, "#1D9E75")}` : ""}</div>
        </div>`;
      }).join("");
      cellsHtml = `
        <div class="cells-box">
          <div class="cells-title">${t("cells_title")} (Δ ${st.delta.toFixed(3)}V)${balancingOn ? `<span class="balance-badge">${haIcon("ti-topology-star-3", 12)} ${t("balancing")}</span>` : ""}</div>
          ${rows}
          <div class="badges-row">
            <div class="badge green"${moreInfoAttr(cellEntityIds && cellEntityIds[st.maxIdx])}>${t("cell_max")} ${st.max.toFixed(3)} V<b>C${st.maxIdx + 1}</b></div>
            <div class="badge amber"${moreInfoAttr(cellEntityIds && cellEntityIds[st.minIdx])}>${t("cell_min")} ${st.min.toFixed(3)} V<b>C${st.minIdx + 1}</b></div>
            <div class="badge blue">Δ ${st.delta.toFixed(3)} V<b>${t("cell_diff")}</b></div>
          </div>
        </div>`;
    }

    const func = (icon, label, value, tone, entityId) => `
      <div class="func-box"${moreInfoAttr(entityId)}>
        <div class="icon-circle">${haIcon(icon, 22, tone)}</div>
        <div class="func-text"><div class="l1">${label}</div><div class="l2" style="color:${tone}">${value}</div></div>
      </div>`;

    const chrgM = stateOf(this._hass, this._e("chrg_mosfet"));
    const disM = stateOf(this._hass, this._e("dischrg_mosfet"));
    const heat = stateOf(this._hass, this._e("heater"));
    const prob = stateOf(this._hass, this._e("problem"));
    const G = "#1D9E75", M = "#8b96a3", A = "#EF9F27", R = "#E24B4A";

    let funcGrid = "";
    if (bal !== undefined) funcGrid += func("ti-topology-star-3", t("func_balancer"), on(bal) ? t("state_active") : t("state_disabled"), on(bal) ? G : M, this._e("balancer"));
    if (chrgM !== undefined) funcGrid += func("ti-plug-connected", t("func_charge_mosfet"), on(chrgM) ? t("state_enabled") : t("state_disabled"), on(chrgM) ? G : M, this._e("chrg_mosfet"));
    if (disM !== undefined) funcGrid += func("ti-plug-connected", t("func_discharge_mosfet"), on(disM) ? t("state_enabled") : t("state_disabled"), on(disM) ? G : M, this._e("dischrg_mosfet"));
    if (heat !== undefined) funcGrid += func("ti-flame", t("func_heater"), on(heat) ? t("state_enabled") : t("state_disabled"), on(heat) ? A : M, this._e("heater"));
    if (prob !== undefined) funcGrid += func("ti-alert-triangle", t("func_problem"), on(prob) ? t("state_yes") : t("state_no"), on(prob) ? R : G, this._e("problem"));
    const modeLabel = status.color === "success" ? t("mode_charge") : status.color === "warning" ? t("mode_discharge") : statusLabelText(status);
    const modeTone = status.color === "success" ? G : status.color === "warning" ? A : M;
    funcGrid += func(status.icon || "ti-bolt", t("func_mode"), modeLabel, modeTone);

    const currentN = Number(current);

    const linkN = Number(link);
    const signalColor = !Number.isFinite(linkN) ? "#8b96a3" : linkN >= 50 ? "#4b9bf0" : linkN >= 25 ? "#EF9F27" : "#E24B4A";
    const nowStr = new Date().toLocaleTimeString(this._lang === "en" ? "en-US" : "uk-UA", { hour: "2-digit", minute: "2-digit" });

    return `
      <div class="bms-full">
        <div class="header">
          <div>
            <h1>${this._batteryName()}</h1>
          </div>
          <div class="hdr-right"${moreInfoAttr(this._e("link_quality") || this._e("rssi"))}>
            <span class="hdr-clock">${nowStr}</span>
            <ha-icon icon="mdi:bluetooth" style="color:${signalColor};--mdc-icon-size:20px"></ha-icon>
          </div>
        </div>

        <div class="bms-tab-pane ${activeTab === "home" ? "active" : ""}" data-pane="home">
        <div class="flow-status-wrap">
        <div class="flow-row">
          <div class="flow-node grid-node">
            ${gridPylonSvg()}
            <div class="node-lbl">${t("node_grid")}</div>
          </div>
          <div class="flow-connector-wrap">
            <div class="flow-arrows">
              ${flowArrowSvg(false, flowState === "charging", "#1D9E75")}
              ${flowArrowSvg(true, flowState === "charging", "#1D9E75")}
            </div>
            ${flowState === "charging" ? `<div class="connector-info">${current !== undefined && current !== null ? `${fmt(Math.abs(currentN), 1)} A` : "—"}<br>${fmtKw(power)} кВт</div>` : ""}
          </div>
          <div class="flow-battery"${moreInfoAttr(this._e("soc"))}>
            ${jarBatterySvg(this._uid, soc, fmt(voltage, 2))}
          </div>
          <div class="flow-connector-wrap">
            <div class="flow-arrows">
              ${flowArrowSvg(false, flowState === "discharging", "#EF9F27", true)}
              ${flowArrowSvg(true, flowState === "discharging", "#EF9F27", true)}
            </div>
            ${flowState === "discharging" ? `<div class="connector-info">${current !== undefined && current !== null ? `${fmt(Math.abs(currentN), 1)} A` : "—"}<br>${fmtKw(power)} кВт</div>` : ""}
          </div>
          <div class="flow-node load-node">
            ${houseLoadSvg()}
            <div class="node-lbl">${t("node_load")}</div>
          </div>
        </div>

        <div class="discharge-box"${moreInfoAttr(this._e("problem") || this._e("charging"))}>
          <div class="discharge-top">
            <div class="icon-circle" style="background:${statusSc.bg}">${haIcon(status.icon,20,statusSc.fg)}</div>
            <div class="discharge-text">
              <div class="l1">${statusLabelText(status)}</div>
              ${(() => {
                const etaPart = showEta ? `${etaLabelText}${eta.seconds !== undefined ? ": ~" + secondsToHuman(eta.seconds) : ""}` : "";
                const balPart = balancingOn ? `${haIcon("ti-topology-star-3", 12)} ${t("balancing")}${st ? ` (${st.cells.map((v) => (Number.isFinite(v) ? v.toFixed(3) : "—")).join(", ")} В, Δ${st.delta.toFixed(3)} В)` : ""}` : "";
                const line2 = [etaPart, balPart].filter(Boolean).join(" · ");
                return line2 ? `<div class="l2">${line2}</div>` : "";
              })()}
            </div>
          </div>
        </div>
        </div>
        </div>


        <div class="bms-tab-pane ${activeTab === "info" ? "active" : ""}" data-pane="info">
        <details class="info-accordion-section" data-section="cells"${infoSections.cells ? " open" : ""}>
          <summary class="info-accordion-title">${t("section_cells")}</summary>
          <div class="info-accordion-body">
            ${cellsHtml}
          </div>
        </details>

        <details class="info-accordion-section" data-section="indicators"${infoSections.indicators ? " open" : ""}>
          <summary class="info-accordion-title">${t("section_indicators")}</summary>
          <div class="info-accordion-body">
            ${(() => {
              const runtimeVal = stateOf(this._hass, this._e("runtime"));
              const rows = [];
              const addRow = (label, value, entityId) => {
                if (value === undefined || value === null || value === "") return;
                rows.push({ label, value, entityId });
              };
              addRow(t("lbl_voltage"), Number.isFinite(Number(voltage)) ? `${fmt(voltage, 2)} V` : undefined, this._e("voltage"));
              addRow(t("lbl_current"), Number.isFinite(Number(current)) ? `${fmt(current, 1)} A` : undefined, this._e("current"));
              addRow(t("lbl_power"), Number.isFinite(Number(power)) ? `${fmt(power, 0)} W` : undefined, this._e("power"));
              addRow(t("lbl_temperature"), Number.isFinite(Number(temp)) ? `${fmt(temp, 1)} °C` : undefined, this._e("temperature"));
              addRow(t("lbl_soc"), Number.isFinite(soc) ? `${fmt(soc, 0)}%` : undefined, this._e("soc"));
              addRow(t("lbl_soh"), soh !== undefined ? `${fmt(soh, 0)}%` : undefined, this._e("soh"));
              addRow(t("lbl_capacity"), Number.isFinite(designN) ? `${fmt(designN, 0)} Ah` : undefined, this._e("design_capacity"));
              addRow(t("lbl_used"), usedAh !== undefined ? `${fmt(usedAh, 1)} Ah` : undefined);
              addRow(t("lbl_remaining"), remainingAh !== undefined ? `${fmt(remainingAh, 1)} Ah` : undefined);
              addRow(t("lbl_cycles"), cycles !== undefined ? `${fmt(cycles, 0)}` : undefined, this._e("charge_cycles"));
              addRow(t("lbl_stored_energy"), stored !== undefined ? `${fmt(stored, 0)} Wh` : undefined, this._e("cycle_capacity"));
              addRow(t("lbl_runtime"), runtimeVal !== undefined ? `~${secondsToHuman(Number(runtimeVal))}` : undefined, this._e("runtime"));
              addRow(t("lbl_balance_current"), balanceCur !== undefined ? `${fmt(balanceCur, 2)} A` : undefined, this._e("current"));
              addRow(t("lbl_link_quality"), link !== undefined ? `${fmt(link, 0)}%` : undefined, this._e("link_quality"));
              addRow(t("lbl_rssi"), rssi !== undefined ? `${fmt(rssi, 0)} dBm` : undefined, this._e("rssi"));
              if (st) {
                addRow(t("lbl_cell_count"), String(st.cells.length));
              }
              addRow(t("lbl_cell_bitmask"), cellBitmask !== undefined && cellBitmask !== null && cellBitmask !== "" ? String(cellBitmask) : undefined, this._e("balancer"));

              const tileHtml = (r) => `<div class="info-tile"${moreInfoAttr(r.entityId)}><div class="info-tile-lbl">${r.label}</div><div class="info-tile-val">${r.value}</div></div>`;
              return `<div class="info-tiles">${rows.map(tileHtml).join("")}</div>`;
            })()}
          </div>
        </details>

        <details class="info-accordion-section" data-section="functions"${infoSections.functions ? " open" : ""}>
          <summary class="info-accordion-title">${t("section_functions")}</summary>
          <div class="info-accordion-body">
            <div class="functions-grid">${funcGrid}</div>
          </div>
        </details>

        ${this._renderHistoryBars()}
        </div>

        <div class="bms-tab-pane ${activeTab === "stats" ? "active" : ""}" data-pane="stats">
        ${this._renderStatsPane()}
        </div>

        <div class="bms-tab-pane ${activeTab === "settings" ? "active" : ""}" data-pane="settings">
        <h2 class="section-title">${t("settings_language")}</h2>
        <p class="bms-muted">${t("settings_language_hint")}</p>
        <div class="lang-switch">
          <button type="button" class="lang-btn ${this._lang === "uk" ? "active" : ""}" data-lang="uk">${t("lang_uk")}</button>
          <button type="button" class="lang-btn ${this._lang === "en" ? "active" : ""}" data-lang="en">${t("lang_en")}</button>
        </div>
        </div>

        <div class="nav-bar">
          <div class="nav-item ${activeTab === "home" ? "active" : ""}" data-tab="home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11 L12 4 L20 11 M6 10 V20 H18 V10" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>${t("nav_home")}</span>
          </div>
          <div class="nav-item ${activeTab === "info" ? "active" : ""}" data-tab="info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 11v6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none"/></svg>
            <span>${t("nav_info")}</span>
          </div>
          <div class="nav-item ${activeTab === "stats" ? "active" : ""}" data-tab="stats">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M12 20V4M20 20v-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>${t("nav_stats")}</span>
          </div>
          <div class="nav-item ${activeTab === "settings" ? "active" : ""}" data-tab="settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>${t("nav_settings")}</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderMiniView() {
    const soc = normalizeSoc(stateOf(this._hass, this._e("soc")));
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
          <div class="battery-box" style="width:140px;"${moreInfoAttr(this._e("soc"))}>
            ${jarBatterySvg(this._uid, soc, fmt(voltage, 2))}
            <div class="charge-badge" style="font-size:12px;padding:6px 10px;">${status.label}</div>
          </div>
          <div class="stat-col">
            <div class="stat-box"${moreInfoAttr(this._e("voltage"))}><div class="val">${fmt(voltage, 2)} V</div><div class="lbl">Напруга</div></div>
            <div class="stat-box"${moreInfoAttr(this._e("current"))}><div class="val">${fmt(current, 1)} A</div><div class="lbl">Струм</div></div>
          </div>
          <div class="stat-col">
            <div class="stat-box"${moreInfoAttr(this._e("power"))}><div class="val">${fmt(power, 0)} W</div><div class="lbl">Потужність</div></div>
            <div class="stat-box"${moreInfoAttr(this._e("temperature"))}><div class="val">${fmt(temp, 1)} °C</div><div class="lbl">Температура</div></div>
          </div>
        </div>
      </div>
    `;
  }

  _toggleOverlay(open) {
    this._expanded = open;
    if (open) {
      this._visible = true;
      if (this.classList) this.classList.remove("bms-idle");
    }
    this._render();
  }

  /** Відкриває стандартний діалог "деталі сутності" HA (той самий, що й
   *  клік по entity в звичайних картках) — подія "hass-more-info", яку
   *  ловить дашборд. Дає нативну історію/графік без переліплення колеса. */
  _fireMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  /** Довге утримання на банці-батареї (.flow-battery) запускає декоративну
   *  демо-анімацію: розряд до 0% → заряд до 100% → повернення до реального
   *  SOC. Слухач навішується РАНІШЕ за _wireMoreInfo() (той самий елемент),
   *  тож при спрацюванні довгого натискання ми встигаємо перехопити клік
   *  через stopImmediatePropagation() і не відкрити діалог сутності —
   *  порядок виклику addEventListener на одному вузлі визначає порядок
   *  спрацювання для фази "at target", незалежно від capture-прапорця. */
  _wireBatteryLongPress() {
    const el = this.querySelector(".flow-battery");
    if (!el) return;
    const LONG_PRESS_MS = 550;
    const MOVE_CANCEL_PX = 12;
    let startX = 0, startY = 0, longPressFired = false;

    const clearTimer = () => {
      if (this._batteryPressTimer) { clearTimeout(this._batteryPressTimer); this._batteryPressTimer = null; }
    };
    const onDown = (ev) => {
      if (this._batteryAnimating) return;
      longPressFired = false;
      startX = ev.clientX; startY = ev.clientY;
      clearTimer();
      this._batteryPressTimer = setTimeout(() => {
        this._batteryPressTimer = null;
        longPressFired = true;
        this._runBatteryDemoAnimation();
      }, LONG_PRESS_MS);
    };
    const onMove = (ev) => {
      if (!this._batteryPressTimer) return;
      if (Math.abs(ev.clientX - startX) > MOVE_CANCEL_PX || Math.abs(ev.clientY - startY) > MOVE_CANCEL_PX) {
        clearTimer();
      }
    };
    const onUp = () => clearTimer();
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onUp);
    // Реєструється до _wireMoreInfo(), тому виконується першим: якщо щойно
    // спрацювало довге утримання — гасимо клік, щоб не відкрився more-info.
    el.addEventListener("click", (ev) => {
      if (longPressFired) {
        longPressFired = false;
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    });
  }

  _easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /** Розряд→0%, заряд→100%, повернення до поточного SOC. Малює кадри
   *  напряму в .flow-battery (минаючи повний _render()) — легше й не
   *  зачіпає решту картки. set hass() тим часом ігнорує оновлення. */
  _runBatteryDemoAnimation() {
    if (this._batteryAnimating || !this._hass) return;
    const el = this.querySelector(".flow-battery");
    if (!el) return;
    const arrowEls = this.querySelectorAll(".flow-arrows");
    const leftArrows = arrowEls[0] || null;
    const rightArrows = arrowEls[1] || null;
    const soc = normalizeSoc(stateOf(this._hass, this._e("soc")));
    const start = soc !== null ? soc : 0;
    const voltageLabel = fmt(stateOf(this._hass, this._e("voltage")), 2);

    // "discharge" = ліва (Мережа->Батарея) гасне, права (Батарея->
    // Навантаження) отримує анімований потік; "charge" — навпаки.
    const setArrows = (mode) => {
      if (leftArrows) {
        leftArrows.innerHTML = `${flowArrowSvg(false, mode === "charge", "#1D9E75")}${flowArrowSvg(true, mode === "charge", "#1D9E75")}`;
      }
      if (rightArrows) {
        rightArrows.innerHTML = `${flowArrowSvg(false, mode === "discharge", "#EF9F27", true)}${flowArrowSvg(true, mode === "discharge", "#EF9F27", true)}`;
      }
    };

    this._batteryAnimating = true;
    const phases = [
      { from: start, to: 0, duration: 3000, arrows: "discharge" },
      { from: 0, to: 100, duration: 3000, arrows: "charge" },
      { from: 100, to: start, duration: 3000, arrows: "discharge" },
    ];
    let phaseIndex = -1;
    let phaseStartTs = null;

    const step = (ts) => {
      if (!this._batteryAnimating) return;
      if (phaseIndex === -1) { phaseIndex = 0; setArrows(phases[0].arrows); }
      if (phaseStartTs === null) phaseStartTs = ts;
      const phase = phases[phaseIndex];
      const t = Math.min(1, (ts - phaseStartTs) / phase.duration);
      const pct = phase.from + (phase.to - phase.from) * this._easeInOutQuad(t);
      el.innerHTML = jarBatterySvg(this._uid, pct, voltageLabel);
      if (t >= 1) {
        phaseIndex += 1;
        phaseStartTs = null;
        if (phaseIndex >= phases.length) {
          this._batteryAnimating = false;
          this._batteryAnimFrame = null;
          this._render(); // надолужуємо будь-які hass-оновлення, пропущені під час анімації
          return;
        }
        setArrows(phases[phaseIndex].arrows);
      }
      this._batteryAnimFrame = requestAnimationFrame(step);
    };
    this._batteryAnimFrame = requestAnimationFrame(step);
  }

  _stopBatteryDemoAnimation() {
    this._batteryAnimating = false;
    if (this._batteryAnimFrame) { cancelAnimationFrame(this._batteryAnimFrame); this._batteryAnimFrame = null; }
  }

  /** Підключає клік/Enter на всіх [data-more-info] елементах у поточному
   *  DOM картки (і міні-, і повний вигляд рендеряться в один innerHTML,
   *  тож один виклик після _render() покриває обидва). */
  _wireMoreInfo() {
    this.querySelectorAll("[data-more-info]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation(); // не відкривати/закривати сповна overlay поверх діалогу сутності
        this._fireMoreInfo(el.dataset.moreInfo);
      });
      el.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          ev.stopPropagation();
          this._fireMoreInfo(el.dataset.moreInfo);
        }
      });
    });
  }

  /** Клік по пунктах нижньої навігації (Головна/Параметри/Історія/
   *  Налаштування) перемикає активну вкладку картки і перерендерює її. */
  _wireTabs() {
    this.querySelectorAll(".nav-item[data-tab]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const tab = el.dataset.tab;
        if (tab && tab !== this._activeTab) {
          this._activeTab = tab;
          this._render();
        }
      });
    });
    this.querySelectorAll("details.info-accordion-section[data-section]").forEach((el) => {
      el.addEventListener("toggle", () => {
        const key = el.dataset.section;
        if (!key) return;
        if (!this._infoSections) this._infoSections = { cells: true, indicators: false, functions: false };
        // Лише запам'ятовуємо стан, БЕЗ this._render() — перерендер під час
        // взаємодії (напр. скролу/тапу всередині) саме й скидав <details>
        // назад до дефолтного стану з шаблону.
        this._infoSections[key] = el.open;
      });
    });
    this.querySelectorAll("details.info-accordion-section[data-stats-section]").forEach((el) => {
      el.addEventListener("toggle", () => {
        const key = el.dataset.statsSection;
        if (!key) return;
        if (!this._statsSections) this._statsSections = { discharge: true, charge: false };
        this._statsSections[key] = el.open;
      });
    });
    this.querySelectorAll(".lang-btn[data-lang]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const lang = el.dataset.lang === "en" ? "en" : "uk";
        if (lang !== this._lang) {
          this._lang = lang;
          try { window.localStorage.setItem(I18N_LANG_KEY, lang); } catch (e) { /* ignore */ }
          this._render();
        }
      });
    });
  }

  _styles() {
    /* CSS ported from bms-dashboard.html reference */
    return `
      <style>
        :host { display:block; max-width:100%; }
        * { box-sizing: border-box; }
        /* Картка невидима (<39%) — глушимо анімації, щоб не вантажити ПК даремно. */
        .bms-idle, .bms-idle * { animation: none !important; }
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
        .header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:18px; gap:10px; }
        .header h1 { font-size:16px; margin:0 0 6px 0; font-weight:700; display:flex; align-items:center; gap:8px; }
        .hdr-right { display:flex; align-items:center; gap:8px; flex-shrink:0; padding-top:2px; }
        .hdr-clock { font-size:14px; color:var(--muted); font-weight:600; }
        .status { display:flex; align-items:center; gap:6px; color:var(--green); font-size:14px; font-weight:500; }
        .dot { width:8px; height:8px; border-radius:50%; background:var(--green); display:inline-block; }

        .top-row { display:flex; gap:14px; margin-bottom:14px; align-items:stretch; flex-wrap:wrap; }

        /* Flow-діаграма заряд/розряд навколо батареї: іконка джерела зліва,
           наша батарея (з анімацією потоку) в центрі замість кола, іконка
           навантаження справа, з'єднані зігнутими стрілками з наконечником.
           Розміри вузлів масштабуються ПРОПОРЦІЙНО через flexbox
           (flex-basis = цільовий розмір "на весь зріст" ×1.3, min-width =
           нижня межа стиснення) замість CSS zoom + фіксованих px на
           кожен @media-брейкпоінт: раніше zoom масштабував уже готовий
           layout цілком, через що на портретних екранах різні елементи
           "стискались" по-різному (деякі — по фіксованому брейкпоінту,
           деякі — по flex), а на альбомних — рядок "мережа/батарея/
           навантаження" переставав влазити в картку й обрізався. Тепер усі
           вузли одного ряду стискаються з тим самим коефіцієнтом і ніколи
           не виходять за межі картки, на будь-якій орієнтації екрана. */
        .flow-status-wrap { display:flex; flex-direction:column; margin-bottom:14px; }
        .flow-row { display:flex; align-items:center; justify-content:center; gap:4px; margin:10px 0 16px; width:100%; }
        .flow-node {
          display:flex; flex-direction:column; align-items:center; gap:4px;
          flex:1 1 135px; min-width:54px; max-width:135px;
        }
        .flow-icon-circle {
          width:78px; height:78px; border-radius:50%; border:2px solid #4a5764;
          background:radial-gradient(circle at 35% 30%, #232c34, #0a0f14);
          box-shadow: inset 0 1px 2px rgba(255,255,255,0.12);
          display:flex; align-items:center; justify-content:center; transition:border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .flow-icon-circle.flow-active-charge { border-color:var(--green); box-shadow:0 0 18px rgba(29,158,117,0.5), inset 0 1px 2px rgba(255,255,255,0.12); }
        .flow-icon-circle.flow-active-discharge { border-color:var(--amber); box-shadow:0 0 18px rgba(239,159,39,0.45), inset 0 1px 2px rgba(255,255,255,0.12); }
        /* Вузли "Мережа"/"Навантаження" — точна копія стилю референсного
           прев'ю: іконка без кола-обгортки, підпис і значення під нею.
           width у % від .flow-node — іконка стискається тим самим
           коефіцієнтом, що й сам вузол (flexbox рахує % відносно вже
           стиснутої ширини батька), тож нічого не "розсинхронізується". */
        .node-icon { width:64%; height:auto; flex-shrink:0; }
        .node-lbl {
          font-size:clamp(9px, 3vw, 13px); font-weight:700; letter-spacing:0.4px; color:#dfe7ee; margin-top:2px;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;
        }
        .flow-battery {
          display:flex; flex-direction:column; align-items:center; gap:8px;
          flex:1 1 203px; min-width:70px; max-width:210px;
        }
        .battery-svg { width:100%; height:auto; }
        /* Фотореалістична банка-батарея (WebP-зображення + прозорий SVG-
           оверлей рідини/тексту поверх нього, координати оверлея завжди
           в espace вихідного зображення 769x1536, тому саме зображення
           може вільно масштабуватись через .battery-svg{width:100%}. */
        .jar-battery { position:relative; line-height:0; }
        .jar-battery-overlay { width:100%; height:auto; display:block; }
        .jar-battery-img { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; }
        .connector-info { font-size:clamp(7px, 2.2vw, 13.6px); font-weight:600; color:var(--muted); text-align:center; line-height:1.25; white-space:nowrap; }
        /* На ширших екранах (планшет/десктоп/телефон горизонтально) блок
           не розтягується на всю ширину картки, а лишається по центру,
           з тою шириною, яку фактично займає ряд мережа/батарея/
           навантаження. Розмір самих вузлів це вже не зачіпає — про
           це піклується flex-basis/max-width вище. */
        @media (min-width:481px) {
          .flow-status-wrap { width:fit-content; max-width:100%; margin-left:auto; margin-right:auto; }
          .flow-status-wrap .discharge-box { width:100%; }
        }

        /* Нижня навігація вкладок — реальні перемикачі вмісту картки, як
           у референсному прев'ю (Головна/Параметри/Історія/Налаштування). */
        .bms-tab-pane { display:none; }
        .bms-tab-pane.active { display:block; }
        .nav-bar {
          margin-top:16px; padding-top:12px; border-top:1px solid var(--border);
          display:flex; justify-content:space-around; align-items:stretch; gap:2px;
        }
        .nav-item {
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:4px; padding:6px 4px; border-radius:10px; color:#8fa0ad; font-size:11px; font-weight:700;
          letter-spacing:0.3px; cursor:pointer; flex:1 1 0; min-width:0;
          border:1px solid transparent; user-select:none; transition:background 0.15s, color 0.15s, border-color 0.15s;
        }
        .nav-item:hover { color:#b0c0d0; }
        .nav-item.active { background:rgba(56,150,231,0.12); color:#4fb3f6; border-color:rgba(79,179,246,0.35); }
        .nav-item svg { width:20px; height:20px; flex-shrink:0; }
        .nav-item span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }

        .flow-connector-wrap {
          flex:0 1 96px; min-width:20px; max-width:96px;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
        }
        .flow-arrows { display:flex; flex-direction:column; align-items:center; width:100%; gap:2px; }
        .flow-arrow { width:100%; height:clamp(26px, 9vw, 83px); overflow:visible; flex-shrink:0; }
        .flow-arrow-v { display:none; }
        .flow-arrow-path { transition: stroke 0.3s ease; }
        .flow-arrow-head { transition: fill 0.3s ease; }
        @keyframes bms-arrow-flow { 0% { stroke-dashoffset:0; opacity:1; } 50% { opacity:0.85; } 100% { stroke-dashoffset:-48; opacity:1; } }
        .flow-arrow-path.flow-arrow-active { stroke-dasharray:12 10 4 10; animation: bms-arrow-flow 0.7s linear infinite; filter:drop-shadow(0 0 5px rgba(57,231,95,0.6)); }
        @media (prefers-reduced-motion: reduce) {
          .flow-arrow-path.flow-arrow-active { animation:none; }
        }
        /* Ряд "мережа/батарея/навантаження" лишається рядком на будь-якій
           ширині — вузли (.flow-node/.flow-connector-wrap/.flow-battery)
           самі пропорційно стискаються через flex-basis/min-width вище,
           тож окремого набору фіксованих px на вузький екран більше не
           потрібно (і немає ризику, що на ширшому екрані сума
           фіксованих ширин перевищить ширину картки). */
        @media (max-width: 480px) {
          .charge-badge {
            font-size:clamp(9px, 2.8vw, 12px); padding:5px 8px; gap:3px;
            white-space:nowrap; width:max-content; max-width:100%;
            overflow:hidden; text-overflow:ellipsis;
          }
        }
        .battery-box {
          background:var(--panel); border:1px solid var(--border); border-radius:16px;
          width:230px; flex-shrink:0; padding:16px; display:flex; flex-direction:column; align-items:center; gap:14px;
        }

        .discharge-box {
          background:var(--panel); border:1px solid var(--border); border-radius:14px;
          padding:16px 18px; display:flex; flex-direction:column; gap:10px;
        }
        .discharge-top { display:flex; align-items:center; gap:16px; }
        .icon-circle {
          width:40px; height:40px; border-radius:50%; background:#1a222c;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .discharge-top .icon-circle { width:52px; height:52px; display:flex; align-items:center; justify-content:center; }
        .discharge-top .icon-circle ha-icon { display:flex; align-items:center; justify-content:center; }
        .discharge-text .l1 { font-size:18px; font-weight:700; }
        .discharge-text .l2 { font-size:13px; color:var(--muted); margin-top:3px; line-height:1.35; }

        .functions-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
        .func-box {
          background:var(--panel); border:1px solid var(--border); border-radius:14px;
          padding:14px 16px; display:flex; align-items:center; gap:12px;
          min-width:0; box-sizing:border-box;
        }
        .func-text { min-width:0; flex:1; }
        .func-text .l1, .func-text .l2 { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
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

        /* Візуальне відображення рівня заряду комірок (раніше цих правил
           не було взагалі — .cell-track/.cell-fill малювались без жодного
           стилю, тому був видно тільки текст). */
        .cell-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; cursor:pointer; }
        .cell-name { flex-shrink:0; width:26px; font-size:12px; font-weight:700; color:var(--muted); }
        .cell-track { flex:1; height:10px; min-width:0; border-radius:6px; background:rgba(127,127,127,0.18); overflow:hidden; }
        .cell-fill { height:100%; border-radius:6px; background:var(--green); transition:width 0.4s ease; }
        .cell-fill.warn { background:var(--red); }
        .cell-row.balancing .cell-fill { background:var(--amber); }
        .cell-val { flex-shrink:0; font-size:12.5px; font-weight:600; color:var(--text); display:flex; align-items:center; gap:4px; }

        .info-accordion-section {
          border:1px solid var(--divider, rgba(127,127,127,0.18));
          border-radius:14px;
          margin-bottom:14px;
          overflow:hidden;
          background:transparent;
        }
        .info-accordion-title {
          list-style:none;
          cursor:pointer;
          font-size:17px;
          font-weight:700;
          color:var(--text);
          padding:14px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          user-select:none;
          background:var(--panel);
        }
        .info-accordion-title::-webkit-details-marker { display:none; }
        .info-accordion-title::after {
          content:"";
          width:9px;
          height:9px;
          border-right:2px solid var(--muted);
          border-bottom:2px solid var(--muted);
          transform:rotate(-45deg);
          transition:transform 0.2s ease;
          flex-shrink:0;
        }
        .info-accordion-section[open] > .info-accordion-title::after { transform:rotate(45deg); }
        .info-accordion-section[open] { border-color:transparent; }
        .info-accordion-body { padding:10px 0 16px; background:transparent; }

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

        .info-tiles { display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:10px; margin-bottom:20px; }
        .info-tile {
          background:var(--panel); border:1px solid var(--border); border-radius:14px;
          padding:12px 14px; display:flex; flex-direction:column; gap:4px; min-width:0;
        }
        .info-tile-lbl { font-size:11.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .info-tile-val { font-size:15px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        @media (max-width:480px) {
          .info-tiles { grid-template-columns:repeat(2, 1fr); }
        }

        .lang-switch { display:flex; gap:10px; margin-top:6px; }
        .lang-btn {
          flex:1; padding:12px 14px; border-radius:12px; border:1px solid var(--border);
          background:var(--panel); color:var(--text); font-size:14px; font-weight:600; cursor:pointer;
        }
        .lang-btn.active { border-color:#1D9E75; background:#1f3d29; color:#1D9E75; }

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
        @media (max-width:420px) {
          .functions-grid { grid-template-columns:repeat(1,1fr); }
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
      this._wireBatteryLongPress();
      this._wireMoreInfo();
      this._wireTabs();
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
    this._wireBatteryLongPress();
    this._wireMoreInfo();
    this._wireTabs();
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
    dischargeOnlyTemplate,
    cellVoltageFraction,
    activeBalancingCells,
    moreInfoAttr,
    chargeFlowState,
    CELL_VOLTAGE_RANGE,
    DEFAULT_THRESHOLDS,
    BMS_BLE_DOMAIN,
    findBmsBleDeviceIds,
    autoDiscoverEntities,
    HaBmsBleCard,
    HaBmsBleCardEditor,
    ENTITY_FIELD_GROUPS,
    discoverFromFullRegistry,
    I18N,
    jarBatterySvg,
    normalizeSoc,
  };
}
