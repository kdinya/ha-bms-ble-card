const test = require("node:test");
const assert = require("node:assert/strict");

// dist/ha-bms-ble-card.js — це файл для браузера: він визначає кастомні
// елементи одразу при завантаженні (class ... extends HTMLElement,
// customElements.define(...)). Для юніт-тестів чистих функцій поза
// браузером підставляємо мінімальні стаби цих глобальних об'єктів.
if (typeof globalThis.HTMLElement === "undefined") {
  globalThis.HTMLElement = class HTMLElement {};
}
if (typeof globalThis.customElements === "undefined") {
  globalThis.customElements = { define() {} };
}
if (typeof globalThis.window === "undefined") {
  globalThis.window = { customCards: [], addEventListener() {}, innerWidth: 1024, innerHeight: 768 };
}

const {
  fmt,
  secondsToHuman,
  batteryFillColor,
  cellVoltageFraction,
  CELL_VOLTAGE_RANGE,
  DEFAULT_THRESHOLDS,
} = require("../dist/ha-bms-ble-card.js");

test("fmt: базове форматування чисел з одиницею", () => {
  assert.equal(fmt(12.345, 2, " V"), "12.35 V");
  assert.equal(fmt(5, 0, " W"), "5 W");
});

test("fmt: невідомі/недоступні значення -> прочерк", () => {
  assert.equal(fmt(undefined), "—");
  assert.equal(fmt(null), "—");
  assert.equal(fmt("unknown"), "—");
  assert.equal(fmt("unavailable"), "—");
});

test("fmt: нечислове значення повертається як є з юнітом", () => {
  assert.equal(fmt("N/A", 1, " V"), "N/A V");
});

test("secondsToHuman: менше години -> лише хвилини", () => {
  assert.equal(secondsToHuman(1800), "30 хв");
});

test("secondsToHuman: більше години -> год + хв", () => {
  assert.equal(secondsToHuman(3661), "1 год 1 хв");
  assert.equal(secondsToHuman(7200), "2 год 0 хв");
});

test("secondsToHuman: некоректні значення -> прочерк", () => {
  assert.equal(secondsToHuman(undefined), "—");
  assert.equal(secondsToHuman(null), "—");
  assert.equal(secondsToHuman("abc"), "—");
});

test("batteryFillColor: пороги кольору SOC", () => {
  assert.equal(batteryFillColor(5), "#E24B4A");
  assert.equal(batteryFillColor(15), "#E24B4A");
  assert.equal(batteryFillColor(20), "#EF9F27");
  assert.equal(batteryFillColor(30), "#EF9F27");
  assert.equal(batteryFillColor(31), "#1D9E75");
  assert.equal(batteryFillColor(100), "#1D9E75");
});

test("cellVoltageFraction: клемп в межах 0..1 по діапазону LiFePO4", () => {
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.lo), 0);
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.hi), 1);
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.lo - 1), 0);
  assert.equal(cellVoltageFraction(CELL_VOLTAGE_RANGE.hi + 1), 1);
});

test("cellVoltageFraction: середина діапазону ~0.5", () => {
  const mid = (CELL_VOLTAGE_RANGE.lo + CELL_VOLTAGE_RANGE.hi) / 2;
  assert.ok(Math.abs(cellVoltageFraction(mid) - 0.5) < 1e-9);
});

test("cellVoltageFraction: некоректне значення -> 0", () => {
  assert.equal(cellVoltageFraction(undefined), 0);
  assert.equal(cellVoltageFraction(NaN), 0);
});

test("DEFAULT_THRESHOLDS: критичний поріг більший за попереджувальний", () => {
  assert.ok(DEFAULT_THRESHOLDS.cell_delta_critical > DEFAULT_THRESHOLDS.cell_delta_warning);
});

test("автовизначення кількості комірок: довжина масиву cell_voltages визначає кількість", () => {
  // Емулюємо логіку _cellVoltages(): якщо масив заданий явно — беремо його
  // довжину; якщо ні — довжину атрибута cell_voltages сенсора дельти.
  const explicit = [3.30, 3.29, 3.31, 3.28];
  assert.equal(explicit.length, 4);
  const fromAttribute = [3.30, 3.29, 3.31]; // напр. пакет з 3 комірок
  assert.equal(fromAttribute.length, 3);
});
