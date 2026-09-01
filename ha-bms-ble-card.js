/*
 * BMS BLE Battery Card v3
 * Automatic discovery layer for BMS_BLE-HA.
 * Protocol/BLE communication remains in BMS_BLE-HA / aiobmsble.
 */
const VERSION = "3.0.0-beta.1";
const DOMAIN = "bms_ble";
const INVALID = new Set(["unknown", "unavailable", "none", "null", ""]);

const FIELDS = {
  soc: { domain: "sensor", aliases: ["battery", "battery_level", "soc"] },
  voltage: { domain: "sensor", aliases: ["voltage"] },
  current: { domain: "sensor", aliases: ["current"] },
  power: { domain: "sensor", aliases: ["power"] },
  temperature: { domain: "sensor", aliases: ["temperature", "battery_temperature"] },
  battery_health: { domain: "sensor", aliases: ["battery_health", "soh", "health"] },
  cycles: { domain: "sensor", aliases: ["cycles", "charge_cycles"] },
  runtime: { domain: "sensor", aliases: ["runtime"] },
  stored_energy: { domain: "sensor", aliases: ["stored_energy"] },
  design_capacity: { domain: "sensor", aliases: ["design_capacity"] },
  signal_strength: { domain: "sensor", aliases: ["signal_strength", "rssi"] },
  link_quality: { domain: "sensor", aliases: ["link_quality", "linkquality"] },
  delta_cell_voltage: { domain: "sensor", aliases: ["delta_cell_voltage", "delta_voltage"] },
  highest_cell_voltage: { domain: "sensor", aliases: ["highest_cell_voltage", "max_cell_voltage", "max_cell"] },
  lowest_cell_voltage: { domain: "sensor", aliases: ["lowest_cell_voltage", "min_cell_voltage", "min_cell"] },
  charging: { domain: "binary_sensor", aliases: ["charging", "battery_charging"] },
  problem: { domain: "binary_sensor", aliases: ["problem"] },
  balancer: { domain: "binary_sensor", aliases: ["balancer", "balance"] },
  heater: { domain: "binary_sensor", aliases: ["heater", "heating"] },
  chrg_mosfet: { domain: "binary_sensor", aliases: ["chrg_mosfet", "charge_mosfet", "charging_mosfet"] },
  dischrg_mosfet: { domain: "binary_sensor", aliases: ["dischrg_mosfet", "discharge_mosfet", "discharging_mosfet"] },
};

const ATTRIBUTES = [
  "cell_voltages", "cell_count", "balance_current", "cycle_charge",
  "cycle_capacity", "total_charge", "problem_code", "battery_mode",
  "pack_count", "temperature_sensors", "temperatures", "packs",
  "package_current", "package_voltage", "package_soc", "package_charge_cycles",
  "cell_number", "minimal_cell_voltage", "maximal_cell_voltage",
];

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const objectId = id => String(id || "").split(".").slice(1).join(".").toLowerCase();
const number = v => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
const hasValue = v => v !== undefined && v !== null && !INVALID.has(String(v).toLowerCase());
const stateOf = (hass, id) => id && hass?.states?.[id]?.state;
const attrOf = (hass, id, key) => id && hass?.states?.[id]?.attributes?.[key];
const fmt = (v, digits = 2, unit = "") => { const n = number(v); return n === undefined ? "—" : `${n.toFixed(digits)}${unit}`; };
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function entityInfo(hass, id) {
  const reg = hass?.entities?.[id] || {};
  const state = hass?.states?.[id];
  return {
    entityId: id,
    domain: String(id).split(".")[0],
    objectId: objectId(id),
    normalized: norm(objectId(id)),
    uniqueId: norm(reg.unique_id),
    platform: String(reg.platform || "").toLowerCase(),
    deviceId: reg.device_id,
    deviceClass: norm(state?.attributes?.device_class || reg.device_class),
    name: norm(state?.attributes?.friendly_name),
  };
}

function bmsEntities(hass) {
  return Object.keys(hass?.entities || {})
    .map(id => entityInfo(hass, id))
    .filter(e => e.platform === DOMAIN && e.deviceId);
}

function discoverDevices(hass) {
  const map = new Map();
  for (const e of bmsEntities(hass)) {
    if (!map.has(e.deviceId)) map.set(e.deviceId, []);
    map.get(e.deviceId).push(e);
  }
  return [...map.entries()].map(([deviceId, entities]) => ({
    deviceId,
    entities,
    name: hass?.devices?.[deviceId]?.name_by_user || hass?.devices?.[deviceId]?.name || entities[0]?.name || deviceId,
  }));
}

function score(e, field) {
  const rule = FIELDS[field];
  if (!rule || e.domain !== rule.domain) return -Infinity;
  let best = -Infinity;
  for (const alias0 of rule.aliases) {
    const alias = norm(alias0);
    if (e.normalized === alias) best = Math.max(best, 100);
    else if (e.normalized.endsWith(`_${alias}`)) best = Math.max(best, 95);
    else if (e.normalized.includes(alias)) best = Math.max(best, 75);
    if (e.uniqueId.endsWith(`_${alias}`)) best = Math.max(best, 90);
    if (e.name.includes(alias)) best = Math.max(best, 55);
  }
  const dc = e.deviceClass;
  const dcMap = { voltage: "voltage", current: "current", power: "power", temperature: "temperature", soc: "battery", signal_strength: "signal_strength" };
  if (dcMap[field] === dc) best = Math.max(best, 65);
  if (field === "soc" && dc === "battery") best = Math.max(best, 65);
  return best;
}

function discoverEntities(hass, deviceId) {
  const list = bmsEntities(hass).filter(e => e.deviceId === deviceId);
  const result = {};
  const used = new Set();
  for (const field of Object.keys(FIELDS)) {
    const winner = list.map(e => ({ e, s: score(e, field) }))
      .filter(x => x.s >= 55 && !used.has(x.e.entityId))
      .sort((a, b) => b.s - a.s)[0];
    if (winner) { result[field] = winner.e.entityId; used.add(winner.e.entityId); }
  }
  return result;
}

function readAttribute(hass, entities, names) {
  for (const id of Object.values(entities)) {
    const attrs = hass?.states?.[id]?.attributes || {};
    for (const name of names) if (attrs[name] !== undefined) return attrs[name];
  }
  return undefined;
}

function cellsOf(hass, entities) {
  const explicit = entities.cell_voltages;
  if (Array.isArray(explicit)) return explicit.map(id => number(stateOf(hass, id))).filter(v => v !== undefined);
  const arr = readAttribute(hass, entities, ["cell_voltages"]);
  return Array.isArray(arr) ? arr.map(Number).filter(Number.isFinite) : [];
}

function batteryName(hass, deviceId, entities, configured) {
  if (configured?.trim()) return configured.trim();
  return hass?.devices?.[deviceId]?.name_by_user || hass?.devices?.[deviceId]?.name ||
    hass?.states?.[entities.soc || entities.voltage || entities.current]?.attributes?.friendly_name || "BMS Battery";
}

function secondsHuman(value) {
  const n = number(value); if (n === undefined || n < 0) return "—";
  const h = Math.floor(n / 3600), m = Math.round((n % 3600) / 60);
  return h ? `${h} год ${m} хв` : `${m} хв`;
}

function etaSeconds(soc, current, capacityAh, charging) {
  const s = number(soc), c = number(current), cap = number(capacityAh);
  if (s === undefined || c === undefined || cap === undefined || Math.abs(c) < 0.05 || cap <= 0) return undefined;
  if (charging && c > 0) return cap * Math.max(0, 100 - s) / 100 / c * 3600;
  if (!charging && c < 0) return cap * Math.max(0, s) / 100 / Math.abs(c) * 3600;
  return undefined;
}

async function getPowerHistory(hass, entityId, days = 30) {
  if (!hass?.callWS || !entityId) return [];
  const end = new Date(), start = new Date(end.getTime() - days * 86400000);
  try {
    const data = await hass.callWS({ type: "history/history_during_period", start_time: start.toISOString(), end_time: end.toISOString(), entity_ids: [entityId], minimal_response: true, no_attributes: true, significant_changes_only: false });
    return (data?.[entityId] || []).map(x => ({ t: Date.parse(x.last_changed || x.last_updated), v: number(x.state) })).filter(x => Number.isFinite(x.t) && x.v !== undefined);
  } catch (_) { return []; }
}

function integrateDischarge(rows) {
  let wh = 0;
  for (let i = 1; i < rows.length; i++) {
    const dt = Math.min(Math.max(0, rows[i].t - rows[i - 1].t), 15 * 60000) / 3600000;
    const p = (rows[i - 1].v + rows[i].v) / 2;
    if (p < 0) wh += -p * dt;
  }
  return wh;
}

class BmsBleV3Card extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._config = {}; this._hass = null; this._deviceId = null; this._entities = {}; this._history = {}; this._historyBusy = false; }
  static getConfigElement() { return document.createElement("ha-bms-ble-card-v3-editor"); }
  static getStubConfig() { return { display_mode: "widget" }; }
  setConfig(config) { this._config = { display_mode: "widget", ...config }; this._deviceId = config?.entities?.device_id || config?.device_id || null; this._discover(); this.render(); }
  set hass(hass) { this._hass = hass; this._discover(); this.render(); }
  getCardSize() { return this._config.display_mode === "inline" ? 8 : 3; }
  _discover() {
    if (!this._hass) return;
    const devices = discoverDevices(this._hass);
    if (!this._deviceId && devices.length === 1) this._deviceId = devices[0].deviceId;
    if (this._deviceId) this._entities = { ...discoverEntities(this._hass, this._deviceId), ...(this._config.entities || {}) };
  }
  _data() {
    const h = this._hass, e = this._entities;
    const soc = number(stateOf(h, e.soc)), voltage = number(stateOf(h, e.voltage)), current = number(stateOf(h, e.current)), power = number(stateOf(h, e.power));
    const storedEnergy = number(stateOf(h, e.stored_energy));
    const designCapacity = number(stateOf(h, e.design_capacity));
    const cells = cellsOf(h, e);
    const chargingState = String(stateOf(h, e.charging)).toLowerCase();
    const charging = chargingState === "on" || (current !== undefined && current > 0.3);
    const cellDelta = number(stateOf(h, e.delta_cell_voltage)) ?? (cells.length ? Math.max(...cells) - Math.min(...cells) : undefined);
    return {
      soc, voltage, current, power, storedEnergy, designCapacity, cells, charging,
      health: number(stateOf(h, e.battery_health)), cycles: number(stateOf(h, e.cycles)), runtime: number(stateOf(h, e.runtime)),
      temperature: number(stateOf(h, e.temperature)), signal: number(stateOf(h, e.signal_strength)), link: number(stateOf(h, e.link_quality)),
      delta: cellDelta, minCell: number(stateOf(h, e.lowest_cell_voltage)), maxCell: number(stateOf(h, e.highest_cell_voltage)),
      problem: stateOf(h, e.problem), balancer: stateOf(h, e.balancer), heater: stateOf(h, e.heater), chrgMos: stateOf(h, e.chrg_mosfet), disMos: stateOf(h, e.dischrg_mosfet),
      balanceCurrent: number(readAttribute(h, e, ["balance_current"])), packageCurrent: number(readAttribute(h, e, ["package_current"])), packageVoltage: number(readAttribute(h, e, ["package_voltage"])), packageSoc: number(readAttribute(h, e, ["package_soc"])),
      packageCycles: number(readAttribute(h, e, ["package_charge_cycles"])), cycleCharge: number(readAttribute(h, e, ["cycle_charge"])), cycleCapacity: number(readAttribute(h, e, ["cycle_capacity"])), totalCharge: number(readAttribute(h, e, ["total_charge"])),
      problemCode: readAttribute(h, e, ["problem_code"]), batteryMode: readAttribute(h, e, ["battery_mode"]), cellCount: number(readAttribute(h, e, ["cell_count"])) || cells.length,
      packCount: number(readAttribute(h, e, ["pack_count"])),
    };
  }
  async _loadHistory() {
    if (this._historyBusy || !this._entities.power) return;
    this._historyBusy = true;
    try {
      const rows = await getPowerHistory(this._hass, this._entities.power, 30), now = Date.now();
      this._history.today = integrateDischarge(rows.filter(x => x.t >= now - 86400000));
      this._history.week = integrateDischarge(rows.filter(x => x.t >= now - 7 * 86400000));
      this._history.month = integrateDischarge(rows.filter(x => x.t >= now - 30 * 86400000));
      this._history.total = integrateDischarge(rows);
      this._history.updated = now;
    } finally { this._historyBusy = false; this.render(); }
  }
  _styles() { return `<style>
:host{display:block;color:var(--primary-text-color)}.card{background:var(--ha-card-background,var(--card-background-color));border-radius:18px;padding:18px;overflow:hidden}.head{display:flex;justify-content:space-between;gap:12px}.title{font-size:20px;font-weight:700}.sub,.label{font-size:12px;color:var(--secondary-text-color)}.badge,.chip{background:var(--secondary-background-color);border-radius:10px;padding:6px 9px;font-size:11px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.metric,.stat{background:var(--secondary-background-color);border-radius:14px;padding:12px}.value{font-size:20px;font-weight:700;margin-top:4px}.soc{height:9px;background:var(--divider-color);border-radius:6px;margin-top:9px;overflow:hidden}.soc i{display:block;height:100%;background:var(--primary-color)}.cells{display:grid;grid-template-columns:repeat(auto-fit,minmax(82px,1fr));gap:8px}.cell{padding:9px;border:1px solid var(--divider-color);border-radius:10px}.cell b,.cell span{display:block}.cell span{font-size:11px;color:var(--secondary-text-color)}.section{margin-top:16px}.section h3{font-size:14px;margin:0 0 8px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.stat strong{display:block;margin-top:3px}.chips{display:flex;flex-wrap:wrap;gap:7px}.empty{text-align:center;padding:20px;color:var(--secondary-text-color)}.editor{display:grid;gap:10px;padding:12px}.editor select,.editor input{width:100%;box-sizing:border-box;padding:9px;border-radius:8px}.entity-list{display:grid;grid-template-columns:1fr 1fr;gap:6px}.entity-item{font-size:11px;padding:7px;border-radius:8px;background:var(--secondary-background-color);overflow:hidden}.entity-item code{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){.grid,.stats{grid-template-columns:repeat(2,1fr)}.entity-list{grid-template-columns:1fr}}
</style>`; }
  render() {
    if (!this.shadowRoot) return;
    const h = this._hass;
    if (!h) { this.shadowRoot.innerHTML = this._styles() + `<div class="card empty">Очікую Home Assistant…</div>`; return; }
    const devices = discoverDevices(h);
    if (!this._deviceId || !this._entities.voltage && !this._entities.soc) {
      const buttons = devices.map(d => `<button data-device="${esc(d.deviceId)}">${esc(d.name)} (${d.entities.length} entities)</button>`).join("");
      this.shadowRoot.innerHTML = this._styles() + `<div class="card"><div class="head"><div><div class="title">🔋 BMS BLE v3</div><div class="sub">Автоматичне визначення акумулятора</div></div><div class="badge">${devices.length} BMS</div></div><div class="empty">${devices.length ? "Оберіть акумулятор:" : "BMS_BLE-HA не знайдено."}<div style="display:grid;gap:8px;margin-top:12px">${buttons}</div></div></div>`;
      this.shadowRoot.querySelectorAll("button[data-device]").forEach(b => b.onclick = () => { this._deviceId = b.dataset.device; this._entities = discoverEntities(h, this._deviceId); this.render(); });
      return;
    }
    const d = this._data(), name = batteryName(h, this._deviceId, this._entities, this._config.name), eta = etaSeconds(d.soc, d.current, d.designCapacity, d.charging);
    const status = d.problem === "on" ? "Проблема" : d.charging ? "Заряджається" : d.current !== undefined && d.current < -0.3 ? "Розряджається" : "У простої";
    const used = this._history;
    this.shadowRoot.innerHTML = this._styles() + `<div class="card"><div class="head"><div><div class="title">🔋 ${esc(name)}</div><div class="sub">BMS BLE · ${VERSION}</div></div><div class="badge">${status}</div></div>
      <div class="grid"><div class="metric"><div class="label">SOC</div><div class="value">${fmt(d.soc,0," %")}</div><div class="soc"><i style="width:${Math.max(0,Math.min(100,d.soc||0))}%"></i></div></div><div class="metric"><div class="label">Напруга</div><div class="value">${fmt(d.voltage,2," V")}</div></div><div class="metric"><div class="label">Струм</div><div class="value">${fmt(d.current,2," A")}</div></div><div class="metric"><div class="label">Потужність</div><div class="value">${fmt(d.power,0," W")}</div></div></div>
      <div class="grid"><div class="metric"><div class="label">Температура</div><div class="value">${fmt(d.temperature,1," °C")}</div></div><div class="metric"><div class="label">Health</div><div class="value">${fmt(d.health,0," %")}</div></div><div class="metric"><div class="label">Цикли</div><div class="value">${fmt(d.cycles,0)}</div></div><div class="metric"><div class="label">Stored Energy</div><div class="value">${fmt(d.storedEnergy,0," Wh")}</div></div></div>
      <div class="section"><h3>Комірки · ${d.cells.length || "—"}</h3><div class="cells">${d.cells.length ? d.cells.map((v,i)=>`<div class="cell"><b>C${i+1}</b><span>${fmt(v,3," V")}</span></div>`).join("") : `<div class="empty">Атрибут cell_voltages недоступний</div>`}</div></div>
      <div class="section"><h3>Діагностика BMS</h3><div class="chips"><span class="chip">Δ ${fmt(d.delta,3," V")}</span><span class="chip">Min ${fmt(d.minCell,3," V")}</span><span class="chip">Max ${fmt(d.maxCell,3," V")}</span><span class="chip">Balancer ${d.balancer ?? "—"}</span><span class="chip">Balance ${fmt(d.balanceCurrent,2," A")}</span><span class="chip">Heater ${d.heater ?? "—"}</span><span class="chip">CHG MOS ${d.chrgMos ?? "—"}</span><span class="chip">DSG MOS ${d.disMos ?? "—"}</span><span class="chip">RSSI ${fmt(d.signal,0," dBm")}</span><span class="chip">Link ${fmt(d.link,0," %")}</span></div></div>
      <div class="section"><h3>Час і прогноз</h3><div class="stats"><div class="stat"><span class="label">Runtime BMS</span><strong>${secondsHuman(d.runtime)}</strong></div><div class="stat"><span class="label">ETA</span><strong>${secondsHuman(eta)}</strong></div><div class="stat"><span class="label">Design capacity</span><strong>${fmt(d.designCapacity,1," Ah")}</strong></div><div class="stat"><span class="label">Cell count</span><strong>${fmt(d.cellCount,0)}</strong></div></div></div>
      <div class="section"><h3>Віддана енергія · Recorder</h3><div class="stats"><div class="stat"><span class="label">24 год</span><strong>${fmt(used.today/1000,2," kWh")}</strong></div><div class="stat"><span class="label">7 днів</span><strong>${fmt(used.week/1000,2," kWh")}</strong></div><div class="stat"><span class="label">30 днів</span><strong>${fmt(used.month/1000,2," kWh")}</strong></div><div class="stat"><span class="label">Історія</span><strong>${used.updated ? "готова" : "завантаження…"}</strong></div></div></div>
      <div class="section"><h3>Додаткові attributes</h3><div class="chips"><span class="chip">Package current ${fmt(d.packageCurrent,1," A")}</span><span class="chip">Package voltage ${fmt(d.packageVoltage,2," V")}</span><span class="chip">Package SOC ${fmt(d.packageSoc,0," %")}</span><span class="chip">Package cycles ${fmt(d.packageCycles,0)}</span><span class="chip">Cycle charge ${fmt(d.cycleCharge,1," Ah")}</span><span class="chip">Cycle capacity ${fmt(d.cycleCapacity,0," Wh")}</span><span class="chip">Total charge ${fmt(d.totalCharge,1," Ah")}</span><span class="chip">Pack count ${fmt(d.packCount,0)}</span><span class="chip">Mode ${esc(d.batteryMode ?? "—")}</span><span class="chip">Problem code ${esc(d.problemCode ?? "—")}</span></div></div>
    </div>`;
    if (!this._history.updated) this._loadHistory();
  }
}

class BmsBleV3Editor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    const h = this._hass, c = this._config || {}, devices = discoverDevices(h), selected = c?.entities?.device_id || (devices.length === 1 ? devices[0].deviceId : "");
    if (!h) return;
    const entities = selected ? discoverEntities(h, selected) : {};
    this.innerHTML = `<div class="editor"><style>.editor{font-family:var(--paper-font-body1_-_font-family,Arial);padding:12px;display:grid;gap:12px}.editor select,.editor input{width:100%;box-sizing:border-box;padding:9px}.bms-found{font-size:12px;opacity:.75}.entity-list{display:grid;grid-template-columns:1fr 1fr;gap:5px}.entity-item{font-size:11px;padding:6px;background:var(--secondary-background-color);border-radius:7px;overflow:hidden}.entity-item code{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:600px){.entity-list{grid-template-columns:1fr}}</style>
      <label>Назва (необов'язково)<input id="name" value="${esc(c.name || "")}" placeholder="Назва з Device Registry"></label>
      <label>Акумулятор BMS_BLE-HA<select id="device"><option value="">— автоматично —</option>${devices.map(d=>`<option value="${esc(d.deviceId)}" ${d.deviceId===selected?"selected":""}>${esc(d.name)}</option>`).join("")}</select></label>
      <label>Режим<select id="mode"><option value="widget" ${c.display_mode!=="inline"?"selected":""}>Widget</option><option value="inline" ${c.display_mode==="inline"?"selected":""}>Inline</option></select></label>
      <div class="bms-found">${selected ? `✓ Автоматично знайдено <b>${Object.keys(entities).length}</b> BMS entities. Вони не записуються в YAML — карта знаходить їх заново за device_id.` : `Знайдено BMS: ${devices.length}.`}</div>
      <div class="entity-list">${Object.entries(entities).map(([k,v])=>`<div class="entity-item"><b>${esc(k)}</b><code>${esc(v)}</code></div>`).join("")}</div>`;
    this.querySelector("#name").onchange = e => this._update({ name: e.target.value });
    this.querySelector("#mode").onchange = e => this._update({ display_mode: e.target.value });
    this.querySelector("#device").onchange = e => { const entities = { ...(c.entities || {}) }; if (e.target.value) entities.device_id = e.target.value; else delete entities.device_id; this._update({ entities }); };
  }
  _update(patch) { this._config = { ...this._config, ...patch }; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config } })); this._render(); }
}

if (!customElements.get("ha-bms-ble-card-v3-editor")) customElements.define("ha-bms-ble-card-v3-editor", BmsBleV3Editor);
if (!customElements.get("ha-bms-ble-card")) customElements.define("ha-bms-ble-card", BmsBleV3Card);
if (!customElements.get("ha-bms-ble-card-v3")) customElements.define("ha-bms-ble-card-v3", BmsBleV3Card);
window.customCards = window.customCards || [];
window.customCards.push({ type: "ha-bms-ble-card", name: "BMS BLE Battery Card v3", description: "Automatic BMS_BLE-HA entity discovery", preview: true });
console.info(`HA-BMS-BLE-CARD v${VERSION}`);

if (typeof module !== "undefined" && module.exports) module.exports = { discoverDevices, discoverEntities, etaSeconds, integrateDischarge, FIELDS, DOMAIN };
