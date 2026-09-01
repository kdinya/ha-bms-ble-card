/* BMS BLE Battery Card v3 — HACS entry point */
const VERSION = "3.0.0-beta.4";
const DOMAIN = "bms_ble";

const FIELDS = {
  soc:{domain:"sensor",aliases:["battery","battery_level","soc"]},
  charging:{domain:"binary_sensor",aliases:["charging","battery_charging"]},
  power:{domain:"sensor",aliases:["power"]},
  stored_energy:{domain:"sensor",aliases:["stored_energy"]},
  voltage:{domain:"sensor",aliases:["voltage"]},
  temperature:{domain:"sensor",aliases:["temperature","battery_temperature"]},
  current:{domain:"sensor",aliases:["current"]},
  battery_health:{domain:"sensor",aliases:["battery_health","soh","health"]},
  cycles:{domain:"sensor",aliases:["cycles","charge_cycles"]},
  runtime:{domain:"sensor",aliases:["runtime"]},
  problem:{domain:"binary_sensor",aliases:["problem"]},
  signal_strength:{domain:"sensor",aliases:["signal_strength","rssi"]},
  balancer:{domain:"binary_sensor",aliases:["balancer","balance"]},
  delta_cell_voltage:{domain:"sensor",aliases:["delta_cell_voltage","delta_voltage"]},
  design_capacity:{domain:"sensor",aliases:["design_capacity"]},
  heater:{domain:"binary_sensor",aliases:["heater","heating"]},
  highest_cell_voltage:{domain:"sensor",aliases:["highest_cell_voltage","max_cell_voltage","max_cell"]},
  link_quality:{domain:"sensor",aliases:["link_quality","linkquality"]},
  lowest_cell_voltage:{domain:"sensor",aliases:["lowest_cell_voltage","min_cell_voltage","min_cell"]},
  chrg_mosfet:{domain:"binary_sensor",aliases:["chrg_mosfet","charge_mosfet","charging_mosfet"]},
  dischrg_mosfet:{domain:"binary_sensor",aliases:["dischrg_mosfet","discharge_mosfet","discharging_mosfet"]}
};

const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const objectId=id=>String(id||"").split(".").slice(1).join(".").toLowerCase();
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:undefined;};
const state=(h,id)=>id&&h?.states?.[id]?.state;
const attrs=(h,id)=>id&&h?.states?.[id]?.attributes||{};
const fmt=(v,d=1,u="")=>{const n=num(v);return n===undefined?"—":`${n.toFixed(d)}${u}`;};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function info(h,id){const r=h?.entities?.[id]||{},s=h?.states?.[id];return{entityId:id,domain:String(id).split(".")[0],normalized:norm(objectId(id)),uniqueId:norm(r.unique_id),platform:String(r.platform||"").toLowerCase(),deviceId:r.device_id,deviceClass:norm(s?.attributes?.device_class||r.device_class),name:norm(s?.attributes?.friendly_name)};}
function allBms(h){return Object.keys(h?.entities||{}).map(id=>info(h,id)).filter(e=>e.platform===DOMAIN&&e.deviceId);}
function devices(h){const m=new Map();for(const e of allBms(h)){if(!m.has(e.deviceId))m.set(e.deviceId,[]);m.get(e.deviceId).push(e);}return [...m].map(([deviceId,entities])=>({deviceId,entities,name:h?.devices?.[deviceId]?.name_by_user||h?.devices?.[deviceId]?.name||deviceId}));}
function score(e,f){const r=FIELDS[f];if(!r||e.domain!==r.domain)return -1e9;let s=-1e9;for(const x of r.aliases){const a=norm(x);if(e.normalized===a)s=Math.max(s,100);else if(e.normalized.endsWith(`_${a}`))s=Math.max(s,95);else if(e.normalized.includes(a))s=Math.max(s,75);if(e.uniqueId.endsWith(`_${a}`))s=Math.max(s,90);if(e.name?.includes(a))s=Math.max(s,55);}if(f==="soc"&&e.deviceClass==="battery")s=Math.max(s,65);if(["voltage","current","power","temperature","signal_strength"].includes(f)&&e.deviceClass===f)s=Math.max(s,65);return s;}
function discover(h,deviceId){const list=allBms(h).filter(e=>e.deviceId===deviceId),out={},used=new Set();for(const f of Object.keys(FIELDS)){const w=list.map(e=>({e,s:score(e,f)})).filter(x=>x.s>=55&&!used.has(x.e.entityId)).sort((a,b)=>b.s-a.s)[0];if(w){out[f]=w.e.entityId;used.add(w.e.entityId);}}return out;}
function cellVoltages(h,e){for(const id of Object.values(e)){const a=attrs(h,id);if(Array.isArray(a.cell_voltages))return a.cell_voltages.map(Number).filter(Number.isFinite);}return[];}
function timeText(hours){if(!Number.isFinite(hours)||hours<0)return"—";const h=Math.floor(hours),m=Math.round((hours-h)*60);if(h>=24){const d=Math.floor(h/24);return`${d} д ${h%24} год`; }return h?`${h} год ${m} хв`:`${m} хв`;}
function estimatedTime(d,h,e){const p=Math.abs(d.power||0),stored=d.stored,design=d.design,unit=attrs(h,e.design_capacity).unit_of_measurement||"";if(!p||stored===undefined)return"—";let capacityWh;if(unit.toLowerCase().includes("wh"))capacityWh=design;else if(design!==undefined&&d.voltage)capacityWh=design*d.voltage;else capacityWh=undefined;if(d.charging==="on"&&capacityWh!==undefined)return timeText(Math.max(0,capacityWh-stored)/p);if(d.charging!=="on"&&stored!==undefined)return timeText(Math.max(0,stored)/p);return"—";}

class BmsBleV3Card extends HTMLElement{
 constructor(){super();this.attachShadow({mode:"open"});this._config={};this._hass=null;this._deviceId=null;this._entities={};}
 static getConfigElement(){return document.createElement("ha-bms-ble-card-v3-editor");}
 static getStubConfig(){return{};}
 setConfig(c){this._config=c||{};this._deviceId=c?.entities?.device_id||c?.device_id||null;this._discover();this.render();}
 set hass(h){this._hass=h;this._discover();this.render();}
 getCardSize(){return 8;}
 _discover(){if(!this._hass)return;const ds=devices(this._hass);if(!this._deviceId&&ds.length===1)this._deviceId=ds[0].deviceId;if(this._deviceId)this._entities={...discover(this._hass,this._deviceId),...(this._config.entities||{})};}
 _data(){const h=this._hass,e=this._entities,cells=cellVoltages(h,e);return{soc:num(state(h,e.soc)),voltage:num(state(h,e.voltage)),current:num(state(h,e.current)),power:num(state(h,e.power)),stored:num(state(h,e.stored_energy)),temp:num(state(h,e.temperature)),health:num(state(h,e.battery_health)),cycles:num(state(h,e.cycles)),runtime:num(state(h,e.runtime)),signal:num(state(h,e.signal_strength)),link:num(state(h,e.link_quality)),delta:num(state(h,e.delta_cell_voltage))??(cells.length?Math.max(...cells)-Math.min(...cells):undefined),min:num(state(h,e.lowest_cell_voltage)),max:num(state(h,e.highest_cell_voltage)),design:num(state(h,e.design_capacity)),charging:state(h,e.charging),problem:state(h,e.problem),balancer:state(h,e.balancer),heater:state(h,e.heater),chrg:state(h,e.chrg_mosfet),dis:state(h,e.dischrg_mosfet),cells};}
 metric(label,value,unit="",digits=1,cls=""){return`<div class="metric ${cls}"><div class="label">${label}</div><div class="value">${fmt(value,digits,unit)}</div></div>`;}
 render(){const h=this._hass;if(!h){this.shadowRoot.innerHTML=`<ha-card><div class="empty">Очікую Home Assistant…</div></ha-card>`;return;}const ds=devices(h);if(!this._deviceId||!this._entities.soc&&!this._entities.voltage){this.shadowRoot.innerHTML=`<ha-card><div class="empty"><b>🔋 BMS BLE v3</b><p>${ds.length?"Оберіть акумулятор:":"Не знайдено BMS_BLE-HA."}</p>${ds.map(d=>`<button class="pick" data-d="${esc(d.deviceId)}">${esc(d.name)} <span>${d.entities.length} entities</span></button>`).join("")}</div></ha-card>`;this.shadowRoot.querySelectorAll(".pick").forEach(b=>b.onclick=()=>{this._deviceId=b.dataset.d;this._discover();this.render();});return;}
 const d=this._data(),name=h.devices?.[this._deviceId]?.name_by_user||h.devices?.[this._deviceId]?.name||"BMS Battery",time=estimatedTime(d,h,this._entities),mode=d.charging==="on"?"charge":"discharge",cells=d.cells;
 const cellMin=d.min??(cells.length?Math.min(...cells):undefined),cellMax=d.max??(cells.length?Math.max(...cells):undefined);
 this.shadowRoot.innerHTML=`<style>
 :host{display:block}.wrap{padding:12px}.top{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:10px}.left{display:grid;grid-template-rows:minmax(220px,1fr) 86px;gap:10px}.upper-left{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(150px,.8fr);gap:10px}.panel{background:var(--ha-card-background,var(--card-background-color));border:1px solid var(--divider-color);border-radius:16px;box-sizing:border-box}.battery{padding:18px;position:relative;min-height:220px;display:flex;align-items:center;overflow:hidden}.battery .title{font-size:14px;opacity:.7}.battery .name{font-size:20px;font-weight:600;margin-top:4px}.battery .big{font-size:64px;line-height:1;font-weight:700;margin-top:18px;text-align:left}.battery .soc{font-size:15px;opacity:.65;margin-top:8px}.battery .status{position:absolute;right:16px;top:16px;font-size:13px}.battery .stored{position:absolute;right:18px;bottom:16px;text-align:right}.metrics{display:grid;grid-template-rows:repeat(4,1fr);gap:8px}.metric{padding:11px 13px;display:flex;flex-direction:column;justify-content:center}.label{font-size:12px;opacity:.68}.value{font-size:23px;font-weight:650;margin-top:3px}.runtime{padding:14px 18px;display:flex;align-items:center;justify-content:space-between}.runtime .rt-label{font-size:13px;opacity:.7}.runtime .rt-value{font-size:25px;font-weight:700}.right{display:grid;grid-template-rows:minmax(220px,1fr) minmax(220px,1fr);gap:10px}.cells-panel{padding:14px}.section-title{font-size:15px;font-weight:650;margin-bottom:10px}.cell-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cell{padding:7px 6px;border:1px solid var(--divider-color);border-radius:9px;text-align:center;font-size:12px}.cell b{display:block;font-size:15px;margin-top:2px}.cell-extremes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.ext{padding:9px;border-radius:10px;background:var(--secondary-background-color)}.ext small{display:block;opacity:.65}.ext b{font-size:17px}.status-panel{padding:14px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);gap:8px}.status-item{padding:10px;border-radius:10px;background:var(--secondary-background-color);display:flex;align-items:center;justify-content:space-between;gap:8px}.status-item small{opacity:.65}.ok{font-weight:650}.warn{font-weight:650}.footer{margin-top:10px;font-size:11px;opacity:.55;text-align:right}.empty{padding:16px}.pick{display:block;width:100%;margin:7px 0;padding:11px;text-align:left;border:1px solid var(--divider-color);background:var(--secondary-background-color);border-radius:10px;color:inherit;cursor:pointer}.pick span{float:right;opacity:.6}@media(max-width:700px){.top{grid-template-columns:1fr}.upper-left{grid-template-columns:1.6fr .9fr}.right{grid-template-rows:auto auto}.cell-grid{grid-template-columns:repeat(3,1fr)}.battery .big{font-size:52px}}
 </style><ha-card><div class="wrap"><div class="top"><div class="left"><div class="upper-left"><div class="panel battery"><div><div class="title">${esc(name)}</div><div class="name">${mode==="charge"?"Заряджається":"Розряджається"}</div><div class="big">${fmt(d.soc,0," %")}</div><div class="soc">Рівень заряду</div></div><div class="status">${d.problem==="on"?"⚠️ Проблема":mode==="charge"?"⚡ Заряд":"↘️ Розряд"}</div><div class="stored">${fmt(d.stored,0," Wh")}<br><small>збережено</small></div></div><div class="metrics">${this.metric("Напруга",d.voltage," V",2)}${this.metric("Струм",d.current," A",2)}${this.metric("Потужність",d.power," W",0)}${this.metric("Температура",d.temp," °C",1)}</div></div><div class="panel runtime"><div><div class="rt-label">${mode==="charge"?"Час до повного заряду":"Орієнтовний час розряду"}</div><div class="rt-value">${time}</div></div><div>${mode==="charge"?"⚡":"🔋"}</div></div></div><div class="right"><div class="panel cells-panel"><div class="section-title">Комірки · ${cells.length}</div><div class="cell-grid">${cells.length?cells.map((v,i)=>`<div class="cell">C${i+1}<b>${fmt(v,3," V")}</b></div>`).join(""):"<div>Немає даних</div>"}</div><div class="cell-extremes"><div class="ext"><small>Мінімальна</small><b>${fmt(cellMin,3," V")}</b></div><div class="ext"><small>Максимальна</small><b>${fmt(cellMax,3," V")}</b></div></div></div><div class="panel status-panel"><div class="status-item"><small>Балансир</small><span class="${d.balancer==="on"?"warn":"ok"}">${d.balancer||"—"}</span></div><div class="status-item"><small>Проблеми</small><span class="${d.problem==="on"?"warn":"ok"}">${d.problem||"—"}</span></div><div class="status-item"><small>Нагрівач</small><span>${d.heater||"—"}</span></div><div class="status-item"><small>CHG MOS</small><span>${d.chrg||"—"}</span></div><div class="status-item"><small>DSG MOS</small><span>${d.dis||"—"}</span></div><div class="status-item"><small>Δ комірок</small><span>${fmt(d.delta,3," V")}</span></div></div></div></div><div class="footer">BMS BLE · ${VERSION}</div></div></ha-card>`;
 }
}
if(!customElements.get("ha-bms-ble-card-v3"))customElements.define("ha-bms-ble-card-v3",BmsBleV3Card);
console.info(`HA-BMS-BLE-CARD v${VERSION}`);
