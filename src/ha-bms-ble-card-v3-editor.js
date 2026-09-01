/* BMS BLE Battery Card v3 editor. Kept separate in source; beta release bundles it into the HACS entry point. */
class HaBmsBleCardV3Editor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  setConfig(config) {
    this._config = config || {};
    this.render();
  }

  _devices() {
    const h = this._hass;
    if (!h?.entities) return [];
    const byDevice = new Map();
    for (const [entityId, reg] of Object.entries(h.entities)) {
      if (String(reg.platform || "").toLowerCase() !== "bms_ble" || !reg.device_id) continue;
      if (!byDevice.has(reg.device_id)) byDevice.set(reg.device_id, { deviceId: reg.device_id, count: 0, entityIds: [] });
      const d = byDevice.get(reg.device_id);
      d.count++;
      d.entityIds.push(entityId);
    }
    return [...byDevice.values()].map(d => ({
      ...d,
      name: h.devices?.[d.deviceId]?.name_by_user || h.devices?.[d.deviceId]?.name || d.deviceId,
    }));
  }

  _emit(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (!this.shadowRoot) return;
    const devices = this._devices();
    const selected = this._config?.device_id || this._config?.entities?.device_id || "";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;padding:16px;box-sizing:border-box}
      .title{font-size:18px;font-weight:600;margin-bottom:14px}
      .hint{font-size:13px;opacity:.7;margin:8px 0 14px;line-height:1.4}
      label{display:block;font-size:13px;margin-bottom:6px}
      select{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}
      .count{font-size:12px;opacity:.65;margin-top:8px}
    </style>
    <div class="title">🔋 BMS BLE Battery Card v3</div>
    <div class="hint">Виберіть акумулятор, знайдений інтеграцією BMS_BLE-HA. Сутності визначаються автоматично — вручну їх прописувати не потрібно.</div>
    <label for="device">Акумулятор</label>
    <select id="device">
      <option value="">${devices.length ? "Виберіть акумулятор…" : "BMS_BLE-HA акумуляторів не знайдено"}</option>
      ${devices.map(d => `<option value="${String(d.deviceId).replace(/&/g,"&amp;").replace(/"/g,"&quot;")}" ${d.deviceId===selected?"selected":""}>${String(d.name).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")} · ${d.count} entities</option>`).join("")}
    </select>
    <div class="count">${devices.length} BMS-пристроїв знайдено</div>`;

    this.shadowRoot.querySelector("#device")?.addEventListener("change", ev => {
      const deviceId = ev.target.value;
      this._emit({ ...this._config, device_id: deviceId, entities: { ...(this._config.entities || {}), device_id: deviceId } });
    });
  }
}
if (!customElements.get("ha-bms-ble-card-v3-editor")) customElements.define("ha-bms-ble-card-v3-editor", HaBmsBleCardV3Editor);
