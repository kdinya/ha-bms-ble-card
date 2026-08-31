/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.0.0";

console.info(
  `%c HA-BMS-BLE-CARD %c v${CARD_VERSION} `,
  "color: white; background: #0F6E56; font-weight: 700;",
  "color: #0F6E56; background: white; font-weight: 700;"
);

const DEFAULT_THRESHOLDS = {
  cell_delta_warning: 0.02,
  cell_delta_critical: 0.05,
};

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

function secondsToHuman(seconds) {
  if (seconds === undefined || seconds === null || Number.isNaN(Number(seconds))) return "—";
  const s = Number(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h <= 0) return `${m} хв`;
  return `${h} год ${m} хв`;
}

class HaBmsBleCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    this.innerHTML = `
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="display:block; font-size:13px; margin-bottom:4px;">Назва картки</label>
          <input id="name" type="text" value="${c.name || ""}" style="width:100%; box-sizing:border-box;" />
        </div>
        <div>
          <label style="display:block; font-size:13px; margin-bottom:4px;">Режим відображення</label>
          <select id="display_mode" style="width:100%;">
            <option value="widget" ${c.display_mode !== "inline" ? "selected" : ""}>Widget + спливаюче вікно</option>
            <option value="inline" ${c.display_mode === "inline" ? "selected" : ""}>Вбудована картка (inline)</option>
          </select>
        </div>
        <p style="font-size:12px; opacity:0.7; margin:0;">
          Основні entities вкажіть у YAML-режимі редактора картки (кнопка "Показати код")
          — див. README для повного списку ключів <code>entities:</code>.
        </p>
      </div>
    `;
    this.querySelector("#name").addEventListener("change", (e) => this._update("name", e.target.value));
    this.querySelector("#display_mode").addEventListener("change", (e) => this._update("display_mode", e.target.value));
  }

  _update(key, value) {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
  }
}
customElements.define("ha-bms-ble-card-editor", HaBmsBleCardEditor);

class HaBmsBleCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("ha-bms-ble-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:ha-bms-ble-card",
      display_mode: "widget",
      name: "BMS Battery",
      entities: {},
      thresholds: DEFAULT_THRESHOLDS,
    };
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("ha-bms-ble-card: потрібно вказати блок 'entities'");
    }
    this._config = {
      display_mode: "widget",
      thresholds: DEFAULT_THRESHOLDS,
      ...config,
      thresholds: { ...DEFAULT_THRESHOLDS, ...(config.thresholds || {}) },
    };
    this._expanded = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return this._config && this._config.display_mode === "inline" ? 8 : 3;
  }

  connectedCallback() {
    this._onResize = () => this._render();
    window.addEventListener("resize", this._onResize);
  }

  disconnectedCallback() {
    if (this._onResize) window.removeEventListener("resize", this._onResize);
  }

  _e(key) {
    return this._config && this._config.entities ? this._config.entities[key] : undefined;
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
    if (!cells.length) return "<p style='opacity:0.6; font-size:13px;'>Немає даних про комірки. Додайте entities.cell_voltages або delta_cell_voltage.</p>";
    const min = Math.min(...cells);
    const max = Math.max(...cells);
    const delta = max - min;
    const range = max - min || 0.05;
    return `
      <div class="bms-section-title">
        <span>Напруга комірок</span>
        <span class="bms-muted">Δ ${delta.toFixed(3)} V</span>
      </div>
      <div class="bms-cell-list">
        ${cells
          .map((v, i) => {
            const pct = Math.max(8, Math.min(100, ((v - (min - range * 0.2)) / (range * 1.4)) * 100));
            const color = this._cellBarColor(v, min, delta);
            return `
              <div class="bms-cell-row">
                <span class="bms-cell-idx">${i + 1}</span>
                <div class="bms-cell-track"><div class="bms-cell-fill" style="width:${pct}%; background:${color};"></div></div>
                <span class="bms-cell-val">${v.toFixed(3)}V</span>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
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
    const socNum = Number(soc) || 0;
    const status = this._statusInfo();
    const statusColors = this._statusColorVars(status.color);
    const circumference = 226;
    const offset = circumference - (circumference * Math.min(100, Math.max(0, socNum))) / 100;

    return `
      <div class="bms-full">
        <div class="bms-header">
          <div class="bms-title"><i class="ti ti-battery-4" style="color:${statusColors.fg};"></i>
            <span>${this._config.name || "BMS Battery"}</span></div>
          <span class="bms-status-pill" style="background:${statusColors.bg}; color:${statusColors.fg};">
            <i class="ti ${status.icon}"></i> ${status.label}
          </span>
        </div>

        <div class="bms-top-row">
          <div class="bms-soc-ring">
            <svg width="88" height="88" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="36" fill="none" stroke="var(--divider-color,#333)" stroke-width="8"/>
              <circle cx="42" cy="42" r="36" fill="none" stroke="${statusColors.fg}" stroke-width="8"
                stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                transform="rotate(-90 42 42)"/>
            </svg>
            <div class="bms-soc-label">
              <span class="bms-soc-value">${fmt(soc, 0)}%</span>
              <span class="bms-soc-sub">SoC</span>
            </div>
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
            <div class="bms-muted" style="font-size:12px;">До розряду (поточне навантаження)</div>
            <div style="font-weight:500;">${secondsToHuman(runtime)}</div>
          </div>
        </div>` : ""}

        <div class="bms-section">${this._renderCellBars()}</div>

        <div class="bms-section">
          <div class="bms-section-title"><span>Діагностика BMS</span></div>
          <div class="bms-diag-grid">
            ${this._renderDiagBadge("Балансир", this._e("balancer"), true)}
            ${this._renderDiagBadge("MOSFET заряд", this._e("chrg_mosfet"), true)}
            ${this._renderDiagBadge("MOSFET розряд", this._e("dischrg_mosfet"), true)}
            ${this._renderDiagBadge("Нагрівач", this._e("heater"), true)}
          </div>
        </div>

        <div class="bms-section">
          <div class="bms-section-title"><span>Загальна інформація</span></div>
          <div class="bms-diag-grid bms-diag-grid-plain">
            <div class="bms-plain-stat"><span class="bms-muted">Цикли</span><span>${fmt(cycles, 0)}</span></div>
            <div class="bms-plain-stat"><span class="bms-muted">Link quality</span><span>${fmt(linkQuality, 0, "%")}</span></div>
            <div class="bms-plain-stat"><span class="bms-muted">RSSI</span><span>${fmt(rssi, 0, " dBm")}</span></div>
          </div>
        </div>

        ${this._hasCapacityEntities() ? `
        <div class="bms-section">
          <div class="bms-section-title"><span>Використано ємності</span></div>
          <div class="bms-diag-grid">
            ${this._renderCapacityCard("Сьогодні", this._e("capacity_daily"))}
            ${this._renderCapacityCard("Тиждень", this._e("capacity_weekly"))}
            ${this._renderCapacityCard("Місяць", this._e("capacity_monthly"))}
            ${this._renderCapacityCard("Всього", this._e("capacity_total"))}
          </div>
        </div>` : `
        <div class="bms-section">
          <p class="bms-muted" style="font-size:12px;">
            Сенсори споживання (сьогодні/тиждень/місяць/всього) не налаштовані.
            Додайте Riemann sum integral + Utility Meter helpers і вкажіть їх у
            <code>entities.capacity_*</code> — див. README.
          </p>
        </div>`}
      </div>
    `;
  }

  _hasCapacityEntities() {
    return !!(this._e("capacity_daily") || this._e("capacity_weekly") || this._e("capacity_monthly") || this._e("capacity_total"));
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
        <div class="bms-mini-battery">
          <div class="bms-mini-battery-fill" style="height:${Math.min(100, Math.max(0, Number(soc) || 0))}%; background:${statusColors.fg};"></div>
          <div class="bms-mini-battery-label">
            <span class="bms-soc-value">${fmt(soc, 0)}%</span>
            <span class="bms-soc-sub">SOC</span>
          </div>
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
    `;
  }

  _toggleOverlay(open) {
    this._expanded = open;
    this._render();
  }

  _render() {
    if (!this._config || !this._hass) return;

    const style = `
      <style>
        :host { display:block; }
        .ti { font-size:16px; vertical-align:-2px; }
        .bms-card { background: var(--ha-card-background, var(--card-background-color, #fff));
          border-radius: var(--ha-card-border-radius, 12px); padding: 16px; color: var(--primary-text-color); }
        .bms-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
        .bms-title { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:500; }
        .bms-status-pill { font-size:12px; padding:4px 10px; border-radius:8px; white-space:nowrap; }
        .bms-top-row { display:flex; align-items:center; gap:16px; margin-bottom:14px; }
        .bms-soc-ring { position:relative; width:88px; height:88px; flex-shrink:0; }
        .bms-soc-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .bms-soc-value { font-size:20px; font-weight:500; }
        .bms-soc-sub { font-size:10px; opacity:0.6; }
        .bms-metric-grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .bms-metric-grid-mini { grid-template-columns:1fr 1fr; }
        .bms-metric { background: var(--secondary-background-color, rgba(127,127,127,0.08)); border-radius:8px; padding:8px 10px; }
        .bms-metric-label { font-size:11px; opacity:0.6; }
        .bms-metric-value { font-size:15px; font-weight:500; }
        .bms-runtime { display:flex; align-items:center; gap:10px; background: var(--secondary-background-color, rgba(127,127,127,0.08));
          border-radius:8px; padding:10px 12px; margin-bottom:14px; }
        .bms-section { border-top:0.5px solid var(--divider-color,#333); padding-top:12px; margin-top:12px; }
        .bms-section-title { display:flex; justify-content:space-between; font-size:12px; opacity:0.75; margin-bottom:8px; }
        .bms-muted { opacity:0.6; }
        .bms-cell-list { display:flex; flex-direction:column; gap:6px; }
        .bms-cell-row { display:flex; align-items:center; gap:8px; }
        .bms-cell-idx { font-size:11px; opacity:0.6; width:14px; }
        .bms-cell-track { flex:1; height:8px; background:var(--secondary-background-color, rgba(127,127,127,0.15)); border-radius:4px; overflow:hidden; }
        .bms-cell-fill { height:100%; border-radius:4px; }
        .bms-cell-val { font-size:11px; width:52px; text-align:right; }
        .bms-diag-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .bms-diag-grid-plain { grid-template-columns:1fr 1fr 1fr; }
        .bms-diag-badge { border-radius:8px; padding:8px 10px; }
        .bms-diag-badge-label { font-size:11px; opacity:0.85; }
        .bms-diag-badge-value { font-size:14px; font-weight:500; }
        .bms-plain-stat { display:flex; flex-direction:column; gap:2px; font-size:13px; }
        .bms-mini { display:flex; gap:14px; align-items:center; cursor:pointer; }
        .bms-mini-battery { position:relative; width:56px; height:88px; border:2px solid var(--divider-color,#555);
          border-radius:8px; overflow:hidden; flex-shrink:0; background: var(--secondary-background-color, rgba(127,127,127,0.08)); }
        .bms-mini-battery-fill { position:absolute; bottom:0; left:0; right:0; transition:height 0.4s ease; }
        .bms-mini-battery-label { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
        .bms-mini-right { flex:1; display:flex; flex-direction:column; gap:8px; }
        .bms-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:16px; box-sizing:border-box; }
        .bms-overlay-inner { background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
          border-radius:12px; max-width:520px; width:100%; max-height:90vh; overflow-y:auto; padding:16px; position:relative; }
        .bms-overlay.landscape .bms-overlay-inner { max-width:820px; }
        .bms-overlay-close { position:absolute; top:8px; right:8px; background:transparent; border:none;
          color:var(--primary-text-color); font-size:20px; cursor:pointer; padding:6px; }
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
            ${this._renderFullView()}
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
