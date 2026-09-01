/*
 * BMS BLE Battery Card v3
 * HACS entry point.
 *
 * The beta branch intentionally exposes the v3 build through this stable
 * root filename so HACS can install the card without manual copying.
 */
const VERSION = "3.0.0-beta.3";
const DOMAIN = "bms_ble";
const INVALID = new Set(["unknown", "unavailable", "none", "null", ""]);

const FIELDS = {
  soc: { domain: "sensor", aliases: ["battery", "battery_level", "soc"] },
  charging: { domain: "binary_sensor", aliases: ["charging", "battery_charging"] },
  power: { domain: "sensor", aliases: ["power"] },
  stored_energy: { domain: "sensor", aliases: ["stored_energy"] },
  voltage: { domain: "sensor", aliases: ["voltage"] },
  temperature: { domain: "sensor", aliases: ["temperature", "battery_temperature"] },
  current: { domain: "sensor", aliases: ["current"] },
  battery_health: { domain: "sensor", aliases: ["battery_health", "soh", "health"] },
  cycles: { domain: "sensor", aliases: ["cycles", "charge_cycles"] },
  runtime: { domain: "sensor", aliases: ["runtime"] },
  problem: { domain: "binary_sensor", aliases: ["problem"] },
  signal_strength: { domain: "sensor", aliases: ["signal_strength", "rssi"] },
  balancer: { domain: "binary_sensor", aliases: ["balancer", "balance"] },
  delta_cell_voltage: { domain: "sensor", aliases: ["delta_cell_voltage", "delta_voltage"] },
  design_capacity: { domain: "sensor", aliases: ["design_capacity"] },
  heater: { domain: "binary_sensor", aliases: ["heater", "heating"] },
  highest_cell_voltage: { domain: "sensor", aliases: ["highest_cell_voltage", "max_cell_voltage", "max_cell"] },
  link_quality: { domain: "sensor", aliases: ["link_quality", "linkquality"] },
  lowest_cell_voltage: { domain: "sensor", aliases: ["lowest_cell_voltage", "min_cell_voltage", "min_cell"] },
  chrg_mosfet: { domain: "binary_sensor", aliases: ["chrg_mosfet", "charge_mosfet", "charging_mosfet"] },
  dischrg_mosfet: { domain: "binary_sensor", aliases: ["dischrg_mosfet", "discharge_mosfet", "discharging_mosfet"] },
};

const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const objectId = id => String(id || "").split(".").slice(1).join(".").toLowerCase();
const number = v => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
const stateOf = (hass, id) => id && hass?.states?.[id]?.state;
const attrOf = (hass, id, key) => id && hass?.states?.[id]?.attributes?.[key];
const fmt = (v, digits = 2, unit = "") => { const n = number(v); return n === undefined ? "—" : `${n.toFixed(digits)}${unit}`; };
const esc = v => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function entityInfo(hass, id) {
  const reg = hass?.entities?.[id] || {};
  const state = hass?.states?.[id];
  return { entityId:id, domain:String(id).split(".")[0], objectId:objectId(id), normalized:norm(objectId(id)), uniqueId:norm(reg.unique_id), platform:String(reg.platform||"").toLowerCase(), deviceId:reg.device_id, deviceClass:norm(state?.attributes?.device_class||reg.device_class), name:norm(state?.attributes?.friendly_name) };
}
function bmsEntities(hass) { return Object.keys(hass?.entities||{}).map(id=>entityInfo(hass,id)).filter(e=>e.platform===DOMAIN&&e.deviceId); }
function discoverDevices(hass) { const map=new Map(); for(const e of bmsEntities(hass)){if(!map.has(e.deviceId))map.set(e.deviceId,[]);map.get(e.deviceId).push(e);} return [...map.entries()].map(([deviceId,entities])=>({deviceId,entities,name:hass?.devices?.[deviceId]?.name_by_user||hass?.devices?.[deviceId]?.name||entities[0]?.name||deviceId})); }
function score(e,field){const rule=FIELDS[field];if(!rule||e.domain!==rule.domain)return -Infinity;let best=-Infinity;for(const a0 of rule.aliases){const a=norm(a0);if(e.normalized===a)best=Math.max(best,100);else if(e.normalized.endsWith(`_${a}`))best=Math.max(best,95);else if(e.normalized.includes(a))best=Math.max(best,75);if(e.uniqueId.endsWith(`_${a}`))best=Math.max(best,90);if(e.name.includes(a))best=Math.max(best,55);}const dcMap={voltage:"voltage",current:"current",power:"power",temperature:"temperature",signal_strength:"signal_strength"};if(dcMap[field]===e.deviceClass)best=Math.max(best,65);if(field==="soc"&&e.deviceClass==="battery")best=Math.max(best,65);return best;}
function discoverEntities(hass,deviceId){const list=bmsEntities(hass).filter(e=>e.deviceId===deviceId),result={},used=new Set();for(const field of Object.keys(FIELDS)){const winner=list.map(e=>({e,s:score(e,field)})).filter(x=>x.s>=55&&!used.has(x.e.entityId)).sort((a,b)=>b.s-a.s)[0];if(winner){result[field]=winner.e.entityId;used.add(winner.e.entityId);}}return result;}
function readAttribute(hass,entities,names){for(const id of Object.values(entities)){const a=hass?.states?.[id]?.attributes||{};for(const name of names)if(a[name]!==undefined)return a[name];}return undefined;}
function cellsOf(hass,entities){const a=readAttribute(hass,entities,["cell_voltages"]);return Array.isArray(a)?a.map(Number).filter(Number.isFinite):[];}
function secondsHuman(v){const n=number(v);if(n===undefined||n<0)return "—";const h=Math.floor(n/3600),m=Math.round((n%3600)/60);return h?`${h} год ${m} хв`:`${m} хв`;}
async function getHistory(hass,id,days=30){if(!hass?.callWS||!id)return[];const end=new Date(),start=new Date(end.getTime()-days*86400000);try{const d=await hass.callWS({type:"history/history_during_period",start_time:start.toISOString(),end_time:end.toISOString(),entity_ids:[id],minimal_response:true,no_attributes:true,significant_changes_only:false});return(d?.[id]||[]).map(x=>({t:Date.parse(x.last_changed||x.last_updated),v:number(x.state)})).filter(x=>Number.isFinite(x.t)&&x.v!==undefined);}catch(_){return[];}}
function integrate(rows){let wh=0;for(let i=1;i<rows.length;i++){const dt=Math.min(Math.max(0,rows[i].t-rows[i-1].t),15*60000)/3600000,p=(rows[i-1].v+rows[i].v)/2;if(p<0)wh+=-p*dt;}return wh;}

class BmsBleV3Card extends HTMLElement {
 constructor(){super();this.attachShadow({mode:"open"});this._config={};this._hass=null;this._deviceId=null;this._entities={};this._history={};this._busy=false;}
 static getConfigElement(){return document.createElement("ha-bms-ble-card-v3-editor");}
 static getStubConfig(){return {display_mode:"widget"};}
 setConfig(c){this._config={display_mode:"widget",...(c||{})};this._deviceId=c?.entities?.device_id||c?.device_id||null;this._discover();this.render();}
 set hass(h){this._hass=h;this._discover();this.render();}
 getCardSize(){return 8;}
 _discover(){if(!this._hass)return;const ds=discoverDevices(this._hass);if(!this._deviceId&&ds.length===1)this._deviceId=ds[0].deviceId;if(this._deviceId)this._entities={...discoverEntities(this._hass,this._deviceId),...(this._config.entities||{})};}
 _data(){const h=this._hass,e=this._entities,s=number(stateOf(h,e.soc)),v=number(stateOf(h,e.voltage)),c=number(stateOf(h,e.current)),p=number(stateOf(h,e.power)),cells=cellsOf(h,e);return{soc:s,voltage:v,current:c,power:p,stored:number(stateOf(h,e.stored_energy)),temp:number(stateOf(h,e.temperature)),health:number(stateOf(h,e.battery_health)),cycles:number(stateOf(h,e.cycles)),runtime:number(stateOf(h,e.runtime)),signal:number(stateOf(h,e.signal_strength)),link:number(stateOf(h,e.link_quality)),delta:number(stateOf(h,e.delta_cell_voltage))??(cells.length?Math.max(...cells)-Math.min(...cells):undefined),min:number(stateOf(h,e.lowest_cell_voltage)),max:number(stateOf(h,e.highest_cell_voltage)),charging:stateOf(h,e.charging),problem:stateOf(h,e.problem),balancer:stateOf(h,e.balancer),heater:stateOf(h,e.heater),chrg:stateOf(h,e.chrg_mosfet),dis:stateOf(h,e.dischrg_mosfet),design:number(stateOf(h,e.design_capacity)),cells};}
 async _loadHistory(){if(this._busy||!this._entities.power)return;this._busy=true;try{const r=await getHistory(this._hass,this._entities.power),n=Date.now();this._history.today=integrate(r.filter(x=>x.t>=n-86400000));this._history.week=integrate(r.filter(x=>x.t>=n-7*86400000));this._history.month=integrate(r.filter(x=>x.t>=n-30*86400000));this._history.total=integrate(r);this._history.ready=true;}finally{this._busy=false;this.render();}}
 render(){if(!this.shadowRoot)return;const h=this._hass;if(!h){this.shadowRoot.innerHTML=`<ha-card><div style="padding:16px">Очікую Home Assistant…</div></ha-card>`;return;}const ds=discoverDevices(h);if(!this._deviceId||!this._entities.voltage&&!this._entities.soc){this.shadowRoot.innerHTML=`<ha-card><div style="padding:16px"><b>🔋 BMS BLE v3</b><p>${ds.length?"Оберіть акумулятор:":"Не знайдено BMS_BLE-HA."}</p>${ds.map(d=>`<button data-d="${esc(d.deviceId)}" style="display:block;width:100%;margin:6px 0;padding:10px">${esc(d.name)} (${d.entities.length} entities)</button>`).join("")}</div></ha-card>`;this.shadowRoot.querySelectorAll("button[data-d]").forEach(b=>b.onclick=()=>{this._deviceId=b.dataset.d;this._discover();this.render();});return;}const d=this._data(),name=h.devices?.[this._deviceId]?.name_by_user||h.devices?.[this._deviceId]?.name||"BMS Battery",hist=this._history;this.shadowRoot.innerHTML=`<ha-card><div style="padding:16px"><div style="display:flex;justify-content:space-between"><div><b style="font-size:20px">🔋 ${esc(name)}</b><div style="font-size:12px;opacity:.7">BMS BLE · ${VERSION}</div></div><b>${d.problem==="on"?"⚠️ ПРОБЛЕМА":d.charging==="on"?"⚡ ЗАРЯД":"🔋 РОЗРЯД"}</b></div><hr><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"><div><small>SOC</small><h2>${fmt(d.soc,0," %")}</h2></div><div><small>Напруга</small><h2>${fmt(d.voltage,2," V")}</h2></div><div><small>Струм</small><h2>${fmt(d.current,2," A")}</h2></div><div><small>Потужність</small><h2>${fmt(d.power,0," W")}</h2></div><div><small>Температура</small><h2>${fmt(d.temp,1," °C")}</h2></div><div><small>SOH</small><h2>${fmt(d.health,0," %")}</h2></div><div><small>Цикли</small><h2>${fmt(d.cycles,0)}</h2></div><div><small>Stored</small><h2>${fmt(d.stored,0," Wh")}</h2></div></div><h3>Комірки (${d.cells.length})</h3><div style="display:flex;flex-wrap:wrap;gap:6px">${d.cells.length?d.cells.map((x,i)=>`<span style="padding:7px;border:1px solid var(--divider-color);border-radius:8px">C${i+1}: ${fmt(x,3," V")}</span>`).join(""):"—"}</div><h3>BMS</h3><div>Δ ${fmt(d.delta,3," V")} · Min ${fmt(d.min,3," V")} · Max ${fmt(d.max,3," V")} · Balancer ${esc(d.balancer||"—")} · Heater ${esc(d.heater||"—")} · CHG MOS ${esc(d.chrg||"—")} · DSG MOS ${esc(d.dis||"—")}</div><h3>Зв'язок / час</h3><div>Runtime: ${secondsHuman(d.runtime)} · RSSI: ${fmt(d.signal,0," dBm")} · Link: ${fmt(d.link,0," %")}</div><h3>Віддана енергія</h3><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"><span>Сьогодні: <b>${fmt((hist.today||0)/1000,2," kWh")}</b></span><span>7 днів: <b>${fmt((hist.week||0)/1000,2," kWh")}</b></span><span>30 днів: <b>${fmt((hist.month||0)/1000,2," kWh")}</b></span><span>Всього: <b>${fmt((hist.total||0)/1000,2," kWh")}</b></span></div></div></ha-card>`;if(!hist.ready)this._loadHistory();}
}
if(!customElements.get("ha-bms-ble-card-v3"))customElements.define("ha-bms-ble-card-v3",BmsBleV3Card);
console.info(`HA-BMS-BLE-CARD v${VERSION}`);
