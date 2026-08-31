# ha-bms-ble-card

Lovelace-картка для Home Assistant, яка візуалізує максимум параметрів з BLE
BMS-акумуляторів (LiFePO4), інтегрованих через
[BMS_BLE-HA](https://github.com/patman15/BMS_BLE-HA).

Не прив'язана до конкретного бренду — працює з будь-якою батареєю, яку
підтримує ця інтеграція: Redodo, LiTime, PowerQueen, JBD/Jiabaida, Daly, JK,
ANT, Seplos, Renogy та інші.

> Скріни інтерфейсу додам після першого проходу тестування на реальному
> дашборді — поки що дизайн описаний нижче в розділі "Можливості".

## Можливості

- Два режими відображення: `widget` (компактний вигляд + fullscreen попап при
  натисканні) і `inline` (одразу повна картка, вбудована в дашборд)
- SOC-індикатор, напруга/струм/потужність/температура
- Напруга кожної комірки окремо, з кольоровим кодуванням дисбалансу
  (configurable пороги)
- Статус BMS: заряджається/розряджається/проблема, балансир, MOSFET заряду і
  розряду, нагрівач
- Link quality / RSSI Bluetooth-з'єднання
- Прогноз часу роботи (runtime)
- Використана ємність сьогодні/тиждень/місяць/всього (потребує додаткових
  helper-сенсорів — див. нижче)
- Адаптивний layout під портретну/альбомну орієнтацію

## Встановлення

### HACS (рекомендовано)

1. HACS → три крапки у верхньому правому куті → **Custom repositories**
2. URL: `https://github.com/kdinya/ha-bms-ble-card`, категорія **Lovelace**
3. Знайти **BMS BLE Battery Card** і встановити
4. Перезавантажити браузер (Ctrl+F5)

### Вручну

1. Завантажити `dist/ha-bms-ble-card.js` з останнього
   [релізу](https://github.com/kdinya/ha-bms-ble-card/releases)
2. Покласти у `config/www/ha-bms-ble-card.js`
3. Settings → Dashboards → три крапки → Resources → додати
   `/local/ha-bms-ble-card.js` як JavaScript Module

## Передумова: інтеграція BMS_BLE-HA

Ця картка не читає Bluetooth напряму — вона відображає entities, які створює
[BMS_BLE-HA](https://github.com/patman15/BMS_BLE-HA). Встановіть і
налаштуйте цю інтеграцію першою (доступна в HACS за замовчуванням).

Після додавання батареї увімкніть diagnostic-сенсори (вимкнені за
замовчуванням): `delta cell voltage`, `max/min cell voltage`, `link quality`,
`RSSI`, а також binary_sensors `balancer`, `chrg/dischrg mosfet`, `heater`.

## Конфігурація картки

```yaml
type: custom:ha-bms-ble-card
display_mode: widget   # або: inline
# name: необов'язково — якщо не вказати, картка сама підтягне назву
# з Device Registry (пристрій батареї в BMS_BLE-HA) або з friendly_name сенсора
entities:
  voltage: sensor.redodo_voltage
  current: sensor.redodo_current
  power: sensor.redodo_power
  soc: sensor.redodo_soc
  temperature: sensor.redodo_temperature
  runtime: sensor.redodo_runtime
  stored_energy: sensor.redodo_stored_energy
  charge_cycles: sensor.redodo_charge_cycles
  delta_cell_voltage: sensor.redodo_delta_cell_voltage
  max_cell_voltage: sensor.redodo_max_cell_voltage
  min_cell_voltage: sensor.redodo_min_cell_voltage
  link_quality: sensor.redodo_link_quality
  rssi: sensor.redodo_rssi
  charging: binary_sensor.redodo_battery_charging
  balancer: binary_sensor.redodo_balancer
  chrg_mosfet: binary_sensor.redodo_chrg_mosfet
  dischrg_mosfet: binary_sensor.redodo_dischrg_mosfet
  heater: binary_sensor.redodo_heater
  problem: binary_sensor.redodo_problem
  # опційно, якщо не задано - картка сама візьме масив із cell_voltages
  # attribute сенсора delta_cell_voltage
  cell_voltages:
    - sensor.redodo_cell_1
    - sensor.redodo_cell_2
    - sensor.redodo_cell_3
    - sensor.redodo_cell_4
  # опційно - див. розділ "Сенсори споживання" нижче
  capacity_daily: sensor.redodo_capacity_daily
  capacity_weekly: sensor.redodo_capacity_weekly
  capacity_monthly: sensor.redodo_capacity_monthly
  capacity_total: sensor.redodo_capacity_total
thresholds:
  cell_delta_warning: 0.02
  cell_delta_critical: 0.05
```

Всі ключі в `entities` опційні — якщо якийсь сенсор не вказано, відповідний
блок картки просто не рендериться замість помилки.

## Individual cell voltages без окремих сенсорів

BMS_BLE-HA не створює entity на кожну комірку — вони лежать в атрибуті
`cell_voltages` сенсора `delta cell voltage`. Якщо не хочете створювати
`cell_voltages` вручну в конфізі картки, залиште цей ключ пустим — картка сама
прочитає масив з атрибута. Якщо ж хочете окремі сенсори (наприклад, для
графіків історії в HA), додайте template sensors:

```yaml
template:
  - sensor:
      - name: redodo_cell_1
        unique_id: redodo_cell_1
        state: >-
          {{ state_attr('sensor.redodo_delta_cell_voltage', 'cell_voltages')[0] }}
        unit_of_measurement: "V"
        device_class: voltage
        state_class: measurement
      - name: redodo_cell_2
        unique_id: redodo_cell_2
        state: >-
          {{ state_attr('sensor.redodo_delta_cell_voltage', 'cell_voltages')[1] }}
        unit_of_measurement: "V"
        device_class: voltage
        state_class: measurement
      - name: redodo_cell_3
        unique_id: redodo_cell_3
        state: >-
          {{ state_attr('sensor.redodo_delta_cell_voltage', 'cell_voltages')[2] }}
        unit_of_measurement: "V"
        device_class: voltage
        state_class: measurement
      - name: redodo_cell_4
        unique_id: redodo_cell_4
        state: >-
          {{ state_attr('sensor.redodo_delta_cell_voltage', 'cell_voltages')[3] }}
        unit_of_measurement: "V"
        device_class: voltage
        state_class: measurement
```

## Сенсори споживання (сьогодні / тиждень / місяць / всього)

BMS_BLE-HA не рахує накопичену ємність — це стандартні HA helpers,
`integration` (Riemann sum) + `utility_meter`:

```yaml
sensor:
  - platform: integration
    name: redodo_capacity_integral
    source: sensor.redodo_power
    unit_prefix: k
    round: 2
    method: left

utility_meter:
  redodo_capacity_daily:
    source: sensor.redodo_capacity_integral
    cycle: daily
  redodo_capacity_weekly:
    source: sensor.redodo_capacity_integral
    cycle: weekly
  redodo_capacity_monthly:
    source: sensor.redodo_capacity_integral
    cycle: monthly
  redodo_capacity_total:
    source: sensor.redodo_capacity_integral
    cycle: yearly
```

Або через UI: **Settings → Devices & Services → Helpers → + Add helper →
Integration - Riemann sum**, потім **Utility Meter** x4 (daily/weekly/
monthly/yearly), джерело — щойно створений integration-сенсор. Отримані
entity_id вкажіть в `entities.capacity_*` конфіга картки.

> Автоматичний майстер створення цих helpers прямо з редактора картки — в
> розробці, слідкуйте за релізами.

## Обмеження

- Картка не надає керування зарядом/розрядом БМС (switches) — це свідоме
  рішення автора BMS_BLE-HA з міркувань безпеки акумулятора. Картка — тільки
  моніторинг.
- Одна картка = одна батарея. Для кількох акумуляторів додайте кілька карток.

## Ліцензія

MIT
