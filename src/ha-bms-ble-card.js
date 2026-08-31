/**
 * ha-bms-ble-card
 * A Lovelace card for visualizing BLE BMS batteries (Redodo, LiTime, JBD, Daly,
 * JK, Seplos, and any other battery supported by the BMS_BLE-HA integration:
 * https://github.com/patman15/BMS_BLE-HA
 *
 * https://github.com/kdinya/ha-bms-ble-card
 */

const CARD_VERSION = "1.2.0";

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

function batteryFillColor(percent) {
  if (percent <= 15) return "#E24B4A";
  if (percent <= 30) return "#EF9F27";
  return "#1D9E75";
}

function secondsToHuman(seconds) {
  if (seconds === undefined || seconds === null || Number.isNaN(Number(seconds))) return "—";
  const s = Number(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h <= 0) return `${m} хв`;
  return `${h} год ${m} хв`;
}

/* ----------------------------------------------------------------------
 * Setup Wizard: creates the helper entities needed for consumption /
 * runtime tracking (Riemann-sum integral + Utility Meter cycles) through
 * HA's own config-entries "helper" flows — the same mechanism used by
 * Settings → Devices & services → Helpers → + Add helper.
 *
 * This talks to internal-but-stable HA REST endpoints exposed on `hass`
 * via hass.callApi(). Field names follow the `integration` and
 * `utility_meter` helper config flows as of HA 2024–2026. If a future core
 * release renames a field, creation will fail gracefully and the card
 * falls back to pointing the user at the manual YAML instructions in the
 * README — nothing here is required for the card to keep working with
 * entities configured by hand.
 * -------------------------------------------------------------------- */
const WIZARD_CYCLES = [
  { key: "capacity_daily", label: "Сьогодні", cycle: "daily" },
  { key: "capacity_weekly", label: "Тиждень", cycle: "weekly" },
  { key: "capacity_monthly", label: "Місяць", cycle: "monthly" },
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
      (e) => (e.domain === "integration" || e.domain === "utility_meter") && e.title === title
    );
  }

  async _entityForEntry(entryId) {
    const regs = await this.hass.callWS({ type: "config/entity_registry/list" });
    const match = regs.find((r) => r.config_entry_id === entryId);
    return match ? match.entity_id : undefined;
  }

  /**
   * Creates (or reuses, if already created earlier) the lifetime
   * Riemann-sum integral sensor for a source entity, in Ah or Wh.
   */
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

  /**
   * Creates (or reuses) a Utility Meter helper on top of an existing
   * integral sensor, for a given reset cycle (daily/weekly/monthly).
   */
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
   * Full run: 1 lifetime integral (capacity_total) + 3 utility meters
   * (capacity_daily/weekly/monthly) wired to it. Returns the resulting
   * entity map plus a human-readable log of what happened, so the caller
   * can show progress and merge it into the card config.
   */
  async run(sourceEntity, batteryName, onProgress) {
    const log = [];
    const report = (msg) => {
      log.push(msg);
      if (onProgress) onProgress(msg);
    };

    const totalTitle = `${batteryName} — накопичена ємність`;
    report(`Створюю "${totalTitle}"…`);
    const total = await this.ensureIntegral(sourceEntity, totalTitle);
    report(total.created ? `✓ Створено ${total.entityId}` : `✓ Вже існує: ${total.entityId}`);

    const entities = { capacity_total: total.entityId };
    for (const { key, label, cycle } of WIZARD_CYCLES) {
      const title = `${batteryName} — використано (${label.toLowerCase()})`;
      report(`Створюю "${title}"…`);
      const meter = await this.ensureUtilityMeter(total.entityId, title, cycle);
      report(meter.created ? `✓ Створено ${meter.entityId}` : `✓ Вже існує: ${meter.entityId}`);
      entities[key] = meter.entityId;
    }

    return { entities, log };
  }
}

/* ------------------------------------------------------------------ */

class HaBmsBleCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._wizardStatus = null;
    this._wizardBusy = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _entities() {
    return (this._config && this._config.entities) || {};
  }

  _wizardEligible() {
    const e = this._entities();
    return !!(e.power || e.current);
  }

  _wizardAlreadyConfigured() {
    const e = this._entities();
    return !!(e.capacity_daily && e.capacity_weekly && e.capacity_monthly && e.capacity_total);
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
    const e = this._entities();
    const source = e.power || e.current;
    if (!source) return;
    const batteryName = (this._config.name && this._config.name.trim()) || "BMS Battery";

    this._wizardBusy = true;
    this._wizardStatus = { ok: true, text: "Запускаю…", lines: [] };
    this._render();

    try {
      const { entities, log } = await new SetupWizard(this._hass).run(source, batteryName, (msg) => {
        this._wizardStatus = { ok: true, text: "Створення…", lines: [...log, msg] };
        this._render();
      });
      this._update("entities", { ...e, ...entities });
      this._wizardStatus = {
        ok: true,
        text: "Готово! Сенсори додано в конфіг картки.",
        lines: log,
      };
    } catch (err) {
      this._wizardStatus = {
        ok: false,
        text: `Не вдалося створити сенсори автоматично (${err.message}). Скористайтесь мануальною інструкцією в README — розділ "Helper-сенсори вручну".`,
      };
    }
    this._wizardBusy = false;
    this._render();
  }

  _renderWizard() {
    if (this._wizardAlreadyConfigured()) {
      return `<p style="font-size:12px; opacity:0.7; margin:0;">✓ Сенсори споживання вже налаштовані в <code>entities.capacity_*</code>.</p>`;
    }
    if (!this._wizardEligible()) {
      return `<p style="font-size:12px; opacity:0.7; margin:0;">Вкажіть <code>entities.power</code> (або <code>current</code>) у YAML-режимі, щоб можна було створити сенсори споживання.</p>`;
    }
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
          ${this._wizardBusy ? "Створюю…" : "Створити сенсори споживання і часу роботи"}
        </button>
        <p style="font-size:11px; opacity:0.6; margin:6px 0 0;">
          Створить 4 helper-сенсори (накопичена ємність + сьогодні/тиждень/місяць) через
          вбудований механізм Helpers у HA. Потрібні admin-права.
        </p>
        ${statusHtml}
      </div>
    `;
  }

  _render() {
    if (!this._config) return;
    const c = this._config;
    this.innerHTML = `
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
        <p style="font-size:12px; opacity:0.7; margin:0;">
          Основні entities вкажіть у YAML-режимі редактора картки (кнопка "Показати код")
          — див. README для повного списку ключів <code>entities:</code>.
        </p>
        <div style="border-top:1px solid var(--divider-color,#333); padding-top:12px;">
          <div style="font-size:13px; font-weight:500; margin-bottom:8px;">Сенсори споживання / часу роботи</div>
          ${this._renderWizard()}
        </div>
      </div>
    `;
    this.querySelector("#name").addEventListener("change", (e) => this._update("name", e.target.value));
    this.querySelector("#display_mode").addEventListener("change", (e) => this._update("display_mode", e.target.value));
    const wizardBtn = this.querySelector("#wizard-btn");
    if (wizardBtn) wizardBtn.addEventListener("click", () => this._runWizard());
  }

  _update(key, value) {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } }));
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
    return this._config && this._config.display_mode === "inline" ? 6 : 2;
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

  _e(key) {
    return this._config && this._config.entities ? this._config.entities[key] : undefined;
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

    const anchorEntity = this._e("soc") || this._e("voltage") || this._e("current") || this._e("power");
    if (anchorEntity && this._hass) {
      const entReg = this._hass.entities && this._hass.entities[anchorEntity];
      const deviceId = entReg && entReg.device_id;
      const device = deviceId && this._hass.devices && this._hass.devices[deviceId];
      if (device) {
        const deviceName = device.name_by_user || device.name;
        if (deviceName) return deviceName;
      }
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
   */
  _renderBatteryShape(percent, variant) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    const color = batteryFillColor(p);
    const clipId = `bms-fill-clip-${this._uid}`;
    const isMini = variant === "mini";
    const w = isMini ? 52 : 84;
    const h = isMini ? 82 : 132;
    const bodyX = 5, bodyY = 11, bodyW = w - 10, bodyH = h - 16, radius = 8;
    const termW = w * 0.36, termH = 6;
    const termX = (w - termW) / 2;
    const fillH = (bodyH - 6) * (p / 100);
    const fillY = bodyY + 3 + (bodyH - 6 - fillH);

    return `
      <div class="bms-battery-shape bms-battery-shape-${variant}">
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
          <defs>
            <clipPath id="${clipId}">
              <rect x="${bodyX + 3}" y="${bodyY + 3}" width="${bodyW - 6}" height="${bodyH - 6}" rx="${radius - 3}"/>
            </clipPath>
          </defs>
          <rect x="${termX}" y="${bodyY - termH}" width="${termW}" height="${termH + 2}" rx="2"
            fill="none" stroke="var(--secondary-text-color,#888)" stroke-width="2"/>
          <rect x="${bodyX}" y="${bodyY}" width="${bodyW}" height="${bodyH}" rx="${radius}"
            fill="none" stroke="var(--secondary-text-color,#888)" stroke-width="2"/>
          <rect x="${bodyX + 3}" y="${fillY}" width="${bodyW - 6}" height="${fillH}"
            fill="${color}" clip-path="url(#${clipId})">
            <animate attributeName="y" from="${bodyY + bodyH - 3}" to="${fillY}" dur="0.6s" fill="freeze"/>
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
    if (!cells.length) return "<p style='opacity:0.6; font-size:12px;'>Немає даних про комірки. Додайте entities.cell_voltages або delta_cell_voltage.</p>";
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

  _hasCapacityEntities() {
    return !!(this._e("capacity_daily") || this._e("capacity_weekly") || this._e("capacity_monthly") || this._e("capacity_total"));
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
        .bms-top-row { display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; }
        .bms-battery-col { display:flex; flex-direction:column; align-items:center; gap:6px; flex-shrink:0; }
        .bms-battery-shape { position:relative; display:flex; align-items:center; justify-content:center; }
        .bms-battery-label { position:absolute; top:34%; display:flex; flex-direction:column; align-items:center; }
        .bms-battery-pct { font-size:13px; font-weight:500; }
        .bms-battery-shape-full .bms-battery-pct { font-size:17px; }
        .bms-battery-sub { font-size:8px; opacity:0.6; }
        .bms-metric-grid { flex:1; display:grid; grid-template-columns:1fr 1fr; gap:6px; min-width:0; }
        .bms-metric-grid-mini { grid-template-columns:1fr 1fr; }
        .bms-metric { background: var(--secondary-background-color, rgba(127,127,127,0.08)); border-radius:7px; padding:6px 8px; min-width:0; }
        .bms-metric-label { font-size:10px; opacity:0.6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bms-metric-value { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bms-runtime { display:flex; align-items:center; gap:8px; background: var(--secondary-background-color, rgba(127,127,127,0.08));
          border-radius:7px; padding:7px 10px; margin-bottom:10px; }
        .bms-body { display:block; }
        .bms-section { border-top:0.5px solid var(--divider-color,#333); padding-top:8px; margin-top:8px; }
        .bms-section-title { display:flex; justify-content:space-between; font-size:11px; opacity:0.75; margin-bottom:6px; }
        .bms-muted { opacity:0.6; }
        .bms-cell-list { display:flex; flex-direction:column; gap:4px; }
        .bms-cell-row { display:flex; align-items:center; gap:6px; }
        .bms-cell-idx { font-size:10px; opacity:0.6; width:12px; }
        .bms-cell-track { flex:1; height:6px; background:var(--secondary-background-color, rgba(127,127,127,0.15)); border-radius:3px; overflow:hidden; }
        .bms-cell-fill { height:100%; border-radius:3px; }
        .bms-cell-val { font-size:10px; width:46px; text-align:right; }
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
              "capacity capacity";
          }
          .bms-section-cells { grid-area: cells; border-top:none; margin-top:0; padding-top:0; }
          .bms-section-diag { grid-area: diag; border-top:none; margin-top:0; padding-top:0;
            border-left:0.5px solid var(--divider-color,#333); padding-left:12px; }
          .bms-section-capacity { grid-area: capacity; }
        }
        @container bms (min-width: 760px) {
          .bms-top-row { gap:20px; }
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
