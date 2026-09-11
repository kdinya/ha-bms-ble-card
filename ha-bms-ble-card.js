/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.8";

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
    stats_charge_duration: "Час заряду",
    stats_today: "Сьогодні",
    stats_week: "Тиждень",
    stats_month: "Місяць",
    stats_total: "Всього",
    stats_year: "Рік",
    stats_custom: "Довільний",
    stats_from: "З дати",
    stats_to: "По дату",
    stats_wh_approx: "≈ енергія (Ah × середня напруга)",
    stats_loading: "Завантаження статистики…",
    stats_no_longterm_stats: "Дані недоступні — для обраного періоду потрібна довготривала статистика (recorder) на сенсорі накопиченої ємності.",
    stats_period_sum: "За обраний період",
    stats_lifetime_total: "За весь час",
    stats_charge_unavailable: "Статистика заряду поки не налаштована. Відредагуйте картку (значок олівця/меню → \"Редагувати\") і натисніть кнопку майстра \"Створити сенсори заряду/розряду\" — вона створить потрібні helper-сенсори автоматично.",
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
    stats_charge_duration: "Charging time",
    stats_today: "Today",
    stats_week: "Week",
    stats_month: "Month",
    stats_total: "Total",
    stats_year: "Year",
    stats_custom: "Custom",
    stats_from: "From",
    stats_to: "To",
    stats_wh_approx: "≈ energy (Ah × average voltage)",
    stats_loading: "Loading statistics…",
    stats_no_longterm_stats: "Data unavailable — the selected period needs long-term statistics (recorder) on the accumulated-capacity sensor.",
    stats_period_sum: "For the selected period",
    stats_lifetime_total: "All-time total",
    stats_charge_unavailable: "Charge statistics aren't set up yet. Edit the card (pencil icon/menu → \"Edit\") and click the \"Create charge/discharge sensors\" wizard button — it will create the needed helper sensors automatically.",
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

/**
 * Дзеркальна версія dischargeOnlyTemplate для заряду: додатне (заряд) →
 * лишається як є, від'ємне (розряд) → 0. Той самий принцип — інтегрувати
 * ЦЕ, а не сирий знакозмінний power/current, щоб заряд і розряд не
 * скасовували один одного в накопиченій сумі.
 */
function chargeOnlyTemplate(value) {
  const n = Number(value) || 0;
  return Math.max(n, 0);
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
 * Діапазон дат + групування для вкладки "Статистика" залежно від обраного
 * періоду. recorder/statistics_during_period сам вміє групувати по
 * годинах/днях/тижнях/місяцях за будь-який діапазон — момент вибору
 * періоду одразу дає і суму (число), і точки (крива) одним запитом.
 */
function statsPeriodRange(period, customFrom, customTo) {
  const now = new Date();
  let start, end = now, groupBy;
  if (period === "week") {
    start = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    groupBy = "day";
  } else if (period === "month") {
    start = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    groupBy = "day";
  } else if (period === "year") {
    start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    groupBy = "month";
  } else if (period === "custom") {
    start = customFrom ? new Date(`${customFrom}T00:00:00`) : new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    end = customTo ? new Date(`${customTo}T23:59:59`) : now;
    if (end < start) { const t = start; start = end; end = t; }
    const days = (end - start) / (24 * 3600 * 1000);
    groupBy = days <= 3 ? "hour" : days <= 60 ? "day" : "month";
  } else {
    // "today" — за замовчуванням
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    groupBy = "hour";
  }
  return { start, end, groupBy };
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
const JAR_BATTERY_IMG = "data:image/webp;base64,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";
const JAR_TOP_Y = 200;
const JAR_FLOOR_Y = 833;
// Найглибша точка округленого дна банки (нижче JAR_FLOOR_Y) — рідина
// ніколи не малюється нижче прямої частини скла, лише сама крива дна
// спускається сюди для природного заокруглення калюжі.
const JAR_APEX_Y = 852;
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

const CHARGE_CYCLES = [
  { key: "charge_daily", label: "Сьогодні", cycle: "daily" },
  { key: "charge_weekly", label: "Тиждень", cycle: "weekly" },
  { key: "charge_monthly", label: "Місяць", cycle: "monthly" },
];

const CHARGE_TIME_CYCLES = [
  { key: "charge_time_daily", label: "Сьогодні", days: 1 },
  { key: "charge_time_weekly", label: "Тиждень", days: 7 },
  { key: "charge_time_monthly", label: "Місяць", days: 30 },
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

  /**
   * Дзеркало ensureDischargeTemplateSensor для заряду: той самий Template
   * config-flow, лише формула бере [value, 0] | max замість min | abs —
   * додатне (заряд) лишається як є, від'ємне (розряд) стає нулем.
   */
  async ensureChargeTemplateSensor(sourceEntity, title, unit, deviceClass) {
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
      state: `{{ [ (states('${sourceEntity}') | float(0)), 0 ] | max }}`,
      unit_of_measurement: unit,
      device_class: deviceClass,
      state_class: "measurement",
    };
    let result = await this._submitStep(step.flow_id, payload);
    if (result.type !== "create_entry") {
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

    // Дзеркало вище для заряду: той самий ланцюжок (template з max замість
    // min|abs → integral → 3x utility_meter), щоб "Заряд" у Статистиці мав
    // такі самі за суттю дані, як і "Розряд".
    const chargeTitle = `${batteryName} — заряд (${unit}, без розряду)`;
    report(`Створюю "${chargeTitle}"…`);
    const charge = await this.ensureChargeTemplateSensor(
      sourceEntity, chargeTitle, unit, deviceClass
    );
    report(charge.created ? `✓ ${charge.entityId}` : `↺ вже є: ${charge.entityId}`);

    const chargeTotalTitle = `${batteryName} — накопичена ємність заряду`;
    report(`Створюю "${chargeTotalTitle}"…`);
    const chargeTotal = await this.ensureIntegral(charge.entityId, chargeTotalTitle);
    report(chargeTotal.created ? `✓ ${chargeTotal.entityId}` : `↺ вже є: ${chargeTotal.entityId}`);

    entities.charge_total = chargeTotal.entityId;
    for (const { key, label, cycle } of CHARGE_CYCLES) {
      const title = `${batteryName} — отримано заряду (${label.toLowerCase()})`;
      report(`Створюю "${title}"…`);
      const meter = await this.ensureUtilityMeter(chargeTotal.entityId, title, cycle);
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
      for (const { key, label, days } of CHARGE_TIME_CYCLES) {
        const title = `${batteryName} — час заряду (${label.toLowerCase()})`;
        report(`Створюю "${title}"…`);
        try {
          const hs = await this.ensureHistoryStats(chargingEntity, title, ["on"], days);
          report(hs.created ? `✓ ${hs.entityId}` : `↺ вже є: ${hs.entityId}`);
          entities[key] = hs.entityId;
        } catch (err) {
          report(`⚠ ${title}: ${err.message || err}`);
        }
      }
    } else {
      report("⏱ Час розряду і заряду пропущено (немає entities.charging)");
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
    title: "Використана ємність — розряд (можна заповнити майстром нижче)",
    fields: [
      ["capacity_daily", "Сьогодні", "sensor"],
      ["capacity_weekly", "Тиждень", "sensor"],
      ["capacity_monthly", "Місяць", "sensor"],
      ["capacity_total", "Всього", "sensor"],
    ],
  },
  {
    title: "Отримано ємності — заряд (можна заповнити майстром нижче)",
    fields: [
      ["charge_daily", "Сьогодні", "sensor"],
      ["charge_weekly", "Тиждень", "sensor"],
      ["charge_monthly", "Місяць", "sensor"],
      ["charge_total", "Всього", "sensor"],
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
  {
    title: "Час заряду (можна заповнити майстром нижче)",
    fields: [
      ["charge_time_daily", "Сьогодні", "sensor"],
      ["charge_time_weekly", "Тиждень", "sensor"],
      ["charge_time_monthly", "Місяць", "sensor"],
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
    const chargeDone = !!(e.charge_daily && e.charge_weekly && e.charge_monthly && e.charge_total);
    if (!e.charging) return capacityDone && chargeDone;
    const dischargeDone = !!(e.discharge_time_daily && e.discharge_time_weekly && e.discharge_time_monthly);
    const chargeTimeDone = !!(e.charge_time_daily && e.charge_time_weekly && e.charge_time_monthly);
    return capacityDone && chargeDone && dischargeDone && chargeTimeDone;
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
      return `<p style="font-size:12px; opacity:0.7; margin:0;">✓ Сенсори споживання (заряд і розряд)${
        this._entities().charging ? " і часу заряду/розряду" : ""
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
          ${this._wizardBusy ? "Створюю…" : "Створити сенсори заряду/розряду"}
        </button>
        <p style="font-size:11px; opacity:0.6; margin:6px 0 0;">
          Створить helper-сенсори ємності розряду і заряду окремо (накопичена +
          сьогодні/тиждень/місяць для кожного)${
            hasCharging
              ? " та часу розряду і заряду (сьогодні/тиждень/місяць для кожного)"
              : " — для часу розряду/заряду вкажіть сенсор \"Заряджається\" у розділі \"Статус і діагностика BMS\" вище"
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
    this._maybeFetchStatsPeriod();
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
          this._maybeFetchStatsPeriod();
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
   * проханням користувача. Обидва тепер мають дзеркальні сенсори з Setup
   * Wizard (capacity_*, charge_* — Ah; discharge_time_*, charge_time_* —
   * час, у годинах з history_stats). Розряд додатково показує ту саму
   * щоденну історію (кілька днів), що вже є у вкладці "Інформація". Якщо
   * для Заряду сенсори ще не створені (старіший конфіг) — чесна підказка
   * замість вигаданих цифр.
   */
  _renderStatsPane() {
    const statsSections = this._statsSections || (this._statsSections = { discharge: true, charge: false });

    const timeCard = (label, entityKey) => {
      const entityId = this._e(entityKey);
      const hours = Number(stateOf(this._hass, entityId));
      if (!entityId || !Number.isFinite(hours)) return "";
      return `<div class="usage-card"${moreInfoAttr(entityId)}>
        <div class="lbl">${label}</div>
        <div class="val-row"><span class="v">${secondsToHuman(hours * 3600)}</span></div>
      </div>`;
    };

    const dischargeTimeCards = [
      timeCard(this._t("stats_today"), "discharge_time_daily"),
      timeCard(this._t("stats_week"), "discharge_time_weekly"),
      timeCard(this._t("stats_month"), "discharge_time_monthly"),
    ].filter(Boolean).join("");
    const chargeTimeCards = [
      timeCard(this._t("stats_today"), "charge_time_daily"),
      timeCard(this._t("stats_week"), "charge_time_weekly"),
      timeCard(this._t("stats_month"), "charge_time_monthly"),
    ].filter(Boolean).join("");

    const dischargeEntityId = this._e("capacity_total");
    const chargeEntityId = this._e("charge_total");

    const dischargeBody = dischargeEntityId || dischargeTimeCards
      ? `
        ${dischargeEntityId ? this._renderStatsPeriodSection("discharge") : ""}
        ${dischargeTimeCards ? `<h2 class="section-title">${this._t("stats_discharge_duration")}</h2><div class="usage-grid">${dischargeTimeCards}</div>` : ""}
      `
      : `<p class="bms-muted">${this._t("cells_no_data")}</p>`;

    const chargeBody = chargeEntityId || chargeTimeCards
      ? `
        ${chargeEntityId ? this._renderStatsPeriodSection("charge") : ""}
        ${chargeTimeCards ? `<h2 class="section-title">${this._t("stats_charge_duration")}</h2><div class="usage-grid">${chargeTimeCards}</div>` : ""}
      `
      : `<p class="bms-muted">${this._t("stats_charge_unavailable")}</p>`;

    return `
      ${dischargeEntityId || chargeEntityId ? this._renderStatsPeriodSelector() : ""}

      <details class="info-accordion-section" data-stats-section="discharge"${statsSections.discharge ? " open" : ""}>
        <summary class="info-accordion-title">${this._t("stats_discharge_title")}</summary>
        <div class="info-accordion-body">
          ${dischargeBody}
        </div>
      </details>

      <details class="info-accordion-section" data-stats-section="charge"${statsSections.charge ? " open" : ""}>
        <summary class="info-accordion-title">${this._t("stats_charge_title")}</summary>
        <div class="info-accordion-body">
          ${chargeBody}
        </div>
      </details>`;
  }

  /** Спільний вибір періоду над Розрядом і Заряду (не всередині кожного
   *  окремо) — один і той самий період застосовується до обох секцій. */
  _renderStatsPeriodSelector() {
    const period = this._statsPeriod || "today";
    const periods = [
      ["today", this._t("stats_today")],
      ["week", this._t("stats_week")],
      ["month", this._t("stats_month")],
      ["year", this._t("stats_year")],
      ["custom", this._t("stats_custom")],
    ];
    const btns = periods.map(([key, label]) => `
      <button type="button" class="stats-period-btn${key === period ? " active" : ""}" data-period="${key}">${label}</button>
    `).join("");
    const from = this._statsCustomFrom || "";
    const to = this._statsCustomTo || "";
    return `
      <div class="stats-period-bar">
        <div class="stats-period-btns">${btns}</div>
        ${period === "custom" ? `
          <div class="stats-period-custom">
            <label>${this._t("stats_from")} <input type="date" class="stats-date-input" data-role="from" value="${from}"></label>
            <label>${this._t("stats_to")} <input type="date" class="stats-date-input" data-role="to" value="${to}"></label>
          </div>` : ""}
      </div>`;
  }

  /** Число (сума за період) + наближені Вт-години + крива — усе одним
   *  запитом recorder/statistics_during_period (див. _maybeFetchStatsPeriod). */
  _renderStatsPeriodSection(kind) {
    const entityKey = kind === "discharge" ? "capacity_total" : "charge_total";
    const entityId = this._e(entityKey);
    const data = this._statsData;

    if (!data || data.loading || data.period !== (this._statsPeriod || "today")) {
      return `<p class="bms-muted">${this._t("stats_loading")}</p>`;
    }
    if (data.error) {
      return `<p class="muted-note">${this._t("stats_no_longterm_stats")}</p>`;
    }

    const series = data[kind] || { points: [], sum: 0 };
    const whVal = kind === "discharge" ? data.whDischarge : data.whCharge;
    const lifetimeTotal = Number(stateOf(this._hass, entityId));

    return `
      <div class="usage-grid stats-summary-grid">
        <div class="usage-card"${moreInfoAttr(entityId)}>
          <div class="lbl">${this._t("stats_period_sum")}</div>
          <div class="val-row"><span class="v">${fmt(series.sum, 1)}</span><span class="p">Ah</span></div>
          ${Number.isFinite(whVal) ? `<div class="val-row"><span class="v" style="font-size:14px;">${fmt(whVal / 1000, 2)}</span><span class="p">kWh</span></div>` : ""}
        </div>
        ${Number.isFinite(lifetimeTotal) ? `
        <div class="usage-card"${moreInfoAttr(entityId)}>
          <div class="lbl">${this._t("stats_lifetime_total")}</div>
          <div class="val-row"><span class="v">${fmt(lifetimeTotal, 1)}</span><span class="p">Ah</span></div>
        </div>` : ""}
      </div>
      ${Number.isFinite(whVal) ? `<p class="muted-note stats-wh-note">${this._t("stats_wh_approx")}</p>` : ""}
      ${this._renderStatsChart(series, data.groupBy)}
    `;
  }

  _renderStatsChart(series, groupBy) {
    const points = (series && series.points) || [];
    if (!points.length) return "";
    const maxRaw = Math.max(0.001, ...points.map((p) => p.v));
    const maxV = maxRaw * 1.15;
    const label = (iso) => {
      const d = new Date(iso);
      if (groupBy === "hour") return `${String(d.getHours()).padStart(2, "0")}:00`;
      if (groupBy === "month") return `${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    };
    const nowKey = new Date();
    const isCurrent = (iso) => {
      const d = new Date(iso);
      if (groupBy === "hour") return d.getHours() === nowKey.getHours() && d.toDateString() === nowKey.toDateString();
      if (groupBy === "month") return d.getMonth() === nowKey.getMonth() && d.getFullYear() === nowKey.getFullYear();
      return d.toDateString() === nowKey.toDateString();
    };
    // Не більше ~31 стовпчика, щоб графік не перетворився на кашу — за
    // потреби рівномірно проріджуємо (для custom-діапазонів на пів року+).
    const maxBars = 31;
    let shown = points;
    if (shown.length > maxBars) {
      const step = Math.ceil(shown.length / maxBars);
      shown = points.filter((_, i) => i % step === 0 || i === points.length - 1);
    }
    const cols = shown.map((p) => `
      <div class="bar-col">
        <div class="bar-val">${p.v >= 10 ? Math.round(p.v) : fmt(p.v, 1)}</div>
        <div class="bar ${isCurrent(p.t) ? "today" : ""}" style="height:${Math.max(2, (p.v / maxV) * 100).toFixed(0)}%"></div>
        <div class="bar-date ${isCurrent(p.t) ? "today" : ""}">${label(p.t)}</div>
      </div>`).join("");
    return `
      <div class="history-box">
        <div class="history-chart">
          <div class="yaxis"><span>${fmt(maxV, 1)} Ah</span><span>${fmt(maxV / 2, 1)} Ah</span><span>0 Ah</span></div>
          ${cols}
        </div>
      </div>`;
  }

  /**
   * Нова логіка вкладки "Статистика": один запит recorder/statistics_during_period,
   * згрупований відповідно до обраного періоду (today→hour, week/month→day,
   * year→month, custom→auto), дає одночасно і суму (число), і точки (крива)
   * для Розряду й Заряду. Плюс середня напруга за той самий період — з неї
   * рахуємо наближені Вт-години (Ah × середня напруга), без нових сенсорів.
   */
  async _maybeFetchStatsPeriod() {
    if (!this._hass || typeof this._hass.callWS !== "function") return;
    const period = this._statsPeriod || "today";
    const { start, end, groupBy } = statsPeriodRange(period, this._statsCustomFrom, this._statsCustomTo);
    const dischargeId = this._e("capacity_total");
    const chargeId = this._e("charge_total");
    const voltageId = this._e("voltage");
    const ids = [dischargeId, chargeId, voltageId].filter(Boolean);
    if (!ids.length) return;
    const cacheKey = `${period}:${this._statsCustomFrom || ""}:${this._statsCustomTo || ""}:${groupBy}`;
    if (this._statsFetchKey === cacheKey && this._statsData && !this._statsData.error) return;
    if (this._statsFetchInFlight) return;
    this._statsFetchInFlight = true;
    this._statsFetchKey = cacheKey;
    try {
      const result = await this._hass.callWS({
        type: "recorder/statistics_during_period",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        statistic_ids: ids,
        period: groupBy,
      });
      const buildSeries = (entityId) => {
        if (!entityId) return { points: [], sum: 0 };
        const rows = (result && result[entityId]) || [];
        const points = rows.map((r) => {
          let v;
          if (Number.isFinite(r.change)) v = r.change;
          else if (Number.isFinite(r.max) && Number.isFinite(r.min)) v = r.max - r.min;
          else v = Number(r.state);
          return { t: r.start, v: Number.isFinite(v) ? Math.abs(v) : 0 };
        });
        const sum = points.reduce((s, p) => s + p.v, 0);
        return { points, sum };
      };
      const buildAvgVoltage = (entityId) => {
        if (!entityId) return undefined;
        const rows = (result && result[entityId]) || [];
        const means = rows
          .map((r) => (Number.isFinite(r.mean) ? r.mean : Number(r.state)))
          .filter(Number.isFinite);
        if (!means.length) return undefined;
        return means.reduce((s, v) => s + v, 0) / means.length;
      };
      const discharge = buildSeries(dischargeId);
      const charge = buildSeries(chargeId);
      const avgVoltage = buildAvgVoltage(voltageId);
      this._statsData = {
        loading: false, error: false, period, groupBy, start, end,
        discharge, charge, avgVoltage,
        whDischarge: Number.isFinite(avgVoltage) ? discharge.sum * avgVoltage : undefined,
        whCharge: Number.isFinite(avgVoltage) ? charge.sum * avgVoltage : undefined,
      };
    } catch (e) {
      // recorder/statistics_during_period недоступний (немає long-term statistics) — чесна підказка, а не поламана картка
      this._statsData = { loading: false, error: true, period, groupBy };
    } finally {
      this._statsFetchInFlight = false;
      this._render();
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
          if (tab === "stats") this._maybeFetchStatsPeriod();
        }
      });
    });
    this.querySelectorAll(".stats-period-btn[data-period]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const period = el.dataset.period;
        if (!period || period === this._statsPeriod) return;
        this._statsPeriod = period;
        this._statsData = null;
        this._render();
        this._maybeFetchStatsPeriod();
      });
    });
    this.querySelectorAll(".stats-date-input[data-role]").forEach((el) => {
      el.addEventListener("change", (ev) => {
        ev.stopPropagation();
        const role = el.dataset.role;
        const val = el.value || "";
        if (role === "from") this._statsCustomFrom = val;
        else if (role === "to") this._statsCustomTo = val;
        this._statsData = null;
        this._render();
        this._maybeFetchStatsPeriod();
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

        .stats-period-bar { margin-bottom:18px; }
        .stats-period-btns { display:flex; flex-wrap:wrap; gap:8px; }
        .stats-period-btn {
          font: inherit; cursor:pointer; padding:7px 14px; border-radius:999px;
          border:1px solid var(--border); background:var(--panel); color:var(--text);
          font-size:13px; font-weight:600;
        }
        .stats-period-btn.active { background:var(--green); border-color:var(--green); color:#04150a; }
        .stats-period-custom { display:flex; flex-wrap:wrap; gap:14px; margin-top:12px; }
        .stats-period-custom label { font-size:12.5px; color:var(--muted); display:flex; flex-direction:column; gap:4px; }
        .stats-period-custom input[type="date"] {
          font: inherit; padding:7px 10px; border-radius:10px; border:1px solid var(--border);
          background:var(--panel); color:var(--text);
        }
        .stats-summary-grid { grid-template-columns:repeat(2,1fr); }
        .stats-wh-note { margin-top:-12px; }

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
        .lang-btn.active { background:rgba(56,150,231,0.12); color:#4fb3f6; border-color:rgba(79,179,246,0.35); }

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
    chargeOnlyTemplate,
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
