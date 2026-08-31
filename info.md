## BMS BLE Battery Card

Картка для BLE BMS-акумуляторів (Redodo, LiTime, JBD, Daly, JK, Seplos та
інші), інтегрованих через [BMS_BLE-HA](https://github.com/patman15/BMS_BLE-HA).

{% if not installed %}
### Встановлення

1. Встановіть цю картку через HACS
2. Додайте `custom:ha-bms-ble-card` на дашборд — приклад конфігурації в
   [README](https://github.com/kdinya/ha-bms-ble-card#конфігурація-картки)
{% endif %}

### Можливості

- Widget + fullscreen попап, або inline-режим
- SOC, напруга, струм, потужність, температура
- Напруга кожної комірки з кольоровим кодуванням дисбалансу
- Діагностика BMS: балансир, MOSFET, нагрівач, link quality, RSSI
- Використана ємність сьогодні/тиждень/місяць/всього
