/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.6";

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
const JAR_BATTERY_IMG = "data:image/webp;base64,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";
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
