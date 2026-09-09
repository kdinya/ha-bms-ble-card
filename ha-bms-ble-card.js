/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.2";

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
