import dayjs from "dayjs";
import dayjsTimezone from "dayjs/plugin/timezone";
import dayjsUtc from "dayjs/plugin/utc";

import { LOWEST_TEMP_ALLOWED_FOR_AC, MAX_TEMP, MIN_TEMP } from "./constants";
import { dateToString, temperatureValue } from "./utils";

type SensorPreconditioningHandler = (temp: number, endsAt: string) => Promise<unknown>;
export type PreconditioningHandler = (sensor: string, temp: number, endsAt: string) => Promise<unknown>;

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
    // 22 mins to cool 1 degree, on a partly cloudy day when it was 72 degrees out

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
    thermostatTemperature: number,
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
        functionalCurrentTemp: thermostatTemperature,
        hvacState: thermostatState.attributes.hvac_action,
        lastChanged: dateToString(new Date()),
        targetTemp: demandingTemp,
        targetTempType: thermostatState.state,
    };
}

function buildOverrideRule(sensorState: TempSensorEntityState, overrides: Override[]): RuleDecision | null {
    const sensorOverrides = overrides.filter((o) => o.sensor === sensorState.entity_id);
    if (sensorOverrides.length === 0) {
        return null;
    }

    const overrideRule: ScheduleRule = {
        day: 0,
        label: sensorOverrides[0].reason,
        temp: sensorOverrides[0].targetTemp,
        time: 0,
    };

    return {
        relevantRule: overrideRule,
        ruleType: overrideRule.label === "Preconditioning" ? "future" : "override",
        nextRuleStartsAt: new Date(sensorOverrides[0].holdUntil),
    };
}

async function buildSensorStatus(
    s: TempSensorEntityState,
    operationMode: OperationMode,
    thermostatTemperature: number,
    themorstatSensor: string,
    scheduleRules: ScheduleRule[],
    overrides: Override[],
    preconditioningHandler: SensorPreconditioningHandler,
    weather: WeatherData,
    tz: string
): Promise<SensorStatus> {
    if (scheduleRules.length === 0 || sensorIsDisconnected(s, themorstatSensor)) {
        return specialSensorStatus(operationMode, s, "disconnected");
    }

    const ruleDecision = await makeRuleDecision(
        operationMode,
        s,
        scheduleRules,
        overrides,
        preconditioningHandler,
        weather,
        tz
    );

    const desiredChange = parseFloat(s.state) - ruleDecision.relevantRule.temp;
    let desiredThermostatSetting = thermostatTemperature - desiredChange;
    if (operationMode === "cool") {
        desiredThermostatSetting = temperatureValue(Math.floor(desiredThermostatSetting));
    } else {
        desiredThermostatSetting = temperatureValue(Math.ceil(desiredThermostatSetting));
    }

    return {
        id: s.entity_id,
        label: getSensorName(s),
        ruleLabel: ruleDecision.relevantRule.label,
        ruleTemp: ruleDecision.relevantRule.temp,
        actionNeeded: pickActionNeeded(ruleDecision.relevantRule, s, operationMode),
        currentTemp: temperatureValue(s.state),
        desiredThermostatSetting,
        lastMeasuredAt: dateToString(s.last_updated && s.last_updated.length ? new Date(s.last_updated) : new Date()),
        ruleEndsAt: dateToString(ruleDecision.nextRuleStartsAt),
        ruleType: ruleDecision.ruleType,
    };
}

async function buildPreconditionRule(
    operation: OperationMode,
    sensorState: TempSensorEntityState,
    nextRule: ScheduleRule,
    nextRuleStartsAt: Date,
    preconditionHandler: SensorPreconditioningHandler,
    weather: WeatherData,
    tz: string
): Promise<RuleDecision | null> {
    const now = new Date();
    const timeDelta = calculateDelta(now, nextRule, tz);
    let tempDelta = temperatureValue(sensorState.state) - nextRule.temp;

    if (operation !== "cool") {
        tempDelta = -1 * tempDelta;
    }

    if (needToActNowToReachTemp(operation, tempDelta, timeDelta, weather)) {
        await preconditionHandler(nextRule.temp, nextRuleStartsAt.toISOString());
        const overrideRule: ScheduleRule = {
            day: 0,
            label: "Preconditioning",
            temp: nextRule.temp,
            time: 0,
        };

        return {
            relevantRule: overrideRule,
            ruleType: "future",
            nextRuleStartsAt,
        };
    }

    return null;
}

async function makeRuleDecision(
    operation: OperationMode,
    sensorState: TempSensorEntityState,
    rules: ScheduleRule[],
    overrides: Override[],
    preconditioningHandler: SensorPreconditioningHandler,
    weather: WeatherData,
    tz: string
): Promise<RuleDecision> {
    const overrideRule = buildOverrideRule(sensorState, overrides);
    if (overrideRule) {
        return overrideRule;
    }

    const now = new Date();
    const deltaRules = rules
        .map((rule) => ({ rule, delta: calculateDelta(now, rule, tz) }))
        .sort((a, b): number => a.delta - b.delta);
    const nextRule = deltaRules[0].rule;
    const currentRule = deltaRules[deltaRules.length - 1].rule;
    const timeRemaining = deltaRules[0].delta;
    const nextRuleStartsAt = new Date(Math.round(now.getTime() + timeRemaining * 1000));

    const preconditionRule = await buildPreconditionRule(
        operation,
        sensorState,
        nextRule,
        nextRuleStartsAt,
        preconditioningHandler,
        weather,
        tz
    );
    if (preconditionRule) {
        return preconditionRule;
    }

    return { relevantRule: currentRule, ruleType: "schedule", nextRuleStartsAt };
}

export async function processSystem(
    thermostatSensor: string,
    thermostatState: ThermostatEntityState,
    sensorStates: TempSensorEntityState[],
    heatingSchedule: Schedule[],
    coolingSchedule: Schedule[],
    overrides: Override[],
    preconditioningHandler: PreconditioningHandler,
    weather: WeatherData,
    tz: string
): Promise<SystemProcessingResult> {
    let newSensorStatuses: SensorStatus[] = [];
    let newThermostatStatus: ThermostatStatus | null = null;

    // perfer the temperature at the thermostat that comes from the sensor entity, since it has higher precision
    const thermostatTemperature = parseFloat(
        sensorStates.find((s) => s.entity_id === thermostatSensor)?.state ??
            String(thermostatState.attributes.current_temperature)
    );

    if (!["heat", "cool"].includes(thermostatState.state)) {
        newThermostatStatus = {
            thermostatSensor,
            activeSensor: thermostatSensor,
            fanState: thermostatState.attributes.fan_mode === "on",
            functionalCurrentTemp: thermostatTemperature,
            hvacState: thermostatState.attributes.hvac_action,
            lastChanged: dateToString(new Date()),
            targetTemp: thermostatTemperature,
            targetTempType: "off",
        };

        newSensorStatuses = sensorStates.map((s) => specialSensorStatus(thermostatState.state, s, "off"));
    } else if (needsCoolingProtection(thermostatState, weather.externalTemperature)) {
        newSensorStatuses = sensorStates.map((s) => specialSensorStatus(thermostatState.state, s, "protection"));
        newThermostatStatus = buildThermostatStatusFromSensorsAndThermostat(
            thermostatSensor,
            thermostatTemperature,
            thermostatState,
            newSensorStatuses
        );
    } else {
        const scheDefs = thermostatState.state === "cool" ? coolingSchedule : heatingSchedule;
        newSensorStatuses = await Promise.all(
            sensorStates.map((sensor) => {
                const scheduleRules = scheDefs.find((schDef) => schDef.sensor === sensor.entity_id)?.rules ?? [];
                return buildSensorStatus(
                    sensor,
                    thermostatState.state,
                    thermostatTemperature,
                    thermostatSensor,
                    scheduleRules,
                    overrides,
                    (t: number, until: string) => preconditioningHandler(sensor.entity_id, t, until),
                    weather,
                    tz
                );
            })
        );
        newThermostatStatus = buildThermostatStatusFromSensorsAndThermostat(
            thermostatSensor,
            thermostatTemperature,
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
    buildOverrideRule,
    buildSensorStatus,
    makeRuleDecision,
    buildPreconditionRule,
    processSystem,
};
