/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.4";

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
const JAR_TOP_Y = 155;
// Було 735 — це помітно вище за справжнє дно скляної колби на фото
// (прозора скляна частина, яку можна "наповнювати", насправді триває
// аж до ~765, далі йде суцільна металева основа-підставка). Через це
// при малому заряді калюжа рідини "висіла" в повітрі з явним темним
// порожнім проміжком до дна — саме той баг. Підняли межу до дна скла.
const JAR_FLOOR_Y = 765;
const JAR_LEFT_X = 35;
const JAR_RIGHT_X = 365;
const JAR_CX = (JAR_LEFT_X + JAR_RIGHT_X) / 2;

function jarBatteryColorFor(p) {
  if (p < 20) return { main: "#ff2419", bright: "#ff5a45" };
  if (p < 50) return { main: "#ff9d12", bright: "#ffc04a" };
  return { main: "#20df14", bright: "#42ff25" };
}

/** Нове фото банки (за референсом користувача): порожня, без вшитої
 *  рідини і з реальною альфа-прозорістю навколо — тому, на відміну від
 *  попередньої версії, тут НЕ потрібен трюк з "emptyMask" (маскування
 *  вшитого в фото рівня 75%): вся рідина — це чистий SVG-оверлей, що
 *  завжди точно відповідає реальному SOC і кольору, без жодних швів чи
 *  просвічування "чужого" кольору. */
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

  // Поверхня рідини (меніск) — дальній край вище, ближній нижче, як і
  // самі скляні кільця-роздільники на фото; дно — дзеркальна крива.
  // Дно калюжі має помітний вигин вниз (было +14, стало +26) — так
  // рідина візуально "лягає" в округлене дно банки і виглядає
  // заповненою, а не пласким диском, що висить над дном.
  const liquidD = `M${JAR_LEFT_X} ${y + 2} Q${JAR_CX} ${y - 16} ${JAR_RIGHT_X} ${y - 3} L${JAR_RIGHT_X} ${JAR_FLOOR_Y - 4} Q${JAR_CX} ${JAR_FLOOR_Y + 26} ${JAR_LEFT_X} ${JAR_FLOOR_Y - 2} Z`;

  // Три роздільники на фото (чверті шкали) підсвічуються кольором рідини,
  // коли вони "занурені" (нижче поточного рівня y).
  const sectionOpacity = (sectionY) => (sectionY >= y && p > 0 ? "0.62" : "0");

  const liquidMarkup = p > 0 ? `
      <g>
        <path fill="${c.main}" opacity=".92" d="${liquidD}"/>
        <ellipse cx="${JAR_CX}" cy="${y - 2}" rx="${half - 3}" ry="16" fill="${c.bright}" opacity=".85"/>
        <ellipse cx="${JAR_CX}" cy="${y - 2}" rx="${half - 8}" ry="12" fill="${c.main}" opacity=".45"/>
      </g>
      <g fill="none" stroke-linecap="round" pointer-events="none">
        <path d="M${JAR_LEFT_X} 283 Q${JAR_CX} 300 ${JAR_RIGHT_X} 283" stroke="${c.bright}" stroke-width="3" opacity="${sectionOpacity(283)}"/>
        <path d="M${JAR_LEFT_X} 437 Q${JAR_CX} 454 ${JAR_RIGHT_X} 437" stroke="${c.bright}" stroke-width="2.4" opacity="${sectionOpacity(437)}"/>
        <path d="M${JAR_LEFT_X} 586 Q${JAR_CX} 603 ${JAR_RIGHT_X} 586" stroke="${c.main}" stroke-width="3" opacity="${sectionOpacity(586)}"/>
      </g>` : "";

  return `
    <div class="battery-svg jar-battery">
      <img class="jar-battery-img" src="${JAR_BATTERY_IMG}" alt=""/>
      <svg class="jar-battery-overlay" viewBox="0 0 402 824" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <clipPath id="${id("innerBatteryClip")}">
            <path d="M${JAR_LEFT_X} ${JAR_TOP_Y - 10} Q${JAR_CX} ${JAR_TOP_Y + 8} ${JAR_RIGHT_X} ${JAR_TOP_Y - 10} L${JAR_RIGHT_X} ${JAR_FLOOR_Y - 6} Q${JAR_CX} ${JAR_FLOOR_Y + 32} ${JAR_LEFT_X} ${JAR_FLOOR_Y - 6} Z"/>
          </clipPath>
        </defs>
        <g clip-path="url(#${id("innerBatteryClip")})" pointer-events="none">
          ${liquidMarkup}
        </g>
        <text x="${JAR_CX}" y="460" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" fill="white">
          ${hasData
            ? `<tspan font-size="170" font-weight="700" fill="white">${Math.round(p)}</tspan><tspan font-size="95" font-weight="400" dx="2" fill="white">%</tspan>`
            : `<tspan font-size="120" font-weight="700" fill="#aeb8c2">N/A</tspan>`}
        </text>
        ${voltageLabel !== undefined && voltageLabel !== null && voltageLabel !== "—" ? `<text x="${JAR_CX}" y="591" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-size="92" font-weight="600" fill="white" opacity=".92">${voltageLabel} V</text>` : ""}
      </svg>
    </div>`;
}

/** Іконка ЛЕП/трансформаторної опори для вузла "Мережа" у flow-row —
 *  точна копія лінійної графіки з референсного прев'ю. */
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
        .jar-battery-img { width:100%; height:auto; display:block; }
        .jar-battery-overlay { position:absolute; top:0; left:0; width:100%; height:100%; }
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
