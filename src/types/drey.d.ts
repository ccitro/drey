type ActionNeeded = "none" | "cool" | "heat";
type OperationMode = "off" | "heat" | "cool" | "range";
type HvacState = "off" | "cooling" | "heating" | "idle";
type RuleType = "override" | "future" | "schedule" | "protection" | "off" | "disconnected";

type SystemStates = Record<string, SystemState>;

interface SystemState {
    sensorStatuses: SensorStatus[];
    thermostatStatus: ThermostatStatus;
}

interface PingApiEvent {
    eventType: "PING";
}

interface StateApiEvent {
    eventType: "STATE";
    payload: SystemStates;
}

interface ConfigApiEvent {
    eventType: "CONFIG";
    payload: DreyConfig;
}

type ApiEvent = PingApiEvent | StateApiEvent | ConfigApiEvent;

type WeatherCondition =
    | "clear-night"
    | "cloudy"
    | "fog"
    | "hail"
    | "lightning"
    | "lightning-rainy"
    | "partlycloudy"
    | "pouring"
    | "rainy"
    | "snowy"
    | "snowy-rainy"
    | "sunny"
    | "windy"
    | "windy-variant"
    | "exceptional";

interface WeatherData {
    externalTemperature: number;
    condition: WeatherCondition;
}

interface ScheduleRule {
    day: number;
    time: number;
    temp: number;
    label: string;
}

interface Schedule {
    sensor: string;
    rules: ScheduleRule[];
}

interface RuleDecision {
    relevantRule: ScheduleRule;
    ruleType: RuleType;
    nextRuleStartsAt: Date;
}

interface SensorStatus {
    id: string;
    label: string;
    lastMeasuredAt: string;
    currentTemp: number;
    ruleType: RuleType;
    ruleLabel: string;
    ruleTemp: number;
    ruleEndsAt: string;
    desiredThermostatSetting: number;
    actionNeeded: ActionNeeded;
}

interface ThermostatStatus {
    targetTemp: number;
    targetTempType: OperationMode;
    functionalCurrentTemp: number;
    activeSensor: string;
    thermostatSensor: string;
    fanState: boolean;
    hvacState: HvacState;
    lastChanged: string;
}

interface Override {
    sensor: string;
    targetTemp: number;
    reason: string;
    holdUntil: string;
}

interface SystemProcessingResult {
    newTargetTemperature: string;
    newThermostatStatus: ThermostatStatus;
    newSensorStatuses: SensorStatus[];
}

interface SystemConfig {
    thermostat_entity_id: string;
    thermostat_sensor: string;
    temp_sensors: string[];
    cooling_schedule: Schedule[];
    heating_schedule: Schedule[];
}

// yarn generate-schema
interface DreyConfig {
    version: number;
    ha_host: string;
    ha_key: string;
    external_sensor: string;
    tz: string;
    configs: SystemConfig[];
}

type ServerConfigListener = (c: DreyConfig) => void;
type ServerStateListener = (c: SystemStates) => void;

interface DreyGlobal {
    systemStates: SystemStates;
    config: DreyConfig | null;
    configListeners: ServerConfigListener[];
    stateListeners: ServerStateListener[];
}
