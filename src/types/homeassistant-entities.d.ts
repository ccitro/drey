interface ThermostatEntityAttributes {
    min_temp: number;
    max_temp: number;
    current_temperature: number;
    temperature: number;
    target_temp_high: number | null;
    target_temp_low: number | null;
    fan_mode: "on" | "auto";
    hvac_action: HvacState;
    preset_mode: string;
    friendly_name: string;
    supported_features: number;
}

interface TempSensorEntityAttributes {
    unit_of_measurement: string;
    friendly_name: string;
    device_class: string;
    state_class: string;
}

interface WeatherEntityAttributes {
    temperature: number;
    temperature_unit: string;
    humidity: number;
    ozone: number;
    pressure: number;
    pressure_unit: string;
    wind_bearing: number;
    wind_speed: number;
    wind_speed_unit: string;
    visibility: number;
    visibility_unit: string;
    precipitation_unit: string;
    forecast: unknown;
    attribution: string;
    friendly_name: string;
}

interface EntityState<T, U> {
    entity_id: string;
    state: T;
    attributes: U;
    last_changed: string;
    last_updated: string;
}

type WeatherEntityState = EntityState<string, WeatherEntityAttributes>;
type ThermostatEntityState = EntityState<OperationMode, ThermostatEntityAttributes>;
type TempSensorEntityState = EntityState<string, TempSensorEntityAttributes>;
