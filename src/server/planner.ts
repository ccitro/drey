import dayjs from "dayjs";
import dayjsTimezone from "dayjs/plugin/timezone";
import dayjsUtc from "dayjs/plugin/utc";

import { LOWEST_TEMP_ALLOWED_FOR_AC, MAX_TEMP, MIN_TEMP } from "./constants";
import { dateToString, temperatureValue } from "./utils";

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTimezone);

function getSensorName(s: TempSensorEntityState): string {
    let name = s.attributes.friendly_name;
    if (!name || name.length === 0) {
        return s.entity_id;
    }

    if (name.endsWith(" Temperature")) {
        name = name.substring(0, name.length - " Temperature".length);
    }

    return name;
}

function specialSensorStatus(o: OperationMode, s: TempSensorEntityState, ruleType: RuleType): SensorStatus {
    const temp = o === "cool" ? MAX_TEMP : MIN_TEMP;
    return {
        id: s.entity_id,
        label: getSensorName(s),
        ruleLabel: ruleType.substring(0, 1).toUpperCase() + ruleType.substring(1),
        ruleTemp: temp,
        actionNeeded: "none",
        currentTemp: temperatureValue(s.state),
        desiredThermostatSetting: temp,
        lastMeasuredAt: dateToString(s.last_updated && s.last_updated.length ? new Date(s.last_updated) : new Date()),
        ruleEndsAt: "2199-12-31T00:00:00.000Z",
        ruleType,
    };
}

function needsCoolingProtection(thermostatState: ThermostatEntityState, externalTemperature: number): boolean {
    return thermostatState.state === "cool" && externalTemperature < LOWEST_TEMP_ALLOWED_FOR_AC;
}

function sensorIsDisconnected(sensor: TempSensorEntityState, themorstatSensor: string): boolean {
    if (themorstatSensor === sensor.entity_id) {
        // assume that the thermostat can never really be disconnected
        return false;
    }

    const last_updated = sensor.last_updated && sensor.last_updated.length ? new Date(sensor.last_updated) : new Date();
    const now = Date.now();
    const timeDiff = Math.abs(now - last_updated.getTime()) / 1000;
    const deviceTimeout = 30 * 60;
    return timeDiff > deviceTimeout;
}

function buildFutureDowDate(utcRef: Date, day: number, time: number, tz: string): Date {
    const localDayjs = dayjs(utcRef).tz(tz);

    const currentD = localDayjs.day();
    const currentH = localDayjs.hour();
    const currentM = localDayjs.minute();
    let daysDifference = day - currentD;

    // if we're asked to build a date for the current day of the week,
    // then we have to check the time and add a week if needed
    if (daysDifference === 0) {
        const currentTime = currentH * 60 + currentM;
        if (currentTime >= time) {
            daysDifference = 7;
        }
    } else if (daysDifference < 0) {
        daysDifference += 7;
    }

    const localTargetDate = localDayjs
        .add(daysDifference, "d")
        .set("h", Math.floor(time / 60))
        .set("m", time % 60)
        .set("s", 0);

    return localTargetDate.toDate();
}

function calculateDelta(time: Date, rule: ScheduleRule, tz: string): number {
    const futureDow = buildFutureDowDate(time, rule.day, rule.time, tz);
    const delta = (futureDow.getTime() - time.getTime()) / 1000;
    if (delta < 0) {
        throw new Error("calculateDelta generated a negative value");
    }
    return delta;
}

function needToActNowToReachTemp(
    operation: OperationMode,
    tempDelta: number,
    timeDelta: number,
    weather: WeatherData
): boolean {
    if (tempDelta < 0 || operation !== "cool") {
        return false;
    }

    const mins = Math.floor(timeDelta / 60);

    // data gathered:
    // 25 minutes to cool 1 degree, on a cloudy day when it was 77 degrees out
    // 47 mins to cool 2 degree, on a cloudy day when it was 68 degrees out

    const baseInterval = 20;
    let minsToCoolOneDegree = baseInterval;

    // add 1 "base interval" for every 10 degrees above an external temp of 70
    if (weather.externalTemperature > 70) {
        const scale = Math.floor((weather.externalTemperature - 70) / 10);
        minsToCoolOneDegree += baseInterval * scale;
    }

    // add 1 "base interval" if it is sunny outside
    if (weather.condition === "sunny") {
        minsToCoolOneDegree += baseInterval;
    }

    const minsRequiredToCool = tempDelta * minsToCoolOneDegree;
    if (mins - minsRequiredToCool < 10) {
        return true;
    }

    return false;
}

function pickActionNeeded(
    relevantRule: ScheduleRule,
    sensorState: TempSensorEntityState,
    state: OperationMode
): ActionNeeded {
    let tempDiff = temperatureValue(sensorState.state) - relevantRule.temp;
    if (Math.abs(tempDiff) < 0.001) {
        tempDiff = 0;
    }

    if (tempDiff > 0 && state === "cool") {
        return "cool";
    } else if (tempDiff < 0 && state === "heat") {
        return "heat";
    }

    return "none";
}

function buildThermostatStatusFromSensorsAndThermostat(
    thermostatSensor: string,
    thermostatState: ThermostatEntityState,
    sensorStatuses: SensorStatus[]
): ThermostatStatus {
    let demandingSensor = "";
    let demandingTemp = thermostatState.state === "cool" ? MAX_TEMP : MIN_TEMP;

    for (const s of sensorStatuses) {
        if (thermostatState.state === "cool") {
            if (s.desiredThermostatSetting < demandingTemp) {
                demandingSensor = s.id;
                demandingTemp = s.desiredThermostatSetting;
            }
        } else {
            if (s.desiredThermostatSetting > demandingTemp) {
                demandingSensor = s.id;
                demandingTemp = s.desiredThermostatSetting;
            }
        }
    }

    return {
        activeSensor: demandingSensor,
        thermostatSensor,
        fanState: thermostatState.attributes.fan_mode === "on",
        functionalCurrentTemp: thermostatState.attributes.current_temperature,
        hvacState: thermostatState.attributes.hvac_action,
        lastChanged: dateToString(new Date()),
        targetTemp: demandingTemp,
        targetTempType: thermostatState.state,
    };
}

function decideIfNextRuleRequiresAction(
    operation: OperationMode,
    sensorState: TempSensorEntityState,
    currentRule: ScheduleRule,
    nextRule: ScheduleRule,
    nextRuleStartsAt: Date,
    tz: string,
    weather: WeatherData
): RuleDecision {
    const now = new Date();
    const timeDelta = calculateDelta(now, nextRule, tz);
    let tempDelta = temperatureValue(sensorState.state) - nextRule.temp;

    if (operation !== "cool") {
        tempDelta = -1 * tempDelta;
    }

    if (needToActNowToReachTemp(operation, tempDelta, timeDelta, weather)) {
        return { relevantRule: nextRule, ruleType: "future", nextRuleStartsAt };
    }

    return { relevantRule: currentRule, ruleType: "schedule", nextRuleStartsAt };
}

function buildOverrideRule(sensorState: TempSensorEntityState, overrides: Override[]): RuleDecision | null {
    const sensorOverrides = overrides.filter((o) => o.sensor === sensorState.entity_id);
    if (sensorOverrides.length === 0) {
        return null;
    }

    const overrideRule: ScheduleRule = {
        day: 0,
        label: "Override: " + sensorOverrides[0].reason,
        temp: sensorOverrides[0].targetTemp,
        time: 0,
    };

    return {
        relevantRule: overrideRule,
        ruleType: "override",
        nextRuleStartsAt: new Date(sensorOverrides[0].holdUntil),
    };
}

function buildSensorStatus(
    s: TempSensorEntityState,
    thermostatState: ThermostatEntityState,
    themorstatSensor: string,
    scheduleRules: ScheduleRule[],
    overrides: Override[],
    tz: string,
    weather: WeatherData
): SensorStatus {
    if (scheduleRules.length === 0 || sensorIsDisconnected(s, themorstatSensor)) {
        return specialSensorStatus(thermostatState.state, s, "disconnected");
    }

    const ruleDecision = makeRuleDecision(thermostatState.state, s, scheduleRules, overrides, tz, weather);
    const desiredChange = temperatureValue(s.state) - ruleDecision.relevantRule.temp;

    return {
        id: s.entity_id,
        label: getSensorName(s),
        ruleLabel: ruleDecision.relevantRule.label,
        ruleTemp: ruleDecision.relevantRule.temp,
        actionNeeded: pickActionNeeded(ruleDecision.relevantRule, s, thermostatState.state),
        currentTemp: temperatureValue(s.state),
        desiredThermostatSetting: temperatureValue(thermostatState.attributes.current_temperature - desiredChange),
        lastMeasuredAt: dateToString(s.last_updated && s.last_updated.length ? new Date(s.last_updated) : new Date()),
        ruleEndsAt: dateToString(ruleDecision.nextRuleStartsAt),
        ruleType: ruleDecision.ruleType,
    };
}

function makeRuleDecision(
    operation: OperationMode,
    sensorState: TempSensorEntityState,
    rules: ScheduleRule[],
    overrides: Override[],
    tz: string,
    weather: WeatherData
): RuleDecision {
    const overrideRule = buildOverrideRule(sensorState, overrides);
    if (overrideRule) {
        return overrideRule;
    }

    const now = new Date();
    const deltaRules = rules
        .map((rule) => ({ rule, delta: calculateDelta(now, rule, tz) }))
        .sort((a, b): number => a.delta - b.delta);

    const currentRule = deltaRules[deltaRules.length - 1].rule;
    const nextRule = deltaRules[0].rule;
    const timeRemaining = deltaRules[0].delta;

    const nextRuleStartsAt = new Date(Math.round(now.getTime() + timeRemaining * 1000));
    return decideIfNextRuleRequiresAction(operation, sensorState, currentRule, nextRule, nextRuleStartsAt, tz, weather);
}

export async function processSystem(
    thermostatSensor: string,
    thermostatState: ThermostatEntityState,
    sensorStates: TempSensorEntityState[],
    heatingSchedule: Schedule[],
    coolingSchedule: Schedule[],
    overrides: Override[],
    weather: WeatherData,
    tz: string
): Promise<SystemProcessingResult> {
    let newSensorStatuses: SensorStatus[] = [];
    let newThermostatStatus: ThermostatStatus | null = null;

    if (!["heat", "cool"].includes(thermostatState.state)) {
        newThermostatStatus = {
            thermostatSensor,
            activeSensor: thermostatSensor,
            fanState: thermostatState.attributes.fan_mode === "on",
            functionalCurrentTemp: thermostatState.attributes.current_temperature,
            hvacState: thermostatState.attributes.hvac_action,
            lastChanged: dateToString(new Date()),
            targetTemp: thermostatState.attributes.current_temperature,
            targetTempType: "off",
        };

        newSensorStatuses = sensorStates.map((s) => specialSensorStatus(thermostatState.state, s, "off"));
    } else if (needsCoolingProtection(thermostatState, weather.externalTemperature)) {
        newSensorStatuses = sensorStates.map((s) => specialSensorStatus(thermostatState.state, s, "protection"));
        newThermostatStatus = buildThermostatStatusFromSensorsAndThermostat(
            thermostatSensor,
            thermostatState,
            newSensorStatuses
        );
    } else {
        const scheDefs = thermostatState.state === "cool" ? coolingSchedule : heatingSchedule;
        newSensorStatuses = sensorStates.map((sensor) => {
            const scheduleRules = scheDefs.find((schDef) => schDef.sensor === sensor.entity_id)?.rules ?? [];
            return buildSensorStatus(sensor, thermostatState, thermostatSensor, scheduleRules, overrides, tz, weather);
        });
        newThermostatStatus = buildThermostatStatusFromSensorsAndThermostat(
            thermostatSensor,
            thermostatState,
            newSensorStatuses
        );
    }

    // make note of the new target temp, but keep the thermostat status in line with what is currently active
    // once the api call is made and the target temp actually changes, this method will rerrun and rebuild the state
    const newTargetTemperature = temperatureValue(newThermostatStatus.targetTemp).toFixed(0);
    newThermostatStatus.targetTemp = thermostatState.attributes.temperature;

    return {
        newTargetTemperature,
        newThermostatStatus,
        newSensorStatuses,
    };
}

// exposed for unit tests
export const _private = {
    getSensorName,
    specialSensorStatus,
    needsCoolingProtection,
    sensorIsDisconnected,
    buildFutureDowDate,
    calculateDelta,
    needToActNowToReachTemp,
    pickActionNeeded,
    buildThermostatStatusFromSensorsAndThermostat,
    decideIfNextRuleRequiresAction,
    buildOverrideRule,
    buildSensorStatus,
    makeRuleDecision,
    processSystem,
};
