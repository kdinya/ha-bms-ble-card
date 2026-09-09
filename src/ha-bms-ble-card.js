/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.1";

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
function batteryFillColorKey(percent) {
  if (percent > 50) return "green";
  if (percent > 20) return "amber";
  return "red";
}

const BATTERY_LIQUID_COLORS = {
  green: { fg: ["#d0ff90", "#70f040", "#30e038", "#18c030", "#068018"], gl: ["#c0ff90", "#40e050", "#10a030"], sf: ["#f0ffd0", "#90f050", "#30d038"], sec: "#054018", shine: "#f8ffe8" },
  amber: { fg: ["#ffe890", "#f0c848", "#e8a828", "#d08818", "#8a5010"], gl: ["#ffd870", "#e8a828", "#c07818"], sf: ["#fff8d0", "#f0c858", "#d09828"], sec: "#5a3010", shine: "#fffce8" },
  red: { fg: ["#ff9888", "#f05848", "#e03830", "#c02020", "#701010"], gl: ["#ff8878", "#e04838", "#a02020"], sf: ["#ffc8b8", "#f06858", "#d03830"], sec: "#4a1010", shine: "#ffe0d8" },
};

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

  /* ===== UI matching bms-dashboard.html reference ===== */
  _renderBatteryShape(percent, variant, flowState) {
    // percent тепер очікується вже нормалізованим через normalizeSoc()
    // (число 0..100 або null = даних немає).
    const flowClass = flowState === "charging" ? "bms-flow-charging" : flowState === "discharging" ? "bms-flow-discharging" : "";
    const hasData = percent !== null && percent !== undefined && Number.isFinite(Number(percent));
    const p = hasData ? Number(percent) : 0;
    const topPct = hasData ? Math.max(8, 100 - p) : 50;
    return `
      <div class="battery-shell bms-battery-shape-${variant} ${flowClass}">
        <div class="battery-nub"></div>
        <div class="battery-fill ${hasData ? "" : "no-data"} ${flowClass}" style="top:${topPct}%;">
          <div class="pct">${hasData ? p.toFixed(0) + "%" : "N/A"}</div>
          <div class="soc-label">SOC</div>
        </div>
      </div>`;
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
            ${this._renderBatteryShape(soc, "mini", chargeFlowState(status.label))}
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
        .battery-shell {
          position:relative; width:130px; height:190px; border-radius:16px;
          border:3px solid #4a5764; background:linear-gradient(145deg,#1c242c,#0a0f14);
          padding:6px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -6px 10px rgba(0,0,0,0.5), 0 4px 10px rgba(0,0,0,0.4);
        }
        .bms-battery-shape-mini.battery-shell { width:90px; height:130px; }
        .bms-battery-shape-flow.battery-shell {
          width:152px; height:224px; border-radius:34px;
          border:4px solid #56636f;
          box-shadow: inset 0 3px 5px rgba(255,255,255,0.1), inset 0 -8px 14px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.5);
        }
        .battery-nub {
          position:absolute; top:-12px; left:50%; transform:translateX(-50%);
          width:46px; height:12px; border-radius:5px 5px 0 0;
          background:linear-gradient(180deg,#6b7883,#3a4650);
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.35);
        }
        .bms-battery-shape-flow .battery-nub {
          width:64px; height:18px; border-radius:10px 10px 0 0; top:-16px;
          background:linear-gradient(180deg,#8b98a3,#3a4650);
          box-shadow: inset 0 2px 2px rgba(255,255,255,0.45), 0 -1px 2px rgba(0,0,0,0.3);
        }
        .battery-fill {
          position:absolute; left:6px; right:6px; bottom:6px; border-radius:9px; overflow:hidden;
          background:linear-gradient(180deg,#7bf094 0%,#63e07e 35%,#2fae4e 100%);
          box-shadow: inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -8px 14px rgba(0,0,0,0.3);
          display:flex; flex-direction:column; align-items:center; justify-content:center;
        }
        .battery-fill.no-data { background:linear-gradient(180deg,#8b96a3 0%,#6b7684 50%,#4a5460 100%); }
        .bms-battery-shape-flow .battery-fill { border-radius:26px; }
        /* Меніск — вигнута верхня межа рідини для псевдо-3D ефекту циліндра. */
        .bms-battery-shape-flow .battery-fill::after {
          content:""; position:absolute; top:-9px; left:-4px; right:-4px; height:20px;
          background:radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.35), rgba(255,255,255,0) 70%), #63e07e;
          border-radius:50%; pointer-events:none;
        }
        /* Глянцева діагональна відбивна смуга — суто CSS, для об'ємного вигляду. */
        .battery-fill::before {
          content:""; position:absolute; top:-20%; left:8%; width:26%; height:140%;
          background:linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0));
          transform:rotate(8deg); pointer-events:none;
        }
        .battery-fill .pct { font-size:30px; font-weight:800; color:#eafff0; line-height:1; text-shadow:0 1px 2px rgba(0,0,0,0.35); }
        .bms-battery-shape-mini .battery-fill .pct { font-size:22px; }
        .bms-battery-shape-flow .battery-fill .pct { font-size:42px; }
        .battery-fill .soc-label { font-size:12px; color:#eafff0cc; margin-top:2px; font-weight:600; }
        .bms-battery-shape-flow .battery-fill .soc-label { font-size:14px; }
        .charge-badge {
          display:flex; align-items:center; gap:6px; background:var(--green-dim); color:var(--green);
          padding:8px 14px; border-radius:10px; font-size:14px; font-weight:600;
          width:max-content; max-width:100%; margin:12px auto 0; justify-content:center;
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
          padding:16px 18px; min-width:260px; width:100%; display:flex; flex-direction:column; gap:12px;
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

        /* Клікабельні значення — відкривають нативний діалог історії
           сутності HA (подія hass-more-info), натхнення від jk-bms-card. */
        [data-more-info] { cursor:pointer; border-radius:10px; transition:background-color 0.15s ease; outline:none; }
        [data-more-info]:hover, [data-more-info]:focus-visible { background-color:rgba(255,255,255,0.05); }

        /* Підсвітка комірок, які зараз активно балансуються (з bitmask
           атрибута balancer) — аналог balancer_status_bitmask у jk-bms-card. */
        @keyframes bms-balance-pulse { 0%, 100% { opacity:1; } 50% { opacity:0.45; } }
        .cell-row.balancing .cell-name { color:var(--green); font-weight:700; }
        .cell-row.balancing .cell-fill { animation: bms-balance-pulse 1.4s ease-in-out infinite; }
        .balance-badge {
          display:inline-flex; align-items:center; gap:4px; margin-left:8px; padding:2px 8px;
          border-radius:8px; background:var(--green-dim); color:var(--green); font-size:11px; font-weight:600;
          vertical-align:middle;
        }

        /* Анімація потоку заряду/розряду на самій батареї. Смуги в заповненні
           "течуть" вгору при заряді (енергія прибуває) і вниз при розряді
           (енергія витрачається); корпус батареї підсвічується відповідним
           кольором у такт. Натхнення — анімація потоку балансування в
           jk-bms-card, але тут саме для заряду/розряду, як просив користувач. */
        @keyframes bms-flow-up { from { background-position: 0 28px, 0 0; } to { background-position: 0 0, 0 0; } }
        @keyframes bms-flow-down { from { background-position: 0 0, 0 0; } to { background-position: 0 28px, 0 0; } }
        @keyframes bms-glow-charge { 0%, 100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); } 50% { box-shadow: 0 0 16px 2px rgba(29,158,117,0.5); } }
        @keyframes bms-glow-discharge { 0%, 100% { box-shadow: 0 0 0 0 rgba(239,159,39,0); } 50% { box-shadow: 0 0 16px 2px rgba(239,159,39,0.45); } }
        .battery-fill.bms-flow-charging, .battery-fill.bms-flow-discharging {
          background-image:
            repeating-linear-gradient(0deg, rgba(255,255,255,0.24) 0px, rgba(255,255,255,0.24) 7px, transparent 7px, transparent 18px),
            linear-gradient(180deg,#63e07e 0%,#2fae4e 100%);
          background-size: 100% 28px, 100% 100%;
        }
        .battery-fill.bms-flow-charging { animation: bms-flow-up 0.85s linear infinite; }
        .battery-fill.bms-flow-discharging { animation: bms-flow-down 0.85s linear infinite; }
        .battery-shell.bms-flow-charging { animation: bms-glow-charge 2s ease-in-out infinite; }
        .battery-shell.bms-flow-discharging { animation: bms-glow-discharge 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .battery-fill.bms-flow-charging, .battery-fill.bms-flow-discharging,
          .battery-shell.bms-flow-charging, .battery-shell.bms-flow-discharging { animation: none; }
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
    batteryFillColor,
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
