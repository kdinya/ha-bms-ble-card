/*
 * BMS BLE Battery Card v3
 * Development implementation for bms-v3-auto-discovery.
 *
 * The BLE protocol remains in BMS_BLE-HA / aiobmsble. This card is an
 * analytics/presentation layer and discovers the BMS entities by device_id
 * and semantic identifiers instead of requiring hard-coded entity IDs.
 */
const VERSION = "3.0.0-beta.1";
const DOMAIN = "bms_ble";
const UPDATE_MS = 30000;

const FIELD_ALIASES = {
  soc: ["battery_level", "battery", "soc"],
  voltage: ["voltage"],
  current: ["current"],
  power: ["power"],
  temperature: ["temperature"],
  health: ["battery_health", "soh", "health"],
  cycles: ["cycles", "charge_cycles"],
  runtime: ["runtime"],
  charging: ["charging", "battery_charging"],
  problem: ["problem"],
  rssi: ["signal_strength", "rssi"],
  link_quality: ["link_quality", "linkquality"],
  balancer: ["balancer", "balance"],
  delta_cell_voltage: ["delta_cell_voltage", "delta_voltage"],
  design_capacity: ["design_capacity"],
  heater: ["heater", "heating"],
  max_cell_voltage: ["highest_cell_voltage", "max_cell_voltage", "max_cell"],
  min_cell_voltage: ["lowest_cell_voltage", "min_cell_voltage", "min_cell"],
  charge_mosfet: ["chrg_mosfet", "charge_mosfet", "charging_mosfet"],
  discharge_mosfet: ["dischrg_mosfet", "discharge_mosfet", "discharging_mosfet"],
  cycle_capacity: ["cycle_capacity"],
};

const ATTRIBUTE_FIELDS = [
  "cell_voltages", "cell_count", "balance_current", "cycle_charge",
  "cycle_capacity", "total_charge", "problem_code", "battery_mode",
  "pack_count", "temperature_sensors", "packs", "chrg_mosfet",
  "dischrg_mosfet", "heater", "balancer"
];

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : undefined; };
const validState = v => v !== undefined && v !== null && !["unknown","unavailable","none"].includes(String(v).toLowerCase());
const fmt = (v, d=2, unit="") => { const n=num(v); return n === undefined ? "—" : `${n.toFixed(d)}${unit}`; };
const objectId = id => String(id || "").split(".").slice(1).join(".").toLowerCase();
const norm = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");

function entityInfo(hass, id) {
  const reg = hass?.entities?.[id] || {};
  const state = hass?.states?.[id];
  return {
    entityId:id,
    domain:String(id).split(".")[0],
    objectId:objectId(id),
    uniqueId:String(reg.unique_id || "").toLowerCase(),
    platform:String(reg.platform || "").toLowerCase(),
    deviceId:reg.device_id,
    deviceClass:state?.attributes?.device_class || reg.device_class || "",
    friendlyName:state?.attributes?.friendly_name || "",
    state:state?.state,
    attributes:state?.attributes || {}
  };
}

function allBmsEntities(hass) {
  if (!hass?.entities) return [];
  return Object.keys(hass.entities).map(id => entityInfo(hass,id)).filter(e => e.platform === DOMAIN && e.deviceId);
}

function discoverDevices(hass) {
  const by = new Map();
  for (const e of allBmsEntities(hass)) {
    if (!by.has(e.deviceId)) by.set(e.deviceId, []);
    by.get(e.deviceId).push(e);
  }
  return [...by.entries()].map(([deviceId, entities]) => {
    const named = entities.find(e => e.friendlyName && !/^(voltage|current|power|battery|temperature)/i.test(e.friendlyName));
    return { deviceId, entities, name: named?.friendlyName?.replace(/\s+(Voltage|Current|Power|Battery|Temperature).*$/i,"") || entities[0]?.friendlyName || deviceId };
  });
}

function scoreField(e, key) {
  const o=norm(e.objectId), u=norm(e.uniqueId), n=norm(e.friendlyName), d=norm(e.deviceClass);
  const aliases=FIELD_ALIASES[key] || [key];
  let best=-Infinity;
  for (const a0 of aliases) {
    const a=norm(a0);
    if (o === a || u.endsWith(`_${a}`)) best=Math.max(best,100);
    if (o.includes(a)) best=Math.max(best,80);
    if (n.includes(a)) best=Math.max(best,55);
  }
  if ((key === "voltage" || key === "current" || key === "power" || key === "temperature") && d === key) best=Math.max(best,45);
  if (key === "soc" && (d === "battery" || d === "battery_level")) best=Math.max(best,45);
  if (key === "health" && d === "battery" && (o.includes("health") || o.includes("soh"))) best=Math.max(best,60);
  if (key === "charging" && e.domain === "binary_sensor") best += 10;
  if (["balancer","heater","problem","charge_mosfet","discharge_mosfet"].includes(key) && e.domain !== "binary_sensor") best -= 100;
  if (["voltage","current","power","temperature","soc","health","cycles","runtime","rssi","link_quality","delta_cell_voltage","design_capacity","max_cell_voltage","min_cell_voltage","cycle_capacity"].includes(key) && e.domain !== "sensor") best -= 100;
  return best;
}

function discoverEntities(hass, deviceId) {
  const list=allBmsEntities(hass).filter(e=>e.deviceId===deviceId);
  const result={}; const used=new Set();
  for (const key of Object.keys(FIELD_ALIASES)) {
    let winner=list.map(e=>({e,s:scoreField(e,key)})).filter(x=>x.s>-20 && !used.has(x.e.entityId)).sort((a,b)=>b.s-a.s)[0];
    if (winner && winner.s>=35) { result[key]=winner.e.entityId; used.add(winner.e.entityId); }
  }
  // Diagnostic entities are sometimes disabled. They can still be found in the registry;
  // no state is required at discovery time.
  return result;
}

function readField(hass, entities, key) {
  const id=entities[key];
  if (!id) return undefined;
  return hass?.states?.[id]?.state;
}
function readAttr(hass, entities, preferredKeys, attrs=ATTRIBUTE_FIELDS) {
  const ids=[...preferredKeys.map(k=>entities[k]).filter(Boolean), ...Object.values(entities).filter(Boolean)];
  for (const id of ids) {
    const a=hass?.states?.[id]?.attributes || {};
    for (const k of attrs) if (a[k] !== undefined) return a[k];
  }
  return undefined;
}
function cellVoltages(hass, entities) {
  const v=readAttr(hass, entities,["delta_cell_voltage","max_cell_voltage","min_cell_voltage"] ,["cell_voltages"]);
  if (Array.isArray(v)) return v.map(Number).filter(Number.isFinite);
  return [];
}
function deviceName(hass, deviceId, entities) {
  const d=hass?.devices?.[deviceId];
  if (d?.name) return d.name;
  const names=Object.values(entities).map(id=>hass?.states?.[id]?.attributes?.friendly_name).filter(Boolean);
  const n=names.find(x=>!/^(Voltage|Current|Power|Temperature|Battery)/i.test(x));
  return n || names[0] || "BMS Battery";
}

function secondsHuman(s) {
  const n=num(s); if(n===undefined || n<0) return "—";
  const h=Math.floor(n/3600), m=Math.round((n%3600)/60);
  return h ? `${h} год ${m} хв` : `${m} хв`;
}
function energyFromSoc(soc, capacityAh, voltage) {
  const s=num(soc), c=num(capacityAh), v=num(voltage);
  return s===undefined||c===undefined||v===undefined ? undefined : c*v*s/100;
}
function estimateEta(soc,current,capacity,charging) {
  const s=num(soc),c=num(current),cap=num(capacity);
  if(s===undefined||c===undefined||cap===undefined||Math.abs(c)<0.05) return undefined;
  if(charging && c>0) return Math.max(0,cap*(100-s)/100/c*3600);
  if(!charging && c<0) return Math.max(0,cap*s/100/Math.abs(c)*3600);
  return undefined;
}

async function historyPower(hass, entityId, days) {
  if(!hass?.callWS || !entityId) return [];
  const end=new Date(), start=new Date(end.getTime()-days*86400000);
  try {
    const rows=await hass.callWS({type:"history/history_during_period", start_time:start.toISOString(), end_time:end.toISOString(), entity_ids:[entityId], minimal_response:true, no_attributes:true, significant_changes_only:false});
    const arr=rows?.[entityId] || [];
    return arr.map(x=>({t:new Date(x.last_changed||x.last_updated).getTime(),v:num(x.state)})).filter(x=>x.t&&x.v!==undefined).sort((a,b)=>a.t-b.t);
  } catch(e) { return []; }
}
function integrateDischarge(rows) {
  let wh=0;
  for(let i=1;i<rows.length;i++) {
    const dt=Math.min(Math.max(0,rows[i].t-rows[i-1].t),15*60*1000)/3600000;
    const p=(rows[i-1].v+rows[i].v)/2;
    if(p<0) wh += -p*dt;
  }
  return wh;
}

class BmsBleV3Card extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:"open"}); this._config={}; this._hass=null; this._deviceId=null; this._entities={}; this._lastDeviceKey=""; this._history={}; this._timer=null; this._historyBusy=false; }
  setConfig(config){ this._config=config||{}; this._deviceId=config?.device_id || config?.entities?.device_id || null; this.render(); }
  set hass(hass){ this._hass=hass; this._autoDiscover(); this.render(); }
  getCardSize(){ return 8; }
  connectedCallback(){ this._timer=setInterval(()=>this.render(),UPDATE_MS); }
  disconnectedCallback(){ clearInterval(this._timer); }
  _autoDiscover(){
    if(!this._hass) return;
    const devices=discoverDevices(this._hass);
    if(!this._deviceId && devices.length===1) this._deviceId=devices[0].deviceId;
    if(this._deviceId && devices.some(d=>d.deviceId===this._deviceId)) this._entities={...discoverEntities(this._hass,this._deviceId),...(this._config.entities||{})};
    const key=this._deviceId||"";
    if(key!==this._lastDeviceKey){this._lastDeviceKey=key;this._history={};}
  }
  _data(){
    const h=this._hass,e=this._entities;
    const soc=num(readField(h,e,"soc")), voltage=num(readField(h,e,"voltage")), current=num(readField(h,e,"current")), power=num(readField(h,e,"power"));
    const designAh=num(readField(h,e,"design_capacity"));
    const cycleCap=num(readField(h,e,"cycle_capacity")) || num(readAttr(h,e,["cycles","power"],["cycle_capacity"]));
    const cells=cellVoltages(h,e), charging=String(readField(h,e,"charging")).toLowerCase()==="on" || (current!==undefined && current>0 && Math.abs(current)>0.05);
    const stored=energyFromSoc(soc, designAh, voltage);
    return {soc,voltage,current,power,designAh,cycleCap,cells,charging,stored,health:num(readField(h,e,"health")),cycles:num(readField(h,e,"cycles")),runtime:num(readField(h,e,"runtime")),temperature:num(readField(h,e,"temperature")),rssi:num(readField(h,e,"rssi")),link:num(readField(h,e,"link_quality")),delta:num(readField(h,e,"delta_cell_voltage")),minCell:num(readField(h,e,"min_cell_voltage")),maxCell:num(readField(h,e,"max_cell_voltage")),problem:readField(h,e,"problem"),heater:readField(h,e,"heater"),balancer:readField(h,e,"balancer"),chargeMosfet:readField(h,e,"charge_mosfet"),dischargeMosfet:readField(h,e,"discharge_mosfet"),balanceCurrent:num(readAttr(h,e,["current"],["balance_current"])),problemCode:readAttr(h,e,["problem"],["problem_code"]),batteryMode:readAttr(h,e,["battery","voltage"],["battery_mode"]),cycleCharge:num(readAttr(h,e,["current"],["cycle_charge"])),totalCharge:num(readAttr(h,e,["current"],["total_charge"])),packCount:num(readAttr(h,e,["voltage"],["pack_count"])),cellCount:num(readAttr(h,e,["delta_cell_voltage"],["cell_count"]))};
  }
  async _loadHistory(){
    if(this._historyBusy || !this._entities.power) return;
    this._historyBusy=true;
    try{
      const rows=await historyPower(this._hass,this._entities.power,30);
      const now=Date.now();
      const periods={today:86400000,week:7*86400000,month:30*86400000};
      for(const [k,ms] of Object.entries(periods)) this._history[k]=integrateDischarge(rows.filter(x=>x.t>=now-ms));
      this._history.total=integrateDischarge(rows);
      this._history.updated=now;
    }finally{this._historyBusy=false;this.render();}
  }
  _styles(){return `<style>
:host{display:block;color:var(--primary-text-color);font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif)}
.card{background:var(--ha-card-background,var(--card-background-color,#fff));border-radius:18px;padding:18px;box-sizing:border-box;box-shadow:var(--ha-card-box-shadow,none);overflow:hidden}
.head{display:flex;justify-content:space-between;align-items:center;gap:12px}.title{font-size:20px;font-weight:700}.sub{font-size:12px;color:var(--secondary-text-color);margin-top:3px}.badge{padding:5px 9px;border-radius:10px;background:var(--secondary-background-color);font-size:11px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.metric{padding:12px;border-radius:14px;background:var(--secondary-background-color)}.label{font-size:11px;color:var(--secondary-text-color)}.value{font-size:21px;font-weight:700;margin-top:4px}.small{font-size:13px;font-weight:600}
.soc{height:10px;border-radius:8px;background:var(--divider-color);overflow:hidden;margin-top:12px}.soc>i{display:block;height:100%;background:var(--primary-color);border-radius:8px}
.cells{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:8px;margin-top:14px}.cell{padding:9px;border:1px solid var(--divider-color);border-radius:12px}.cell b{display:block;font-size:14px}.cell span{font-size:11px;color:var(--secondary-text-color)}
.section{margin-top:16px}.section h3{font-size:14px;margin:0 0 8px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.stat{padding:10px;border-radius:12px;background:var(--secondary-background-color)}.stat strong{display:block;font-size:16px;margin-top:3px}.warn{color:var(--error-color,#db4437)}.ok{color:var(--success-color,#0b8043)}
.cap{display:flex;flex-wrap:wrap;gap:7px}.chip{padding:6px 9px;border-radius:10px;background:var(--secondary-background-color);font-size:11px}.empty{padding:16px;text-align:center;color:var(--secondary-text-color)}
@media(max-width:700px){.grid{grid-template-columns:repeat(2,1fr)}.stats{grid-template-columns:repeat(2,1fr)}}
</style>`}
  render(){
    if(!this.shadowRoot) return;
    const h=this._hass;
    if(!h){this.shadowRoot.innerHTML=this._styles()+`<div class="card empty">Очікую Home Assistant…</div>`;return;}
    const devices=discoverDevices(h);
    if(!this._deviceId || !this._entities.voltage && !this._entities.soc){
      const buttons=devices.map(d=>`<button data-device="${esc(d.deviceId)}">${esc(d.name)} <span>(${d.entities.length})</span></button>`).join("");
      this.shadowRoot.innerHTML=this._styles()+`<div class="card"><div class="head"><div><div class="title">🔋 BMS BLE v3</div><div class="sub">Автоматичний пошук акумулятора</div></div><div class="badge">${devices.length} BMS</div></div><div class="empty">${devices.length?"Оберіть акумулятор:":"Не знайдено пристроїв BMS_BLE-HA."}<div style="display:grid;gap:8px;margin-top:12px">${buttons}</div></div></div>`;
      this.shadowRoot.querySelectorAll("button[data-device]").forEach(b=>b.onclick=()=>{this._deviceId=b.dataset.device;this._autoDiscover();this.render();});
      return;
    }
    const d=this._data();
    const name=deviceName(h,this._deviceId,this._entities); const eta=estimateEta(d.soc,d.current,d.designAh||d.cycleCap,d.charging);
    const delta=d.delta ?? (d.cells.length?Math.max(...d.cells)-Math.min(...d.cells):undefined);
    const usedToday=this._history.today, usedWeek=this._history.week, usedMonth=this._history.month, usedTotal=this._history.total;
    const healthClass=d.problem==="on"?"warn":"ok";
    this.shadowRoot.innerHTML=this._styles()+`<div class="card">
      <div class="head"><div><div class="title">🔋 ${esc(name)}</div><div class="sub">BMS BLE · ${VERSION}</div></div><div class="badge ${healthClass}">${d.problem==="on"?"Проблема":d.charging?"Заряджається":"Розряджається"}</div></div>
      <div class="grid">
        <div class="metric"><div class="label">SOC</div><div class="value">${fmt(d.soc,0,"%")}</div><div class="soc"><i style="width:${Math.max(0,Math.min(100,d.soc||0))}%"></i></div></div>
        <div class="metric"><div class="label">Напруга</div><div class="value">${fmt(d.voltage,2," V")}</div></div>
        <div class="metric"><div class="label">Струм</div><div class="value">${fmt(d.current,2," A")}</div></div>
        <div class="metric"><div class="label">Потужність</div><div class="value">${fmt(d.power,0," W")}</div></div>
      </div>
      <div class="grid">
        <div class="metric"><div class="label">Температура</div><div class="value">${fmt(d.temperature,1," °C")}</div></div>
        <div class="metric"><div class="label">SOH</div><div class="value">${fmt(d.health,0,"%")}</div></div>
        <div class="metric"><div class="label">Цикли</div><div class="value">${fmt(d.cycles,0)}</div></div>
        <div class="metric"><div class="label">Залишок</div><div class="value">${fmt(d.stored,0," Wh")}</div></div>
      </div>
      <div class="section"><h3>Комірки · ${d.cells.length || d.cellCount || "—"}</h3><div class="cells">${d.cells.length?d.cells.map((v,i)=>`<div class="cell"><b>C${i+1}</b><span>${fmt(v,3," V")}</span></div>`).join(""):"<div class="empty">Атрибут cell_voltages недоступний</div>"}</div></div>
      <div class="section"><h3>Баланс та стан BMS</h3><div class="cap"><span class="chip">Δ ${fmt(delta,3," V")}</span><span class="chip">Min ${fmt(d.minCell,3," V")}</span><span class="chip">Max ${fmt(d.maxCell,3," V")}</span><span class="chip">Balancer ${d.balancer||"—"}</span><span class="chip">Balance ${fmt(d.balanceCurrent,2," A")}</span><span class="chip">Heater ${d.heater||"—"}</span><span class="chip">CHG MOS ${d.chargeMosfet||"—"}</span><span class="chip">DSG MOS ${d.dischargeMosfet||"—"}</span></div></div>
      <div class="section"><h3>Час</h3><div class="stats"><div class="stat"><span class="label">Runtime</span><strong>${secondsHuman(d.runtime)}</strong></div><div class="stat"><span class="label">ETA</span><strong>${secondsHuman(eta)}</strong></div><div class="stat"><span class="label">RSSI</span><strong>${fmt(d.rssi,0," dBm")}</strong></div><div class="stat"><span class="label">Link</span><strong>${fmt(d.link,0,"%")}</strong></div></div></div>
      <div class="section"><h3>Віддана енергія · реальна історія Recorder</h3><div class="stats"><div class="stat"><span class="label">Сьогодні</span><strong>${fmt(usedToday/1000,2," kWh")}</strong></div><div class="stat"><span class="label">7 днів</span><strong>${fmt(usedWeek/1000,2," kWh")}</strong></div><div class="stat"><span class="label">30 днів</span><strong>${fmt(usedMonth/1000,2," kWh")}</strong></div><div class="stat"><span class="label">Доступно</span><strong>${this._history.updated?"так":"очікує"}</strong></div></div></div>
      <div class="section"><h3>Додаткові дані</h3><div class="cap"><span class="chip">Design ${fmt(d.designAh,1," Ah")}</span><span class="chip">Cycle cap ${fmt(d.cycleCap,0," Wh")}</span><span class="chip">Cycle charge ${fmt(d.cycleCharge,1," Ah")}</span><span class="chip">Total charge ${fmt(d.totalCharge,1," Ah")}</span><span class="chip">Cell count ${fmt(d.cellCount,0)}</span><span class="chip">Pack count ${fmt(d.packCount,0)}</span><span class="chip">Mode ${esc(d.batteryMode||"—")}</span><span class="chip">Problem code ${esc(d.problemCode||"—")}</span></div></div>
    </div>`;
    if(!this._history.updated) this._loadHistory();
  }
}
if(!customElements.get("ha-bms-ble-card-v3")) customElements.define("ha-bms-ble-card-v3",BmsBleV3Card);
console.info(`HA-BMS-BLE-CARD v${VERSION}`);
