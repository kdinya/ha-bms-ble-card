# Manual Helper Sensors Setup (YAML)

If you prefer to configure helper sensors manually via `configuration.yaml` instead of using the built-in **Setup Wizard**, use the templates below.

## 1. Separate Sensors for Charge and Discharge Current / Power

Add the following to your `configuration.yaml`:

```yaml
template:
  - sensor:
      - name: "Battery Discharge Current"
        unique_id: battery_discharge_current
        unit_of_measurement: "A"
        device_class: current
        state_class: measurement
        state: >
          {% set c = states('sensor.battery_current') | float(0) %}
          {{ (-c) if c < 0 else 0 }}

      - name: "Battery Charge Current"
        unique_id: battery_charge_current
        unit_of_measurement: "A"
        device_class: current
        state_class: measurement
        state: >
          {% set c = states('sensor.battery_current') | float(0) %}
          {{ c if c > 0 else 0 }}
```

## 2. Integration Sensors for Accumulated Capacity (Ah)

Add the Riemann sum integral sensors:

```yaml
sensor:
  - platform: integration
    source: sensor.battery_discharge_current
    name: "Battery Discharged Ah"
    unique_id: battery_discharged_ah
    unit_prefix: none
    unit_time: h
    round: 2
    method: left

  - platform: integration
    source: sensor.battery_charge_current
    name: "Battery Charged Ah"
    unique_id: battery_charged_ah
    unit_prefix: none
    unit_time: h
    round: 2
    method: left
```

After adding the configuration, restart Home Assistant or reload YAML configurations.
